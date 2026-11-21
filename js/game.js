/* ============================================================
   ENGINE DESA PORTOFOLIO (v2)
   Peta 26x19 tile (32px). Player = pengunjung (MC) yang berkeliling
   desa dan mengobrol dengan warga (NPC) untuk membuka portofolio.
   Mini game berada di halaman terpisah (fishing.html & td.html),
   progres tersimpan via localStorage (lihat js/storage.js).
   ============================================================ */
(function () {
  'use strict';

  const TILE = 32, COLS = 26, ROWS = 19;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  /* ---------------- Progres (tersimpan) ---------------- */
  const saveData = window.DesaSave ? DesaSave.load() : { talked: [], fish: 0, tdBest: 0 };
  window.GAME_STATE = {
    talked: new Set(saveData.talked || []),
    fish: saveData.fish || 0,
    tdBest: saveData.tdBest || 0,
  };
  function persist() {
    if (!window.DesaSave) return;
    const d = DesaSave.load();
    d.talked = Array.from(GAME_STATE.talked);
    d.fish = GAME_STATE.fish;
    d.tdBest = GAME_STATE.tdBest;
    DesaSave.save(d);
  }

  /* ---------------- Suara (beep sederhana) ---------------- */
  let audioCtx = null;
  let soundOn = true;
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
  window.gameBeep = beep;
  document.getElementById('btn-sound').addEventListener('click', function () {
    soundOn = !soundOn;
    this.textContent = soundOn ? '🔊' : '🔇';
  });

  /* ---------------- Sprite karakter 16x16 + outline ---------------- */
  const TEMPLATES = {
    down: [
      '................',
      '....hhhhhhhh....',
      '...hhhhhhhhhh...',
      '...hssssssssh...',
      '...sesssssess...',
      '...ssssssssss...',
      '.....ssssss.....',
      '...tttttttttt...',
      '..tttttttttttt..',
      '..stttttttttts..',
      '..stttttttttts..',
      '....pppppppp....',
      '....pppp.pppp...',
      '....pppp.pppp...',
      '....pppp.pppp...',
      '...kkkk...kkkk..',
    ],
    up: [
      '................',
      '....hhhhhhhh....',
      '...hhhhhhhhhh...',
      '...hhhhhhhhhh...',
      '...hhhhhhhhhh...',
      '....hhhhhhhh....',
      '.....ssssss.....',
      '...tttttttttt...',
      '..tttttttttttt..',
      '..stttttttttts..',
      '..stttttttttts..',
      '....pppppppp....',
      '....pppp.pppp...',
      '....pppp.pppp...',
      '....pppp.pppp...',
      '...kkkk...kkkk..',
    ],
    side: [
      '................',
      '....hhhhhhhh....',
      '...hhhhhhhhhh...',
      '...hhhhhhssss...',
      '...hhhhssses....',
      '....sssssss.....',
      '.....sssss......',
      '....ttttttt.....',
      '...ttttttttt....',
      '...tttttttts....',
      '....tttttt......',
      '....ppppppp.....',
      '....pppp.pp.....',
      '....pppp.pp.....',
      '....pppp.pp.....',
      '...kkkk..kkk....',
    ],
  };

  function silhouette(src) {
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = 'rgba(35,28,22,0.95)';
    g.fillRect(0, 0, c.width, c.height);
    return c;
  }

  // Sprite final 18x18: siluet gelap di 4 sisi (outline) + sprite asli di tengah
  function makeSprite(look, dir) {
    const rows = TEMPLATES[dir] || TEMPLATES.down;
    const pal = {
      h: look.hair, s: look.skin, t: look.shirt, p: look.pants,
      k: '#26221f', e: '#20242b', '.': null,
    };
    const base = document.createElement('canvas');
    base.width = 16; base.height = 16;
    const g = base.getContext('2d');
    rows.forEach(function (row, y) {
      row = row.padEnd(16, '.').slice(0, 16);
      for (let x = 0; x < 16; x++) {
        const col = pal[row[x]];
        if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
      }
    });
    // Topi / aksesoris
    const hatColors = { cap: '#d8342c', peci: '#20242b', straw: '#e8c85a', helmet: '#9aa5ad' };
    if (look.hat && look.hat !== 'none' && look.hat !== 'bun') {
      g.fillStyle = hatColors[look.hat] || '#d8342c';
      if (look.hat === 'cap') {
        g.fillRect(4, 0, 8, 2);
        if (dir === 'down') g.fillRect(4, 2, 8, 1);
        if (dir === 'side') g.fillRect(4, 2, 9, 1);
      } else if (look.hat === 'peci') {
        g.fillRect(4, 0, 8, 3);
      } else if (look.hat === 'straw') {
        g.fillRect(5, 1, 6, 1); g.fillRect(2, 2, 12, 1);
      } else if (look.hat === 'helmet') {
        g.fillRect(4, 0, 8, 3); g.fillRect(3, 3, 10, 1);
      }
    }
    if (look.hat === 'bun') {
      g.fillStyle = look.hair;
      g.fillRect(7, 0, 3, 2);
    }
    const sil = silhouette(base);
    const out = document.createElement('canvas');
    out.width = 18; out.height = 18;
    const og = out.getContext('2d');
    og.drawImage(sil, 0, 1); og.drawImage(sil, 2, 1);
    og.drawImage(sil, 1, 0); og.drawImage(sil, 1, 2);
    og.drawImage(base, 1, 1);
    return out;
  }

  function drawSprite(g, sprite, dx, dy, size, flip) {
    // sprite sumber 18x18 (termasuk outline 1px) -> digambar proporsional
    g.save();
    if (flip) {
      g.translate(dx + size, dy);
      g.scale(-1, 1);
      g.drawImage(sprite, 0, 0, size, size);
    } else {
      g.drawImage(sprite, dx, dy, size, size);
    }
    g.restore();
  }
  // Gambar karakter 32px di posisi tile-pixel (px,py) dengan sprite 18x18
  function drawChar(g, sprite, px, py, flip) {
    drawSprite(g, sprite, px - 2, py - 2, 36, flip);
  }

  /* ---------------- Peta dasar ---------------- */
  const ground = [];
  for (let y = 0; y < ROWS; y++) ground.push(new Array(COLS).fill('grass'));
  function fillRect(x0, y0, x1, y1, type) {
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++)
        if (x >= 0 && y >= 0 && x < COLS && y < ROWS) ground[y][x] = type;
  }
  fillRect(12, 4, 13, 18, 'path');
  fillRect(1, 9, 24, 10, 'path');
  fillRect(6, 5, 19, 5, 'path');
  fillRect(6, 5, 6, 9, 'path');
  fillRect(21, 5, 21, 9, 'path');
  fillRect(8, 11, 17, 12, 'plaza');
  fillRect(13, 14, 19, 14, 'path');
  fillRect(19, 11, 19, 14, 'path');
  fillRect(6, 14, 12, 14, 'path');
  fillRect(1, 13, 5, 17, 'water');
  fillRect(6, 13, 6, 17, 'sand');
  fillRect(1, 12, 5, 12, 'sand');
  fillRect(1, 18, 5, 18, 'sand');

  const blocked = new Set();
  function key(x, y) { return x + ',' + y; }
  for (let x = 0; x < COLS; x++) { blocked.add(key(x, 0)); blocked.add(key(x, ROWS - 1)); }
  for (let y = 0; y < ROWS; y++) { blocked.add(key(0, y)); blocked.add(key(COLS - 1, y)); }
  HOUSES.forEach(function (h) {
    for (let y = h.y; y < h.y + h.h; y++)
      for (let x = h.x; x < h.x + h.w; x++) blocked.add(key(x, y));
  });
  TREES.forEach(function (t) { blocked.add(key(t[0], t[1])); });
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++)
      if (ground[y][x] === 'water') blocked.add(key(x, y));
  SIGNS.forEach(function (s) { blocked.add(key(s.x, s.y)); });
  // Semak & pot bunga dekoratif (penghalang)
  const BUSHES = [[8, 3], [17, 3], [5, 11], [20, 11], [7, 17], [18, 17], [16, 7], [9, 16]];
  BUSHES.forEach(function (b) { blocked.add(key(b[0], b[1])); });
  // Pagar di sisi alun-alun & tepi jalan utara (penghalang, celah di tengah)
  const FENCES = [];
  [8, 9, 10, 11, 14, 15, 16, 17].forEach(function (x) { FENCES.push([x, 12]); });
  [3, 4, 5, 22, 23].forEach(function (x) { FENCES.push([x, 6]); });
  FENCES.forEach(function (f) { blocked.add(key(f[0], f[1])); });

  function isBlockedPx(px, py) {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
    return blocked.has(key(tx, ty));
  }

  /* ---------------- Pre-render tile tanah ---------------- */
  function makeTile(draw) {
    const c = document.createElement('canvas');
    c.width = TILE; c.height = TILE;
    draw(c.getContext('2d'));
    return c;
  }
  function speckles(g, colors, n, seed) {
    let s = seed;
    function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    for (let i = 0; i < n; i++) {
      g.fillStyle = colors[Math.floor(rnd() * colors.length)];
      g.fillRect(Math.floor(rnd() * 30), Math.floor(rnd() * 30), 2, 2);
    }
  }
  function grassTufts(g, seed) {
    let s = seed;
    function rnd() { s = (s * 48271) % 2147483647; return s / 2147483647; }
    g.fillStyle = '#3f8f2f';
    for (let i = 0; i < 5; i++) {
      const x = 3 + Math.floor(rnd() * 26), y = 6 + Math.floor(rnd() * 22);
      g.fillRect(x, y, 1.6, 4); g.fillRect(x + 3, y + 1, 1.6, 3);
    }
  }
  const TILES = {
    grassA: makeTile(function (g) { g.fillStyle = '#5cab3e'; g.fillRect(0, 0, 32, 32); speckles(g, ['#53a137', '#66b848'], 12, 12345); grassTufts(g, 111); }),
    grassB: makeTile(function (g) { g.fillStyle = '#56a539'; g.fillRect(0, 0, 32, 32); speckles(g, ['#5cab3e', '#4c9831'], 12, 67890); grassTufts(g, 222); }),
    flower: makeTile(function (g) {
      g.fillStyle = '#5cab3e'; g.fillRect(0, 0, 32, 32); grassTufts(g, 333);
      const cols = ['#ff6b9d', '#ffd93d', '#ffffff', '#ff8c42', '#c77dff'];
      [[6, 8], [20, 14], [12, 24], [26, 26], [24, 5]].forEach(function (p, i) {
        g.fillStyle = cols[i % 5]; g.fillRect(p[0], p[1], 3, 3);
        g.fillStyle = '#fff59d'; g.fillRect(p[0] + 1, p[1] + 1, 1, 1);
      });
    }),
    path: makeTile(function (g) {
      g.fillStyle = '#dcbd7f'; g.fillRect(0, 0, 32, 32);
      speckles(g, ['#cda961', '#ecd096'], 12, 24680);
      g.fillStyle = 'rgba(160,124,62,.5)'; g.fillRect(0, 0, 32, 1.6); g.fillRect(0, 30.4, 32, 1.6);
    }),
    plaza: makeTile(function (g) {
      g.fillStyle = '#bfc3c9'; g.fillRect(0, 0, 32, 32);
      g.fillStyle = '#a8adb5'; g.fillRect(0, 0, 32, 2); g.fillRect(0, 0, 2, 32); g.fillRect(0, 30, 32, 2); g.fillRect(30, 0, 2, 32);
      g.fillStyle = '#d6dade'; g.fillRect(3, 3, 26, 3);
    }),
    sand: makeTile(function (g) { g.fillStyle = '#f0dc9f'; g.fillRect(0, 0, 32, 32); speckles(g, ['#e3cb85'], 8, 13579); }),
    water1: makeTile(function (g) {
      g.fillStyle = '#2e7cd6'; g.fillRect(0, 0, 32, 32);
      g.fillStyle = '#57a6e8'; g.fillRect(4, 8, 10, 2); g.fillRect(18, 20, 10, 2);
      g.fillStyle = '#8fc6f2'; g.fillRect(20, 6, 4, 1.6);
    }),
    water2: makeTile(function (g) {
      g.fillStyle = '#2e7cd6'; g.fillRect(0, 0, 32, 32);
      g.fillStyle = '#57a6e8'; g.fillRect(12, 8, 10, 2); g.fillRect(6, 20, 10, 2);
      g.fillStyle = '#8fc6f2'; g.fillRect(8, 26, 4, 1.6);
    }),
  };
  const FLOWER_SPOTS = new Set(['15,16', '16,16', '20,15', '4,6', '22,8', '9,7', '3,12', '23,15']);

  /* ---------------- Gambar objek desa ---------------- */
  function drawHouse(h) {
    const px = h.x * TILE, py = h.y * TILE, w = h.w * TILE, hh = h.h * TILE;
    // bayangan
    ctx.fillStyle = 'rgba(20,40,15,.28)';
    ctx.fillRect(px + 8, py + 40, w - 4, hh - 32);
    // dinding + shading
    ctx.fillStyle = h.wall; ctx.fillRect(px + 4, py + 34, w - 8, hh - 34);
    ctx.fillStyle = 'rgba(0,0,0,.10)'; ctx.fillRect(px + 4, py + hh - 10, w - 8, 6);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(px + 4, py + 34, w - 8, 3);
    // atap berlapis
    ctx.fillStyle = h.roof;
    ctx.fillRect(px - 2, py + 22, w + 4, 12);
    ctx.fillRect(px + 6, py + 12, w - 12, 10);
    ctx.fillRect(px + 16, py + 4, w - 32, 8);
    ctx.fillStyle = 'rgba(255,255,255,.20)'; ctx.fillRect(px + 16, py + 4, w - 32, 3); ctx.fillRect(px + 6, py + 12, w - 12, 3);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(px - 2, py + 31, w + 4, 3);
    // cerobong untuk balai desa
    if (h.label === 'BALAI DESA') {
      ctx.fillStyle = '#8d8d93'; ctx.fillRect(px + w - 44, py - 6, 12, 14);
    }
    // pintu & jendela
    ctx.fillStyle = '#6b4a2a';
    const doorX = px + w / 2 - 10;
    ctx.fillRect(doorX, py + hh - 30, 20, 30);
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(doorX + 2, py + hh - 28, 3, 26);
    ctx.fillStyle = '#f2b705'; ctx.fillRect(doorX + 15, py + hh - 16, 3, 3);
    ctx.fillStyle = '#ffe9a8';
    ctx.fillRect(px + 14, py + 46, 14, 12);
    ctx.fillRect(px + w - 28, py + 46, 14, 12);
    ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 2;
    ctx.strokeRect(px + 14, py + 46, 14, 12);
    ctx.strokeRect(px + w - 28, py + 46, 14, 12);
    // papan nama kayu di atas atap
    ctx.font = 'bold 11px monospace';
    const tw = ctx.measureText(h.label).width + 14;
    const lx = px + w / 2 - tw / 2, ly = py - 16;
    ctx.fillStyle = 'rgba(20,40,15,.25)'; ctx.fillRect(lx + 2, ly + 2, tw, 15);
    ctx.fillStyle = '#8a5a2b'; ctx.fillRect(lx, ly, tw, 15);
    ctx.fillStyle = '#a9743f'; ctx.fillRect(lx + 2, ly + 2, tw - 4, 11);
    ctx.fillStyle = '#fff3d6'; ctx.textAlign = 'center';
    ctx.fillText(h.label, px + w / 2, ly + 12);
  }

  function drawTree(tx, ty, t) {
    const px = tx * TILE, py = ty * TILE;
    const sway = Math.sin(t / 700 + tx * 1.7) * 1;
    ctx.fillStyle = 'rgba(20,40,15,.28)';
    ctx.beginPath(); ctx.ellipse(px + 17, py + 30, 13, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b4a2a'; ctx.fillRect(px + 13, py + 20, 6, 12);
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(px + 4 + sway, py + 6, 24, 16);
    ctx.fillRect(px + 8 + sway, py + 0, 16, 8);
    ctx.fillStyle = '#43a047';
    ctx.fillRect(px + 7 + sway, py + 8, 9, 6);
    ctx.fillRect(px + 10 + sway, py + 2, 7, 5);
    ctx.fillStyle = '#e4572e';
    ctx.fillRect(px + 20 + sway, py + 12, 3, 3);
    ctx.fillRect(px + 9 + sway, py + 15, 3, 3);
  }

  function drawBush(b) {
    const px = b[0] * TILE, py = b[1] * TILE;
    ctx.fillStyle = 'rgba(20,40,15,.25)';
    ctx.beginPath(); ctx.ellipse(px + 16, py + 27, 12, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(px + 5, py + 12, 22, 13);
    ctx.fillRect(px + 9, py + 8, 14, 6);
    ctx.fillStyle = '#43a047'; ctx.fillRect(px + 8, py + 13, 8, 5);
    ctx.fillStyle = '#ff6b9d';
    ctx.fillRect(px + 10, py + 11, 3, 3); ctx.fillRect(px + 20, py + 16, 3, 3);
  }

  function drawFence(f) {
    const px = f[0] * TILE, py = f[1] * TILE;
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(px + 3, py + 10, 4, 16);
    ctx.fillRect(px + 25, py + 10, 4, 16);
    ctx.fillStyle = '#a9743f';
    ctx.fillRect(px, py + 13, 32, 4);
    ctx.fillRect(px, py + 21, 32, 4);
  }

  function drawSign(s) {
    const px = s.x * TILE, py = s.y * TILE;
    ctx.fillStyle = 'rgba(20,40,15,.25)'; ctx.fillRect(px + 4, py + 28, 26, 4);
    ctx.fillStyle = '#6b4a2a';
    ctx.fillRect(px + 6, py + 16, 4, 14);
    ctx.fillRect(px + 22, py + 16, 4, 14);
    ctx.fillStyle = '#8a5a2b'; ctx.fillRect(px + 2, py + 2, 28, 16);
    ctx.fillStyle = '#c98f52'; ctx.fillRect(px + 4, py + 4, 24, 12);
    ctx.fillStyle = '#4a2f16';
    ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
    ctx.fillText('!', px + 16, py + 15);
  }

  function drawLabel(text, cx, y, color) {
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.7)';
    ctx.strokeText(text, cx, y);
    ctx.fillStyle = color || '#fff';
    ctx.fillText(text, cx, y);
  }

  /* ---------------- Player & NPC ---------------- */
  const playerLook = { skin: '#f2c188', hair: '#3a2a1a', shirt: '#d8342c', pants: '#33415c', hat: 'cap' };
  const playerSprites = {
    down: makeSprite(playerLook, 'down'),
    up: makeSprite(playerLook, 'up'),
    side: makeSprite(playerLook, 'side'),
  };
  const player = { x: 12.5 * TILE, y: 16.2 * TILE, dir: 'up', moving: false, walkPhase: 0 };

  const npcSprites = {};
  NPCS.forEach(function (n) {
    npcSprites[n.id] = {
      down: makeSprite(n.look, 'down'),
      up: makeSprite(n.look, 'up'),
      side: makeSprite(n.look, 'side'),
    };
    n.px = n.x * TILE; n.py = n.y * TILE;
    n.phase = Math.random() * Math.PI * 2;
  });

  /* ---------------- Dialog ---------------- */
  const dialogEl = document.getElementById('dialog');
  const dialogName = document.getElementById('dialog-name');
  const dialogText = document.getElementById('dialog-text');
  const dialogFace = document.getElementById('dialog-face');
  const faceCtx = dialogFace.getContext('2d');
  faceCtx.imageSmoothingEnabled = false;

  let dialog = null;
  function openDialog(name, pages, faceDraw, onDone) {
    dialog = { pages: pages, idx: 0, chars: 0, onDone: onDone || null };
    dialogName.textContent = name;
    dialogEl.classList.remove('hidden');
    faceCtx.clearRect(0, 0, 64, 64);
    if (faceDraw) faceDraw(faceCtx);
    typeStep();
  }
  function typeStep() {
    if (!dialog) return;
    const full = dialog.pages[dialog.idx];
    dialog.chars = 0;
    dialogText.textContent = '';
    clearInterval(dialog.timer);
    dialog.timer = setInterval(function () {
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

  function faceForNpc(n) {
    return function (g) {
      g.fillStyle = '#bfe3ff'; g.fillRect(0, 0, 64, 64);
      g.imageSmoothingEnabled = false;
      g.drawImage(npcSprites[n.id].down, 0, 0, 64, 64);
    };
  }
  function faceForSign() {
    return function (g) {
      g.fillStyle = '#f3e2b8'; g.fillRect(0, 0, 64, 64);
      g.font = '36px serif'; g.textAlign = 'center';
      g.fillText('📜', 32, 44);
    };
  }

  function updateHUD() {
    const total = NPCS.filter(function (n) { return n.counts; }).length;
    document.getElementById('hud-talk').textContent = GAME_STATE.talked.size + '/' + total;
    document.getElementById('hud-fish').textContent = GAME_STATE.fish;
    document.getElementById('hud-td').textContent = 'Wave ' + GAME_STATE.tdBest;
  }
  window.updateHUD = updateHUD;

  function interact() {
    if (dialog) { advanceDialog(); return; }
    const pcx = player.x + 16, pcy = player.y + 16;
    let best = null, bestDist = 54;
    NPCS.forEach(function (n) {
      const d = Math.hypot(n.px + 16 - pcx, n.py + 16 - pcy);
      if (d < bestDist) { bestDist = d; best = { type: 'npc', obj: n }; }
    });
    SIGNS.forEach(function (s) {
      const d = Math.hypot(s.x * TILE + 16 - pcx, s.y * TILE + 16 - pcy);
      if (d < bestDist) { bestDist = d; best = { type: 'sign', obj: s }; }
    });
    if (!best) return;
    beep(600, 0.05);
    if (best.type === 'npc') {
      const n = best.obj;
      openDialog(n.name + ' — ' + n.role, n.pages, faceForNpc(n), function () {
        if (n.counts && !GAME_STATE.talked.has(n.id)) {
          GAME_STATE.talked.add(n.id);
          persist();
          updateHUD();
          const total = NPCS.filter(function (x) { return x.counts; }).length;
          if (GAME_STATE.talked.size >= total) {
            document.getElementById('quest-hint').textContent =
              '🏆 LUAR BIASA! Kamu sudah mengobrol dengan semua warga — kamu resmi jadi Penjelajah Portofolio Desa! Terima kasih sudah berkunjung.';
            beep(880, 0.12); setTimeout(function () { beep(1174, 0.18); }, 130);
          }
        }
        if (n.action === 'fishing') window.location.href = 'fishing.html';
        if (n.action === 'td') window.location.href = 'td.html';
      });
    } else {
      openDialog(best.obj.name, best.obj.pages, faceForSign(), null);
    }
  }

  /* ---------------- Input ---------------- */
  const keys = {};
  const GAME_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE'];
  window.addEventListener('keydown', function (e) {
    if (GAME_KEYS.includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    keys[e.code] = true;
    if (e.code === 'KeyE' || e.code === 'Space') interact();
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });

  const touch = { up: false, down: false, left: false, right: false };
  function bindTouch(id, prop) {
    const el = document.getElementById(id);
    function on(e) { e.preventDefault(); touch[prop] = true; }
    function off(e) { e.preventDefault(); touch[prop] = false; }
    el.addEventListener('touchstart', on, { passive: false });
    el.addEventListener('touchend', off, { passive: false });
    el.addEventListener('touchcancel', off, { passive: false });
    el.addEventListener('mousedown', on);
    el.addEventListener('mouseup', off);
    el.addEventListener('mouseleave', off);
  }
  bindTouch('t-up', 'up'); bindTouch('t-down', 'down');
  bindTouch('t-left', 'left'); bindTouch('t-right', 'right');
  document.getElementById('t-action').addEventListener('click', function (e) {
    e.preventDefault(); interact();
  });

  /* ---------------- Gerakan player (DIPERBAIKI) ----------------
     - Kecepatan berbasis delta-time (px/detik), konsisten di semua layar.
     - Hitbox kaki lebih kecil (18x9px) agar tidak mudah "tersangkut".
     - NPC menghalangi lewat lingkaran jarak, BUKAN tile penuh — versi
       sebelumnya memakai tile NPC sehingga player terjebak di titik
       spawn (tile Pak Pos menempel ke hitbox awal).                     */
  const SPEED = 158; // px per detik
  function collides(nx, ny) {
    const pts = [
      [nx + 7, ny + 22], [nx + 25, ny + 22],
      [nx + 7, ny + 30], [nx + 25, ny + 30],
    ];
    for (let i = 0; i < pts.length; i++) {
      if (isBlockedPx(pts[i][0], pts[i][1])) return true;
    }
    const cx = nx + 16, cy = ny + 26;
    for (let i = 0; i < NPCS.length; i++) {
      const n = NPCS[i];
      if (Math.hypot(n.px + 16 - cx, n.py + 26 - cy) < 19) return true;
    }
    return false;
  }

  function update(dt) {
    if (dialog) { player.moving = false; return; }
    let dx = 0, dy = 0;
    if (keys['ArrowLeft'] || keys['KeyA'] || touch.left) dx = -1;
    if (keys['ArrowRight'] || keys['KeyD'] || touch.right) dx = 1;
    if (keys['ArrowUp'] || keys['KeyW'] || touch.up) dy = -1;
    if (keys['ArrowDown'] || keys['KeyS'] || touch.down) dy = 1;
    if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }
    if (dx < 0) player.dir = 'left';
    else if (dx > 0) player.dir = 'right';
    else if (dy < 0) player.dir = 'up';
    else if (dy > 0) player.dir = 'down';

    const dist = SPEED * dt;
    let moved = false;
    if (dx !== 0 && !collides(player.x + dx * dist, player.y)) { player.x += dx * dist; moved = true; }
    if (dy !== 0 && !collides(player.x, player.y + dy * dist)) { player.y += dy * dist; moved = true; }
    player.moving = moved;
    if (moved) player.walkPhase += dt * 11;
  }

  /* ---------------- Render ---------------- */
  function render(t) {
    const waterFrame = Math.floor(t / 600) % 2 === 0 ? 'water1' : 'water2';
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const type = ground[y][x];
        let tile;
        if (type === 'water') tile = TILES[waterFrame];
        else if (type === 'path') tile = TILES.path;
        else if (type === 'plaza') tile = TILES.plaza;
        else if (type === 'sand') tile = TILES.sand;
        else if (FLOWER_SPOTS.has(key(x, y))) tile = TILES.flower;
        else tile = (x + y) % 2 === 0 ? TILES.grassA : TILES.grassB;
        ctx.drawImage(tile, x * TILE, y * TILE);
      }
    }
    // kilau air kolam
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    const sparkleSeed = Math.floor(t / 450);
    for (let i = 0; i < 4; i++) {
      const sx = 1 + ((sparkleSeed * 7 + i * 37) % 5);
      const sy = 13 + ((sparkleSeed * 3 + i * 23) % 5);
      ctx.fillRect(sx * TILE + 8, sy * TILE + 12, 5, 1.6);
    }
    // gerbang selatan + lentera
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(11.7 * TILE, 18 * TILE + 4, 7, 28);
    ctx.fillRect(14 * TILE, 18 * TILE + 4, 7, 28);
    ctx.fillStyle = '#ffd93d';
    ctx.fillRect(11.7 * TILE + 1, 18 * TILE + 2, 5, 5);
    ctx.fillRect(14 * TILE + 1, 18 * TILE + 2, 5, 5);
    drawLabel('GERBANG DESA', 13 * TILE, 18 * TILE, '#ffe9a8');

    const drawables = [];
    HOUSES.forEach(function (h) { drawables.push({ y: (h.y + h.h) * TILE, fn: function () { drawHouse(h); } }); });
    TREES.forEach(function (tr) { drawables.push({ y: (tr[1] + 1) * TILE, fn: function () { drawTree(tr[0], tr[1], t); } }); });
    BUSHES.forEach(function (b) { drawables.push({ y: (b[1] + 1) * TILE, fn: function () { drawBush(b); } }); });
    FENCES.forEach(function (f) { drawables.push({ y: (f[1] + 1) * TILE, fn: function () { drawFence(f); } }); });
    SIGNS.forEach(function (s) { drawables.push({ y: (s.y + 1) * TILE, fn: function () { drawSign(s); } }); });
    NPCS.forEach(function (n) {
      drawables.push({
        y: n.py + 32,
        fn: function () {
          const bob = Math.sin(t / 480 + n.phase) * 1.6;
          ctx.fillStyle = 'rgba(20,40,15,.25)';
          ctx.beginPath(); ctx.ellipse(n.px + 16, n.py + 30, 10, 3.5, 0, 0, Math.PI * 2); ctx.fill();
          drawChar(ctx, npcSprites[n.id].down, n.px, n.py + bob, false);
          drawLabel(n.name.split(' ').slice(-1)[0], n.px + 16, n.py - 6 + bob, '#ffe9a8');
          if (n.counts && !GAME_STATE.talked.has(n.id)) {
            const bounce = Math.abs(Math.sin(t / 300 + n.phase)) * 4;
            ctx.font = 'bold 15px monospace'; ctx.textAlign = 'center';
            ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.7)';
            const qy = n.py - 16 - bounce;
            ctx.strokeText('!', n.px + 16, qy);
            ctx.fillStyle = '#ffd93d';
            ctx.fillText('!', n.px + 16, qy);
          }
        },
      });
    });
    drawables.push({
      y: player.y + 32,
      fn: function () {
        const bob = player.moving ? Math.abs(Math.sin(player.walkPhase)) * 2.5 : 0;
        let spr = playerSprites.down, flip = false;
        if (player.dir === 'up') spr = playerSprites.up;
        else if (player.dir === 'left') { spr = playerSprites.side; flip = true; }
        else if (player.dir === 'right') { spr = playerSprites.side; flip = false; }
        ctx.fillStyle = 'rgba(20,40,15,.3)';
        ctx.beginPath(); ctx.ellipse(player.x + 16, player.y + 30, 10, 3.5, 0, 0, Math.PI * 2); ctx.fill();
        drawChar(ctx, spr, player.x, player.y - bob, flip);
        drawLabel('KAMU', player.x + 16, player.y - 6 - bob, '#fff');
      },
    });
    drawables.sort(function (a, b) { return a.y - b.y; });
    drawables.forEach(function (d) { d.fn(); });

    // bayangan awan melayang (nuansa hidup ala game tani)
    ctx.fillStyle = 'rgba(255,255,255,.10)';
    for (let i = 0; i < 3; i++) {
      const cx = ((t / 40 + i * 340) % (canvas.width + 260)) - 130;
      const cy = 60 + i * 170;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 90, 26, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 50, cy + 8, 60, 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // vignette lembut di tepi layar
    const vg = ctx.createRadialGradient(416, 304, 320, 416, 304, 620);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(10,25,10,.28)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // petunjuk interaksi
    if (!dialog) {
      const pcx = player.x + 16, pcy = player.y + 16;
      let near = false;
      NPCS.forEach(function (n) { if (Math.hypot(n.px + 16 - pcx, n.py + 16 - pcy) < 54) near = true; });
      SIGNS.forEach(function (s) { if (Math.hypot(s.x * TILE + 16 - pcx, s.y * TILE + 16 - pcy) < 54) near = true; });
      if (near) {
        const label = 'Tekan E / BICARA untuk berinteraksi';
        ctx.font = 'bold 12px monospace';
        const w = ctx.measureText(label).width + 18;
        ctx.fillStyle = 'rgba(0,0,0,.65)';
        ctx.fillRect((canvas.width - w) / 2, 8, w, 22);
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.fillText(label, canvas.width / 2, 23);
      }
    }
  }

  /* ---------------- Loop utama ---------------- */
  let last = 0;
  function loop(t) {
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    update(dt);
    render(t);
    requestAnimationFrame(loop);
  }
  updateHUD();
  if (GAME_STATE.talked.size >= NPCS.filter(function (n) { return n.counts; }).length && GAME_STATE.talked.size > 0) {
    document.getElementById('quest-hint').textContent =
      '🏆 Kamu sudah mengobrol dengan semua warga — Penjelajah Portofolio Desa! Masih bisa main mancing & tower defense sepuasnya.';
  }
  requestAnimationFrame(loop);
})();
