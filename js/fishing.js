/* ============================================================
   MINI GAME: MANCING (halaman terpisah — fishing.html)
   Lempar kail -> tunggu gigitan ("!") -> tarik cepat!
   Progres (koleksi, poin, total) tersimpan via localStorage.
   ============================================================ */
(function () {
  'use strict';

  const cvs = document.getElementById('fishing-canvas');
  const g = cvs.getContext('2d');
  const W = cvs.width, H = cvs.height;
  const WATER_Y = Math.floor(H * 0.52);
  const btn = document.getElementById('fishing-btn');
  const status = document.getElementById('fishing-status');
  const collectionEl = document.getElementById('fishing-collection');
  const totalEl = document.getElementById('fish-total');
  const scoreEl = document.getElementById('fish-score');

  /* --- suara --- */
  let audioCtx = null;
  function beep(freq, dur, type, vol) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const gn = audioCtx.createGain();
      o.type = type || 'square';
      o.frequency.value = freq;
      gn.gain.value = vol || 0.04;
      o.connect(gn); gn.connect(audioCtx.destination);
      o.start();
      gn.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + (dur || 0.08));
      o.stop(audioCtx.currentTime + (dur || 0.08));
    } catch (e) { /* abaikan */ }
  }

  const FISH = [
    { name: 'Ikan Mujair', emoji: '🐟', weight: 34, pts: 10 },
    { name: 'Ikan Mas', emoji: '🐠', weight: 28, pts: 15 },
    { name: 'Ikan Lele', emoji: '🐡', weight: 20, pts: 20 },
    { name: 'Ikan Gurame', emoji: '🐟', weight: 11, pts: 30 },
    { name: 'Ikan Koi Emas', emoji: '✨🐠', weight: 4, pts: 50 },
    { name: 'Sepatu Tua', emoji: '👞', weight: 3, pts: 1 },
  ];

  /* --- progres tersimpan --- */
  const save = window.DesaSave ? DesaSave.load() : { collection: {}, fishScore: 0, fish: 0 };
  const collection = save.collection || {};
  let totalScore = save.fishScore || 0;

  function persist() {
    if (!window.DesaSave) return;
    const d = DesaSave.load();
    d.collection = collection;
    d.fishScore = totalScore;
    d.fish = Object.values(collection).reduce(function (a, b) { return a + b; }, 0);
    DesaSave.save(d);
  }
  function totalFish() {
    return Object.values(collection).reduce(function (a, b) { return a + b; }, 0);
  }

  function renderCollection() {
    const parts = Object.keys(collection).map(function (k) {
      const f = FISH.find(function (x) { return x.name === k; });
      return f.emoji + ' ' + k + ' ×' + collection[k];
    });
    collectionEl.textContent = parts.length
      ? parts.join('  ·  ')
      : 'Masih kosong — ayo tangkap ikan pertamamu!';
    totalEl.textContent = totalFish();
    scoreEl.textContent = totalScore;
  }

  /* --- state --- */
  let state = 'ready'; // ready | waiting | bite | done
  let biteAt = 0, biteDeadline = 0;
  let bobberX = 380;
  let lastCatch = null;
  let particles = [];
  // bayangan ikan yang berenang di air
  const swimmers = [];
  for (let i = 0; i < 5; i++) {
    swimmers.push({
      x: Math.random() * W, y: WATER_Y + 46 + Math.random() * (H - WATER_Y - 70),
      v: (0.25 + Math.random() * 0.4) * (Math.random() < 0.5 ? 1 : -1),
      s: 0.7 + Math.random() * 0.7,
    });
  }

  function pickFish() {
    const total = FISH.reduce(function (a, f) { return a + f.weight; }, 0);
    let r = Math.random() * total;
    for (const f of FISH) { r -= f.weight; if (r <= 0) return f; }
    return FISH[0];
  }

  function splash(x, y, n, colors) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 2.6,
        vy: -1.2 - Math.random() * 2.4,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 2.5,
      });
    }
  }

  /* --- gambar adegan --- */
  function drawTree(x, y, s) {
    g.fillStyle = '#6b4a2a'; g.fillRect(x - 3 * s, y, 6 * s, 16 * s);
    g.fillStyle = '#2e7d32';
    g.beginPath(); g.ellipse(x, y - 12 * s, 20 * s, 15 * s, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#43a047';
    g.beginPath(); g.ellipse(x - 6 * s, y - 16 * s, 11 * s, 8 * s, 0, 0, Math.PI * 2); g.fill();
  }

  function draw(t) {
    // langit senja lembut
    const sky = g.createLinearGradient(0, 0, 0, WATER_Y);
    sky.addColorStop(0, '#6ec1f5');
    sky.addColorStop(0.75, '#bfe6fb');
    sky.addColorStop(1, '#e8f7ff');
    g.fillStyle = sky; g.fillRect(0, 0, W, WATER_Y);
    // matahari + awan
    g.fillStyle = '#ffd93d';
    g.beginPath(); g.arc(W - 84, 52, 24, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,217,61,.35)';
    g.beginPath(); g.arc(W - 84, 52, 34, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,.92)';
    [[60 + Math.sin(t / 4000) * 8, 44, 46], [210, 30, 34], [420 + Math.cos(t / 5200) * 7, 58, 40]].forEach(function (c) {
      g.beginPath();
      g.ellipse(c[0], c[1], c[2], 13, 0, 0, Math.PI * 2);
      g.ellipse(c[0] + c[2] * 0.55, c[1] + 4, c[2] * 0.6, 10, 0, 0, Math.PI * 2);
      g.fill();
    });
    // bukit jauh + pepohonan tepi danau
    g.fillStyle = '#8fd07a';
    g.beginPath(); g.ellipse(90, WATER_Y + 6, 190, 44, 0, Math.PI, Math.PI * 2); g.fill();
    g.fillStyle = '#74ba62';
    g.beginPath(); g.ellipse(W - 90, WATER_Y + 8, 210, 52, 0, Math.PI, Math.PI * 2); g.fill();
    drawTree(36, WATER_Y - 8, 1.05);
    drawTree(96, WATER_Y - 2, 0.8);
    drawTree(W - 40, WATER_Y - 6, 1.1);
    drawTree(W - 104, WATER_Y - 1, 0.75);

    // air bergradasi + kilau
    const water = g.createLinearGradient(0, WATER_Y, 0, H);
    water.addColorStop(0, '#3f97dd');
    water.addColorStop(1, '#1f5fa6');
    g.fillStyle = water; g.fillRect(0, WATER_Y, W, H - WATER_Y);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, WATER_Y, W, 3);
    g.fillStyle = 'rgba(255,255,255,.30)';
    for (let i = 0; i < 9; i++) {
      const wx = ((i * 97 + Math.floor(t / 34)) % (W + 40)) - 20;
      g.fillRect(wx, WATER_Y + 18 + (i % 4) * 34, 16, 2.4);
    }
    // bayangan ikan berenang
    g.fillStyle = 'rgba(10,40,80,.30)';
    swimmers.forEach(function (s) {
      g.beginPath(); g.ellipse(s.x, s.y, 15 * s.s, 5.5 * s.s, 0, 0, Math.PI * 2); g.fill();
      g.beginPath();
      const dir = s.v > 0 ? 1 : -1;
      g.moveTo(s.x - dir * 14 * s.s, s.y);
      g.lineTo(s.x - dir * 21 * s.s, s.y - 5 * s.s);
      g.lineTo(s.x - dir * 21 * s.s, s.y + 5 * s.s);
      g.closePath(); g.fill();
    });
    // daun teratai
    [[520, WATER_Y + 108], [566, WATER_Y + 132], [70, WATER_Y + 128]].forEach(function (p) {
      g.fillStyle = '#3f9e4d';
      g.beginPath(); g.ellipse(p[0], p[1], 17, 6.5, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#57b868';
      g.beginPath(); g.ellipse(p[0] - 3, p[1] - 1.5, 11, 4, 0, 0, Math.PI * 2); g.fill();
    });
    g.fillStyle = '#ff8fb2';
    g.beginPath(); g.arc(566, WATER_Y + 122, 4.5, 0, Math.PI * 2); g.fill();

    // dermaga kayu detail
    const dockY = WATER_Y - 4;
    g.fillStyle = 'rgba(15,45,80,.35)'; g.fillRect(0, WATER_Y + 2, 176, 6);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = i % 2 ? '#96682f' : '#a9743f';
      g.fillRect(i * 30, dockY, 28, 11);
    }
    g.fillStyle = '#6b4a2a';
    g.fillRect(12, dockY + 11, 9, 30); g.fillRect(148, dockY + 11, 9, 30);
    g.fillStyle = '#5d4020'; g.fillRect(0, dockY + 9, 178, 3);
    // ember ikan
    g.fillStyle = '#5b8dd9'; g.fillRect(128, dockY - 14, 24, 14);
    g.fillStyle = '#3f6db3'; g.fillRect(128, dockY - 14, 24, 4);

    // pemancing (duduk di dermaga)
    const fx = 52, fy = dockY;
    g.fillStyle = '#33415c'; g.fillRect(fx - 2, fy - 12, 20, 12);      // celana
    g.fillStyle = '#d8342c'; g.fillRect(fx, fy - 34, 17, 23);           // baju
    g.fillStyle = '#f2c188'; g.fillRect(fx + 2, fy - 49, 13, 14);       // kepala
    g.fillStyle = '#3a2a1a'; g.fillRect(fx + 2, fy - 49, 13, 4);        // rambut
    g.fillStyle = '#e8c85a'; g.fillRect(fx - 2, fy - 51, 22, 4);        // topi jerami
    g.fillStyle = '#f2c188'; g.fillRect(fx + 15, fy - 30, 10, 5);       // lengan
    // joran melengkung
    g.strokeStyle = '#4a2f16'; g.lineWidth = 3.4;
    g.beginPath();
    g.moveTo(fx + 22, fy - 28);
    g.quadraticCurveTo(fx + 74, fy - 62, fx + 118, fy - 54);
    g.stroke();
    const rodTipX = fx + 118, rodTipY = fy - 54;

    if (state === 'waiting' || state === 'bite') {
      const bobY = WATER_Y + 30 + Math.sin(t / 260) * 3 - (state === 'bite' ? 6 : 0);
      g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(rodTipX, rodTipY); g.lineTo(bobberX, bobY); g.stroke();
      // riak berdenyut
      const rp = (t % 900) / 900;
      g.strokeStyle = 'rgba(255,255,255,' + (0.65 * (1 - rp)) + ')';
      g.lineWidth = 2;
      g.beginPath(); g.ellipse(bobberX, WATER_Y + 31, 8 + rp * 22, 3 + rp * 6, 0, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.5)';
      g.beginPath(); g.ellipse(bobberX, WATER_Y + 31, 10, 3.4, 0, 0, Math.PI * 2); g.stroke();
      // pelampung
      g.fillStyle = '#e33'; g.fillRect(bobberX - 5, bobY - 8, 10, 8);
      g.fillStyle = '#fff'; g.fillRect(bobberX - 5, bobY, 10, 6);
      g.fillStyle = '#20242b'; g.fillRect(bobberX - 1, bobY - 12, 2.4, 5);
      if (state === 'bite') {
        // cipratan
        if (Math.random() < 0.5) splash(bobberX, WATER_Y + 28, 2, ['#bfe3ff', '#ffffff', '#7ec8f7']);
        g.font = 'bold 52px sans-serif'; g.textAlign = 'center';
        g.lineWidth = 8; g.strokeStyle = 'rgba(0,0,0,.55)';
        const by = bobY - 30 + Math.sin(t / 55) * 2.5;
        g.strokeText('!', bobberX, by);
        g.fillStyle = '#ffd93d'; g.fillText('!', bobberX, by);
      }
    }

    if (state === 'done' && lastCatch) {
      const cy = WATER_Y - 66 + Math.sin(t / 300) * 3;
      g.font = '58px serif'; g.textAlign = 'center';
      g.fillText(lastCatch.emoji.replace('✨', ''), W / 2 + 60, cy);
      if (lastCatch.name === 'Ikan Koi Emas') {
        g.font = '30px serif';
        g.fillText('✨', W / 2 + 26, cy - 16);
        g.fillText('✨', W / 2 + 96, cy + 6);
      }
      g.font = 'bold 21px sans-serif';
      g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,.5)';
      const label = lastCatch.name + '  +' + lastCatch.pts + ' poin!';
      g.strokeText(label, W / 2 + 60, cy + 34);
      g.fillStyle = '#fff'; g.fillText(label, W / 2 + 60, cy + 34);
    }

    // partikel cipratan
    particles = particles.filter(function (p) { return p.life > 0; });
    particles.forEach(function (p) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.14; p.life -= 0.03;
      g.globalAlpha = Math.max(0, p.life);
      g.fillStyle = p.color;
      g.fillRect(p.x, p.y, p.size, p.size);
      g.globalAlpha = 1;
    });

    // vignette
    const vg = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(8,25,50,.25)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }

  function loop(t) {
    // gerakkan bayangan ikan
    swimmers.forEach(function (s) {
      s.x += s.v;
      if (s.x < -30) s.x = W + 30;
      if (s.x > W + 30) s.x = -30;
    });
    draw(t);
    if (state === 'waiting' && t >= biteAt) {
      state = 'bite';
      biteDeadline = t + 780;
      status.textContent = 'IKAN MENGGIGIT! TARIK SEKARANG! 🐟';
      btn.textContent = 'TARIK! 🎣';
      beep(980, 0.09); setTimeout(function () { beep(1180, 0.1); }, 90);
    } else if (state === 'bite' && t > biteDeadline) {
      state = 'ready';
      status.textContent = 'Yah, ikannya kabur... Coba lempar lagi, tetap sabar!';
      btn.textContent = 'LEMPAR 🎣';
      lastCatch = null;
    }
    requestAnimationFrame(loop);
  }

  function action() {
    const now = performance.now();
    if (state === 'ready' || state === 'done') {
      state = 'waiting';
      lastCatch = null;
      bobberX = 250 + Math.random() * 300;
      biteAt = now + 1300 + Math.random() * 2400;
      status.textContent = 'Kail dilempar... tunggu sampai ada tanda "!" lalu tarik cepat!';
      btn.textContent = 'MENUNGGU...';
      splash(bobberX, WATER_Y + 26, 7, ['#bfe3ff', '#ffffff']);
      beep(420, 0.06, 'sine', 0.05);
    } else if (state === 'bite') {
      const fish = pickFish();
      collection[fish.name] = (collection[fish.name] || 0) + 1;
      totalScore += fish.pts;
      lastCatch = fish;
      state = 'done';
      status.textContent = fish.name === 'Sepatu Tua'
        ? 'Lho, yang naik malah sepatu tua?! Simpan saja untuk kenang-kenangan. 😅'
        : fish.name === 'Ikan Koi Emas'
          ? 'LUAR BIASA! Kamu menangkap Ikan Koi Emas yang legendaris! ✨'
          : 'Dapat! ' + fish.name + ' (' + fish.pts + ' poin). Lempar lagi?';
      btn.textContent = 'LEMPAR LAGI 🎣';
      splash(bobberX, WATER_Y + 24, 16, ['#bfe3ff', '#ffffff', '#ffd93d']);
      // Poin ikan menjadi koin desa (terlihat di navbar halaman utama)
      if (window.DesaSave) {
        const d0 = DesaSave.load();
        d0.coins = (d0.coins || 0) + fish.pts;
        DesaSave.save(d0);
      }
      persist();
      renderCollection();
      beep(784, 0.1); setTimeout(function () { beep(1046, 0.14); }, 110);
    } else if (state === 'waiting') {
      status.textContent = 'Sabar... belum ada gigitan. Tunggu tanda "!" muncul!';
    }
  }

  btn.addEventListener('click', action);
  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space') { e.preventDefault(); action(); }
  });

  renderCollection();
  requestAnimationFrame(loop);
})();
