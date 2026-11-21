/* ============================================================
   DESA PORTOFOLIO 3D — engine Three.js (fullscreen)
   Pengunjung (MC) berkeliling desa low-poly, mengobrol dengan
   warga (NPC) untuk membuka portofolio Rama Hadi Nugraha.
   Data desa & dialog: js/data.js | Progres: js/storage.js
   ============================================================ */
import * as THREE from 'three';

const COLS = 26, ROWS = 19;
// Konversi koordinat tile (satuan tile, float) -> dunia 3D
function W(tu, tv) { return { x: tu - COLS / 2, z: tv - ROWS / 2 }; }

/* ---------------- Progres & koin ---------------- */
const save0 = window.DesaSave ? DesaSave.load() : {};
const STATE = {
  talked: new Set(save0.talked || []),
  fish: save0.fish || 0,
  tdBest: save0.tdBest || 0,
  coins: save0.coins || 0,
};
function persist() {
  if (!window.DesaSave) return;
  const d = DesaSave.load();
  d.talked = Array.from(STATE.talked);
  d.fish = STATE.fish;
  d.tdBest = STATE.tdBest;
  d.coins = STATE.coins;
  DesaSave.save(d);
}
function refreshChips() {
  const total = NPCS.filter((n) => n.counts).length;
  document.getElementById('chip-talk').textContent = STATE.talked.size + '/' + total;
  document.getElementById('chip-fish').textContent = STATE.fish;
  document.getElementById('chip-td').textContent = 'Wave ' + STATE.tdBest;
  document.getElementById('chip-coins').textContent = STATE.coins;
}
let toastTimer = null;
function toast(text) {
  const el = document.getElementById('toast');
  el.textContent = text;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2400);
}

/* ---------------- Suara ---------------- */
let audioCtx = null, soundOn = true;
function beep(freq, dur, type, vol) {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    g.gain.value = vol || 0.04;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + (dur || 0.08));
    o.stop(audioCtx.currentTime + (dur || 0.08));
  } catch (e) { /* abaikan */ }
}
document.getElementById('btn-sound').addEventListener('click', function () {
  soundOn = !soundOn;
  this.textContent = soundOn ? '🔊' : '🔇';
});

/* ---------------- Renderer & scene ---------------- */
const container = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ecfee);
scene.fog = new THREE.Fog(0x8ecfee, 42, 95);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 300);

const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x5d8a4a, 0.95);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2d8, 1.9);
sun.position.set(16, 26, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -20; sun.shadow.camera.right = 20;
sun.shadow.camera.top = 20; sun.shadow.camera.bottom = -20;
sun.shadow.camera.far = 70;
sun.shadow.bias = -0.0006;
scene.add(sun);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------------- Tekstur tanah (digambar di canvas 2D) ---------------- */
function buildGroundTexture() {
  const S = 32;
  const cv = document.createElement('canvas');
  cv.width = COLS * S; cv.height = ROWS * S;
  const g = cv.getContext('2d');
  const ground = [];
  for (let y = 0; y < ROWS; y++) ground.push(new Array(COLS).fill('grass'));
  function fill(x0, y0, x1, y1, t) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++)
      if (x >= 0 && y >= 0 && x < COLS && y < ROWS) ground[y][x] = t;
  }
  fill(12, 4, 13, 18, 'path'); fill(1, 9, 24, 10, 'path'); fill(6, 5, 19, 5, 'path');
  fill(6, 5, 6, 9, 'path'); fill(21, 5, 21, 9, 'path'); fill(8, 11, 17, 12, 'plaza');
  fill(13, 14, 19, 14, 'path'); fill(19, 11, 19, 14, 'path'); fill(6, 14, 12, 14, 'path');
  fill(1, 13, 5, 17, 'sand'); fill(6, 13, 6, 17, 'sand'); fill(1, 12, 5, 12, 'sand'); fill(1, 18, 5, 18, 'sand');
  let seed = 777;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const t = ground[y][x], px = x * S, py = y * S;
      if (t === 'path') {
        g.fillStyle = '#dcbd7f'; g.fillRect(px, py, S, S);
        g.fillStyle = '#cda961';
        for (let i = 0; i < 4; i++) g.fillRect(px + rnd() * 26, py + rnd() * 26, 4, 2.4);
        g.fillStyle = 'rgba(160,124,62,.5)'; g.fillRect(px, py, S, 1.6); g.fillRect(px, py + S - 1.6, S, 1.6);
      } else if (t === 'plaza') {
        g.fillStyle = '#bfc3c9'; g.fillRect(px, py, S, S);
        g.fillStyle = '#a8adb5'; g.fillRect(px, py, S, 2); g.fillRect(px, py, 2, S);
        g.fillStyle = '#d6dade'; g.fillRect(px + 3, py + 3, S - 6, 3);
      } else if (t === 'sand') {
        g.fillStyle = '#f0dc9f'; g.fillRect(px, py, S, S);
        g.fillStyle = '#e3cb85';
        for (let i = 0; i < 3; i++) g.fillRect(px + rnd() * 27, py + rnd() * 27, 3, 2);
      } else {
        g.fillStyle = (x + y) % 2 === 0 ? '#5cab3e' : '#56a539';
        g.fillRect(px, py, S, S);
        g.fillStyle = (x + y) % 2 === 0 ? '#53a137' : '#4c9831';
        for (let i = 0; i < 5; i++) g.fillRect(px + rnd() * 29, py + rnd() * 29, 2.4, 2.4);
        g.fillStyle = '#3f8f2f';
        for (let i = 0; i < 3; i++) { const tx = px + 4 + rnd() * 24, ty = py + 6 + rnd() * 20; g.fillRect(tx, ty, 1.6, 4); }
      }
    }
  }
  // titik bunga
  const flowerCols = ['#ff6b9d', '#ffd93d', '#ffffff', '#ff8c42', '#c77dff'];
  [[15, 16], [16, 16], [20, 15], [22, 8], [9, 7], [3, 12], [23, 15]].forEach((f, i) => {
    g.fillStyle = flowerCols[i % 5];
    g.fillRect(f[0] * S + 8, f[1] * S + 10, 4, 4);
    g.fillRect(f[0] * S + 20, f[1] * S + 20, 4, 4);
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const groundMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(COLS, ROWS),
  new THREE.MeshLambertMaterial({ map: buildGroundTexture() })
);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.receiveShadow = true;
scene.add(groundMesh);
// padang luas di luar desa + bukit jauh
const outer = new THREE.Mesh(
  new THREE.CircleGeometry(90, 40),
  new THREE.MeshLambertMaterial({ color: 0x67b34a })
);
outer.rotation.x = -Math.PI / 2;
outer.position.y = -0.03;
outer.receiveShadow = true;
scene.add(outer);
[[-34, -26, 15], [36, -22, 19], [-40, 14, 13], [30, 30, 16], [2, -40, 21]].forEach((h) => {
  const hill = new THREE.Mesh(
    new THREE.SphereGeometry(h[2], 20, 14),
    new THREE.MeshLambertMaterial({ color: 0x74ba62 })
  );
  hill.scale.y = 0.32;
  hill.position.set(h[0], 0, h[1]);
  scene.add(hill);
});

/* ---------------- Material helper ---------------- */
function mat(color) { return new THREE.MeshLambertMaterial({ color }); }
function box(w, h, d, color, x, y, z, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  (parent || scene).add(m);
  return m;
}

/* ---------------- Label sprite (nama di atas kepala/bangunan) ---------------- */
function makeLabel(text, color, scale) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 56;
  const g = cv.getContext('2d');
  g.font = 'bold 30px Trebuchet MS, sans-serif';
  g.textAlign = 'center';
  g.lineWidth = 7; g.strokeStyle = 'rgba(20,25,15,.85)';
  g.strokeText(text, 128, 38);
  g.fillStyle = color || '#ffffff';
  g.fillText(text, 128, 38);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sp.scale.set(scale || 2.4, (scale || 2.4) * 0.22, 1);
  return sp;
}

/* ---------------- Bangunan ---------------- */
const colliders = []; // {minX,maxX,minZ,maxZ} rect | {x,z,r} circle
function rectCollider(x0, z0, x1, z1) { colliders.push({ minX: x0, maxX: x1, minZ: z0, maxZ: z1 }); }
function circleCollider(x, z, r) { colliders.push({ x, z, r }); }

HOUSES.forEach((h) => {
  const grp = new THREE.Group();
  const cx = h.x + h.w / 2 - COLS / 2, cz = h.y + h.h / 2 - ROWS / 2;
  box(h.w, 1.5, h.h, new THREE.Color(h.wall).getHex(), 0, 0.75, 0, grp);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1, 1.15, 4), mat(new THREE.Color(h.roof).getHex()));
  roof.position.y = 2.05;
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(h.w * 0.76, 1, h.h * 0.76);
  roof.castShadow = true;
  grp.add(roof);
  // pintu & jendela (sisi selatan)
  box(0.55, 0.95, 0.08, 0x6b4a2a, 0, 0.48, h.h / 2 + 0.03, grp);
  box(0.42, 0.42, 0.06, 0xffe9a8, -h.w / 4, 0.95, h.h / 2 + 0.03, grp);
  box(0.42, 0.42, 0.06, 0xffe9a8, h.w / 4, 0.95, h.h / 2 + 0.03, grp);
  if (h.label === 'BALAI DESA') box(0.34, 0.7, 0.34, 0x8d8d93, h.w / 4, 2.5, 0, grp);
  const label = makeLabel(h.label, '#ffe9a8', Math.max(2.2, h.w * 0.62));
  label.position.set(0, 3.15, 0);
  grp.add(label);
  grp.position.set(cx, 0, cz);
  scene.add(grp);
  rectCollider(cx - h.w / 2, cz - h.h / 2, cx + h.w / 2, cz + h.h / 2);
});

/* ---------------- Pohon, semak, pagar, papan ---------------- */
function makeTree(x, z, s) {
  const grp = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * s, 0.13 * s, 0.6 * s, 6), mat(0x6b4a2a));
  trunk.position.y = 0.3 * s; trunk.castShadow = true; grp.add(trunk);
  const c1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62 * s, 1), mat(0x2e7d32));
  c1.position.y = 1.05 * s; c1.castShadow = true; grp.add(c1);
  const c2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42 * s, 1), mat(0x43a047));
  c2.position.set(0.18 * s, 1.42 * s, 0.08 * s); c2.castShadow = true; grp.add(c2);
  grp.position.set(x, 0, z);
  scene.add(grp);
  return grp;
}
TREES.forEach((t) => {
  const p = W(t[0] + 0.5, t[1] + 0.5);
  makeTree(p.x, p.z, 0.9 + ((t[0] * 7 + t[1] * 3) % 4) * 0.12);
  circleCollider(p.x, p.z, 0.42);
});
// pohon pemandangan di luar pagar desa
[[-16, -8], [15, -11], [-18, 4], [17, 8], [-14, 12], [14, 13], [-8, -13], [9, -14], [20, -3], [-21, -4]].forEach((t, i) => {
  makeTree(t[0], t[1], 1.25 + (i % 3) * 0.3);
});
const BUSHES = [[8, 3], [17, 3], [5, 11], [20, 11], [7, 17], [18, 17], [16, 7], [9, 16]];
BUSHES.forEach((b) => {
  const p = W(b[0] + 0.5, b[1] + 0.5);
  const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 1), mat(0x2e7d32));
  bush.position.set(p.x, 0.26, p.z);
  bush.castShadow = true;
  scene.add(bush);
  const fl = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), mat(0xff6b9d));
  fl.position.set(p.x + 0.14, 0.5, p.z + 0.1);
  scene.add(fl);
  circleCollider(p.x, p.z, 0.4);
});
const FENCES = [];
[8, 9, 10, 11, 14, 15, 16, 17].forEach((x) => FENCES.push([x, 12]));
[3, 4, 5, 22, 23].forEach((x) => FENCES.push([x, 6]));
FENCES.forEach((f) => {
  const p = W(f[0] + 0.5, f[1] + 0.5);
  box(1, 0.1, 0.08, 0xa9743f, p.x, 0.32, p.z);
  box(1, 0.1, 0.08, 0xa9743f, p.x, 0.58, p.z);
  box(0.09, 0.66, 0.09, 0x8a5a2b, p.x - 0.42, 0.33, p.z);
  box(0.09, 0.66, 0.09, 0x8a5a2b, p.x + 0.42, 0.33, p.z);
  circleCollider(p.x, p.z, 0.5);
});
SIGNS.forEach((s) => {
  const p = W(s.x + 0.5, s.y + 0.5);
  box(0.09, 0.7, 0.09, 0x6b4a2a, p.x - 0.2, 0.35, p.z);
  box(0.09, 0.7, 0.09, 0x6b4a2a, p.x + 0.2, 0.35, p.z);
  box(0.85, 0.5, 0.07, 0xa9743f, p.x, 0.72, p.z);
  circleCollider(p.x, p.z, 0.42);
});

/* ---------------- Kolam pancing ---------------- */
const pond = new THREE.Mesh(
  new THREE.PlaneGeometry(5.4, 5.4),
  new THREE.MeshLambertMaterial({ color: 0x2e7cd6, transparent: true, opacity: 0.93 })
);
pond.rotation.x = -Math.PI / 2;
pond.position.set(-9.5, 0.04, 6);
pond.receiveShadow = true;
scene.add(pond);
const ripples = [];
for (let i = 0; i < 3; i++) {
  const r = new THREE.Mesh(
    new THREE.RingGeometry(0.16, 0.2, 24),
    new THREE.MeshBasicMaterial({ color: 0xbfe3ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
  );
  r.rotation.x = -Math.PI / 2;
  r.position.set(-11 + i * 1.6, 0.06, 4.6 + (i % 2) * 2.2);
  scene.add(r);
  ripples.push({ mesh: r, phase: i * 0.37 });
}
[[-8.2, 7.6], [-10.8, 4.4], [-7.6, 5.2]].forEach((lp) => {
  const pad = new THREE.Mesh(new THREE.CircleGeometry(0.3, 12), mat(0x3f9e4d));
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(lp[0], 0.055, lp[1]);
  scene.add(pad);
});
// dermaga kayu di tepi kolam
const dockP = W(6.5, 15.5);
box(1.7, 0.12, 1.1, 0xa9743f, dockP.x, 0.1, dockP.z);
box(0.12, 0.3, 0.12, 0x6b4a2a, dockP.x - 0.7, -0.02, dockP.z - 0.4);
box(0.12, 0.3, 0.12, 0x6b4a2a, dockP.x + 0.7, -0.02, dockP.z + 0.4);

/* ---------------- Gerbang desa ---------------- */
const gateL = W(11.85, 18.5), gateR = W(14.15, 18.5);
box(0.22, 1.5, 0.22, 0x8a5a2b, gateL.x, 0.75, gateL.z);
box(0.22, 1.5, 0.22, 0x8a5a2b, gateR.x, 0.75, gateR.z);
box(2.6, 0.18, 0.3, 0xa9743f, 0, 1.56, gateL.z);
const gateLabel = makeLabel('🌻 DESA PORTOFOLIO 🌻', '#ffe9a8', 3.4);
gateLabel.position.set(0, 2.1, gateL.z);
scene.add(gateLabel);

/* ---------------- Awan & partikel serbuk sari ---------------- */
const clouds = [];
for (let i = 0; i < 4; i++) {
  const grp = new THREE.Group();
  const cm = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
  [[0, 0, 0, 1.5], [1.3, -0.15, 0.2, 1.05], [-1.25, -0.1, -0.1, 1.1]].forEach((s) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(s[3], 12, 10), cm);
    m.position.set(s[0], s[1], s[2]);
    m.scale.y = 0.45;
    grp.add(m);
  });
  grp.position.set(-26 + i * 15, 10 + (i % 3), -8 + i * 5);
  scene.add(grp);
  clouds.push({ grp, speed: 0.14 + i * 0.05 });
}
const pollenGeo = new THREE.BufferGeometry();
{
  const pts = [];
  for (let i = 0; i < 130; i++) {
    pts.push((Math.random() - 0.5) * 26, 0.4 + Math.random() * 2.4, (Math.random() - 0.5) * 19);
  }
  pollenGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
}
const pollen = new THREE.Points(pollenGeo, new THREE.PointsMaterial({ color: 0xfff6b8, size: 0.07, transparent: true, opacity: 0.85 }));
scene.add(pollen);

/* ---------------- Karakter (player & NPC) ---------------- */
function makeCharacter(look) {
  const grp = new THREE.Group();
  const skin = mat(new THREE.Color(look.skin).getHex());
  const shirt = mat(new THREE.Color(look.shirt).getHex());
  const pants = mat(new THREE.Color(look.pants).getHex());
  const hairM = mat(new THREE.Color(look.hair).getHex());
  // kaki
  const legL = box(0.13, 0.3, 0.15, new THREE.Color(look.pants).getHex(), -0.09, 0.15, 0, grp);
  const legR = box(0.13, 0.3, 0.15, new THREE.Color(look.pants).getHex(), 0.09, 0.15, 0, grp);
  // badan
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.23, 0.52, 10), shirt);
  body.position.y = 0.56; body.castShadow = true; grp.add(body);
  // lengan
  const armL = box(0.09, 0.4, 0.09, new THREE.Color(look.shirt).getHex(), -0.29, 0.58, 0, grp);
  const armR = box(0.09, 0.4, 0.09, new THREE.Color(look.shirt).getHex(), 0.29, 0.58, 0, grp);
  armL.geometry.translate(0, -0.14, 0); armL.position.y = 0.72;
  armR.geometry.translate(0, -0.14, 0); armR.position.y = 0.72;
  // kepala + rambut
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 16, 12), skin);
  head.position.y = 1.03; head.castShadow = true; grp.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.218, 16, 12), hairM);
  hair.scale.set(1, 0.72, 1);
  hair.position.y = 1.1;
  grp.add(hair);
  // topi
  if (look.hat === 'cap') {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.23, 0.09, 12), mat(0xd8342c));
    cap.position.y = 1.19; grp.add(cap);
    box(0.3, 0.04, 0.2, 0xd8342c, 0, 1.16, 0.26, grp);
  } else if (look.hat === 'peci') {
    const peci = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.2, 12), mat(0x20242b));
    peci.position.y = 1.2; grp.add(peci);
  } else if (look.hat === 'straw') {
    const straw = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.14, 14), mat(0xe8c85a));
    straw.position.y = 1.2; grp.add(straw);
  } else if (look.hat === 'helmet') {
    const helm = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10), mat(0x9aa5ad));
    helm.scale.y = 0.75; helm.position.y = 1.1; grp.add(helm);
  } else if (look.hat === 'bun') {
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), hairM);
    bun.position.set(0, 1.24, -0.1); grp.add(bun);
  }
  grp.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { grp, legL, legR, armL, armR };
}

const playerLook = { skin: '#f2c188', hair: '#3a2a1a', shirt: '#d8342c', pants: '#33415c', hat: 'cap' };
const playerChar = makeCharacter(playerLook);
scene.add(playerChar.grp);
const player = {
  pos: new THREE.Vector3(0, 0, 0),
  yaw: Math.PI, // menghadap kamera (selatan)
  moving: false, walkPhase: 0,
};
{
  const s = W(12.5, 16.7);
  player.pos.set(s.x, 0, s.z);
  playerChar.grp.position.copy(player.pos);
}

const NPC_EMOJI = {
  lurah: '👴', pandai: '🔨', dito: '🎟️', nara: '🔬', raka: '🧑‍💼',
  tania: '👩‍🌾', sari: '👩', pio: '📬', tirta: '🎣', garda: '💂',
};
const npcObjs = [];
NPCS.forEach((n) => {
  const c = makeCharacter(n.look);
  const p = W(n.x + 0.5, n.y + 0.5);
  c.grp.position.set(p.x, 0, p.z);
  scene.add(c.grp);
  const label = makeLabel(n.name.split(' ').slice(-1)[0], '#ffe9a8', 1.7);
  label.position.set(p.x, 1.72, p.z);
  scene.add(label);
  const mark = makeLabel('!', '#ffd93d', 0.85);
  mark.position.set(p.x, 2.25, p.z);
  mark.visible = n.counts && !STATE.talked.has(n.id);
  scene.add(mark);
  circleCollider(p.x, p.z, 0.45);
  npcObjs.push({ data: n, char: c, x: p.x, z: p.z, mark, phase: Math.random() * Math.PI * 2 });
});

/* ---------------- Tabrakan ---------------- */
function collides(x, z) {
  if (x < -12.5 || x > 12.5 || z < -9 || z > 9) return true;
  for (const c of colliders) {
    if (c.r !== undefined) {
      if (Math.hypot(x - c.x, z - c.z) < c.r + 0.32) return true;
    } else {
      const nx = Math.max(c.minX, Math.min(x, c.maxX));
      const nz = Math.max(c.minZ, Math.min(z, c.maxZ));
      if (Math.hypot(x - nx, z - nz) < 0.32) return true;
    }
  }
  return false;
}

/* ---------------- Dialog ---------------- */
const dialogEl = document.getElementById('dialog');
const dialogName = document.getElementById('dialog-name');
const dialogText = document.getElementById('dialog-text');
const dialogAvatar = document.getElementById('dialog-avatar');
const promptEl = document.getElementById('prompt');
let dialog = null;

function openDialog(title, pages, emoji, onDone) {
  dialog = { pages, idx: 0, chars: 0, onDone: onDone || null };
  dialogName.textContent = title;
  dialogAvatar.textContent = emoji || '🙂';
  dialogEl.classList.remove('hidden');
  promptEl.classList.add('hidden');
  typeStep();
}
function typeStep() {
  if (!dialog) return;
  const full = dialog.pages[dialog.idx];
  dialog.chars = 0;
  dialogText.textContent = '';
  clearInterval(dialog.timer);
  dialog.timer = setInterval(() => {
    if (!dialog) return;
    dialog.chars++;
    dialogText.textContent = full.slice(0, dialog.chars);
    if (dialog.chars % 3 === 0) beep(720, 0.02, 'square', 0.015);
    if (dialog.chars >= full.length) clearInterval(dialog.timer);
  }, 16);
}
function advanceDialog() {
  if (!dialog) return;
  const full = dialog.pages[dialog.idx];
  if (dialog.chars < full.length) {
    clearInterval(dialog.timer);
    dialog.chars = full.length;
    dialogText.textContent = full;
    return;
  }
  beep(520, 0.05);
  dialog.idx++;
  if (dialog.idx >= dialog.pages.length) {
    const cb = dialog.onDone;
    dialog = null;
    dialogEl.classList.add('hidden');
    if (cb) cb();
  } else {
    typeStep();
  }
}
dialogEl.addEventListener('click', advanceDialog);

function nearestInteractable() {
  let best = null, bestD = 2.0;
  npcObjs.forEach((o) => {
    const d = Math.hypot(o.x - player.pos.x, o.z - player.pos.z);
    if (d < bestD) { bestD = d; best = { type: 'npc', obj: o }; }
  });
  SIGNS.forEach((s) => {
    const p = W(s.x + 0.5, s.y + 0.5);
    const d = Math.hypot(p.x - player.pos.x, p.z - player.pos.z);
    if (d < bestD) { bestD = d; best = { type: 'sign', obj: s }; }
  });
  return best;
}

function interact() {
  if (dialog) { advanceDialog(); return; }
  const near = nearestInteractable();
  if (!near) return;
  beep(600, 0.05);
  if (near.type === 'npc') {
    const o = near.obj, n = o.data;
    // NPC menoleh ke player
    o.char.grp.rotation.y = Math.atan2(player.pos.x - o.x, player.pos.z - o.z);
    openDialog(n.name + ' — ' + n.role, n.pages, NPC_EMOJI[n.id] || '🙂', () => {
      if (n.counts && !STATE.talked.has(n.id)) {
        STATE.talked.add(n.id);
        STATE.coins += 15;
        persist(); refreshChips();
        o.mark.visible = false;
        toast('+15 🪙 — Terima kasih sudah mengobrol dengan ' + n.name.split(' ').slice(-1)[0] + '!');
        beep(880, 0.1); setTimeout(() => beep(1174, 0.14), 110);
        const total = NPCS.filter((x) => x.counts).length;
        if (STATE.talked.size >= total) {
          setTimeout(() => toast('🏆 MISI SELESAI! Kamu sudah mengenal seluruh warga Desa Portofolio!'), 2600);
        }
      }
      if (n.action === 'fishing') window.location.href = 'fishing.html';
      if (n.action === 'td') window.location.href = 'td.html';
    });
  } else {
    openDialog(near.obj.name, near.obj.pages, '📜', null);
  }
}

/* ---------------- Input ---------------- */
const keys = {};
const GAME_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE'];
window.addEventListener('keydown', (e) => {
  if (GAME_KEYS.includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  keys[e.code] = true;
  if (e.code === 'KeyE' || e.code === 'Space') interact();
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

const touch = { up: false, down: false, left: false, right: false };
function bindTouch(id, prop) {
  const el = document.getElementById(id);
  if (!el) return;
  const on = (e) => { e.preventDefault(); touch[prop] = true; };
  const off = (e) => { e.preventDefault(); touch[prop] = false; };
  el.addEventListener('touchstart', on, { passive: false });
  el.addEventListener('touchend', off, { passive: false });
  el.addEventListener('touchcancel', off, { passive: false });
  el.addEventListener('mousedown', on);
  el.addEventListener('mouseup', off);
  el.addEventListener('mouseleave', off);
}
bindTouch('t-up', 'up'); bindTouch('t-down', 'down');
bindTouch('t-left', 'left'); bindTouch('t-right', 'right');
document.getElementById('t-action').addEventListener('click', (e) => { e.preventDefault(); interact(); });

/* ---------------- Navbar: modal info + teleport ---------------- */
const INFO = {
  tentang: {
    title: '👋 Tentang Saya',
    npc: 'lurah',
    body: '<p><b>Rama Hadi Nugraha</b> — UI/UX &amp; Mobile Developer · Visual Designer · Applied AI Research.</p>' +
      '<p>Lulusan S1 Teknik Informatika, Universitas Komputer Indonesia (2022–2026), IPK <b>3,80</b>. Memegang sertifikasi <b>BNSP Data Analis</b> dan <b>BNSP Desain Grafis Muda</b>.</p>' +
      '<p>Di desa ini, Pak Lurah adalah penjaga ceritanya.</p>',
  },
  proyek: {
    title: '🚀 Proyek Pilihan',
    npc: 'dito',
    body:
      '<div class="proj-item"><b>🎟️ Aplikasi Tiket Wisata — Disparbud Majalengka</b><span>UI/UX end-to-end &amp; Flutter (web/Android), 200+ pengguna uji, scan QR mempercepat validasi 40%. → Dito</span></div>' +
      '<div class="proj-item"><b>🔬 Japanese Waste Detection — Riset JAIST</b><span>YOLOv8 + FastAPI; 8 konfigurasi deteksi, pipeline PCA/UMAP/Isolation Forest, LMM/GEE atas 1.150 prediksi. → Nara</span></div>' +
      '<div class="proj-item"><b>🧑‍💼 Blockchain B2B Product Reservation DApp</b><span>Smart contract Solidity di Ethereum Sepolia, frontend React + MetaMask. → Raka</span></div>' +
      '<div class="proj-item"><b>👩‍🌾 TaniXplore &amp; Proyek Lainnya</b><span>Platform pertanian Maps API, Smart Door IoT, Anime Face Recognition. → Tania</span></div>' +
      '<div class="proj-item"><b>🎨 Desain Visual — Laznas PYI</b><span>Konten 8 akun Instagram, +20 pengikut/akun/bulan. → Papan Galeri di alun-alun</span></div>',
  },
  keahlian: {
    title: '🛠️ Keahlian',
    npc: 'pandai',
    body: '<p><b>Pemrograman:</b> Flutter · Python/FastAPI · PHP · JavaScript · HTML/CSS · C#/Unity · Solidity</p>' +
      '<p><b>Data:</b> SQLite · SQLAlchemy · Hadoop · OLAP Mondrian · Spoon ETL</p>' +
      '<p><b>AI &amp; Riset:</b> YOLOv8 · PCA · UMAP · Isolation Forest · Association Rule Mining · LMM/GEE · Vuforia AR</p>' +
      '<p><b>Desain:</b> Figma · Photoshop · Illustrator · Premiere Pro · After Effects · Lightroom</p>' +
      '<p>Di desa ini, Bang Bara si pandai besi adalah penjaga daftar lengkapnya.</p>',
  },
  pengalaman: {
    title: '💼 Pengalaman',
    npc: 'sari',
    body: '<p><b>Research Intern — JAIST</b> (Jul–Sep 2026): Computer Vision &amp; Reliability Analysis.</p>' +
      '<p><b>Visual Designer — Laznas PYI</b> (Feb–Mar 2026).</p>' +
      '<p><b>UI/UX &amp; Flutter Developer Intern — Disparbud Majalengka</b> (Agu–Okt 2025).</p>' +
      '<p><b>Divisi Dekomedia — UKM Fotografi Glosarium UNIKOM</b> (Des 2023–Des 2024), engagement +25%.</p>' +
      '<p>Di desa ini, Bu Sari si pemilik penginapan adalah penjaga ceritanya.</p>',
  },
  kontak: {
    title: '✉️ Kontak',
    npc: 'pio',
    body: '<p>📧 Email: <a href="mailto:nramahadi1@gmail.com">nramahadi1@gmail.com</a></p>' +
      '<p>💼 LinkedIn: <a href="https://www.linkedin.com/in/rama-hadi-nugraha" target="_blank" rel="noopener">linkedin.com/in/rama-hadi-nugraha</a></p>' +
      '<p>🐙 GitHub: <a href="https://github.com/Ram4UnMi" target="_blank" rel="noopener">github.com/Ram4UnMi</a></p>' +
      '<p>Rama terbuka untuk peluang UI/UX, Mobile Development (Flutter), dan Desain Visual. Di desa ini, Pak Pos Pio siap menyampaikan pesanmu!</p>',
  },
};
const infoModal = document.getElementById('info-modal');
const infoTitle = document.getElementById('info-title');
const infoBody = document.getElementById('info-body');
const infoVisit = document.getElementById('info-visit');
let infoTarget = null;

function teleportToNpc(id) {
  const o = npcObjs.find((x) => x.data.id === id);
  if (!o) return;
  // Berdiri 1.6 tile di selatan NPC
  const target = { x: o.x, z: o.z + 1.6 };
  if (!collides(target.x, target.z)) {
    player.pos.set(target.x, 0, target.z);
  } else {
    player.pos.set(o.x, 0, o.z + 2.2);
  }
  player.yaw = Math.PI; // menghadap utara (ke NPC)
  playerChar.grp.position.copy(player.pos);
  toast('📍 Kamu tiba di dekat ' + o.data.name);
  beep(740, 0.07);
}
document.querySelectorAll('[data-section]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const sec = INFO[btn.getAttribute('data-section')];
    if (!sec) return;
    infoTitle.textContent = sec.title;
    infoBody.innerHTML = sec.body;
    infoTarget = sec.npc;
    infoModal.classList.remove('hidden');
    beep(600, 0.05);
  });
});
infoVisit.addEventListener('click', () => {
  infoModal.classList.add('hidden');
  if (infoTarget) teleportToNpc(infoTarget);
});
document.querySelectorAll('[data-close-info]').forEach((el) => {
  el.addEventListener('click', () => infoModal.classList.add('hidden'));
});
infoModal.addEventListener('click', (e) => { if (e.target === infoModal) infoModal.classList.add('hidden'); });

/* ---------------- Tutorial ---------------- */
const tutorialModal = document.getElementById('tutorial-modal');
function closeTutorial() {
  tutorialModal.classList.add('hidden');
  if (window.DesaSave) {
    const d = DesaSave.load();
    d.seenTutorial = true;
    DesaSave.save(d);
  }
}
document.querySelectorAll('[data-close-tutorial]').forEach((el) => {
  el.addEventListener('click', closeTutorial);
});
document.getElementById('btn-tutorial').addEventListener('click', () => {
  tutorialModal.classList.remove('hidden');
});
if (!save0.seenTutorial) tutorialModal.classList.remove('hidden');

/* ---------------- Gerakan & kamera ---------------- */
const SPEED = 4.4; // satuan dunia per detik
const camTarget = new THREE.Vector3();
function update(dt, t) {
  let dx = 0, dz = 0;
  if (!dialog && infoModal.classList.contains('hidden') && tutorialModal.classList.contains('hidden')) {
    if (keys['ArrowLeft'] || keys['KeyA'] || touch.left) dx = -1;
    if (keys['ArrowRight'] || keys['KeyD'] || touch.right) dx = 1;
    if (keys['ArrowUp'] || keys['KeyW'] || touch.up) dz = -1;
    if (keys['ArrowDown'] || keys['KeyS'] || touch.down) dz = 1;
  }
  const len = Math.hypot(dx, dz);
  player.moving = len > 0;
  if (len > 0) {
    dx /= len; dz /= len;
    const targetYaw = Math.atan2(dx, dz);
    let diff = targetYaw - player.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    player.yaw += diff * Math.min(1, dt * 14);
    const dist = SPEED * dt;
    if (!collides(player.pos.x + dx * dist, player.pos.z)) player.pos.x += dx * dist;
    if (!collides(player.pos.x, player.pos.z + dz * dist)) player.pos.z += dz * dist;
    player.walkPhase += dt * 10;
  }
  const bob = player.moving ? Math.abs(Math.sin(player.walkPhase)) * 0.07 : Math.sin(t / 500) * 0.015;
  playerChar.grp.position.set(player.pos.x, bob, player.pos.z);
  playerChar.grp.rotation.y = player.yaw;
  const swing = player.moving ? Math.sin(player.walkPhase) * 0.55 : 0;
  playerChar.armL.rotation.x = swing;
  playerChar.armR.rotation.x = -swing;
  playerChar.legL.rotation.x = -swing * 0.8;
  playerChar.legR.rotation.x = swing * 0.8;

  // NPC idle
  npcObjs.forEach((o) => {
    o.char.grp.position.y = Math.sin(t / 480 + o.phase) * 0.02;
    if (o.mark.visible) o.mark.position.y = 2.25 + Math.abs(Math.sin(t / 300 + o.phase)) * 0.14;
  });

  // prompt interaksi
  if (!dialog) {
    const near = nearestInteractable();
    if (near) {
      const name = near.type === 'npc' ? near.obj.data.name : near.obj.name;
      promptEl.innerHTML = 'Tekan <b>E</b> / BICARA — ' + name;
      promptEl.classList.remove('hidden');
    } else {
      promptEl.classList.add('hidden');
    }
  } else {
    promptEl.classList.add('hidden');
  }

  // kamera mengikuti player (sudut pandang ala game tani 3D)
  camTarget.set(player.pos.x, 0, player.pos.z);
  const desired = new THREE.Vector3(player.pos.x, 13.5, player.pos.z + 9.5);
  camera.position.lerp(desired, 1 - Math.exp(-dt * 3.2));
  camera.lookAt(camTarget.x, 0.4, camTarget.z - 1.2);

  // lingkungan hidup
  clouds.forEach((c) => {
    c.grp.position.x += c.speed * dt;
    if (c.grp.position.x > 34) c.grp.position.x = -34;
  });
  ripples.forEach((r) => {
    const s = 0.6 + ((t / 1600 + r.phase) % 1) * 2.2;
    r.mesh.scale.set(s, s, 1);
    r.mesh.material.opacity = 0.75 * (1 - ((t / 1600 + r.phase) % 1));
  });
  pollen.rotation.y = t / 26000;
}

/* ---------------- Loop ---------------- */
const clock = new THREE.Clock();
let firstFrame = true;
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());
  const t = performance.now();
  update(dt, t);
  renderer.render(scene, camera);
  if (firstFrame) {
    firstFrame = false;
    window.__desa3dReady = true;
    document.getElementById('loading').classList.add('hidden');
  }
}
refreshChips();
animate();
