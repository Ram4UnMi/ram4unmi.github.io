/* ============================================================
   MINI GAME: TOWER DEFENSE (halaman terpisah — td.html)
   Grid 15x10 (tile 40px). Bangun menara Panah/Meriam di rumput,
   tahan gelombang slime yang berjalan mengikuti jalan tanah.
   Rekor wave tersimpan via localStorage.
   ============================================================ */
(function () {
  'use strict';

  const cvs = document.getElementById('td-canvas');
  const g = cvs.getContext('2d');
  const COLS = 15, ROWS = 10, T = 40;

  const goldEl = document.getElementById('td-gold');
  const livesEl = document.getElementById('td-lives');
  const waveEl = document.getElementById('td-wave');
  const enemiesEl = document.getElementById('td-enemies');
  const bestEl = document.getElementById('td-best-label');
  const msgEl = document.getElementById('td-msg');
  const startBtn = document.getElementById('td-start');
  const btnArrow = document.getElementById('td-tower-arrow');
  const btnCannon = document.getElementById('td-tower-cannon');

  /* --- suara --- */
  let audioCtx = null;
  function beep(freq, dur, type, vol) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const gn = audioCtx.createGain();
      o.type = type || 'square';
      o.frequency.value = freq;
      gn.gain.value = vol || 0.035;
      o.connect(gn); gn.connect(audioCtx.destination);
      o.start();
      gn.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + (dur || 0.08));
      o.stop(audioCtx.currentTime + (dur || 0.08));
    } catch (e) { /* abaikan */ }
  }

  const TOWERS = {
    arrow: { name: 'Panah', icon: '🏹', cost: 50, range: 102, dmg: 7, rate: 0.34, projSpeed: 320, roof: '#b3392e' },
    cannon: { name: 'Meriam', icon: '💣', cost: 100, range: 92, dmg: 26, rate: 1.15, projSpeed: 220, splash: 38, roof: '#3d4b57' },
  };

  // Jalan tanah: masuk barat di baris 7 -> naik di kolom 11 -> keluar timur di baris 2
  const PATH_CELLS = new Set();
  for (let c = 0; c <= 11; c++) PATH_CELLS.add(c + ',7');
  for (let r = 2; r <= 7; r++) PATH_CELLS.add('11,' + r);
  for (let c = 11; c <= 14; c++) PATH_CELLS.add(c + ',2');
  const WAYPOINTS = [
    { x: -24, y: 7 * T + T / 2 },
    { x: 11 * T + T / 2, y: 7 * T + T / 2 },
    { x: 11 * T + T / 2, y: 2 * T + T / 2 },
    { x: COLS * T + 24, y: 2 * T + T / 2 },
  ];
  // Dekorasi tetap (tidak bisa dibangun)
  const DECOR = new Set(['1,1', '13,8', '6,4', '2,9', '14,5', '4,2']);
  const FLOWERS = new Set(['3,5', '8,8', '13,3', '5,9', '10,5', '1,3']);

  let gold, lives, wave, towers, enemies, projs, particles, spawning, spawnTimer, waveActive, gameOver;
  let selected = 'arrow';
  let hoverCell = null;
  let lastTime = 0;

  function best() {
    if (!window.DesaSave) return 0;
    return DesaSave.load().tdBest || 0;
  }
  function saveBest() {
    if (!window.DesaSave) return;
    const d = DesaSave.load();
    d.tdBest = Math.max(d.tdBest || 0, wave);
    DesaSave.save(d);
    bestEl.textContent = 'Wave ' + d.tdBest;
  }

  function reset() {
    gold = 130; lives = 20; wave = 0;
    towers = new Map(); enemies = []; projs = []; particles = [];
    spawning = 0; spawnTimer = 0; waveActive = false; gameOver = false;
    msgEl.textContent = 'Pilih menara, klik/tap petak rumput untuk membangun. Lalu tekan MULAI WAVE.';
    startBtn.disabled = false;
    bestEl.textContent = 'Wave ' + best();
    syncStats();
  }

  function syncStats() {
    goldEl.textContent = gold;
    livesEl.textContent = lives;
    waveEl.textContent = wave;
    enemiesEl.textContent = enemies.length + spawning;
  }

  function selectTower(type) {
    selected = type;
    btnArrow.classList.toggle('selected', type === 'arrow');
    btnCannon.classList.toggle('selected', type === 'cannon');
  }
  btnArrow.addEventListener('click', function () { selectTower('arrow'); });
  btnCannon.addEventListener('click', function () { selectTower('cannon'); });

  startBtn.addEventListener('click', function () {
    if (waveActive || gameOver) return;
    wave++;
    spawning = 6 + wave * 3;
    spawnTimer = 0;
    waveActive = true;
    msgEl.textContent = 'Wave ' + wave + ' datang! Slime mendekat dari gerbang barat...';
    syncStats();
    beep(392, 0.1);
  });

  function cellFromEvent(e) {
    const rect = cvs.getBoundingClientRect();
    const cx = Math.floor((e.clientX - rect.left) / rect.width * COLS);
    const cy = Math.floor((e.clientY - rect.top) / rect.height * ROWS);
    if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return null;
    return { cx: cx, cy: cy };
  }
  cvs.addEventListener('mousemove', function (e) { hoverCell = cellFromEvent(e); });
  cvs.addEventListener('mouseleave', function () { hoverCell = null; });
  cvs.addEventListener('click', function (e) {
    if (gameOver) return;
    const cell = cellFromEvent(e);
    if (!cell) return;
    const k = cell.cx + ',' + cell.cy;
    if (PATH_CELLS.has(k)) { msgEl.textContent = 'Tidak bisa membangun di jalan!'; return; }
    if (DECOR.has(k)) { msgEl.textContent = 'Ada pohon/batu di petak itu.'; return; }
    if (towers.has(k)) { msgEl.textContent = 'Petak ini sudah ada menara.'; return; }
    const spec = TOWERS[selected];
    if (gold < spec.cost) { msgEl.textContent = 'Emas tidak cukup untuk menara ' + spec.name + ' (' + spec.cost + '🪙).'; return; }
    gold -= spec.cost;
    towers.set(k, { cx: cell.cx, cy: cell.cy, type: selected, cooldown: 0, flash: 0 });
    msgEl.textContent = 'Menara ' + spec.name + ' dibangun. Pertahankan desa!';
    syncStats();
    beep(660, 0.06);
  });

  function spawnEnemy() {
    const hp = Math.round(16 + wave * 9 + Math.pow(wave, 1.6));
    enemies.push({
      x: WAYPOINTS[0].x, y: WAYPOINTS[0].y,
      wp: 1, hp: hp, maxHp: hp,
      speed: Math.min(84, 34 + wave * 2.4),
      reward: 8 + Math.floor(wave / 2),
      phase: Math.random() * Math.PI * 2,
    });
  }

  function burst(x, y, colors, n) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 90,
        vy: (Math.random() - 0.5) * 90,
        life: 1, size: 2 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  function update(dt) {
    if (gameOver) return;
    if (spawning > 0) {
      spawnTimer -= dt;
      if (spawnTimer <= 0) { spawnEnemy(); spawning--; spawnTimer = 0.75; syncStats(); }
    }
    for (const e of enemies) {
      const target = WAYPOINTS[e.wp];
      const dx = target.x - e.x, dy = target.y - e.y;
      const dist = Math.hypot(dx, dy);
      const step = e.speed * dt;
      if (dist <= step) {
        e.x = target.x; e.y = target.y; e.wp++;
        if (e.wp >= WAYPOINTS.length) {
          e.dead = true;
          lives--;
          burst(e.x - 10, e.y, ['#e33', '#ff8c42'], 8);
          beep(160, 0.15, 'sawtooth', 0.05);
          if (lives <= 0) {
            lives = 0; gameOver = true;
            saveBest();
            msgEl.textContent = 'Desa berhasil ditembus slime di wave ' + wave + '! Muat ulang halaman untuk mencoba lagi.';
            startBtn.disabled = true;
          }
          syncStats();
        }
      } else {
        e.x += dx / dist * step; e.y += dy / dist * step;
      }
    }
    towers.forEach(function (tw) {
      tw.cooldown -= dt;
      tw.flash = Math.max(0, tw.flash - dt * 6);
      if (tw.cooldown > 0) return;
      const spec = TOWERS[tw.type];
      const tx = tw.cx * T + T / 2, ty = tw.cy * T + T / 2;
      let bestT = null, bestD = spec.range;
      for (const e of enemies) {
        if (e.dead) continue;
        const d = Math.hypot(e.x - tx, e.y - ty);
        if (d < bestD) { bestD = d; bestT = e; }
      }
      if (bestT) {
        projs.push({ x: tx, y: ty - 10, target: bestT, type: tw.type, dmg: spec.dmg, splash: spec.splash || 0, speed: spec.projSpeed });
        tw.cooldown = spec.rate;
        tw.flash = 1;
      }
    });
    for (const p of projs) {
      if (!p.target || p.target.dead) { p.dead = true; continue; }
      const dx = p.target.x - p.x, dy = p.target.y - p.y;
      const dist = Math.hypot(dx, dy);
      const step = p.speed * dt;
      if (dist <= step + 4) {
        p.dead = true;
        if (p.splash > 0) {
          enemies.forEach(function (e) {
            if (!e.dead && Math.hypot(e.x - p.target.x, e.y - p.target.y) <= p.splash) e.hp -= p.dmg;
          });
          burst(p.target.x, p.target.y, ['#ff8c42', '#ffd93d', '#666'], 10);
          beep(120, 0.08, 'triangle', 0.05);
        } else {
          p.target.hp -= p.dmg;
          burst(p.target.x, p.target.y, ['#c98f52'], 3);
        }
      } else {
        p.x += dx / dist * step; p.y += dy / dist * step;
      }
    }
    enemies.forEach(function (e) {
      if (!e.dead && e.hp <= 0) {
        e.dead = true;
        gold += e.reward;
        burst(e.x, e.y, ['#7ee06b', '#b8f7a8'], 9);
        syncStats();
      }
    });
    enemies = enemies.filter(function (e) { return !e.dead; });
    projs = projs.filter(function (p) { return !p.dead; });
    particles = particles.filter(function (p) { return p.life > 0; });
    particles.forEach(function (p) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 2.2;
    });
    if (waveActive && spawning === 0 && enemies.length === 0 && !gameOver) {
      waveActive = false;
      const bonus = 20 + wave * 2;
      gold += bonus;
      // Bonus wave menjadi koin desa (terlihat di navbar halaman utama)
      if (window.DesaSave) {
        const d0 = DesaSave.load();
        d0.coins = (d0.coins || 0) + bonus;
        DesaSave.save(d0);
      }
      saveBest();
      msgEl.textContent = 'Wave ' + wave + ' bersih! Bonus +' + bonus + '🪙. Bangun menara lagi atau mulai wave berikutnya.';
      beep(784, 0.1); setTimeout(function () { beep(1046, 0.13); }, 100);
      syncStats();
    }
  }

  /* ---------------- Gambar ---------------- */
  function drawPathCell(c, r) {
    g.fillStyle = '#dcbd7f'; g.fillRect(c * T, r * T, T, T);
    g.fillStyle = '#cda961';
    const seed = (c * 31 + r * 17) % 5;
    g.fillRect(c * T + 6 + seed * 4, r * T + 9, 5, 3);
    g.fillRect(c * T + 20 - seed * 2, r * T + 26, 6, 3);
    g.fillStyle = 'rgba(160,124,62,.45)';
    g.fillRect(c * T, r * T, T, 2); g.fillRect(c * T, r * T + T - 2, T, 2);
  }
  function drawDecor(k) {
    const parts = k.split(',');
    const c = Number(parts[0]), r = Number(parts[1]);
    const x = c * T, y = r * T;
    if (k === '1,1' || k === '6,4' || k === '13,8') {
      // pohon
      g.fillStyle = 'rgba(20,40,15,.25)';
      g.beginPath(); g.ellipse(x + 21, y + 34, 13, 4, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#6b4a2a'; g.fillRect(x + 17, y + 22, 6, 13);
      g.fillStyle = '#2e7d32'; g.fillRect(x + 6, y + 6, 28, 18); g.fillRect(x + 11, y + 0, 18, 8);
      g.fillStyle = '#43a047'; g.fillRect(x + 10, y + 9, 10, 7);
    } else {
      // batu
      g.fillStyle = '#9aa0a6';
      g.beginPath(); g.ellipse(x + 20, y + 26, 13, 9, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#b9bfc5';
      g.beginPath(); g.ellipse(x + 16, y + 22, 8, 5.5, 0, 0, Math.PI * 2); g.fill();
    }
  }

  function draw(t) {
    // rumput bergaris seperti lapangan terawat
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const k = c + ',' + r;
        if (PATH_CELLS.has(k)) { drawPathCell(c, r); continue; }
        g.fillStyle = (c + r) % 2 === 0 ? '#5cab3e' : '#54a139';
        g.fillRect(c * T, r * T, T, T);
        if (FLOWERS.has(k)) {
          g.fillStyle = '#ff6b9d'; g.fillRect(c * T + 9, r * T + 12, 3.4, 3.4);
          g.fillStyle = '#ffd93d'; g.fillRect(c * T + 24, r * T + 22, 3.4, 3.4);
          g.fillStyle = '#fff'; g.fillRect(c * T + 16, r * T + 28, 3, 3);
        }
      }
    }
    DECOR.forEach(drawDecor);
    // gerbang masuk (barat) & gerbang desa (timur)
    g.fillStyle = '#8a5a2b';
    g.fillRect(0, 7 * T + 4, 7, 32);
    g.fillRect(COLS * T - 7, 2 * T + 4, 7, 32);
    g.fillStyle = '#b3392e';
    g.fillRect(COLS * T - 9, 2 * T, 9, 7);
    g.fillStyle = '#ffd93d'; g.fillRect(1, 7 * T + 2, 5, 5); g.fillRect(COLS * T - 6, 2 * T + 9, 4, 4);

    // pratinjau jangkauan saat hover
    if (hoverCell && !gameOver) {
      const k = hoverCell.cx + ',' + hoverCell.cy;
      if (!PATH_CELLS.has(k) && !DECOR.has(k) && !towers.has(k)) {
        const spec = TOWERS[selected];
        const hx = hoverCell.cx * T + T / 2, hy = hoverCell.cy * T + T / 2;
        g.fillStyle = 'rgba(255,255,255,.16)';
        g.beginPath(); g.arc(hx, hy, spec.range, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.6;
        g.beginPath(); g.arc(hx, hy, spec.range, 0, Math.PI * 2); g.stroke();
        g.fillStyle = gold >= spec.cost ? 'rgba(255,255,255,.35)' : 'rgba(227,51,51,.35)';
        g.fillRect(hoverCell.cx * T + 2, hoverCell.cy * T + 2, T - 4, T - 4);
      }
    }

    // menara
    towers.forEach(function (tw) {
      const spec = TOWERS[tw.type];
      const x = tw.cx * T, y = tw.cy * T;
      g.fillStyle = 'rgba(20,40,15,.3)';
      g.beginPath(); g.ellipse(x + 20, y + 35, 15, 4.5, 0, 0, Math.PI * 2); g.fill();
      // badan menara kayu-batu
      g.fillStyle = '#b9a98c'; g.fillRect(x + 8, y + 14, 24, 21);
      g.fillStyle = '#a08e6d'; g.fillRect(x + 8, y + 30, 24, 5);
      g.fillStyle = '#8d7c5c'; g.fillRect(x + 17, y + 22, 6, 13); // pintu
      // atap + bendera
      g.fillStyle = spec.roof;
      g.fillRect(x + 5, y + 6, 30, 8);
      g.fillRect(x + 10, y + 1, 20, 5);
      g.fillStyle = '#6b4a2a'; g.fillRect(x + 19, y - 5, 2.4, 7);
      g.fillStyle = '#ffd93d';
      const waveFlag = Math.sin(t / 160 + tw.cx) * 1.6;
      g.beginPath();
      g.moveTo(x + 21.4, y - 5);
      g.lineTo(x + 29, y - 3 + waveFlag);
      g.lineTo(x + 21.4, y);
      g.closePath(); g.fill();
      // ikon + kilatan tembakan
      g.font = '16px serif'; g.textAlign = 'center';
      g.fillText(spec.icon, x + 20, y + 27);
      if (tw.flash > 0) {
        g.fillStyle = 'rgba(255,220,90,' + 0.55 * tw.flash + ')';
        g.beginPath(); g.arc(x + 20, y + 10, 9, 0, Math.PI * 2); g.fill();
      }
    });

    // musuh slime (animasi memantul)
    for (const e of enemies) {
      const squash = Math.sin(t / 130 + e.phase) * 1.8;
      g.fillStyle = 'rgba(20,40,15,.28)';
      g.beginPath(); g.ellipse(e.x, e.y + 11, 12, 3.6, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#7ee06b';
      g.beginPath(); g.ellipse(e.x, e.y + 2, 13.5, 10.5 + squash * 0.4, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#a5ef97';
      g.beginPath(); g.ellipse(e.x - 4, e.y - 3, 5.5, 3.6, -0.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#20242b';
      g.fillRect(e.x - 6.5, e.y - 2, 3.2, 5.5);
      g.fillRect(e.x + 3.3, e.y - 2, 3.2, 5.5);
      g.fillStyle = '#fff';
      g.fillRect(e.x - 5.8, e.y - 1.6, 1.3, 1.8);
      g.fillRect(e.x + 4, e.y - 1.6, 1.3, 1.8);
      const w = 27, pct = Math.max(0, e.hp / e.maxHp);
      g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(e.x - w / 2, e.y - 15, w, 4.4);
      g.fillStyle = pct > 0.4 ? '#57e357' : '#e33';
      g.fillRect(e.x - w / 2, e.y - 15, w * pct, 4.4);
    }
    // proyektil
    for (const p of projs) {
      g.fillStyle = p.type === 'cannon' ? '#20242b' : '#8a5a2b';
      g.beginPath(); g.arc(p.x, p.y, p.type === 'cannon' ? 4.6 : 3, 0, Math.PI * 2); g.fill();
    }
    // partikel
    particles.forEach(function (p) {
      g.globalAlpha = Math.max(0, p.life);
      g.fillStyle = p.color;
      g.fillRect(p.x, p.y, p.size, p.size);
      g.globalAlpha = 1;
    });
    // vignette
    const vg = g.createRadialGradient(300, 200, 210, 300, 200, 430);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(10,25,10,.26)');
    g.fillStyle = vg; g.fillRect(0, 0, cvs.width, cvs.height);

    if (gameOver) {
      g.fillStyle = 'rgba(0,0,0,.58)'; g.fillRect(0, 0, cvs.width, cvs.height);
      g.font = 'bold 34px sans-serif'; g.textAlign = 'center';
      g.fillStyle = '#ff6b6b';
      g.fillText('DESA JATUH! 💀', cvs.width / 2, cvs.height / 2 - 10);
      g.font = '17px sans-serif'; g.fillStyle = '#fff';
      g.fillText('Kamu bertahan sampai wave ' + wave + ' — muat ulang halaman untuk mencoba lagi', cvs.width / 2, cvs.height / 2 + 24);
    }
  }

  function loop(t) {
    const dt = Math.min(0.05, (t - lastTime) / 1000 || 0);
    lastTime = t;
    update(dt);
    draw(t);
    requestAnimationFrame(loop);
  }

  reset();
  selectTower('arrow');
  lastTime = performance.now();
  requestAnimationFrame(loop);
})();
