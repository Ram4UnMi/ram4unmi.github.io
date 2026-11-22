/* ============================================================
   DESIGN ROOM — galeri portofolio desain grafis 3D (Three.js lokal).
   Ruangan gaming: dinding berisi bingkai karya (logofolio & slide),
   strip LED RGB, setup meja gaming, hologram logo berputar.
   Kontrol: seret untuk melihat, WASD/panah untuk berjalan,
   klik bingkai untuk membuka lightbox. Fallback: tampilan grid.
   ============================================================ */
(function () {
  'use strict';

  var save = window.DesaSave ? DesaSave.load() : {};
  var LANG = save.lang || 'en';
  var UI = {
    gridBtn: { en: '🖼️ Grid View', id: '🖼️ Tampilan Grid' },
    roomBtn: { en: '🎮 3D Room', id: '🎮 Ruangan 3D' },
    prev: { en: '⬅ Prev', id: '⬅ Sebelumnya' },
    next: { en: 'Next ➡', id: 'Berikutnya ➡' },
    close: { en: '✖ Close', id: '✖ Tutup' },
    secLogo: { en: '🖋️ Logofolio — Logo Designs', id: '🖋️ Logofolio — Desain Logo' },
    secSlide: { en: '📑 Portfolio Slides', id: '📑 Slide Portofolio' },
    noWebgl: { en: '3D could not start on this browser — showing the grid gallery instead.', id: '3D tidak bisa berjalan di browser ini — menampilkan galeri grid sebagai gantinya.' },
  };
  function T(o) { return o[LANG] !== undefined ? o[LANG] : o.en; }
  function wTitle(w) { return LANG === 'id' && w.titleId ? w.titleId : w.title; }
  function wDesc(w) { return LANG === 'id' ? w.descId : w.descEn; }

  var WORKS = (window.DESIGN_WORKS || []).slice();
  var logos = WORKS.filter(function (w) { return w.cat === 'logo'; });
  var slides = WORKS.filter(function (w) { return w.cat === 'slide'; });
  function slide(id) { return slides.filter(function (w) { return w.id === id; })[0]; }

  /* ---------------- Lightbox ---------------- */
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lb-img');
  var lbTitle = document.getElementById('lb-title');
  var lbDesc = document.getElementById('lb-desc');
  var lbCount = document.getElementById('lb-count');
  var lbIdx = 0;
  function openLightbox(i) {
    lbIdx = (i + WORKS.length) % WORKS.length;
    var w = WORKS[lbIdx];
    lbImg.src = w.img;
    lbImg.className = w.cat === 'logo' ? 'logo-img' : '';
    lbImg.alt = wTitle(w);
    lbTitle.textContent = wTitle(w);
    lbDesc.textContent = wDesc(w);
    lbCount.textContent = (lbIdx + 1) + ' / ' + WORKS.length;
    lb.classList.add('open');
  }
  function closeLightbox() { lb.classList.remove('open'); }
  document.getElementById('lb-prev').textContent = T(UI.prev);
  document.getElementById('lb-next').textContent = T(UI.next);
  document.getElementById('lb-close').textContent = T(UI.close);
  document.getElementById('lb-prev').addEventListener('click', function () { openLightbox(lbIdx - 1); });
  document.getElementById('lb-next').addEventListener('click', function () { openLightbox(lbIdx + 1); });
  document.getElementById('lb-close').addEventListener('click', closeLightbox);
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
  window.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.code === 'Escape') closeLightbox();
    if (e.code === 'ArrowLeft') openLightbox(lbIdx - 1);
    if (e.code === 'ArrowRight') openLightbox(lbIdx + 1);
  });

  /* ---------------- Strip thumbnail ---------------- */
  var thumbsEl = document.getElementById('thumbs');
  WORKS.forEach(function (w, i) {
    var b = document.createElement('button');
    b.type = 'button';
    if (w.cat === 'logo') b.className = 't-logo';
    b.title = wTitle(w);
    var im = document.createElement('img');
    im.src = w.img; im.alt = wTitle(w);
    b.appendChild(im);
    b.addEventListener('click', function () { openLightbox(i); });
    thumbsEl.appendChild(b);
  });

  /* ---------------- Tampilan grid (fallback & alternatif) ---------------- */
  var gridEl = document.getElementById('grid-view');
  function cardHTML(w, i) {
    return '<article class="work-card" data-open="' + i + '">' +
      '<div class="wc-img"><img src="' + w.img + '" alt=""></div>' +
      '<div class="wc-body"><b>' + wTitle(w) + '</b><span>' + wDesc(w) + '</span></div></article>';
  }
  gridEl.innerHTML =
    '<h2>' + T(UI.secLogo) + '</h2><div class="work-grid">' +
    logos.map(function (w) { return cardHTML(w, WORKS.indexOf(w)); }).join('') + '</div>' +
    '<h2>' + T(UI.secSlide) + '</h2><div class="work-grid">' +
    slides.map(function (w) { return cardHTML(w, WORKS.indexOf(w)); }).join('') + '</div>';
  gridEl.querySelectorAll('[data-open]').forEach(function (el) {
    el.addEventListener('click', function () { openLightbox(Number(el.getAttribute('data-open'))); });
  });

  var roomWrap = document.getElementById('room-wrap');
  var thumbsBar = document.getElementById('thumbs');
  var toggleBtn = document.getElementById('view-toggle');
  var gridMode = false;
  function setGridMode(on) {
    gridMode = on;
    gridEl.classList.toggle('open', on);
    roomWrap.style.display = on ? 'none' : '';
    thumbsBar.style.display = on ? 'none' : '';
    toggleBtn.textContent = on ? T(UI.roomBtn) : T(UI.gridBtn);
  }
  toggleBtn.textContent = T(UI.gridBtn);
  toggleBtn.addEventListener('click', function () { setGridMode(!gridMode); });

  /* ---------------- Joystick sentuh (HP/tablet) ---------------- */
  var joyVec = { x: 0, y: 0 };
  (function initJoystick() {
    var joy = document.getElementById('joy');
    var knob = document.getElementById('joy-knob');
    if (!joy || !knob || !joy.getBoundingClientRect) return;
    var active = false, pid = null;
    function setKnob(dx, dy) { knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; }
    function handle(e) {
      var r = joy.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var dx = e.clientX - cx, dy = e.clientY - cy;
      var max = r.width / 2 - 8;
      var d = Math.hypot(dx, dy);
      if (d > max) { dx *= max / d; dy *= max / d; }
      setKnob(dx, dy);
      joyVec.x = dx / max; joyVec.y = dy / max;
    }
    joy.addEventListener('pointerdown', function (e) {
      active = true; pid = e.pointerId;
      if (joy.setPointerCapture) joy.setPointerCapture(pid);
      handle(e);
      if (e.preventDefault) e.preventDefault();
    });
    joy.addEventListener('pointermove', function (e) { if (active && e.pointerId === pid) handle(e); });
    function end(e) {
      if (e.pointerId !== pid) return;
      active = false; pid = null; joyVec.x = 0; joyVec.y = 0; setKnob(0, 0);
    }
    joy.addEventListener('pointerup', end);
    joy.addEventListener('pointercancel', end);
  })();

  /* ---------------- Ruangan 3D ---------------- */
  var loadingEl = document.getElementById('room-loading');
  try {
    initRoom();
  } catch (err) {
    loadingEl.innerHTML = '<div style="font-size:34px">🖼️</div><div>' + T(UI.noWebgl) + '</div>';
    setTimeout(function () { setGridMode(true); }, 900);
  }

  function initRoom() {
    if (!window.THREE) throw new Error('no three');
    var canvas = document.getElementById('room-canvas');
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0e1a);
    scene.fog = new THREE.Fog(0x0b0e1a, 12, 26);
    var camera = new THREE.PerspectiveCamera(68, 1, 0.1, 60);

    /* --- cahaya --- */
    scene.add(new THREE.HemisphereLight(0x93a7ff, 0x0a0a12, 0.55));
    var pCyan = new THREE.PointLight(0x00c8ff, 0.85, 16); pCyan.position.set(-5, 3.5, -3.5); scene.add(pCyan);
    var pMag = new THREE.PointLight(0xff2e88, 0.7, 16); pMag.position.set(5.5, 3.2, 3.5); scene.add(pMag);
    var pWarm = new THREE.PointLight(0xff8a4d, 0.55, 13); pWarm.position.set(0, 3.4, 0); scene.add(pWarm);

    /* --- tekstur prosedural --- */
    function canvasTex(w, h, draw) {
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      var t = new THREE.CanvasTexture(c);
      t.encoding = THREE.sRGBEncoding;
      return t;
    }
    var floorTex = canvasTex(512, 512, function (g, w, h) {
      g.fillStyle = '#12151f'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(120,140,200,.13)'; g.lineWidth = 2;
      for (var i = 0; i <= 4; i++) {
        g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, h); g.stroke();
        g.beginPath(); g.moveTo(0, i * 128); g.lineTo(w, i * 128); g.stroke();
      }
      g.fillStyle = 'rgba(255,255,255,.02)';
      for (var j = 0; j < 300; j++) g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    });
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(4, 3);
    var wallTex = canvasTex(512, 256, function (g, w, h) {
      g.fillStyle = '#20263a'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,.025)';
      for (var j = 0; j < 200; j++) g.fillRect(Math.random() * w, Math.random() * h, 3, 2);
      g.fillStyle = '#171c2c'; g.fillRect(0, h - 42, w, 42);
      g.fillStyle = 'rgba(255,107,53,.5)'; g.fillRect(0, h - 44, w, 3);
    });
    wallTex.wrapS = THREE.RepeatWrapping;

    var RW = 14, RD = 11, RH = 4.2; // lebar, kedalaman, tinggi ruangan
    function plane(w, h, mat) { return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); }
    var floor = plane(RW, RD, new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.65, metalness: 0.25 }));
    floor.rotation.x = -Math.PI / 2; scene.add(floor);
    var ceil = plane(RW, RD, new THREE.MeshStandardMaterial({ color: 0x11141f, roughness: 1 }));
    ceil.rotation.x = Math.PI / 2; ceil.position.y = RH; scene.add(ceil);
    function wall(w, x, z, ry) {
      var m = plane(w, RH, new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.92 }));
      m.position.set(x, RH / 2, z); m.rotation.y = ry; scene.add(m); return m;
    }
    wall(RW, 0, -RD / 2, 0);
    wall(RW, 0, RD / 2, Math.PI);
    wall(RD, -RW / 2, 0, Math.PI / 2);
    wall(RD, RW / 2, 0, -Math.PI / 2);

    /* karpet aksen oranye di tengah */
    var rugTex = canvasTex(256, 256, function (g, w, h) {
      var gr = g.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, 128);
      gr.addColorStop(0, 'rgba(255,107,53,.30)');
      gr.addColorStop(0.7, 'rgba(120,40,90,.18)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    var rug = plane(6.4, 6.4, new THREE.MeshBasicMaterial({ map: rugTex, transparent: true, depthWrite: false }));
    rug.rotation.x = -Math.PI / 2; rug.position.y = 0.01; scene.add(rug);

    /* --- strip LED RGB --- */
    var ledMats = [];
    function ledStrip(w, x, y, z, ry, color) {
      var m = new THREE.MeshBasicMaterial({ color: color });
      var s = new THREE.Mesh(new THREE.BoxGeometry(w, 0.055, 0.055), m);
      s.position.set(x, y, z); s.rotation.y = ry; scene.add(s); ledMats.push(m); return s;
    }
    ledStrip(RW - 0.4, 0, RH - 0.14, -RD / 2 + 0.06, 0, 0x00e5ff);
    ledStrip(RW - 0.4, 0, RH - 0.14, RD / 2 - 0.06, 0, 0xff2e88);
    ledStrip(RD - 0.4, -RW / 2 + 0.06, RH - 0.14, 0, Math.PI / 2, 0xff6b35);
    ledStrip(RD - 0.4, RW / 2 - 0.06, RH - 0.14, 0, Math.PI / 2, 0x8a5cff);
    ledStrip(RW - 0.4, 0, 0.06, -RD / 2 + 0.06, 0, 0x00e5ff);
    ledStrip(RW - 0.4, 0, 0.06, RD / 2 - 0.06, 0, 0xff2e88);

    /* --- papan neon (teks bercahaya dari canvas) --- */
    function neonSign(text, w, color) {
      var tex = canvasTex(1024, 192, function (g, cw, ch) {
        g.clearRect(0, 0, cw, ch);
        g.font = '900 104px "Arial Black", Arial, sans-serif';
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.shadowColor = color; g.shadowBlur = 34;
        g.fillStyle = color;
        g.fillText(text, cw / 2, ch / 2);
        g.shadowBlur = 10; g.fillStyle = '#ffffff';
        g.globalAlpha = 0.85; g.fillText(text, cw / 2, ch / 2);
      });
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 192 / 1024),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
      return m;
    }
    var signMain = neonSign('DESIGN ROOM', 4.4, '#ff6b35');
    signMain.position.set(0, 3.78, -RD / 2 + 0.09); scene.add(signMain);
    var signLogo = neonSign('LOGOFOLIO', 3.4, '#00e5ff');
    signLogo.position.set(-RW / 2 + 0.09, 3.62, 0); signLogo.rotation.y = Math.PI / 2; scene.add(signLogo);
    var signSlides = neonSign('MY WORK', 3.0, '#ff2e88');
    signSlides.position.set(RW / 2 - 0.09, 3.62, 0); signSlides.rotation.y = -Math.PI / 2; scene.add(signSlides);

    /* --- bingkai karya --- */
    var frameMeshes = [];
    var texLoader = new THREE.TextureLoader();
    function addFrame(work, w, h, pos, ry) {
      var grp = new THREE.Group();
      var isLogo = work.cat === 'logo';
      var back = new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, h + 0.14, 0.07),
        new THREE.MeshStandardMaterial({ color: 0x11141f, roughness: 0.5, metalness: 0.4 }));
      grp.add(back);
      var edge = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, h + 0.2, 0.045),
        new THREE.MeshBasicMaterial({ color: isLogo ? 0x00c8ff : 0xff6b35 }));
      edge.position.z = -0.012; grp.add(edge);
      var tex = texLoader.load(work.img);
      tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = 4;
      var art = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ map: tex, transparent: isLogo }));
      art.position.z = 0.045;
      art.userData.workIndex = WORKS.indexOf(work);
      grp.add(art);
      frameMeshes.push(art);
      grp.position.copy(pos); grp.rotation.y = ry;
      scene.add(grp);
      return grp;
    }
    function frameH(work, w) { return w * work.h / work.w; }
    /* Pas-kan karya dalam kotak maxW x maxH tanpa distorsi aspek. */
    function fitBox(work, maxW, maxH) {
      var w = maxW, h = frameH(work, w);
      if (h > maxH) { h = maxH; w = h * work.w / work.h; }
      return [w, h];
    }

    /* Dinding utara (dinding utama): sampul besar + logofolio & terima kasih */
    var cover = slide('cover');
    if (cover) addFrame(cover, 4.0, frameH(cover, 4.0), new THREE.Vector3(-3.6, 1.95, -RD / 2 + 0.1), 0);
    var lf = slide('logofolio');
    if (lf) addFrame(lf, 3.2, frameH(lf, 3.2), new THREE.Vector3(3.2, 2.38, -RD / 2 + 0.1), 0);
    var th = slide('thanks');
    if (th) addFrame(th, 2.5, frameH(th, 2.5), new THREE.Vector3(3.2, 0.74, -RD / 2 + 0.1), 0);

    /* Dinding barat: LOGOFOLIO — 5 logo (2 baris: 3 + 2) */
    var logoPos = [
      [-2.9, 2.35], [0, 2.35], [2.9, 2.35], [-1.5, 0.95], [1.5, 0.95],
    ];
    logos.forEach(function (w, i) {
      var p = logoPos[i % logoPos.length];
      var box = fitBox(w, 1.45, 1.3);
      addFrame(w, box[0], box[1], new THREE.Vector3(-RW / 2 + 0.1, p[1], p[0]), Math.PI / 2);
    });

    /* Dinding timur: 5 slide portofolio (3 atas + 2 bawah) */
    var eastIds = ['skills', 'education', 'experience', 'job', 'volunteer'];
    var eastWorks = eastIds.map(slide).filter(Boolean);
    eastWorks.forEach(function (w, i) {
      var fw = 2.4, fh = frameH(w, fw);
      if (i < 3) addFrame(w, fw, fh, new THREE.Vector3(RW / 2 - 0.1, 2.62, -3.4 + i * 3.4), -Math.PI / 2);
      else addFrame(w, fw, fh, new THREE.Vector3(RW / 2 - 0.1, 1.02, i === 3 ? -1.7 : 1.7), -Math.PI / 2);
    });

    /* Dinding selatan (belakang spawn): tentang saya + kontak */
    var ab = slide('about');
    if (ab) addFrame(ab, 3.2, frameH(ab, 3.2), new THREE.Vector3(-3.4, 2.2, RD / 2 - 0.1), Math.PI);
    var ct = slide('contact');
    if (ct) addFrame(ct, 3.2, frameH(ct, 3.2), new THREE.Vector3(3.4, 2.2, RD / 2 - 0.1), Math.PI);

    /* --- setup meja gaming (dinding barat bawah) --- */
    var desk = new THREE.Group();
    var darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1f30, roughness: 0.6, metalness: 0.3 });
    var top = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 2.6), darkMat); top.position.y = 0.78; desk.add(top);
    [[-1.2], [1.2]].forEach(function (dz) {
      var leg = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.78, 0.06), darkMat);
      leg.position.set(0, 0.39, dz[0]); desk.add(leg);
    });
    var pc = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.85, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x0d0f16, roughness: 0.35, metalness: 0.5 }));
    pc.position.set(0, 0.45, 1.55); desk.add(pc);
    var pcGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.7),
      new THREE.MeshBasicMaterial({ color: 0x8a5cff }));
    pcGlow.position.set(0.22, 0.45, 1.55); pcGlow.rotation.y = Math.PI / 2; desk.add(pcGlow);
    ledMats.push(pcGlow.material);
    var kb = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 1.05),
      new THREE.MeshStandardMaterial({ color: 0x222840, roughness: 0.5 }));
    kb.position.set(0.02, 0.83, -0.2); desk.add(kb);
    var chair = new THREE.Group();
    var seat = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.09, 0.62),
      new THREE.MeshStandardMaterial({ color: 0x8c1f28, roughness: 0.7 }));
    seat.position.y = 0.55; chair.add(seat);
    var backr = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.95, 0.62),
      new THREE.MeshStandardMaterial({ color: 0x8c1f28, roughness: 0.7 }));
    backr.position.set(-0.3, 1.1, 0); chair.add(backr);
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x333a52, roughness: 0.4, metalness: 0.6 }));
    pole.position.y = 0.28; chair.add(pole);
    chair.position.set(0.85, 0, 0); chair.rotation.y = -Math.PI / 2 + 0.5;
    desk.add(chair);
    desk.position.set(-RW / 2 + 0.55, 0, -0.2);
    scene.add(desk);

    /* --- hologram logo berputar di tengah ruangan --- */
    var holo = null;
    var inei = logos.filter(function (w) { return w.id === 'inei'; })[0] || logos[0];
    if (inei) {
      var pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 0.9, 24),
        new THREE.MeshStandardMaterial({ color: 0x1a2032, roughness: 0.4, metalness: 0.5 }));
      pedestal.position.set(0, 0.45, 0.6); scene.add(pedestal);
      var holoTex = texLoader.load(inei.img); holoTex.encoding = THREE.sRGBEncoding;
      holo = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.15 * inei.h / inei.w),
        new THREE.MeshBasicMaterial({ map: holoTex, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
      holo.position.set(0, 1.85, 0.6); scene.add(holo);
      var holoLight = new THREE.PointLight(0x00c8ff, 0.7, 5);
      holoLight.position.set(0, 1.9, 0.6); scene.add(holoLight);
    }

    /* --- partikel debu melayang --- */
    var pGeo = new THREE.BufferGeometry();
    var pCount = 130, pArr = new Float32Array(pCount * 3);
    for (var i = 0; i < pCount; i++) {
      pArr[i * 3] = (Math.random() - 0.5) * (RW - 1);
      pArr[i * 3 + 1] = Math.random() * RH;
      pArr[i * 3 + 2] = (Math.random() - 0.5) * (RD - 1);
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pArr, 3));
    var dust = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x9db8ff, size: 0.035, transparent: true, opacity: 0.55 }));
    scene.add(dust);

    /* --- kontrol: lihat (seret) + jalan (WASD) --- */
    var pos = new THREE.Vector3(0, 1.6, 4.4);
    var yaw = 0, pitch = 0; // menghadap dinding utara (layar utama)
    var keys = {};
    window.addEventListener('keydown', function (e) {
      if (lb.classList.contains('open')) return;
      keys[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) >= 0) e.preventDefault();
    });
    window.addEventListener('keyup', function (e) { keys[e.code] = false; });
    var dragging = false, dragMoved = 0, lastX = 0, lastY = 0, downT = 0;
    canvas.addEventListener('pointerdown', function (e) {
      dragging = true; dragMoved = 0; downT = performance.now();
      lastX = e.clientX; lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      dragMoved += Math.abs(dx) + Math.abs(dy);
      yaw -= dx * 0.0042;
      pitch -= dy * 0.0035;
      pitch = Math.max(-1.1, Math.min(1.1, pitch));
    });
    canvas.addEventListener('pointerup', function (e) {
      dragging = false;
      if (dragMoved < 6 && performance.now() - downT < 400) {
        // klik bingkai -> lightbox
        var rect = canvas.getBoundingClientRect();
        var mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1);
        var rc = new THREE.Raycaster();
        rc.setFromCamera(mouse, camera);
        var hits = rc.intersectObjects(frameMeshes);
        if (hits.length) openLightbox(hits[0].object.userData.workIndex);
      }
    });

    function resize() {
      var w = roomWrap.clientWidth, h = roomWrap.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();
    loadingEl.style.display = 'none';

    var clock = new THREE.Clock();
    var hueBase = 0;
    function animate() {
      requestAnimationFrame(animate);
      var dt = Math.min(0.05, clock.getDelta());
      var t = clock.elapsedTime;
      // gerak
      var sp = 2.6 * dt;
      var sin = Math.sin(yaw), cos = Math.cos(yaw);
      var mx = 0, mz = 0;
      if (keys['KeyW'] || keys['ArrowUp']) { mx += -sin; mz += -cos; }
      if (keys['KeyS'] || keys['ArrowDown']) { mx += sin; mz += cos; }
      if (keys['KeyA'] || keys['ArrowLeft']) { mx += -cos; mz += sin; }
      if (keys['KeyD'] || keys['ArrowRight']) { mx += cos; mz += -sin; }
      var joyMag = Math.min(1, Math.hypot(joyVec.x, joyVec.y));
      if (joyMag > 0.08) {
        mx += (-sin) * (-joyVec.y) + cos * joyVec.x;
        mz += (-cos) * (-joyVec.y) + (-sin) * joyVec.x;
      }
      var len = Math.hypot(mx, mz);
      if (len > 0) {
        var spd = sp * (joyMag > 0.08 ? Math.max(joyMag, 0.35) : 1);
        pos.x += (mx / len) * spd;
        pos.z += (mz / len) * spd;
        pos.x = Math.max(-RW / 2 + 0.8, Math.min(RW / 2 - 0.8, pos.x));
        pos.z = Math.max(-RD / 2 + 0.8, Math.min(RD / 2 - 0.8, pos.z));
        // hindari pedestal hologram: dorong keluar dari radiusnya
        var dh = Math.hypot(pos.x, pos.z - 0.6);
        if (dh < 0.85 && dh > 0.001) {
          var push = 0.85 / dh;
          pos.x = pos.x * push;
          pos.z = 0.6 + (pos.z - 0.6) * push;
        }
      }
      camera.position.copy(pos);
      camera.rotation.set(0, 0, 0);
      camera.rotateY(yaw);
      camera.rotateX(pitch);
      // animasi suasana
      hueBase = (hueBase + dt * 0.03) % 1;
      ledMats.forEach(function (m, i) { m.color.setHSL((hueBase + i * 0.13) % 1, 0.85, 0.55); });
      if (holo) { holo.rotation.y += dt * 0.7; holo.position.y = 1.85 + Math.sin(t * 1.4) * 0.06; }
      dust.rotation.y = t * 0.012;
      renderer.render(scene, camera);
    }
    animate();
  }
})();
