/* ============================================================
   DESA PORTOFOLIO — engine pixel-art 2D ala Stardew Valley
   Fullscreen, TANPA library eksternal & TANPA internet:
   semua sprite & tile digambar prosedural oleh kode.
   Data desa & dialog: js/data.js | Progres: js/storage.js
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- Canvas fullscreen ---------------- */
  const container = document.getElementById('scene');
  const cvs = document.createElement('canvas');
  container.appendChild(cvs);
  const ctx = cvs.getContext('2d');
  let VW = 0, VH = 0;
  function resize() {
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    VW = window.innerWidth; VH = window.innerHeight;
    cvs.width = VW * DPR; cvs.height = VH * DPR;
    cvs.style.width = VW + 'px'; cvs.style.height = VH + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }
  window.addEventListener('resize', resize);
  resize();

  const TILE = 48, COLS = 26, ROWS = 19;
  const WORLD_W = COLS * TILE, WORLD_H = ROWS * TILE;

  /* ---------------- Progres & koin ---------------- */
  const save0 = window.DesaSave ? DesaSave.load() : {};
  const STATE = {
    talked: new Set(save0.talked || []),
    fish: save0.fish || 0,
    tdBest: save0.tdBest || 0,
    coins: save0.coins || 0,
    houseUpgrades: new Set(save0.house || []),
    musicOn: save0.music !== false,
    lang: save0.lang || 'en',
  };
  function persist() {
    if (!window.DesaSave) return;
    const d = DesaSave.load();
    d.talked = Array.from(STATE.talked);
    d.fish = STATE.fish;
    d.tdBest = STATE.tdBest;
    d.coins = STATE.coins;
    d.house = Array.from(STATE.houseUpgrades);
    d.music = STATE.musicOn;
    d.lang = STATE.lang;
    DesaSave.save(d);
  }
  function refreshChips() {
    const total = NPCS.filter((n) => n.counts).length;
    document.getElementById('chip-talk').textContent = STATE.talked.size + '/' + total;
    document.getElementById('chip-fish').textContent = STATE.fish;
    document.getElementById('chip-td').textContent = 'Wave ' + STATE.tdBest;
    document.getElementById('chip-coins').textContent = STATE.coins;
  }
  /* ---------------- Bahasa (EN utama / ID) ---------------- */
  const HOUSE_LABEL_EN = {
    'BALAI DESA': 'VILLAGE HALL', 'PANDAI BESI': 'BLACKSMITH', 'ARENA': 'ARENA',
    'GALERI': 'GALLERY', 'PENGINAPAN': 'INN', 'KANTOR POS': 'POST OFFICE', 'RUMAH TAMU': 'GUEST HOUSE',
  };
  function houseLabel(h) {
    return STATE.lang === 'en' ? (HOUSE_LABEL_EN[h.label] || h.label) : h.label;
  }

  /* ---------------- Kamus Bahasa ---------------- */
  function L(obj) { return obj[STATE.lang] !== undefined ? obj[STATE.lang] : obj.en; }
  const STR = {
    prompt: { en: 'Press <b>E</b> / TALK — ', id: 'Tekan <b>E</b> / BICARA — ' },
    dialogNext: { en: '▼ Press E / Space / Tap to continue', id: '▼ Tekan E / Spasi / Tap untuk lanjut' },
    homeTitle: { en: 'Guest House — Your Home in the Village', id: 'Rumah Tamu — Rumahmu di Desa' },
    homePrompt: { en: 'Guest House (your home)', id: 'Rumah Tamu (rumahmu)' },
    missionDone: { en: '🏆 MISSION COMPLETE! You have met every villager of Portfolio Village!', id: '🏆 MISI SELESAI! Kamu sudah mengenal seluruh warga Desa Portofolio!' },
    arrived: { en: '📍 You arrived near ', id: '📍 Kamu tiba di dekat ' },
    coinToast: { en: (n) => '+15 🪙 — Thanks for chatting with ' + n + '!', id: (n) => '+15 🪙 — Terima kasih sudah mengobrol dengan ' + n + '!' },
    bought: { en: (n) => '🎉 ' + n + ' installed at the Guest House!', id: (n) => '🎉 ' + n + ' terpasang di Rumah Tamu!' },
    owned: { en: '✓ Owned', id: '✓ Dimiliki' },
    buy: { en: 'Buy', id: 'Beli' },
  };
  const ROLE_EN = {
    lurah: 'About Me', pandai: 'Skills', dito: 'Project: Tourism Tickets', nara: 'Project: AI Research',
    raka: 'Project: Blockchain', tania: 'Project: TaniXplore & More', sari: 'Experience', pio: 'Contact',
    tirta: 'Mini Game: Fishing', garda: 'Mini Game: Tower Defense',
  };
  const NPC_EN = {
    lurah: [
      'Welcome to Portfolio Village, kid! I am Pak Lurah, the village chief. This village was built by a young man named Rama Hadi Nugraha.',
      'Rama graduated with a Bachelor\'s degree in Informatics Engineering from Universitas Komputer Indonesia (2022–2026) with a GPA of 3.80. His specialties: UI/UX & Mobile Development, Visual Design, and Applied AI Research.',
      'He also holds two BNSP certifications: Data Analyst and Junior Graphic Design. Go ahead, walk around — every villager here holds a piece of his work story!',
    ],
    pandai: [
      'Ha, a new visitor! I am Bang Bara, the village blacksmith. In my forge, Rama\'s tools are always kept sharp!',
      'His main languages & frameworks: Flutter, Python (FastAPI), PHP, JavaScript, HTML/CSS, C#/Unity, and Solidity. For data work: SQLite, SQLAlchemy, all the way to Hadoop.',
      'His design weapons: Figma, Photoshop, Illustrator, Premiere Pro, After Effects, and Lightroom. For AI: YOLOv8, PCA, UMAP, Isolation Forest, and LMM/GEE statistics. Impressive, right?',
    ],
    dito: [
      'Hello! I am Dito. I used to queue forever just to buy tourism tickets... until Rama interned at the Majalengka Tourism and Culture Office (Aug–Oct 2025).',
      'He designed the end-to-end UI/UX and built a tourism ticket booking app with Flutter for web & Android. It was tested by more than 200 users!',
      'His QR scan feature sped up ticket validation by 40%. He also designed the logo and branding. My queues run smoothly now!',
    ],
    nara: [
      'Nice to meet you, I am Nara, the village researcher. My colleague Rama once did a research internship at JAIST, Japan (Jul–Sep 2026) — in Computer Vision & Reliability Analysis.',
      'There he ran experiments on 8 object-detection configurations, built a PCA/UMAP/Isolation Forest pipeline, and analyzed 1,150 predictions using LMM/GEE and Association Rule Mining.',
      'His project: Japanese Waste Detection — detecting waste with YOLOv8 and a FastAPI backend (REST API + SQLite/SQLAlchemy). Cool, right?',
    ],
    raka: [
      'Yo! I am Raka, a traveling merchant. I trade between villages using Rama\'s technology: the Blockchain B2B Product Reservation DApp!',
      'Its smart contracts are written in Solidity and run on the Ethereum Sepolia network. The storefront is built with React and connected to a MetaMask wallet.',
      'Business-to-business product reservations become transparent and permanently recorded. My trade is safe and sound!',
    ],
    tania: [
      'Hi, I am Tania, a farmer in this village. Rama once built us TaniXplore (2024), an agriculture platform integrated with the Maps API — finding farmland and fresh produce became easy!',
      'He also built a Smart Door Notification based on IoT (2025) and an Anime Face Recognition project (2025). His hands are truly versatile.',
      'Do not forget to stop by the gallery boards at the plaza — they tell the story of his visual design work for Laznas PYI!',
    ],
    sari: [
      'Do stop by my inn, dear. I am Bu Sari. Many guests have told me tales of Rama\'s journey...',
      'He did a research internship at JAIST (2026) and became a Visual Designer at Laznas PYI (Feb–Mar 2026) — managing content for 8 Instagram accounts with an average of +20 followers per account per month.',
      'Before that he interned in UI/UX & Flutter at the Majalengka Tourism Office (2025), and during college he was active in the Glosarium Photography Club at UNIKOM in the Media Division (2023–2024) — content engagement rose 25%!',
    ],
    pio: [
      'A letter for you! I am Pak Pos Pio, the postman. If you wish to reach Rama, note his addresses carefully:',
      '📧 Email: nramahadi1@gmail.com\n💼 LinkedIn: linkedin.com/in/rama-hadi-nugraha\n🐙 GitHub: github.com/Ram4UnMi',
      'Rama is open to opportunities in UI/UX, Mobile Development (Flutter), and Visual Design. Send good news — I will deliver it in a flash!',
    ],
    tirta: [
      'Hoho... sit a while, kid. This pond has plenty of fish, but only a patient angler can catch the Golden Koi.',
      'It is easy: cast your line, wait for the "!" mark — then REEL as fast as you can! Want to try? (After this dialog, the fishing pond will open)',
    ],
    garda: [
      'HALT! ...Oh, you are a village visitor. Forgive me, I am Sergeant Garda. Lately slime monsters have been raiding our village from the eastern forest.',
      'Help me defend the village! Build Arrow and Cannon towers in the arena and hold back the slime waves as long as you can. Ready? (After this dialog, the arena will open)',
    ],
  };
  const SIGN_NAME_EN = {
    welcome: '🌻 Village Welcome Board', board1: '🎨 Gallery Board: Visual Design',
    board2: '🧪 Gallery Board: Tech & Research', board3: '🎓 Gallery Board: Education',
  };
  const SIGN_EN = {
    welcome: [
      '🌻 WELCOME TO PORTFOLIO VILLAGE 🌻\nA digital village by Rama Hadi Nugraha.',
      'How to play: walk with WASD / arrow keys (on phones use the D-pad), then press E or the TALK button near a villager to chat.',
      'There are 8 villagers holding Rama\'s portfolio stories, 1 fishing pond, and 1 tower defense arena. Happy exploring!',
    ],
    board1: [
      '🎨 VISUAL DESIGN — Laznas PYI (Feb–Mar 2026)',
      'As a Visual Designer, Rama created content for 8 Instagram accounts at once. His content insight mix was 65% / 22% / 12%, and each account grew by an average of +20 followers per month.',
      'His design skills are backed by a BNSP Junior Graphic Design certification. His weapons: Photoshop, Illustrator, Figma, Premiere Pro, After Effects, Lightroom.',
    ],
    board2: [
      '🧪 TECHNOLOGY & RESEARCH',
      'Rama loves experimenting: Web3 & Solidity smart contracts, AR with Vuforia, YOLOv8 object detection, even data pipelines with Hadoop, OLAP Mondrian, and Spoon ETL.',
      'In research he uses PCA, UMAP, Isolation Forest, Association Rule Mining, and statistical modeling with LMM and GEE.',
    ],
    board3: [
      '🎓 EDUCATION',
      'Bachelor\'s in Informatics Engineering — Universitas Komputer Indonesia (UNIKOM), 2022–2026. GPA 3.80.',
      'Certifications: BNSP Data Analyst (LSP Informatika) and BNSP Junior Graphic Design (LKP DITEKINDO & West Java DISPORA).',
    ],
  };
  const INFO_EN = {
    tentang: {
      title: '👋 About Me', npc: 'lurah',
      body: '<p><b>Rama Hadi Nugraha</b> — UI/UX &amp; Mobile Developer · Visual Designer · Applied AI Research.</p>' +
        '<p>Bachelor\'s in Informatics Engineering, Universitas Komputer Indonesia (2022–2026), GPA <b>3.80</b>. Holds <b>BNSP Data Analyst</b> and <b>BNSP Junior Graphic Design</b> certifications.</p>' +
        '<p>In this village, Pak Lurah is the keeper of his story.</p>',
    },
    proyek: {
      title: '🚀 Selected Projects', npc: 'dito',
      body:
        '<div class="proj-item"><b>🎟️ Tourism Ticket App — Disparbud Majalengka</b><span>End-to-end UI/UX &amp; Flutter (web/Android), 200+ test users, QR scan sped up validation by 40%. → Dito</span></div>' +
        '<div class="proj-item"><b>🔬 Japanese Waste Detection — JAIST Research</b><span>YOLOv8 + FastAPI; 8 detection configurations, PCA/UMAP/Isolation Forest pipeline, LMM/GEE over 1,150 predictions. → Nara</span></div>' +
        '<div class="proj-item"><b>🧑‍💼 Blockchain B2B Product Reservation DApp</b><span>Solidity smart contracts on Ethereum Sepolia, React + MetaMask frontend. → Raka</span></div>' +
        '<div class="proj-item"><b>👩‍🌾 TaniXplore &amp; Other Projects</b><span>Agriculture platform with Maps API, Smart Door IoT, Anime Face Recognition. → Tania</span></div>' +
        '<div class="proj-item"><b>🎨 Visual Design — Laznas PYI</b><span>Content for 8 Instagram accounts, +20 followers/account/month. → Gallery boards at the plaza</span></div>',
    },
    keahlian: {
      title: '🛠️ Skills', npc: 'pandai',
      body: '<p><b>Programming:</b> Flutter · Python/FastAPI · PHP · JavaScript · HTML/CSS · C#/Unity · Solidity</p>' +
        '<p><b>Data:</b> SQLite · SQLAlchemy · Hadoop · OLAP Mondrian · Spoon ETL</p>' +
        '<p><b>AI &amp; Research:</b> YOLOv8 · PCA · UMAP · Isolation Forest · Association Rule Mining · LMM/GEE · Vuforia AR</p>' +
        '<p><b>Design:</b> Figma · Photoshop · Illustrator · Premiere Pro · After Effects · Lightroom</p>' +
        '<p>In this village, Bang Bara the blacksmith keeps the complete list.</p>',
    },
    pengalaman: {
      title: '💼 Experience', npc: 'sari',
      body: '<p><b>Research Intern — JAIST</b> (Jul–Sep 2026): Computer Vision &amp; Reliability Analysis.</p>' +
        '<p><b>Visual Designer — Laznas PYI</b> (Feb–Mar 2026).</p>' +
        '<p><b>UI/UX &amp; Flutter Developer Intern — Disparbud Majalengka</b> (Aug–Oct 2025).</p>' +
        '<p><b>Media Division — Glosarium Photography Club, UNIKOM</b> (Dec 2023–Dec 2024), engagement +25%.</p>' +
        '<p>In this village, Bu Sari the innkeeper is the keeper of his story.</p>',
    },
    kontak: {
      title: '✉️ Contact', npc: 'pio',
      body: '<p>📧 Email: <a href="mailto:nramahadi1@gmail.com">nramahadi1@gmail.com</a></p>' +
        '<p>💼 LinkedIn: <a href="https://www.linkedin.com/in/rama-hadi-nugraha" target="_blank" rel="noopener">linkedin.com/in/rama-hadi-nugraha</a></p>' +
        '<p>🐙 GitHub: <a href="https://github.com/Ram4UnMi" target="_blank" rel="noopener">github.com/Ram4UnMi</a></p>' +
        '<p>Rama is open to opportunities in UI/UX, Mobile Development (Flutter), and Visual Design. In this village, Pak Pos Pio will gladly deliver your message!</p>',
    },
  };
  const TUT = {
    en: {
      title: '🎮 Welcome to Portfolio Village!',
      start: 'START PLAYING ▶',
      body: '<p>You are a <b>village visitor</b> — the character in the red shirt. This village is the living portfolio of <b>Rama Hadi Nugraha</b>: every villager holds one piece of his story!</p>' +
        '<h3>🕹️ How to Play</h3><ul>' +
        '<li><b>Move:</b> WASD / arrow keys (on phones: the on-screen D-pad).</li>' +
        '<li><b>Talk:</b> approach a villager, then press <b>E</b> / Space / the TALK button. Villagers marked <b>"!"</b> have not been talked to yet.</li>' +
        '<li><b>Mission:</b> talk to <b>8 villagers</b> to unlock the whole portfolio — each new villager gives you <b>+15 🪙</b>!</li>' +
        '<li><b>The navbar above</b> holds your coins &amp; progress, plus shortcut buttons to Projects, About, Skills, Experience, and Contact — read instantly or teleport to the right villager.</li></ul>' +
        '<h3>🎣 Mini Games</h3><ul>' +
        '<li><b>Fishing:</b> talk to Grandpa Tirta at the pond (southwest) or tap 🎣 Fishing in the navbar.</li>' +
        '<li><b>Tower Defense:</b> talk to Sergeant Garda at the arena (northeast) or tap 🏰 Defense.</li>' +
        '<li>Your caught fish and best wave are saved automatically — and they earn you village coins!</li></ul>' +
        '<p class="tutorial-note">In a hurry? Open the <a href="portofolio.html">📄 text portfolio</a> to read everything without playing. This game is 100% offline — no internet needed at all.</p>',
    },
    id: {
      title: '🎮 Selamat Datang di Desa Portofolio!',
      start: 'MULAI BERMAIN ▶',
      body: '<p>Kamu adalah <b>pengunjung desa</b> — karakter berbaju merah. Desa ini adalah portofolio hidup milik <b>Rama Hadi Nugraha</b>: setiap warga menyimpan satu bagian ceritanya!</p>' +
        '<h3>🕹️ Cara Bermain</h3><ul>' +
        '<li><b>Bergerak:</b> WASD / tombol panah (di HP: D-pad di layar).</li>' +
        '<li><b>Bicara:</b> dekati warga lalu tekan <b>E</b> / Spasi / tombol BICARA. Warga bertanda <b>"!"</b> belum pernah diajak bicara.</li>' +
        '<li><b>Misi:</b> ajak bicara <b>8 warga</b> untuk membuka seluruh portofolio — setiap warga baru memberimu <b>+15 🪙</b>!</li>' +
        '<li><b>Navbar di atas</b> berisi koin &amp; progresmu, plus tombol pintas ke Proyek, Tentang, Keahlian, Pengalaman, dan Kontak — bisa baca cepat atau teleport ke warga yang bersangkutan.</li></ul>' +
        '<h3>🎣 Mini Game</h3><ul>' +
        '<li><b>Mancing:</b> bicara dengan Kakek Tirta di kolam (barat daya) atau klik 🎣 Mancing di navbar.</li>' +
        '<li><b>Tower Defense:</b> bicara dengan Sersan Garda di arena (timur laut) atau klik 🏰 Defense.</li>' +
        '<li>Ikan yang tertangkap dan rekor wave-mu tersimpan otomatis, dan menambah koin desa!</li></ul>' +
        '<p class="tutorial-note">Buru-buru? Buka <a href="portofolio.html">📄 Portofolio versi teks</a> untuk membaca semuanya tanpa bermain. Game ini 100% offline — tidak butuh internet sama sekali.</p>',
    },
  };
  const NAV_TEXT = {
    proyek: { en: '🚀 Projects', id: '🚀 Proyek' },
    tentang: { en: '👋 About', id: '👋 Tentang' },
    keahlian: { en: '🛠️ Skills', id: '🛠️ Keahlian' },
    pengalaman: { en: '💼 Experience', id: '💼 Pengalaman' },
    kontak: { en: '✉️ Contact', id: '✉️ Kontak' },
  };
  function homePages() {
    const owned = STATE.houseUpgrades.size;
    if (STATE.lang === 'en') {
      return owned >= 6
        ? ['This is the Guest House — your home while in the village. Thanks to all the coins you gathered, it is now the prettiest house in the whole village! ⛲🌸', 'The Village Chief would be proud. Thank you for taking care of this house!']
        : ['This is the Guest House — your home while in the village. The Chief said it stood empty for a long time... peeling paint, a roof patched here and there.', 'But worry not! Gather coins by chatting with villagers, fishing, and defending the village — then shop at the Decoration Shop to beautify this house.', 'You currently own ' + owned + ' of 6 decorations. Let\'s open the shop catalog!'];
    }
    return owned >= 6
      ? ['Ini Rumah Tamu — tempat tinggalmu selama di desa. Berkat jerih payahmu mengumpulkan koin, rumah ini sekarang jadi yang tercantik di seluruh desa! ⛲🌸', 'Pak Lurah pasti bangga. Terima kasih sudah merawat rumah ini!']
      : ['Ini Rumah Tamu — tempat tinggalmu selama di desa. Kata Pak Lurah, rumah ini sudah lama kosong... catnya mengelupas, atapnya bertambal di sana-sini.', 'Tapi jangan khawatir! Kumpulkan koin dari mengobrol dengan warga, memancing, dan mempertahankan desa — lalu belanja di Toko Dekorasi untuk mempercantik rumah ini.', 'Saat ini kamu punya ' + owned + ' dari 6 perabotan. Ayo buka katalog tokonya!'];
  }
  function applyLang() {
    const en = STATE.lang === 'en';
    const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    const setH = (id, txt) => { const el = document.getElementById(id); if (el) el.innerHTML = txt; };
    set('nav-brand', en ? '🏡 PORTFOLIO VILLAGE' : '🏡 DESA PORTOFOLIO');
    document.querySelectorAll('[data-section]').forEach((b) => {
      const t = NAV_TEXT[b.getAttribute('data-section')];
      if (t) b.textContent = L(t);
    });
    set('btn-shop', en ? '🛒 Shop' : '🛒 Toko');
    set('nav-fish', en ? '🎣 Fishing' : '🎣 Mancing');
    set('nav-td', '🏰 Defense');
    set('nav-teks', en ? '📄 Portfolio' : '📄 Portofolio');
    set('btn-lang', en ? '🌐 EN' : '🌐 ID');
    set('t-action', en ? 'TALK' : 'BICARA');
    set('dialog-next', L(STR.dialogNext));
    const T = TUT[STATE.lang];
    set('tut-title', T.title);
    setH('tut-body', T.body);
    set('tut-start', T.start);
    const le = document.getElementById('tut-lang-en');
    const li = document.getElementById('tut-lang-id');
    if (le) le.classList.toggle('active', en);
    if (li) li.classList.toggle('active', !en);
    set('info-visit', en ? '📍 Visit in the Village' : '📍 Kunjungi di Desa');
    set('info-close-btn', en ? 'Close' : 'Tutup');
    set('shop-title', en ? '🛒 Village Decoration Shop' : '🛒 Toko Dekorasi Desa');
    setH('shop-sub-text', en ? "Bang Bara's catalog — beautify the <b>Guest House</b>, your home in the village. Balance:" : 'Katalog Bang Bara — percantik <b>Rumah Tamu</b> tempatmu tinggal selama di desa. Saldo:');
    set('shop-note', en ? 'Coins come from chatting with villagers (+15), fishing (fish points = coins), and clearing tower defense waves (bonus = coins).' : 'Koin didapat dari mengobrol dengan warga (+15), memancing (poin ikan = koin), dan memenangkan wave tower defense (bonus = koin).');
    set('shop-close-btn', en ? 'Close' : 'Tutup');
    set('shop-fish-link', en ? '🎣 Earn Coins: Fishing' : '🎣 Cari Koin: Mancing');
    set('loading-title', en ? '🏡 Loading Portfolio Village...' : '🏡 Memuat Desa Portofolio...');
    set('loading-sub', en ? 'Building a pixel village for you. One moment!' : 'Membangun desa pixel untukmu. Sebentar ya!');
    // papan nama rumah mengikuti bahasa terpilih
    HOUSES.forEach((h, i) => { houseSprites[i] = buildHouseSprite(h, i); });
  }
  function setLang(l) {
    STATE.lang = l;
    persist();
    applyLang();
    if (typeof shopModal !== 'undefined' && !shopModal.classList.contains('hidden')) renderShop();
  }
  document.getElementById('btn-lang').addEventListener('click', () => setLang(STATE.lang === 'en' ? 'id' : 'en'));
  document.getElementById('tut-lang-en').addEventListener('click', () => setLang('en'));
  document.getElementById('tut-lang-id').addEventListener('click', () => setLang('id'));

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

  /* ---------------- Musik latar (komposisi orisinal, digenerate WebAudio) ----------------
     Catatan: lagu "Time Flowing Ever Onward" karya Evan Call berhak cipta,
     jadi tidak bisa dipasang sebagai file. Sebagai gantinya, ini melodi
     orisinal bergaya serupa: lembut, mengalir, pastoral — dibuat di tempat. */
  const Music = (() => {
    let timer = null, step = 0, nextTime = 0, master = null;
    const STEP_DUR = 60 / 92 / 2; // 92 bpm, langkah = not seperdelapan
    const MELODY = { 0: 74, 2: 78, 4: 81, 6: 78, 8: 76, 10: 78, 12: 74, 14: 73, 16: 71, 18: 74, 20: 78, 22: 74, 24: 71, 26: 69, 28: 66, 30: 69, 32: 74, 34: 71, 36: 67, 38: 71, 40: 74, 42: 71, 44: 69, 46: 66, 48: 69, 50: 73, 52: 76, 54: 73, 56: 74, 58: 78, 60: 81, 62: 78 };
    const BARS = [
      { bass: 38, chord: [62, 66, 69] }, { bass: 35, chord: [59, 62, 66] },
      { bass: 43, chord: [55, 59, 62] }, { bass: 45, chord: [57, 61, 64] },
      { bass: 38, chord: [62, 66, 69] }, { bass: 35, chord: [59, 62, 66] },
      { bass: 43, chord: [55, 59, 62] }, { bass: 45, chord: [57, 61, 64] },
    ];
    function freq(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function tone(m, t, dur, type, vol) {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type; o.frequency.value = freq(m);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + dur + 0.05);
    }
    function schedule() {
      if (!audioCtx) return;
      while (nextTime < audioCtx.currentTime + 0.18) {
        const s = step % 64;
        const bar = BARS[Math.floor(s / 8)];
        if (MELODY[s] !== undefined) tone(MELODY[s], nextTime, 0.55, 'triangle', 0.05);
        if (s % 8 === 0) {
          bar.chord.forEach((m) => tone(m, nextTime, STEP_DUR * 7.6, 'sine', 0.014));
          tone(bar.bass + 12, nextTime, 0.7, 'sine', 0.045);
        }
        if (s % 8 === 4) tone(bar.bass + 12, nextTime, 0.6, 'sine', 0.036);
        nextTime += STEP_DUR;
        step++;
      }
    }
    return {
      start() {
        try {
          audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
          if (audioCtx.state === 'suspended') audioCtx.resume();
          if (!master) { master = audioCtx.createGain(); master.gain.value = 0.9; master.connect(audioCtx.destination); }
          if (timer) return;
          step = 0; nextTime = audioCtx.currentTime + 0.06;
          timer = setInterval(schedule, 40);
        } catch (e) { /* abaikan */ }
      },
      stop() { if (timer) { clearInterval(timer); timer = null; } },
    };
  })();
  const musicBtn = document.getElementById('btn-music');
  function syncMusicBtn() {
    musicBtn.textContent = STATE.musicOn ? '🎵' : '🎵̸';
    musicBtn.style.opacity = STATE.musicOn ? '1' : '.5';
  }
  musicBtn.addEventListener('click', () => {
    STATE.musicOn = !STATE.musicOn;
    persist(); syncMusicBtn();
    if (STATE.musicOn) Music.start(); else Music.stop();
  });
  syncMusicBtn();
  // Musik mulai setelah interaksi pertama (kebijakan autoplay browser)
  function kickMusic() { if (STATE.musicOn) Music.start(); }
  window.addEventListener('pointerdown', kickMusic, { once: true });
  window.addEventListener('keydown', kickMusic, { once: true });

  /* ---------------- Helper gambar ---------------- */
  function mkCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * f)));
    const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * f)));
    const b = Math.max(0, Math.min(255, Math.round((n & 255) * f)));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  function rng(seed) {
    let s = seed * 9301 + 49297;
    return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  }

  /* ---------------- Peta dasar ---------------- */
  const ground = [];
  for (let y = 0; y < ROWS; y++) ground.push(new Array(COLS).fill('grass'));
  function fillRect(x0, y0, x1, y1, type) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++)
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
  const bkey = (x, y) => x + ',' + y;
  for (let x = 0; x < COLS; x++) { blocked.add(bkey(x, 0)); blocked.add(bkey(x, ROWS - 1)); }
  for (let y = 0; y < ROWS; y++) { blocked.add(bkey(0, y)); blocked.add(bkey(COLS - 1, y)); }
  HOUSES.forEach((h) => {
    for (let y = h.y; y < h.y + h.h; y++) for (let x = h.x; x < h.x + h.w; x++) blocked.add(bkey(x, y));
  });
  TREES.forEach((t) => blocked.add(bkey(t[0], t[1])));
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++)
    if (ground[y][x] === 'water') blocked.add(bkey(x, y));
  SIGNS.forEach((s) => blocked.add(bkey(s.x, s.y)));
  const BUSHES = [[8, 3], [17, 3], [5, 11], [20, 11], [7, 17], [24, 14], [16, 7], [9, 16]];
  BUSHES.forEach((b) => blocked.add(bkey(b[0], b[1])));
  const FENCES = [];
  [8, 9, 10, 11, 14, 15, 16, 17].forEach((x) => FENCES.push([x, 12]));
  [3, 4, 5, 22, 23].forEach((x) => FENCES.push([x, 6]));
  FENCES.forEach((f) => blocked.add(bkey(f[0], f[1])));
  [[5, 4], [23, 8], [4, 11], [18, 7], [11, 7]].forEach((d) => blocked.add(bkey(d[0], d[1]))); // batu & tunggul
  const FLOWER_SPOTS = [[15, 16], [16, 16], [20, 15], [22, 8], [9, 7], [3, 12], [23, 15]];

  /* ---------------- Sprite TILE (48x48) ---------------- */
  function makeGrass(variant, base) {
    const c = mkCanvas(TILE, TILE), g = c.getContext('2d');
    const r = rng(variant * 131 + base.length);
    g.fillStyle = base; g.fillRect(0, 0, TILE, TILE);
    // bercak tanah & rumput kering (nuansa desa tua ala gambar referensi)
    g.fillStyle = 'rgba(95,109,49,.5)';
    for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(r() * 48, r() * 48, 7 + r() * 9, 4 + r() * 5, r() * 3, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = 'rgba(138,138,77,.45)';
    for (let i = 0; i < 2; i++) { g.beginPath(); g.ellipse(r() * 48, r() * 48, 5 + r() * 7, 3 + r() * 4, r() * 3, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = shade(base, 0.9);
    for (let i = 0; i < 26; i++) g.fillRect(r() * 45, r() * 45, 3, 2);
    g.fillStyle = shade(base, 1.12);
    for (let i = 0; i < 16; i++) g.fillRect(r() * 45, r() * 45, 2.5, 2);
    // daun-daun kecil berserakan
    g.fillStyle = 'rgba(168,100,47,.55)';
    for (let i = 0; i < 4; i++) g.fillRect(r() * 45, r() * 45, 2.6, 1.8);
    // rumpun rumput
    g.strokeStyle = shade(base, 0.72); g.lineWidth = 1.6;
    for (let i = 0; i < 4; i++) {
      const tx = 5 + r() * 38, ty = 12 + r() * 32;
      g.beginPath();
      g.moveTo(tx, ty); g.lineTo(tx - 2.4, ty - 7);
      g.moveTo(tx + 3, ty); g.lineTo(tx + 3.4, ty - 8.6);
      g.moveTo(tx + 6, ty); g.lineTo(tx + 8.6, ty - 6.4);
      g.stroke();
    }
    return c;
  }
  const GRASS = [
    makeGrass(1, '#75823f'), makeGrass(2, '#6d7c39'),
    makeGrass(3, '#75823f'), makeGrass(4, '#6d7c39'),
  ];
  function makePathTile() {
    const c = mkCanvas(TILE, TILE), g = c.getContext('2d');
    const r = rng(4242);
    g.fillStyle = '#8a6f4d'; g.fillRect(0, 0, TILE, TILE);
    g.fillStyle = '#7d6242';
    for (let i = 0; i < 20; i++) g.fillRect(r() * 44, r() * 44, 4, 2.4);
    g.fillStyle = '#9c805a';
    for (let i = 0; i < 10; i++) g.fillRect(r() * 44, r() * 44, 3, 2);
    g.fillStyle = '#6d5638';
    for (let i = 0; i < 7; i++) g.fillRect(r() * 44, r() * 44, 3.4, 2);
    g.fillStyle = '#9a958c';
    [[8, 10], [30, 26], [16, 38], [38, 8]].forEach((s) => { g.beginPath(); g.ellipse(s[0], s[1], 4.4, 3, 0, 0, Math.PI * 2); g.fill(); });
    g.fillStyle = '#b3aea4';
    [[12, 12], [33, 28]].forEach((s) => { g.beginPath(); g.ellipse(s[0], s[1], 2, 1.3, 0, 0, Math.PI * 2); g.fill(); });
    return c;
  }
  const PATH_TILE = makePathTile();
  function makePlazaTile() {
    const c = mkCanvas(TILE, TILE), g = c.getContext('2d');
    const r = rng(777);
    g.fillStyle = '#8f8d86'; g.fillRect(0, 0, TILE, TILE);
    g.fillStyle = '#a3a19a'; g.fillRect(2, 2, TILE - 4, 12);
    g.fillStyle = '#76746e'; g.fillRect(0, TILE - 3, TILE, 3); g.fillRect(TILE - 3, 0, 3, TILE);
    g.fillStyle = '#7c7a74';
    for (let i = 0; i < 7; i++) g.fillRect(r() * 44, r() * 44, 3, 2);
    g.strokeStyle = '#6a6862'; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(4, 34); g.lineTo(20, 30); g.lineTo(30, 38); g.stroke();
    return c;
  }
  const PLAZA_TILE = makePlazaTile();
  function makeSandTile() {
    const c = mkCanvas(TILE, TILE), g = c.getContext('2d');
    const r = rng(9090);
    g.fillStyle = '#d9c48d'; g.fillRect(0, 0, TILE, TILE);
    g.fillStyle = '#c9b078';
    for (let i = 0; i < 16; i++) g.fillRect(r() * 45, r() * 45, 3, 2);
    g.fillStyle = '#f7ecc2';
    for (let i = 0; i < 9; i++) g.fillRect(r() * 45, r() * 45, 2.6, 1.8);
    g.fillStyle = '#ffb7a5';
    g.beginPath(); g.arc(12 + r() * 20, 12 + r() * 20, 2.2, 0, Math.PI * 2); g.fill();
    return c;
  }
  const SAND_TILE = makeSandTile();
  function makeWaterTile(frame) {
    const c = mkCanvas(TILE, TILE), g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, TILE);
    grad.addColorStop(0, '#35707e'); grad.addColorStop(1, '#26525f');
    g.fillStyle = grad; g.fillRect(0, 0, TILE, TILE);
    g.strokeStyle = 'rgba(220,245,255,.38)'; g.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const y = 9 + i * 15, off = ((frame * 7 + i * 13) % 16) - 8;
      g.beginPath();
      g.moveTo(4 + off, y);
      g.quadraticCurveTo(14 + off, y - 3.4, 24 + off, y);
      g.quadraticCurveTo(34 + off, y + 3.4, 44 + off, y);
      g.stroke();
    }
    g.fillStyle = 'rgba(16,70,130,.35)';
    g.fillRect(0, TILE - 5, TILE, 5);
    return c;
  }
  const WATER_TILES = [makeWaterTile(0), makeWaterTile(1), makeWaterTile(2)];

  /* ---------------- Sprite RUMAH (4 gaya arsitektur dunia) ---------------- */
  function drawPlaque(g, W, y, label, dark) {
    g.font = 'bold 15px "Trebuchet MS", sans-serif';
    const tw = g.measureText(label).width + 22;
    const px = W / 2 - tw / 2;
    g.fillStyle = dark ? '#2e2620' : '#6b4a2a'; g.fillRect(px - 2, y - 2, tw + 4, 25);
    g.fillStyle = dark ? '#4a3b28' : '#a9743f'; g.fillRect(px, y, tw, 21);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(px, y + 16, tw, 5);
    g.fillStyle = dark ? '#ffd98a' : '#fff2cf'; g.textAlign = 'center';
    g.fillText(label, W / 2, y + 15.5);
  }

  // --- Gaya MEDIEVAL EROPA: batu + setengah kayu, atap curam ---
  function houseMedieval(g, h, W, wallH, re, WALL, ROOF, r) {
    const stoneTop = re + wallH * 0.48;
    // bagian batu (bawah)
    g.fillStyle = '#98938a'; g.fillRect(2, stoneTop, W - 4, wallH * 0.52);
    g.fillStyle = '#8a857c';
    for (let y = stoneTop + 8; y < re + wallH - 4; y += 11) g.fillRect(2, y, W - 4, 2);
    for (let i = 0; i < W / 4; i++) g.fillRect(4 + r() * (W - 10), stoneTop + 4 + r() * (wallH * 0.44), 6, 3.4);
    // plester + rangka kayu (atas)
    g.fillStyle = WALL; g.fillRect(2, re, W - 4, wallH * 0.48);
    g.fillStyle = '#5d4630';
    g.fillRect(2, re, 7, wallH); g.fillRect(W - 9, re, 7, wallH); g.fillRect(W / 2 - 3, re, 6, wallH * 0.48);
    g.fillRect(2, re, W - 4, 6); g.fillRect(2, stoneTop - 4, W - 4, 6);
    g.beginPath();
    g.moveTo(10, re + 8); g.lineTo(30, stoneTop - 6); g.lineTo(36, stoneTop - 6); g.lineTo(16, re + 8);
    g.moveTo(W - 10, re + 8); g.lineTo(W - 30, stoneTop - 6); g.lineTo(W - 36, stoneTop - 6); g.lineTo(W - 16, re + 8);
    g.fill();
    // gabel + jendela bundar
    g.fillStyle = shade(WALL, 0.92);
    g.beginPath(); g.moveTo(18, re + 4); g.lineTo(W - 18, re + 4); g.lineTo(W / 2, 14); g.closePath(); g.fill();
    g.fillStyle = '#5d4630'; g.beginPath(); g.arc(W / 2, re - 16, 8.6, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(W / 2, re - 16, 5.6, 0, Math.PI * 2); g.fill();
    // atap curam sirap batu tulis
    g.save();
    g.beginPath();
    g.moveTo(-4, re + 12); g.lineTo(W + 4, re + 12); g.lineTo(W / 2 + 27, 2); g.lineTo(W / 2 - 27, 2);
    g.closePath(); g.clip();
    g.fillStyle = ROOF; g.fillRect(0, 0, W, re + 14);
    for (let y = 4, row = 0; y < re + 14; y += 9, row++) {
      g.fillStyle = row % 2 ? shade(ROOF, 0.85) : shade(ROOF, 1.06);
      g.fillRect(0, y, W, 5);
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, y + 5, W, 1.6);
    }
    g.restore();
    g.fillStyle = shade(ROOF, 1.2); g.fillRect(W / 2 - 29, 0, 58, 6);
    // cerobong batu
    g.fillStyle = '#8a857c'; g.fillRect(W - 54, 10, 15, 34);
    g.fillStyle = '#75726b'; g.fillRect(W - 56, 7, 19, 6);
    // pintu lengkung besi
    const doorW = 28, doorX = W / 2 - doorW / 2, doorY = re + wallH - 46;
    g.fillStyle = '#4a3a28'; g.fillRect(doorX - 3, doorY - 3, doorW + 6, 49);
    g.fillStyle = '#6e4a26';
    g.fillRect(doorX, doorY + 6, doorW, 40);
    g.beginPath(); g.arc(W / 2, doorY + 6, doorW / 2, Math.PI, 0); g.fill();
    g.fillStyle = '#3a332c'; g.fillRect(doorX, doorY + 14, doorW, 3); g.fillRect(doorX, doorY + 32, doorW, 3);
    g.fillStyle = '#c9ccd1'; g.beginPath(); g.arc(W / 2 + 8, doorY + 24, 2.6, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#9aa0a8'; g.fillRect(doorX - 5, re + wallH - 4, doorW + 10, 4);
    g.fillStyle = '#a03d2d'; g.fillRect(doorX + 3, re + wallH - 1, doorW - 6, 3.4);
    // jendela kecil berpalang
    [W * 0.2, W * 0.8].forEach((wx) => {
      if (Math.abs(wx - W / 2) < 36) return;
      g.fillStyle = '#4a3a28'; g.fillRect(wx - 10, re + 22, 20, 22);
      g.fillStyle = '#ffe9a8'; g.fillRect(wx - 7, re + 25, 14, 16);
      g.fillStyle = '#4a3a28'; g.fillRect(wx - 1, re + 25, 2, 16); g.fillRect(wx - 7, re + 32, 14, 2);
    });
    // panji kecil di samping pintu
    g.fillStyle = '#5d4630'; g.fillRect(doorX - 24, doorY - 8, 3, 30);
    g.fillStyle = ROOF; g.fillRect(doorX - 21, doorY - 8, 13, 17);
    g.fillStyle = '#fff2cf'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center';
    g.fillText(houseLabel(h).charAt(0), doorX - 14.5, doorY + 4.5);
    return { doorX, doorY, doorW, plaqueY: re + wallH * 0.48 - 32 };
  }

  // --- Gaya TIMUR TENGAH: batu pasir, kubah, lengkung ---
  function houseMideast(g, h, W, wallH, re, WALL, ROOF, r) {
    // dinding batu pasir berblok
    g.fillStyle = WALL; g.fillRect(2, re, W - 4, wallH);
    g.fillStyle = shade(WALL, 0.9);
    for (let y = re + 12; y < re + wallH; y += 13) g.fillRect(2, y, W - 4, 2);
    for (let i = 0; i < W / 3.4; i++) g.fillRect(4 + r() * (W - 10), re + 4 + r() * (wallH - 8), 5, 2.6);
    g.fillStyle = shade(WALL, 0.8); g.fillRect(2, re + wallH - 10, W - 4, 10);
    // pita ornamen geometris
    g.fillStyle = ROOF; g.fillRect(2, re + 14, W - 4, 9);
    g.fillStyle = '#fff2cf';
    for (let x = 8; x < W - 8; x += 14) {
      g.beginPath(); g.moveTo(x, re + 21); g.lineTo(x + 4, re + 15.5); g.lineTo(x + 8, re + 21); g.closePath(); g.fill();
    }
    // parapet bergerigi + kubah
    g.fillStyle = shade(WALL, 0.94); g.fillRect(0, re - 12, W, 13);
    g.fillStyle = shade(WALL, 0.85);
    for (let x = 2; x < W - 8; x += 15) g.fillRect(x, re - 19, 9, 8);
    g.fillStyle = ROOF;
    g.beginPath(); g.arc(W / 2, re - 10, Math.min(30, W * 0.2), Math.PI, 0); g.fill();
    g.fillStyle = shade(ROOF, 1.12);
    g.beginPath(); g.arc(W / 2, re - 10, Math.min(30, W * 0.2) * 0.62, Math.PI, 0); g.fill();
    g.fillStyle = '#d9b84a'; g.fillRect(W / 2 - 1.4, re - 10 - Math.min(30, W * 0.2) - 8, 2.8, 9);
    g.beginPath(); g.arc(W / 2, re - 12 - Math.min(30, W * 0.2), 3, 0, Math.PI * 2); g.fill();
    // cerobong pipa pandai besi
    if (h.label === 'PANDAI BESI') {
      g.fillStyle = '#7c7f85'; g.fillRect(27, re - 28, 10, 28);
      g.fillStyle = '#5f6266'; g.fillRect(25, re - 31, 14, 5);
    }
    // pintu lengkung tinggi + kanopi bergaris
    const doorW = 26, doorX = W / 2 - doorW / 2, doorY = re + wallH - 48;
    g.fillStyle = shade(WALL, 0.7); g.fillRect(doorX - 4, doorY - 4, doorW + 8, 52);
    g.fillStyle = '#2e6f6a';
    g.fillRect(doorX, doorY + 5, doorW, 43);
    g.beginPath(); g.arc(W / 2, doorY + 5, doorW / 2, Math.PI, 0); g.fill();
    g.fillStyle = '#256058'; g.fillRect(W / 2 - 1.2, doorY - 7, 2.4, 55);
    g.fillStyle = '#d9b84a'; g.beginPath(); g.arc(W / 2 - 6, doorY + 26, 2.2, 0, Math.PI * 2); g.arc(W / 2 + 6, doorY + 26, 2.2, 0, Math.PI * 2); g.fill();
    // kanopi
    g.fillStyle = '#fff2cf'; g.fillRect(doorX - 10, doorY - 16, doorW + 20, 7);
    g.fillStyle = ROOF;
    for (let x = doorX - 10; x < doorX + doorW + 16; x += 10) g.fillRect(x, doorY - 16, 5, 7);
    // jendela lengkung berkisi
    [W * 0.2, W * 0.8].forEach((wx) => {
      if (Math.abs(wx - W / 2) < 36) return;
      g.fillStyle = shade(WALL, 0.7); g.fillRect(wx - 10, re + 34, 20, 26);
      g.fillStyle = '#ffe9a8';
      g.fillRect(wx - 7, re + 40, 14, 17);
      g.beginPath(); g.arc(wx, re + 40, 7, Math.PI, 0); g.fill();
      g.strokeStyle = shade(WALL, 0.6); g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(wx, re + 33); g.lineTo(wx, re + 57); g.moveTo(wx - 7, re + 46); g.lineTo(wx + 7, re + 46); g.stroke();
    });
    return { doorX, doorY, doorW, plaqueY: re + 26 };
  }

  // --- Gaya ASIA TIMUR: atap melengkung, pilar merah ---
  function houseEastasia(g, h, W, wallH, re, WALL, ROOF, r) {
    // dinding + pilar merah
    g.fillStyle = WALL; g.fillRect(4, re, W - 8, wallH);
    g.fillStyle = shade(WALL, 0.93);
    for (let i = 0; i < W / 3; i++) g.fillRect(4 + r() * (W - 10), re + r() * (wallH - 4), 3, 2);
    g.fillStyle = '#8d8d93'; g.fillRect(2, re + wallH - 9, W - 4, 9);
    g.fillStyle = '#a33327';
    g.fillRect(4, re, 7, wallH); g.fillRect(W - 11, re, 7, wallH);
    if (W > 200) g.fillRect(W / 2 - 3, re, 6, wallH);
    g.fillStyle = '#7e2a20'; g.fillRect(2, re, W - 4, 7);
    // atap melengkung dua lapis dengan ujung terangkat
    function roofLayer(yBase, inset, hgt, col) {
      g.save();
      g.beginPath();
      g.moveTo(inset - 10, yBase); g.lineTo(W - inset + 10, yBase);
      g.lineTo(W / 2 + 30, yBase - hgt); g.lineTo(W / 2 - 30, yBase - hgt);
      g.closePath(); g.clip();
      g.fillStyle = col; g.fillRect(0, yBase - hgt - 2, W, hgt + 4);
      g.fillStyle = 'rgba(0,0,0,.2)';
      for (let x = 6; x < W; x += 9) g.fillRect(x, yBase - hgt - 2, 2, hgt + 4);
      g.fillStyle = 'rgba(255,255,255,.08)';
      g.fillRect(0, yBase - 5, W, 3);
      g.restore();
      // ujung atap terangkat
      g.fillStyle = col;
      g.beginPath(); g.moveTo(inset - 10, yBase); g.lineTo(inset - 20, yBase - 11); g.lineTo(inset + 2, yBase - 3); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(W - inset + 10, yBase); g.lineTo(W - inset + 20, yBase - 11); g.lineTo(W - inset - 2, yBase - 3); g.closePath(); g.fill();
    }
    roofLayer(re + 14, 2, re - 8, ROOF);
    g.fillStyle = shade(ROOF, 1.25); g.fillRect(W / 2 - 32, 0, 64, 6);
    g.fillStyle = shade(ROOF, 0.8);
    g.beginPath(); g.arc(W / 2 - 34, 3, 4.4, 0, Math.PI * 2); g.arc(W / 2 + 34, 3, 4.4, 0, Math.PI * 2); g.fill();
    // pintu ganda berkisi
    const doorW = 30, doorX = W / 2 - doorW / 2, doorY = re + wallH - 44;
    g.fillStyle = '#7e2a20'; g.fillRect(doorX - 3, doorY - 3, doorW + 6, 47);
    g.fillStyle = '#5d3a22'; g.fillRect(doorX, doorY, doorW, 44);
    g.fillStyle = '#8a5a30'; g.fillRect(doorX + 3, doorY + 3, doorW - 6, 12);
    g.strokeStyle = '#5d3a22'; g.lineWidth = 1.6;
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(doorX + 3 + i * 6, doorY + 3); g.lineTo(doorX + 3 + i * 6, doorY + 15); g.stroke(); }
    g.fillStyle = '#d9b84a';
    g.beginPath(); g.arc(W / 2 - 3, doorY + 26, 2.2, 0, Math.PI * 2); g.arc(W / 2 + 3, doorY + 26, 2.2, 0, Math.PI * 2); g.fill();
    // jendela kisi bercahaya
    [W * 0.2, W * 0.8].forEach((wx) => {
      if (Math.abs(wx - W / 2) < 38) return;
      g.fillStyle = '#7e2a20'; g.fillRect(wx - 12, re + 24, 24, 24);
      g.fillStyle = '#ffe9a8'; g.fillRect(wx - 9, re + 27, 18, 18);
      g.strokeStyle = '#b08954'; g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(wx - 3, re + 27); g.lineTo(wx - 3, re + 45); g.moveTo(wx + 3, re + 27); g.lineTo(wx + 3, re + 45);
      g.moveTo(wx - 9, re + 33); g.lineTo(wx + 9, re + 33); g.moveTo(wx - 9, re + 39); g.lineTo(wx + 9, re + 39);
      g.stroke();
    });
    // lentera kertas merah di kedua sisi pintu
    [doorX - 13, doorX + doorW + 6].forEach((lx) => {
      g.fillStyle = '#3a2c1c'; g.fillRect(lx + 2.4, doorY - 6, 2, 6);
      g.fillStyle = '#d8402e'; g.fillRect(lx, doorY, 7, 10);
      g.fillStyle = '#ff7a5c'; g.fillRect(lx + 1.4, doorY + 2, 4.2, 6);
    });
    return { doorX, doorY, doorW, plaqueY: re + 12, darkPlaque: true };
  }

  // --- Gaya ASIA TENGGARA: rumah panggung kayu, atap jerami tinggi ---
  function houseSeasia(g, h, W, wallH, re, WALL, ROOF, r) {
    const floorY = re + wallH - 16; // lantai panggung terangkat
    // tiang panggung + penguat silang
    g.fillStyle = '#5d4630';
    [10, W / 2 - 3, W - 16].forEach((px) => g.fillRect(px, floorY, 6, 16));
    g.save();
    g.strokeStyle = '#5d4630'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(12, floorY + 14); g.lineTo(W / 2 - 2, floorY + 2); g.moveTo(W - 14, floorY + 14); g.lineTo(W / 2 + 4, floorY + 2); g.stroke();
    g.restore();
    // dinding papan kayu
    g.fillStyle = WALL; g.fillRect(4, re, W - 8, wallH - 16);
    g.fillStyle = shade(WALL, 0.86);
    for (let y = re + 7; y < floorY - 2; y += 8) g.fillRect(4, y, W - 8, 1.8);
    g.fillStyle = shade(WALL, 0.75);
    for (let i = 0; i < W / 4; i++) g.fillRect(6 + r() * (W - 12), re + 3 + r() * (wallH - 24), 2.4, 5);
    // pita anyaman di bawah atap
    g.fillStyle = shade(WALL, 0.7); g.fillRect(4, re, W - 8, 9);
    g.strokeStyle = shade(WALL, 1.25); g.lineWidth = 1.4;
    for (let x = 6; x < W - 8; x += 9) {
      g.beginPath(); g.moveTo(x, re + 8); g.lineTo(x + 5, re + 1); g.moveTo(x, re + 1); g.lineTo(x + 5, re + 8); g.stroke();
    }
    // gabel ukiran + ornamen lingkaran
    g.fillStyle = shade(WALL, 0.8);
    g.beginPath(); g.moveTo(16, re + 2); g.lineTo(W - 16, re + 2); g.lineTo(W / 2, 12); g.closePath(); g.fill();
    g.fillStyle = '#5d4630'; g.beginPath(); g.arc(W / 2, re - 14, 6.4, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#d9b84a'; g.beginPath(); g.arc(W / 2, re - 14, 3, 0, Math.PI * 2); g.fill();
    // atap jerami tinggi bertekstur
    g.save();
    g.beginPath();
    g.moveTo(-6, re + 16); g.lineTo(W + 6, re + 16); g.lineTo(W / 2 + 17, 0); g.lineTo(W / 2 - 17, 0);
    g.closePath(); g.clip();
    g.fillStyle = ROOF; g.fillRect(0, 0, W, re + 18);
    g.strokeStyle = shade(ROOF, 0.78); g.lineWidth = 1.6;
    for (let x = 4; x < W; x += 6) { g.beginPath(); g.moveTo(x, 2); g.lineTo(x - 3, re + 16); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,.16)';
    g.fillRect(0, re * 0.45, W, 4); g.fillRect(0, re * 0.75, W, 4);
    g.restore();
    g.fillStyle = shade(ROOF, 1.15); g.fillRect(W / 2 - 18, 0, 36, 5);
    // pintu + tangga
    const doorW = 25, doorX = W / 2 - doorW / 2, doorY = floorY - 40;
    g.fillStyle = '#4a3823'; g.fillRect(doorX - 3, doorY - 3, doorW + 6, 43);
    g.fillStyle = '#6e4a26'; g.fillRect(doorX, doorY, doorW, 40);
    g.fillStyle = shade(WALL, 0.8); g.fillRect(doorX + 4, doorY + 5, doorW - 8, 13);
    g.fillStyle = '#d9b84a'; g.beginPath(); g.arc(doorX + doorW - 6, doorY + 24, 2.2, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#5d4630';
    g.fillRect(doorX + 2, floorY, doorW - 4, 4);
    g.fillRect(doorX + 5, floorY + 5, doorW - 10, 4);
    g.fillRect(doorX + 8, floorY + 10, doorW - 16, 4);
    // jendela kecil dengan daun terbuka
    [W * 0.22, W * 0.78].forEach((wx) => {
      if (Math.abs(wx - W / 2) < 34) return;
      g.fillStyle = '#4a3823'; g.fillRect(wx - 9, re + 22, 18, 18);
      g.fillStyle = '#ffe9a8'; g.fillRect(wx - 6.4, re + 24.6, 12.8, 12.8);
      g.fillStyle = shade(WALL, 0.72);
      g.beginPath(); g.moveTo(wx - 9, re + 22); g.lineTo(wx - 16, re + 27); g.lineTo(wx - 16, re + 42); g.lineTo(wx - 9, re + 40); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(wx + 9, re + 22); g.lineTo(wx + 16, re + 27); g.lineTo(wx + 16, re + 42); g.lineTo(wx + 9, re + 40); g.closePath(); g.fill();
    });
    return { doorX, doorY, doorW, plaqueY: re + 14 };
  }

  function makeHouseSprite(h, opts) {
    opts = opts || {};
    const WALL = opts.wall || h.wall;
    const ROOF = opts.roof || h.roof;
    const W = h.w * TILE, wallH = h.h * TILE;
    const roofExtra = h.style === 'mideast' ? 46 : h.style === 'seasia' ? 80 : h.style === 'eastasia' ? 64 : 68;
    const c = mkCanvas(W, wallH + roofExtra), g = c.getContext('2d');
    const r = rng(h.x * 31 + h.y * 57);
    let geo;
    if (h.style === 'mideast') geo = houseMideast(g, h, W, wallH, roofExtra, WALL, ROOF, r);
    else if (h.style === 'eastasia') geo = houseEastasia(g, h, W, wallH, roofExtra, WALL, ROOF, r);
    else if (h.style === 'seasia') geo = houseSeasia(g, h, W, wallH, roofExtra, WALL, ROOF, r);
    else geo = houseMedieval(g, h, W, wallH, roofExtra, WALL, ROOF, r);
    // kesan usang (Rumah Tamu sebelum direnovasi)
    if (opts.shabby) {
      g.fillStyle = 'rgba(96,76,44,.20)';
      g.fillRect(2, roofExtra + 6, W - 4, wallH - 8);
      g.strokeStyle = 'rgba(70,54,32,.55)'; g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(16, roofExtra + 14); g.lineTo(21, roofExtra + 26); g.lineTo(17, roofExtra + 36);
      g.moveTo(W - 20, roofExtra + 30); g.lineTo(W - 15, roofExtra + 44);
      g.stroke();
    }
    if (opts.shabbyRoof) {
      g.fillStyle = 'rgba(40,32,22,.38)';
      g.fillRect(W * 0.24, 14, 20, 12);
      g.fillRect(W * 0.66, 26, 16, 10);
    }
    if (opts.premium) {
      g.fillStyle = '#ffd93d';
      for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(W / 2 - 21 + i * 14, 3, 3, 0, Math.PI * 2); g.fill(); }
    }
    // lentera teras (item toko)
    if (opts.lanterns && geo) {
      [geo.doorX - 17, geo.doorX + geo.doorW + 10].forEach((lx) => {
        g.fillStyle = '#3a2c1c'; g.fillRect(lx, geo.doorY + 2, 7, 12);
        g.fillStyle = '#ffd93d'; g.fillRect(lx + 1.2, geo.doorY + 4.4, 4.6, 6);
        g.fillStyle = '#fff3b0'; g.fillRect(lx + 2.4, geo.doorY + 6, 2.2, 3);
        g.fillStyle = '#3a2c1c'; g.fillRect(lx - 0.6, geo.doorY + 0.6, 8.2, 2);
      });
    }
    drawPlaque(g, W, geo ? geo.plaqueY : roofExtra + 8, houseLabel(h), geo && geo.darkPlaque);
    return { canvas: c, roofExtra };
  }
  const PLAYER_HOUSE_IDX = HOUSES.findIndex((h) => h.label === 'RUMAH TAMU');
  function buildPlayerHouseSprite() {
    const up = STATE.houseUpgrades;
    return makeHouseSprite(HOUSES[PLAYER_HOUSE_IDX], {
      wall: up.has('paint') ? '#d9b47c' : undefined,
      roof: up.has('roof') ? '#8c4a2f' : undefined,
      premium: up.has('roof'),
      shabby: !up.has('paint'),
      shabbyRoof: !up.has('roof'),
      lanterns: up.has('lantern'),
    });
  }
  function buildHouseSprite(h, i) {
    return i === PLAYER_HOUSE_IDX ? buildPlayerHouseSprite() : makeHouseSprite(h);
  }
  const houseSprites = HOUSES.map(buildHouseSprite);

  /* ---------------- Sprite POHON / SEMAK / PAPAN ---------------- */
  function makeTreeSprite(variant) {
    const c = mkCanvas(104, 124), g = c.getContext('2d');
    const r = rng(variant * 733 + 5);
    // batang
    g.fillStyle = '#5d4630'; g.fillRect(46, 84, 12, 38);
    g.fillStyle = '#6e543a'; g.fillRect(46, 84, 5, 38);
    g.fillStyle = '#4a3823'; g.fillRect(40, 116, 24, 6);
    g.fillStyle = '#5d4630';
    g.beginPath(); g.moveTo(50, 88); g.lineTo(34, 66); g.lineTo(40, 62); g.lineTo(53, 82); g.closePath(); g.fill();
    if (variant === 2) {
      // pohon mati gundul (seperti di tepi desa pada gambar referensi)
      g.strokeStyle = '#4a3a28'; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath();
      g.moveTo(52, 88); g.lineTo(50, 48);
      g.moveTo(51, 62); g.lineTo(30, 38);
      g.moveTo(51, 54); g.lineTo(74, 30);
      g.moveTo(50, 48); g.lineTo(42, 22);
      g.moveTo(50, 48); g.lineTo(62, 24);
      g.stroke();
      g.lineWidth = 2.6;
      g.beginPath();
      g.moveTo(30, 38); g.lineTo(20, 26);
      g.moveTo(74, 30); g.lineTo(86, 22);
      g.moveTo(42, 22); g.lineTo(36, 10);
      g.stroke();
      return c;
    }
    // tajuk berlapis: hijau tua atau oranye musim gugur
    const pal = variant === 1
      ? ['#a8542a', '#b45f2e', '#cf7a35', '#e09a4a']
      : ['#3c5a24', '#46652b', '#557a35', '#77994a'];
    const blobs = [
      [52, 42, 34, pal[0]], [28, 54, 22, pal[0]], [76, 54, 22, pal[0]],
      [52, 30, 26, pal[1]], [36, 40, 18, pal[1]], [68, 40, 18, pal[2]],
      [46, 22, 15, pal[2]], [60, 34, 12, pal[3]],
    ];
    blobs.forEach((b) => { g.fillStyle = b[3]; g.beginPath(); g.arc(b[0], b[1], b[2], 0, Math.PI * 2); g.fill(); });
    g.fillStyle = 'rgba(0,0,0,.16)';
    g.beginPath(); g.ellipse(52, 66, 34, 12, 0, 0, Math.PI); g.fill();
    g.fillStyle = pal[3];
    for (let i = 0; i < 12; i++) { g.fillRect(22 + r() * 58, 10 + r() * 42, 3.4, 2.6); }
    return c;
  }
  const TREE_SPRITES = [makeTreeSprite(0), makeTreeSprite(1), makeTreeSprite(2)];
  function treeVariant(tr, i) {
    if ((tr[0] === 24 && tr[1] === 5) || (tr[0] === 1 && tr[1] === 11)) return 2; // pohon mati
    return i % 3 === 1 ? 1 : 0; // sebagian oranye musim gugur
  }
  function makeBushSprite() {
    const c = mkCanvas(52, 42), g = c.getContext('2d');
    g.fillStyle = '#2e7d32';
    g.beginPath(); g.arc(16, 28, 13, 0, Math.PI * 2); g.arc(36, 28, 13, 0, Math.PI * 2); g.arc(26, 18, 14, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#43a047';
    g.beginPath(); g.arc(22, 16, 8, 0, Math.PI * 2); g.arc(34, 24, 7, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ff6b9d';
    [[14, 20], [28, 12], [40, 26], [22, 30]].forEach((f) => g.fillRect(f[0], f[1], 4, 4));
    g.fillStyle = '#ffd93d'; g.fillRect(32, 18, 3.4, 3.4);
    return c;
  }
  const BUSH_SPRITE = makeBushSprite();
  function makeSignSprite() {
    const c = mkCanvas(52, 60), g = c.getContext('2d');
    g.fillStyle = '#6b4a2a'; g.fillRect(12, 22, 5, 36); g.fillRect(35, 22, 5, 36);
    g.fillStyle = '#8a5a2b'; g.fillRect(2, 4, 48, 30);
    g.fillStyle = '#a9743f'; g.fillRect(5, 7, 42, 24);
    g.fillStyle = '#fff8e7'; g.fillRect(11, 11, 30, 16);
    g.fillStyle = '#8a8f98';
    g.fillRect(14, 15, 24, 2.4); g.fillRect(14, 20, 18, 2.4); g.fillRect(14, 25, 21, 2);
    g.fillStyle = '#ffd93d'; g.fillRect(37, 9, 5, 5);
    return c;
  }
  const SIGN_SPRITE = makeSignSprite();
  function makeGateSprite() {
    const c = mkCanvas(190, 104), g = c.getContext('2d');
    g.fillStyle = '#8a5a2b'; g.fillRect(6, 26, 13, 78); g.fillRect(171, 26, 13, 78);
    g.fillStyle = '#6b4a2a'; g.fillRect(6, 26, 5, 78); g.fillRect(171, 26, 5, 78);
    g.fillStyle = '#a9743f'; g.fillRect(0, 16, 190, 13);
    g.fillStyle = '#8a5a2b'; g.fillRect(0, 26, 190, 3.4);
    // papan gantung
    g.fillStyle = '#5d4020'; g.fillRect(38, 31, 3.4, 10); g.fillRect(148, 31, 3.4, 10);
    g.fillStyle = '#6b4a2a'; g.fillRect(28, 40, 134, 34);
    g.fillStyle = '#a9743f'; g.fillRect(31, 43, 128, 28);
    g.font = 'bold 17px "Trebuchet MS", sans-serif';
    g.textAlign = 'center'; g.fillStyle = '#fff2cf';
    g.fillText('🌻 DESA PORTOFOLIO 🌻', 95, 63);
    // lentera
    [12, 177].forEach((lx) => {
      g.fillStyle = '#ffd93d'; g.fillRect(lx - 3, 34, 7, 9);
      g.fillStyle = '#e8a33d'; g.fillRect(lx - 3, 34, 7, 2.4);
    });
    return c;
  }
  const GATE_SPRITE = makeGateSprite();

  /* ---------------- Sprite KARAKTER (grid detail 32x48 -> tampil 48x72) ---------------- */
  function makeCharSprites(look) {
    function frame(dir, step) {
      const c = mkCanvas(32, 48), g = c.getContext('2d');
      const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
      const skin = look.skin, hair = look.hair, shirt = look.shirt, pants = look.pants;
      const skinD = shade(skin, 0.86), hairD = shade(hair, 0.78), hairL = shade(hair, 1.2);
      const shirtD = shade(shirt, 0.8), shirtL = shade(shirt, 1.12), pantsD = shade(pants, 0.78);
      const swing = step === 1 ? 2 : step === 2 ? -2 : 0;
      // ---- kaki & sepatu ----
      if (dir === 'down' || dir === 'up') {
        if (step === 1) { R(11, 36, 4, 8, pants); R(17, 36, 4, 7, pantsD); R(10, 44, 5, 3, '#3a332c'); R(17, 43, 5, 3, '#3a332c'); }
        else if (step === 2) { R(11, 36, 4, 7, pantsD); R(17, 36, 4, 8, pants); R(11, 43, 5, 3, '#3a332c'); R(16, 44, 5, 3, '#3a332c'); }
        else { R(11, 36, 4, 8, pants); R(17, 36, 4, 8, pants); R(11, 44, 5, 3, '#3a332c'); R(17, 44, 5, 3, '#3a332c'); }
        R(11, 47, 5, 1, '#241f1a'); R(17, 47, 5, 1, '#241f1a');
      } else {
        if (step === 1) { R(10, 36, 4, 8, pants); R(18, 36, 4, 8, pants); R(7, 44, 6, 3, '#3a332c'); R(19, 44, 6, 3, '#3a332c'); }
        else if (step === 2) { R(12, 36, 4, 7, pantsD); R(16, 36, 4, 7, pantsD); R(11, 43, 5, 3, '#3a332c'); R(16, 43, 5, 3, '#3a332c'); }
        else { R(12, 36, 4, 8, pants); R(16, 36, 4, 8, pants); R(12, 44, 5, 3, '#3a332c'); R(16, 44, 5, 3, '#3a332c'); }
      }
      // ---- badan ----
      R(10, 21, 12, 15, shirt);
      R(10, 21, 2, 15, shirtD); R(20, 21, 2, 15, shirtD);
      R(12, 21, 8, 2, shirtL);
      R(15, 23, 2, 10, shirtD);
      R(10, 33, 12, 3, pantsD);
      R(15, 33, 2, 3, '#d9b84a');
      // ---- lengan ----
      if (dir === 'down' || dir === 'up') {
        R(6, 22 + Math.max(0, swing), 4, 11, shirt); R(6, 33 + Math.max(0, swing), 4, 3, skin);
        R(22, 22 + Math.max(0, -swing), 4, 11, shirt); R(22, 33 + Math.max(0, -swing), 4, 3, skin);
      } else if (dir === 'left') {
        R(9, 22, 4, 11, shirtD); R(9, 33, 4, 3, skinD);
        R(18, 22 - swing, 4, 11, shirt); R(18, 33 - swing, 4, 3, skin);
      } else {
        R(19, 22, 4, 11, shirtD); R(19, 33, 4, 3, skinD);
        R(10, 22 - swing, 4, 11, shirt); R(10, 33 - swing, 4, 3, skin);
      }
      // ---- leher & kepala ----
      R(14, 18, 4, 4, skinD);
      if (dir === 'down') {
        R(10, 5, 12, 13, skin);
        R(9, 10, 1, 5, skin); R(22, 10, 1, 5, skin);
        R(12, 12, 2, 3, '#26221f'); R(18, 12, 2, 3, '#26221f');
        R(12, 12, 1, 1, '#ffffff'); R(18, 12, 1, 1, '#ffffff');
        R(11, 10, 3, 1, hairD); R(18, 10, 3, 1, hairD);
        g.fillStyle = 'rgba(244,130,110,.45)';
        g.fillRect(10, 15, 3, 2); g.fillRect(19, 15, 3, 2);
        R(14, 16, 4, 1, '#b06a44');
        // rambut: poni bergerigi + sisi pendek (tidak menutupi mata)
        R(10, 3, 12, 4, hair); R(10, 7, 12, 2, hair);
        R(10, 3, 2, 11, hair); R(20, 3, 2, 11, hair);
        R(14, 7, 2, 2, hair); R(17, 7, 1, 2, hair);
        R(10, 3, 12, 1, hairL);
      } else if (dir === 'up') {
        R(10, 5, 12, 13, skinD);
        R(9, 4, 14, 15, hair);
        R(9, 17, 14, 2, hairD);
        R(12, 6, 3, 3, hairL); R(18, 9, 2, 4, hairL);
      } else if (dir === 'left') {
        R(11, 5, 11, 13, skin);
        R(10, 10, 1, 5, skin);
        R(13, 12, 2, 3, '#26221f'); R(13, 12, 1, 1, '#ffffff');
        R(12, 10, 3, 1, hairD);
        g.fillStyle = 'rgba(244,130,110,.45)'; g.fillRect(11, 15, 3, 2);
        R(11, 16, 3, 1, '#b06a44');
        R(14, 3, 8, 5, hair); R(18, 3, 4, 13, hair); R(14, 3, 8, 1, hairL);
      } else {
        R(10, 5, 11, 13, skin);
        R(21, 10, 1, 5, skin);
        R(17, 12, 2, 3, '#26221f'); R(17, 12, 1, 1, '#ffffff');
        R(17, 10, 3, 1, hairD);
        g.fillStyle = 'rgba(244,130,110,.45)'; g.fillRect(18, 15, 3, 2);
        R(18, 16, 3, 1, '#b06a44');
        R(10, 3, 8, 5, hair); R(10, 3, 4, 13, hair); R(10, 3, 8, 1, hairL);
      }
      // ---- topi ----
      if (look.hat === 'cap') {
        if (dir === 'down' || dir === 'up') { R(9, 1, 14, 4, '#d8342c'); R(9, 5, 14, 2, '#a8231c'); R(12, 0, 8, 2, '#e0453a'); }
        else if (dir === 'left') { R(10, 1, 13, 4, '#d8342c'); R(6, 5, 7, 2, '#a8231c'); }
        else { R(9, 1, 13, 4, '#d8342c'); R(19, 5, 7, 2, '#a8231c'); }
      } else if (look.hat === 'peci') {
        R(11, 0, 10, 5, '#20242b'); R(11, 5, 10, 1, '#3a4048');
      } else if (look.hat === 'straw') {
        R(11, 0, 10, 4, '#e8c85a'); R(5, 4, 22, 2, '#e8c85a'); R(5, 6, 22, 1, '#c9a83f'); R(11, 0, 10, 1, '#f4dc82');
      } else if (look.hat === 'helmet') {
        R(9, 1, 14, 6, '#9aa5ad'); R(9, 7, 14, 2, '#7e8a91'); R(14, 1, 4, 6, '#c3ccd1');
      } else if (look.hat === 'bun') {
        R(20, 0, 6, 6, hair); R(21, 1, 4, 2, hairL);
        if (dir === 'down') { R(10, 3, 12, 3, hair); R(10, 3, 12, 1, hairL); }
      }
      return c;
    }
    const dirs = {};
    ['down', 'up', 'left', 'right'].forEach((d) => {
      dirs[d] = [frame(d, 0), frame(d, 1), frame(d, 2)];
    });
    return dirs;
  }
  const playerSprites = makeCharSprites({ skin: '#f2c188', hair: '#3a2a1a', shirt: '#d8342c', pants: '#33415c', hat: 'cap' });
  const npcSprites = {};
  NPCS.forEach((n) => { npcSprites[n.id] = makeCharSprites(n.look); });

  /* ---------------- Player & NPC runtime ---------------- */
  const player = {
    x: 12.5 * TILE, y: 16.2 * TILE,
    dir: 'up', moving: false, walkTime: 0,
  };
  const npcState = NPCS.map((n) => ({
    data: n, x: n.x * TILE, y: n.y * TILE, dir: 'down',
    phase: Math.random() * Math.PI * 2,
  }));

  function isBlockedPx(px, py) {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
    return blocked.has(bkey(tx, ty));
  }
  // Collider dinamis dari item rumah yang dibeli (air mancur, pagar)
  const dynColliders = [];
  function refreshDynColliders() {
    dynColliders.length = 0;
    if (STATE.houseUpgrades.has('fountain')) dynColliders.push({ x: 22.5 * TILE, y: 15.5 * TILE, r: 24 });
    if (STATE.houseUpgrades.has('fence')) {
      dynColliders.push({ x: 18.5 * TILE, y: 17.5 * TILE, r: 17 });
      dynColliders.push({ x: 23.5 * TILE, y: 17.5 * TILE, r: 17 });
    }
  }
  refreshDynColliders();

  function collides(nx, ny) {
    const pts = [[nx + 11, ny + 33], [nx + 37, ny + 33], [nx + 11, ny + 45], [nx + 37, ny + 45]];
    for (const p of pts) if (isBlockedPx(p[0], p[1])) return true;
    const cx = nx + 24, cy = ny + 39;
    for (const o of npcState) {
      if (Math.hypot(o.x + 24 - cx, o.y + 39 - cy) < 28) return true;
    }
    for (const d of dynColliders) {
      if (Math.hypot(d.x - cx, d.y - cy) < d.r + 10) return true;
    }
    return false;
  }

  /* ---------------- Dialog ---------------- */
  const dialogEl = document.getElementById('dialog');
  const dialogName = document.getElementById('dialog-name');
  const dialogText = document.getElementById('dialog-text');
  const dialogAvatar = document.getElementById('dialog-avatar');
  const promptEl = document.getElementById('prompt');
  const NPC_EMOJI = {
    lurah: '👴', pandai: '🔨', dito: '🎟️', nara: '🔬', raka: '🧑‍💼',
    tania: '👩‍🌾', sari: '👩', pio: '📬', tirta: '🎣', garda: '💂',
  };
  let dialog = null;
  function openDialog(title, pages, emoji, onDone) {
    dialog = { pages, idx: 0, chars: 0, onDone: onDone || null, timer: null };
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

  function playerFeet() { return { x: player.x + 24, y: player.y + 39 }; }
  function nearestInteractable() {
    const f = playerFeet();
    let best = null, bestD = 86;
    npcState.forEach((o) => {
      const d = Math.hypot(o.x + 24 - f.x, o.y + 39 - f.y);
      if (d < bestD) { bestD = d; best = { type: 'npc', obj: o }; }
    });
    SIGNS.forEach((s) => {
      const d = Math.hypot(s.x * TILE + 24 - f.x, s.y * TILE + 39 - f.y);
      if (d < bestD) { bestD = d; best = { type: 'sign', obj: s }; }
    });
    // Rumah Tamu (rumah player — buka toko dekorasi; radius sedikit lebih besar)
    const hd = Math.hypot(20 * TILE + 24 - f.x, 17 * TILE + 39 - f.y);
    if (hd < 105 && (!best || hd <= bestD + 20)) { best = { type: 'home', obj: null }; }
    return best;
  }
  function faceEachOther(o) {
    const dx = player.x - o.x, dy = player.y - o.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      o.dir = dx > 0 ? 'right' : 'left';
      player.dir = dx > 0 ? 'left' : 'right';
    } else {
      o.dir = dy > 0 ? 'down' : 'up';
      player.dir = dy > 0 ? 'up' : 'down';
    }
  }
  function interact() {
    if (dialog) { advanceDialog(); return; }
    const near = nearestInteractable();
    if (!near) return;
    beep(600, 0.05);
    if (near.type === 'npc') {
      const o = near.obj, n = o.data;
      faceEachOther(o);
      const title = n.name + ' — ' + (STATE.lang === 'en' ? (ROLE_EN[n.id] || n.role) : n.role);
      const pages = STATE.lang === 'en' ? (NPC_EN[n.id] || n.pages) : n.pages;
      openDialog(title, pages, NPC_EMOJI[n.id] || '🙂', () => {
        if (n.counts && !STATE.talked.has(n.id)) {
          STATE.talked.add(n.id);
          STATE.coins += 15;
          persist(); refreshChips();
          toast(L(STR.coinToast)(n.name.split(' ').slice(-1)[0]));
          beep(880, 0.1); setTimeout(() => beep(1174, 0.14), 110);
          const total = NPCS.filter((x) => x.counts).length;
          if (STATE.talked.size >= total) {
            setTimeout(() => toast(L(STR.missionDone)), 2600);
          }
        }
        if (n.action === 'fishing') window.location.href = 'fishing.html';
        if (n.action === 'td') window.location.href = 'td.html';
      });
    } else if (near.type === 'home') {
      openDialog(L(STR.homeTitle), homePages(), '🏠', () => openShop());
    } else {
      const s = near.obj;
      const sName = STATE.lang === 'en' ? (SIGN_NAME_EN[s.id] || s.name) : s.name;
      const sPages = STATE.lang === 'en' ? (SIGN_EN[s.id] || s.pages) : s.pages;
      openDialog(sName, sPages, '📜', null);
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
      title: '👋 Tentang Saya', npc: 'lurah',
      body: '<p><b>Rama Hadi Nugraha</b> — UI/UX &amp; Mobile Developer · Visual Designer · Applied AI Research.</p>' +
        '<p>Lulusan S1 Teknik Informatika, Universitas Komputer Indonesia (2022–2026), IPK <b>3,80</b>. Memegang sertifikasi <b>BNSP Data Analis</b> dan <b>BNSP Desain Grafis Muda</b>.</p>' +
        '<p>Di desa ini, Pak Lurah adalah penjaga ceritanya.</p>',
    },
    proyek: {
      title: '🚀 Proyek Pilihan', npc: 'dito',
      body:
        '<div class="proj-item"><b>🎟️ Aplikasi Tiket Wisata — Disparbud Majalengka</b><span>UI/UX end-to-end &amp; Flutter (web/Android), 200+ pengguna uji, scan QR mempercepat validasi 40%. → Dito</span></div>' +
        '<div class="proj-item"><b>🔬 Japanese Waste Detection — Riset JAIST</b><span>YOLOv8 + FastAPI; 8 konfigurasi deteksi, pipeline PCA/UMAP/Isolation Forest, LMM/GEE atas 1.150 prediksi. → Nara</span></div>' +
        '<div class="proj-item"><b>🧑‍💼 Blockchain B2B Product Reservation DApp</b><span>Smart contract Solidity di Ethereum Sepolia, frontend React + MetaMask. → Raka</span></div>' +
        '<div class="proj-item"><b>👩‍🌾 TaniXplore &amp; Proyek Lainnya</b><span>Platform pertanian Maps API, Smart Door IoT, Anime Face Recognition. → Tania</span></div>' +
        '<div class="proj-item"><b>🎨 Desain Visual — Laznas PYI</b><span>Konten 8 akun Instagram, +20 pengikut/akun/bulan. → Papan Galeri di alun-alun</span></div>',
    },
    keahlian: {
      title: '🛠️ Keahlian', npc: 'pandai',
      body: '<p><b>Pemrograman:</b> Flutter · Python/FastAPI · PHP · JavaScript · HTML/CSS · C#/Unity · Solidity</p>' +
        '<p><b>Data:</b> SQLite · SQLAlchemy · Hadoop · OLAP Mondrian · Spoon ETL</p>' +
        '<p><b>AI &amp; Riset:</b> YOLOv8 · PCA · UMAP · Isolation Forest · Association Rule Mining · LMM/GEE · Vuforia AR</p>' +
        '<p><b>Desain:</b> Figma · Photoshop · Illustrator · Premiere Pro · After Effects · Lightroom</p>' +
        '<p>Di desa ini, Bang Bara si pandai besi adalah penjaga daftar lengkapnya.</p>',
    },
    pengalaman: {
      title: '💼 Pengalaman', npc: 'sari',
      body: '<p><b>Research Intern — JAIST</b> (Jul–Sep 2026): Computer Vision &amp; Reliability Analysis.</p>' +
        '<p><b>Visual Designer — Laznas PYI</b> (Feb–Mar 2026).</p>' +
        '<p><b>UI/UX &amp; Flutter Developer Intern — Disparbud Majalengka</b> (Agu–Okt 2025).</p>' +
        '<p><b>Divisi Dekomedia — UKM Fotografi Glosarium UNIKOM</b> (Des 2023–Des 2024), engagement +25%.</p>' +
        '<p>Di desa ini, Bu Sari si pemilik penginapan adalah penjaga ceritanya.</p>',
    },
    kontak: {
      title: '✉️ Kontak', npc: 'pio',
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
    const o = npcState.find((x) => x.data.id === id);
    if (!o) return;
    const tx = o.x, ty = (o.data.y + 1.35) * TILE;
    if (!collides(tx, ty)) { player.x = tx; player.y = ty; }
    else { player.x = tx; player.y = (o.data.y + 2.15) * TILE; }
    player.dir = 'up';
    toast(L(STR.arrived) + o.data.name);
    beep(740, 0.07);
  }
  document.querySelectorAll('[data-section]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sec = (STATE.lang === 'en' ? INFO_EN : INFO)[btn.getAttribute('data-section')];
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
  // Popup pembuka (tutorial) ditampilkan di bagian "Mulai".

  /* ---------------- Toko Dekorasi ---------------- */
  const SHOP_ITEMS = [
    { id: 'paint', icon: '🎨', price: 40, name: { en: 'Fresh House Paint', id: 'Cat Rumah Baru' }, desc: { en: 'Walls repainted in bright cream — the shabby look is gone, the house feels alive again.', id: 'Dinding dicat ulang krem cerah — kesan usang hilang, rumah terasa hidup lagi.' } },
    { id: 'roof', icon: '🏠', price: 60, name: { en: 'Premium Terracotta Roof', id: 'Atap Terakota Premium' }, desc: { en: 'A new terracotta roof with a decorated ridge and golden ornaments.', id: 'Atap baru warna terakota dengan bubungan berhias dan ornamen emas.' } },
    { id: 'garden', icon: '🌸', price: 30, name: { en: 'Flower Garden', id: 'Taman Bunga' }, desc: { en: 'Two colorful flower beds in the Guest House front yard.', id: 'Dua petak bunga warna-warni di halaman depan Rumah Tamu.' } },
    { id: 'lantern', icon: '🏮', price: 25, name: { en: 'Porch Lanterns', id: 'Lentera Teras' }, desc: { en: 'A pair of warm lanterns beside the door — their glow reaches the village road.', id: 'Sepasang lentera hangat di samping pintu — cahayanya terasa sampai jalan desa.' } },
    { id: 'fence', icon: '🪵', price: 35, name: { en: 'Wooden Yard Fence', id: 'Pagar Kayu Halaman' }, desc: { en: 'A sturdy wooden fence at both ends of the front yard.', id: 'Pagar kayu kokoh di kedua ujung halaman depan.' } },
    { id: 'fountain', icon: '⛲', price: 80, name: { en: 'Mini Fountain', id: 'Air Mancur Mini' }, desc: { en: 'An animated stone fountain beside the house. The neighbors will be jealous!', id: 'Air mancur batu beranimasi di samping rumah. Tetangga pasti iri!' } },
  ];
  const shopModal = document.getElementById('shop-modal');
  const shopItemsEl = document.getElementById('shop-items');
  const shopCoinsEl = document.getElementById('shop-coins');
  function renderShop() {
    shopCoinsEl.textContent = STATE.coins;
    shopItemsEl.innerHTML = SHOP_ITEMS.map((it) => {
      const owned = STATE.houseUpgrades.has(it.id);
      const afford = STATE.coins >= it.price;
      return '<div class="shop-item' + (owned ? ' owned' : '') + '">' +
        '<div class="ic">' + it.icon + '</div>' +
        '<div class="inf"><b>' + L(it.name) + '</b><span>' + L(it.desc) + '</span></div>' +
        '<div class="buy">' + (owned
          ? '<span class="owned-label">' + L(STR.owned) + '</span>'
          : '<span class="price">🪙 ' + it.price + '</span><button class="px-btn' + (afford ? ' primary' : '') + '" data-buy="' + it.id + '"' + (afford ? '' : ' disabled') + '>' + L(STR.buy) + '</button>') +
        '</div></div>';
    }).join('');
    shopItemsEl.querySelectorAll('[data-buy]').forEach((b) => {
      b.addEventListener('click', () => buyItem(b.getAttribute('data-buy')));
    });
  }
  function buyItem(id) {
    const it = SHOP_ITEMS.find((x) => x.id === id);
    if (!it || STATE.houseUpgrades.has(id) || STATE.coins < it.price) return;
    STATE.coins -= it.price;
    STATE.houseUpgrades.add(id);
    persist(); refreshChips();
    if (id === 'paint' || id === 'roof' || id === 'lantern') {
      houseSprites[PLAYER_HOUSE_IDX] = buildPlayerHouseSprite();
    }
    refreshDynColliders();
    renderShop();
    toast(L(STR.bought)(L(it.name)));
    beep(784, 0.09); setTimeout(() => beep(988, 0.09), 90); setTimeout(() => beep(1318, 0.16), 180);
  }
  function openShop() { renderShop(); shopModal.classList.remove('hidden'); }
  function closeShop() { shopModal.classList.add('hidden'); }
  document.getElementById('btn-shop').addEventListener('click', openShop);
  document.querySelectorAll('[data-close-shop]').forEach((el) => {
    el.addEventListener('click', closeShop);
  });
  shopModal.addEventListener('click', (e) => { if (e.target === shopModal) closeShop(); });

  /* ---------------- Asap cerobong ---------------- */
  const smoke = [];
  let smokeTimer = 0;
  const CHIMNEYS = [{ x: 721, y: -11 }, { x: 128, y: 63 }]; // Balai Desa (medieval) & Pandai Besi (pipa)

  /* ---------------- Partikel daun gugur ---------------- */
  const pollen = [];
  for (let i = 0; i < 42; i++) {
    pollen.push({ x: Math.random() * WORLD_W, y: Math.random() * WORLD_H, s: Math.random() * Math.PI * 2, v: 4 + Math.random() * 7 });
  }

  /* ---------------- Render ---------------- */
  function drawShadow(x, y, w) {
    ctx.fillStyle = 'rgba(20,40,15,.28)';
    ctx.beginPath(); ctx.ellipse(x, y, w, w * 0.32, 0, 0, Math.PI * 2); ctx.fill();
  }
  function drawNamePill(x, y, text) {
    ctx.font = 'bold 12.5px "Trebuchet MS", sans-serif';
    const w = ctx.measureText(text).width + 16;
    ctx.fillStyle = 'rgba(20,26,18,.78)';
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - 10, w, 20, 10); ctx.fill();
    ctx.fillStyle = '#fff7e0';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y + 4.5);
  }

  function render(t) {
    // kamera mengikuti player
    const f = playerFeet();
    let camX = f.x - VW / 2, camY = f.y - VH / 2;
    camX = WORLD_W <= VW ? (WORLD_W - VW) / 2 : Math.max(0, Math.min(WORLD_W - VW, camX));
    camY = WORLD_H <= VH ? (WORLD_H - VH) / 2 : Math.max(0, Math.min(WORLD_H - VH, camY));

    ctx.fillStyle = '#3d7a2e';
    ctx.fillRect(0, 0, VW, VH);
    ctx.save();
    ctx.translate(-Math.round(camX), -Math.round(camY));

    // --- tile yang terlihat ---
    const x0 = Math.max(0, Math.floor(camX / TILE)), x1 = Math.min(COLS - 1, Math.ceil((camX + VW) / TILE));
    const y0 = Math.max(0, Math.floor(camY / TILE)), y1 = Math.min(ROWS - 1, Math.ceil((camY + VH) / TILE));
    const waterFrame = WATER_TILES[Math.floor(t / 480) % 3];
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const ty = ground[y][x], px = x * TILE, py = y * TILE;
        if (ty === 'grass') ctx.drawImage(GRASS[(x * 7 + y * 13) % 4], px, py);
        else if (ty === 'path') ctx.drawImage(PATH_TILE, px, py);
        else if (ty === 'plaza') ctx.drawImage(PLAZA_TILE, px, py);
        else if (ty === 'sand') ctx.drawImage(SAND_TILE, px, py);
        else if (ty === 'water') ctx.drawImage(waterFrame, px, py);
      }
    }
    // tepi jalan & busa air
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const ty = ground[y][x], px = x * TILE, py = y * TILE;
        const nb = (dx, dy) => (x + dx < 0 || y + dy < 0 || x + dx >= COLS || y + dy >= ROWS) ? 'grass' : ground[y + dy][x + dx];
        if (ty === 'path' || ty === 'plaza') {
          ctx.fillStyle = 'rgba(90,60,20,.28)';
          if (nb(0, -1) === 'grass') ctx.fillRect(px, py, TILE, 4);
          if (nb(0, 1) === 'grass') ctx.fillRect(px, py + TILE - 4, TILE, 4);
          if (nb(-1, 0) === 'grass') ctx.fillRect(px, py, 4, TILE);
          if (nb(1, 0) === 'grass') ctx.fillRect(px + TILE - 4, py, 4, TILE);
        }
        if (ty === 'sand') {
          ctx.fillStyle = 'rgba(255,255,255,.55)';
          if (nb(0, -1) === 'water') ctx.fillRect(px, py, TILE, 3);
          if (nb(0, 1) === 'water') ctx.fillRect(px, py + TILE - 3, TILE, 3);
          if (nb(-1, 0) === 'water') ctx.fillRect(px, py, 3, TILE);
          if (nb(1, 0) === 'water') ctx.fillRect(px + TILE - 3, py, 3, TILE);
        }
      }
    }
    // kilau kolam
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    for (let i = 0; i < 7; i++) {
      const sx = 1.4 * TILE + ((i * 173 + Math.floor(t / 90)) % 200);
      const sy = 13.5 * TILE + ((i * 97) % 170);
      if (Math.sin(t / 300 + i * 1.7) > 0.55) ctx.fillRect(sx, sy, 9, 2.2);
    }
    // dermaga kayu di tepi kolam
    ctx.fillStyle = 'rgba(15,45,80,.3)'; ctx.fillRect(5.55 * TILE, 14.1 * TILE, 52, 2.3 * TILE + 6);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 ? '#96682f' : '#a9743f';
      ctx.fillRect(5.55 * TILE, (14.1 + i * 0.47) * TILE, 52, 0.44 * TILE);
    }
    ctx.fillStyle = '#6b4a2a';
    ctx.fillRect(5.6 * TILE, 14.2 * TILE, 7, 2.2 * TILE);
    ctx.fillRect(6.5 * TILE, 14.2 * TILE, 7, 2.2 * TILE);
    // bunga-bunga
    FLOWER_SPOTS.forEach((s, i) => {
      const cols = ['#ff6b9d', '#ffd93d', '#ffffff', '#ff8c42', '#c77dff'];
      ctx.fillStyle = cols[i % 5];
      const fx = s[0] * TILE, fy = s[1] * TILE;
      ctx.fillRect(fx + 10, fy + 14, 5, 5); ctx.fillRect(fx + 30, fy + 30, 5, 5); ctx.fillRect(fx + 34, fy + 8, 4, 4);
      ctx.fillStyle = '#3f8f2f';
      ctx.fillRect(fx + 12, fy + 19, 2, 6); ctx.fillRect(fx + 32, fy + 35, 2, 5);
    });
    // petak bunga Rumah Tamu (item toko: taman)
    if (STATE.houseUpgrades.has('garden')) {
      [[19, 17], [22, 17]].forEach((b) => {
        const bx = b[0] * TILE, by = b[1] * TILE;
        ctx.fillStyle = '#5d4630'; ctx.fillRect(bx + 3, by + 16, TILE - 6, 22);
        ctx.fillStyle = '#6e543a'; ctx.fillRect(bx + 3, by + 16, TILE - 6, 4);
        const cols = ['#ff6b9d', '#ffd93d', '#ff8c42', '#c77dff', '#ffffff'];
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = cols[(i + b[0]) % 5];
          ctx.fillRect(bx + 7 + (i % 3) * 13, by + 12 + Math.floor(i / 3) * 12, 5, 5);
          ctx.fillStyle = '#3f8f2f';
          ctx.fillRect(bx + 9 + (i % 3) * 13, by + 17 + Math.floor(i / 3) * 12, 2, 5);
        }
      });
    }
    // bayangan awan melayang
    for (let i = 0; i < 3; i++) {
      const cxp = ((t * 0.008 * (1 + i * 0.4) + i * 460) % (WORLD_W + 560)) - 280;
      const cyp = 130 + i * 300 + Math.sin(t / 3000 + i) * 26;
      const grd = ctx.createRadialGradient(cxp, cyp, 10, cxp, cyp, 190);
      grd.addColorStop(0, 'rgba(20,50,25,.16)');
      grd.addColorStop(1, 'rgba(20,50,25,0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.ellipse(cxp, cyp, 210, 92, 0, 0, Math.PI * 2); ctx.fill();
    }

    // --- entitas terurut Y ---
    const ents = [];
    HOUSES.forEach((h, i) => ents.push({
      sortY: (h.y + h.h) * TILE,
      draw: () => {
        drawShadow(h.x * TILE + h.w * TILE / 2, (h.y + h.h) * TILE - 4, h.w * TILE * 0.46);
        ctx.drawImage(houseSprites[i].canvas, h.x * TILE, h.y * TILE - houseSprites[i].roofExtra);
      },
    }));
    TREES.forEach((tr, i) => ents.push({
      sortY: (tr[1] + 1) * TILE,
      draw: () => {
        drawShadow(tr[0] * TILE + 24, tr[1] * TILE + 44, 21);
        ctx.drawImage(TREE_SPRITES[treeVariant(tr, i)], tr[0] * TILE - 28, tr[1] * TILE - 74);
      },
    }));
    // batu & tunggul pohon (dekorasi desa tua)
    const ROCKS = [[5, 4], [23, 8], [4, 11]];
    ROCKS.forEach((rk) => ents.push({
      sortY: (rk[1] + 1) * TILE,
      draw: () => {
        const px = rk[0] * TILE, py = rk[1] * TILE;
        drawShadow(px + 24, py + 40, 16);
        ctx.fillStyle = '#8a8d90';
        ctx.beginPath(); ctx.ellipse(px + 24, py + 32, 17, 11, 0, Math.PI, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#a6a9ac';
        ctx.beginPath(); ctx.ellipse(px + 18, py + 27, 9, 6, -0.4, Math.PI, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#76797c';
        ctx.beginPath(); ctx.ellipse(px + 36, py + 36, 8, 5.4, 0, Math.PI, Math.PI * 2); ctx.fill();
      },
    }));
    const STUMPS = [[18, 7], [11, 7]];
    STUMPS.forEach((st) => ents.push({
      sortY: (st[1] + 1) * TILE,
      draw: () => {
        const px = st[0] * TILE, py = st[1] * TILE;
        drawShadow(px + 24, py + 42, 13);
        ctx.fillStyle = '#6e543a'; ctx.fillRect(px + 14, py + 26, 20, 15);
        ctx.fillStyle = '#c9a26b';
        ctx.beginPath(); ctx.ellipse(px + 24, py + 26, 10, 4.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#a37f4c'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.ellipse(px + 24, py + 26, 5.6, 2.4, 0, 0, Math.PI * 2); ctx.stroke();
      },
    }));
    BUSHES.forEach((b) => ents.push({
      sortY: (b[1] + 1) * TILE,
      draw: () => {
        drawShadow(b[0] * TILE + 24, b[1] * TILE + 40, 17);
        ctx.drawImage(BUSH_SPRITE, b[0] * TILE - 2, b[1] * TILE + 4);
      },
    }));
    FENCES.forEach((fc) => ents.push({
      sortY: (fc[1] + 1) * TILE,
      draw: () => {
        const px = fc[0] * TILE, py = fc[1] * TILE;
        ctx.fillStyle = '#8a5a2b';
        ctx.fillRect(px + 3, py + 14, 6, 30); ctx.fillRect(px + 39, py + 14, 6, 30);
        ctx.fillStyle = '#a9743f';
        ctx.fillRect(px, py + 18, TILE, 6); ctx.fillRect(px, py + 32, TILE, 6);
        ctx.fillStyle = '#c08b4d';
        ctx.fillRect(px, py + 18, TILE, 2.4); ctx.fillRect(px, py + 32, TILE, 2.4);
      },
    }));
    SIGNS.forEach((s) => ents.push({
      sortY: (s.y + 1) * TILE,
      draw: () => {
        drawShadow(s.x * TILE + 24, s.y * TILE + 46, 15);
        ctx.drawImage(SIGN_SPRITE, s.x * TILE - 2, s.y * TILE - 10);
      },
    }));
    // pagar halaman Rumah Tamu (item toko)
    if (STATE.houseUpgrades.has('fence')) {
      [[18, 17], [23, 17]].forEach((fc) => ents.push({
        sortY: (fc[1] + 1) * TILE,
        draw: () => {
          const px = fc[0] * TILE, py = fc[1] * TILE;
          ctx.fillStyle = '#8a5a2b';
          ctx.fillRect(px + 3, py + 14, 6, 30); ctx.fillRect(px + 39, py + 14, 6, 30);
          ctx.fillStyle = '#a9743f';
          ctx.fillRect(px, py + 18, TILE, 6); ctx.fillRect(px, py + 32, TILE, 6);
          ctx.fillStyle = '#c08b4d';
          ctx.fillRect(px, py + 18, TILE, 2.4); ctx.fillRect(px, py + 32, TILE, 2.4);
        },
      }));
    }
    // air mancur mini (item toko)
    if (STATE.houseUpgrades.has('fountain')) {
      ents.push({
        sortY: 16 * TILE,
        draw: () => {
          const fx = 22.5 * TILE, fy = 15.5 * TILE;
          drawShadow(fx, fy + 16, 24);
          ctx.fillStyle = '#8d8d93';
          ctx.beginPath(); ctx.ellipse(fx, fy + 12, 25, 10, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#35707e';
          ctx.beginPath(); ctx.ellipse(fx, fy + 10, 19, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#a6a9ac'; ctx.fillRect(fx - 3.4, fy - 12, 6.8, 22);
          ctx.fillStyle = '#8d8d93';
          ctx.beginPath(); ctx.ellipse(fx, fy - 12, 8, 3.6, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(200,240,255,.85)'; ctx.lineWidth = 2;
          for (let i = -1; i <= 1; i++) {
            const ph = Math.sin(t / 240 + i * 1.3) * 2;
            ctx.beginPath();
            ctx.moveTo(fx + i * 3, fy - 13);
            ctx.quadraticCurveTo(fx + i * 11, fy - 22 + ph, fx + i * 15, fy + 6);
            ctx.stroke();
          }
          ctx.fillStyle = 'rgba(255,255,255,.8)';
          ctx.fillRect(fx - 12 + (Math.floor(t / 130) % 20), fy + 8, 3, 1.8);
        },
      });
    }
    npcState.forEach((o) => ents.push({
      sortY: o.y + 46,
      draw: () => {
        const bob = Math.sin(t / 520 + o.phase) * 1.1;
        drawShadow(o.x + 24, o.y + 45, 15);
        ctx.drawImage(npcSprites[o.data.id][o.dir][0], o.x, o.y - 24 + bob, 48, 72);
      },
    }));
    ents.push({
      sortY: player.y + 46,
      draw: () => {
        let frameIdx = 0;
        if (player.moving) frameIdx = [1, 0, 2, 0][Math.floor(player.walkTime * 9) % 4];
        drawShadow(player.x + 24, player.y + 45, 15);
        ctx.drawImage(playerSprites[player.dir][frameIdx], player.x, player.y - 24, 48, 72);
      },
    });
    ents.push({
      sortY: 18.6 * TILE,
      draw: () => { ctx.drawImage(GATE_SPRITE, 12 * TILE - 46, 17.35 * TILE); },
    });
    ents.sort((a, b) => a.sortY - b.sortY);
    ents.forEach((e) => e.draw());

    // cahaya hangat lentera di depan tiap rumah (senja desa)
    HOUSES.forEach((h) => {
      const gx = (h.x + h.w / 2) * TILE, gy = (h.y + h.h) * TILE - 6;
      const strong = h.label === 'RUMAH TAMU' && STATE.houseUpgrades.has('lantern');
      const grd = ctx.createRadialGradient(gx, gy, 4, gx, gy, strong ? 110 : 74);
      grd.addColorStop(0, 'rgba(255,186,84,' + (strong ? 0.30 : 0.16) + ')');
      grd.addColorStop(1, 'rgba(255,186,84,0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(gx, gy, strong ? 110 : 74, 0, Math.PI * 2); ctx.fill();
    });

    // asap cerobong Balai Desa & Pandai Besi
    smoke.forEach((p) => {
      ctx.fillStyle = 'rgba(228,228,228,' + (0.34 * p.life) + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });

    // --- label nama & tanda "!" ---
    const pf = playerFeet();
    npcState.forEach((o) => {
      const d = Math.hypot(o.x + 24 - pf.x, o.y + 39 - pf.y);
      if (d < 215) drawNamePill(o.x + 24, o.y - 42, o.data.name.split(' ').slice(-1)[0]);
      if (o.data.counts && !STATE.talked.has(o.data.id)) {
        const by = o.y - 60 + Math.abs(Math.sin(t / 300 + o.phase)) * 6;
        ctx.font = 'bold 21px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(30,25,5,.8)';
        ctx.strokeText('!', o.x + 24, by);
        ctx.fillStyle = '#ffd93d';
        ctx.fillText('!', o.x + 24, by);
      }
    });
    // daun-daun gugur beterbangan
    const LEAF_COLS = ['#c97b2f', '#a8642f', '#8a8a4d', '#b45f2e'];
    pollen.forEach((p, i) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.sin(t / 500 + p.s) * 0.9);
      ctx.fillStyle = LEAF_COLS[i % 4];
      ctx.globalAlpha = 0.75;
      ctx.fillRect(-3, -2, 6, 4);
      ctx.restore();
    });
    ctx.globalAlpha = 1;

    ctx.restore();
    // grading warna: sapuan cokelat tipis + vignette (nuansa gambar referensi)
    ctx.fillStyle = 'rgba(43,36,18,.13)';
    ctx.fillRect(0, 0, VW, VH);
    const vg = ctx.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * 0.40, VW / 2, VH / 2, Math.max(VW, VH) * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(10,14,6,.40)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, VW, VH);
  }

  /* ---------------- Update ---------------- */
  const SPEED = 237;
  let lastTime = performance.now();
  function update(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    const uiBusy = dialog ||
      !infoModal.classList.contains('hidden') || !tutorialModal.classList.contains('hidden') ||
      !shopModal.classList.contains('hidden');
    let dx = 0, dy = 0;
    if (!uiBusy) {
      if (keys['ArrowLeft'] || keys['KeyA'] || touch.left) dx = -1;
      if (keys['ArrowRight'] || keys['KeyD'] || touch.right) dx = 1;
      if (keys['ArrowUp'] || keys['KeyW'] || touch.up) dy = -1;
      if (keys['ArrowDown'] || keys['KeyS'] || touch.down) dy = 1;
    }
    const len = Math.hypot(dx, dy);
    player.moving = len > 0;
    if (len > 0) {
      dx /= len; dy /= len;
      if (Math.abs(dx) > Math.abs(dy)) player.dir = dx > 0 ? 'right' : 'left';
      else if (dy !== 0) player.dir = dy > 0 ? 'down' : 'up';
      const dist = SPEED * dt;
      if (!collides(player.x + dx * dist, player.y)) player.x += dx * dist;
      if (!collides(player.x, player.y + dy * dist)) player.y += dy * dist;
      player.walkTime += dt;
      if (Math.floor(player.walkTime * 9) !== Math.floor((player.walkTime - dt) * 9) && Math.floor(player.walkTime * 9) % 2 === 0) {
        beep(180 + Math.random() * 40, 0.03, 'triangle', 0.012);
      }
    }
    // prompt interaksi
    if (!dialog) {
      const near = nearestInteractable();
      if (near) {
        const name = near.type === 'npc' ? near.obj.data.name
          : near.type === 'home' ? L(STR.homePrompt)
          : (STATE.lang === 'en' ? (SIGN_NAME_EN[near.obj.id] || near.obj.name) : near.obj.name);
        promptEl.innerHTML = L(STR.prompt) + name;
        promptEl.classList.remove('hidden');
      } else {
        promptEl.classList.add('hidden');
      }
    } else {
      promptEl.classList.add('hidden');
    }
    // asap cerobong: kepulan baru + gerak naik
    smokeTimer -= dt;
    if (smokeTimer <= 0) {
      smokeTimer = 0.42;
      CHIMNEYS.forEach((ch) => {
        smoke.push({ x: ch.x + (Math.random() - 0.5) * 4, y: ch.y, r: 3.5, life: 1 });
      });
    }
    for (let i = smoke.length - 1; i >= 0; i--) {
      const p = smoke[i];
      p.y -= 13 * dt; p.x += 5.5 * dt; p.r += 5 * dt; p.life -= dt / 2.8;
      if (p.life <= 0) smoke.splice(i, 1);
    }
    // gerakkan daun gugur (jatuh perlahan sambil bergoyang)
    pollen.forEach((p) => {
      p.y += 0.35 + Math.sin(now / 900 + p.s) * 0.12;
      p.x += Math.sin(now / 1300 + p.s) * 0.5;
      if (p.y > WORLD_H) { p.y = -6; p.x = Math.random() * WORLD_W; }
      if (p.x > WORLD_W) p.x = 0; if (p.x < 0) p.x = WORLD_W;
    });
    render(now);
    requestAnimationFrame(update);
  }

  /* ---------------- Mulai ---------------- */
  refreshChips();
  window.__desaReady = true;
  document.getElementById('loading').classList.add('hidden');
  // Terapkan bahasa terpilih (default: English) lalu tampilkan popup pembuka.
  applyLang();
  tutorialModal.classList.remove('hidden');
  requestAnimationFrame(update);
})();
