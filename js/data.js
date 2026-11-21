/* ============================================================
   DATA DESA PORTOFOLIO
   Semua teks di sini berasal dari CV Rama Hadi Nugraha.
   Untuk mengubah isi portofolio, cukup edit file ini.
   Koordinat memakai satuan TILE (1 tile = 32px). Peta: 26 x 19.
   ============================================================ */

// Bangunan desa: x, y, w, h dalam tile + label + warna + gaya arsitektur
// style: 'medieval' (Eropa) | 'eastasia' (Asia Timur) | 'mideast' (Timur Tengah) | 'seasia' (Asia Tenggara)
const HOUSES = [
  { x: 10, y: 1, w: 6, h: 3, label: 'BALAI DESA', roof: '#54687c', wall: '#e8e0cc', style: 'medieval' },
  { x: 2,  y: 2, w: 4, h: 3, label: 'PANDAI BESI', roof: '#b08954', wall: '#e3cfa3', style: 'mideast' },
  { x: 20, y: 2, w: 4, h: 3, label: 'ARENA', roof: '#4a4f57', wall: '#f2ede2', style: 'eastasia' },
  { x: 2,  y: 7, w: 4, h: 3, label: 'GALERI', roof: '#8a6a42', wall: '#a9743f', style: 'seasia' },
  { x: 20, y: 12, w: 4, h: 3, label: 'PENGINAPAN', roof: '#7a4a35', wall: '#f2ede2', style: 'eastasia' },
  { x: 8,  y: 15, w: 4, h: 3, label: 'KANTOR POS', roof: '#9c4030', wall: '#efe3ce', style: 'medieval' },
  { x: 19, y: 15, w: 3, h: 2, label: 'RUMAH TAMU', roof: '#6e5a44', wall: '#b98a58', style: 'seasia' },
];

// Pohon dekorasi (tile x, y)
const TREES = [
  [1, 1], [7, 1], [18, 1], [24, 5], [1, 5], [18, 5],
  [7, 6], [24, 10], [1, 11], [15, 6], [6, 12], [17, 16],
  [24, 16], [3, 17], [21, 17], [14, 17],
];

// Papan proyek di alun-alun (interaktif, seperti NPC tanpa badan)
const BOARDS = [
  { x: 9,  y: 11, id: 'board1' },
  { x: 12, y: 11, id: 'board2' },
  { x: 15, y: 11, id: 'board3' },
];

/* NPC desa. 
   action: null = dialog biasa | 'fishing' | 'td'
   counts: true = dihitung dalam misi "8 warga" di HUD            */
const NPCS = [
  {
    id: 'lurah', name: 'Pak Lurah Wiryo', role: 'Tentang Saya',
    x: 12, y: 5, counts: true,
    look: { skin: '#f2c188', hair: '#e8e8e8', shirt: '#8a5a2b', pants: '#4a3b28', hat: 'peci' },
    pages: [
      'Selamat datang di Desa Portofolio, Nak! Aku Pak Lurah. Desa ini dibangun oleh seorang pemuda bernama Rama Hadi Nugraha.',
      'Rama adalah lulusan S1 Teknik Informatika, Universitas Komputer Indonesia (2022–2026) dengan IPK 3,80. Bidang andalannya: UI/UX & Mobile Developer, Visual Designer, dan Applied AI Research.',
      'Ia memegang dua sertifikasi BNSP: Data Analis dan Desain Grafis Muda. Silakan keliling desa — setiap warga di sini punya cerita tentang karya-karyanya!',
    ],
  },
  {
    id: 'pandai', name: 'Bang Bara', role: 'Keahlian',
    x: 7, y: 4, counts: true,
    look: { skin: '#c68850', hair: '#1c1c1c', shirt: '#5b6770', pants: '#333a40', hat: 'none' },
    pages: [
      'Hah, pengunjung baru! Aku Bang Bara, pandai besi desa ini. Di bengkelku, peralatan Rama selalu diasah tajam!',
      'Bahasa & framework andalannya: Flutter, Python (FastAPI), PHP, JavaScript, HTML/CSS, C#/Unity, dan Solidity. Untuk data: SQLite, SQLAlchemy, sampai Hadoop.',
      'Senjata desainnya: Figma, Photoshop, Illustrator, Premiere Pro, After Effects, dan Lightroom. Untuk AI: YOLOv8, PCA, UMAP, Isolation Forest, dan analisis statistik LMM/GEE. Lengkap, kan?',
    ],
  },
  {
    id: 'dito', name: 'Dito', role: 'Proyek: Tiket Wisata',
    x: 7, y: 9, counts: true,
    look: { skin: '#f2c188', hair: '#3a2a1a', shirt: '#2e6fd8', pants: '#33415c', hat: 'cap' },
    pages: [
      'Halo! Aku Dito. Dulu aku antre panjang beli tiket wisata... sampai Rama datang magang di Dinas Pariwisata dan Kebudayaan Majalengka (Agu–Okt 2025).',
      'Ia merancang UI/UX end-to-end dan membangun aplikasi pemesanan tiket wisata dengan Flutter untuk web & Android. Diuji oleh 200+ pengguna, lho!',
      'Fitur scan QR buatannya mempercepat validasi tiket sampai 40%. Ia juga yang merancang logo dan branding-nya. Antreanku sekarang lancar!',
    ],
  },
  {
    id: 'nara', name: 'Nara', role: 'Proyek: Riset AI',
    x: 19, y: 9, counts: true,
    look: { skin: '#ffd9b3', hair: '#101010', shirt: '#7a4fa3', pants: '#3d3355', hat: 'bun' },
    pages: [
      'Salam kenal, aku Nara, peneliti desa. Rekanku Rama pernah magang riset di JAIST, Jepang (Jul–Sep 2026) — bidang Computer Vision & Reliability Analysis.',
      'Di sana ia menjalankan eksperimen 8 konfigurasi deteksi objek, membangun pipeline PCA/UMAP/Isolation Forest, dan menganalisis 1.150 prediksi dengan LMM/GEE serta Association Rule Mining.',
      'Proyeknya: Japanese Waste Detection — deteksi sampah memakai YOLOv8 dengan backend FastAPI (REST API + SQLite/SQLAlchemy). Keren, ya?',
    ],
  },
  {
    id: 'raka', name: 'Raka', role: 'Proyek: Blockchain',
    x: 16, y: 13, counts: true,
    look: { skin: '#e0ac69', hair: '#241a12', shirt: '#f2b705', pants: '#5c4a1f', hat: 'cap' },
    pages: [
      'Yo! Aku Raka, pedagang keliling. Aku jualan antar-desa pakai teknologi buatan Rama: Blockchain B2B Product Reservation DApp!',
      'Smart contract-nya ditulis dengan Solidity dan berjalan di jaringan Ethereum Sepolia. Tampilan tokonya dibuat dengan React dan terhubung ke dompet MetaMask.',
      'Pesanan produk antar-bisnis jadi transparan dan tercatat permanen. Daganganku aman sentosa!',
    ],
  },
  {
    id: 'tania', name: 'Tania', role: 'Proyek: TaniXplore & Lainnya',
    x: 10, y: 13, counts: true,
    look: { skin: '#c68850', hair: '#4a2c14', shirt: '#38a13d', pants: '#6b4f2a', hat: 'straw' },
    pages: [
      'Hai, aku Tania, petani desa ini. Rama pernah membuatkan kami TaniXplore (2024), platform pertanian yang terintegrasi Maps API — mencari lahan dan hasil tani jadi gampang!',
      'Ia juga membuat Smart Door Notification berbasis IoT (2025) dan proyek Anime Face Recognition (2025). Tangannya memang serba bisa.',
      'Jangan lupa mampir ke papan galeri di alun-alun — di sana ada cerita desain visualnya untuk Laznas PYI!',
    ],
  },
  {
    id: 'sari', name: 'Bu Sari', role: 'Pengalaman',
    x: 19, y: 13, counts: true,
    look: { skin: '#f2c188', hair: '#5a3a1a', shirt: '#2f8f5b', pants: '#274e36', hat: 'bun' },
    pages: [
      'Mampir dulu di penginapanku, Nak. Aku Bu Sari. Banyak tamu bercerita tentang perjalanan Rama...',
      'Ia magang riset di JAIST (2026), menjadi Visual Designer di Laznas PYI (Feb–Mar 2026) — mengelola konten 8 akun Instagram dengan rata-rata +20 pengikut per akun per bulan.',
      'Sebelumnya ia magang UI/UX & Flutter di Disparbud Majalengka (2025), dan selama kuliah aktif di UKM Fotografi Glosarium UNIKOM sebagai Divisi Dekomedia (2023–2024) — engagement konten naik 25%!',
    ],
  },
  {
    id: 'pio', name: 'Pak Pos Pio', role: 'Kontak',
    x: 14, y: 16, counts: true,
    look: { skin: '#e0ac69', hair: '#2b2b2b', shirt: '#e4572e', pants: '#33415c', hat: 'cap' },
    pages: [
      'Ada surat untukmu! Aku Pak Pos Pio. Kalau kau ingin menghubungi Rama, catat baik-baik alamatku... eh, alamatnya:',
      '📧 Email: nramahadi1@gmail.com\n💼 LinkedIn: linkedin.com/in/rama-hadi-nugraha\n🐙 GitHub: github.com/Ram4UnMi',
      'Rama sedang terbuka untuk peluang kerja UI/UX, Mobile Development (Flutter), dan Desain Visual. Kirimkan kabar baik, ya — akan kusampaikan secepat kilat!',
    ],
  },
  {
    id: 'tirta', name: 'Kakek Tirta', role: 'Mini Game: Mancing',
    x: 7, y: 15, counts: false, action: 'fishing',
    look: { skin: '#e8b98a', hair: '#d9d9d9', shirt: '#3e7cb1', pants: '#4a3b28', hat: 'straw' },
    pages: [
      'Hoho... duduklah sebentar, Nak. Kolam ini ikannya banyak, tapi hanya pemancing sabar yang bisa menangkap Ikan Koi Emas.',
      'Caranya gampang: lempar kail, tunggu sampai ada tanda "!" — lalu TARIK secepatnya! Mau coba? (Setelah dialog ini, kolam pancing akan terbuka)',
    ],
  },
  {
    id: 'garda', name: 'Sersan Garda', role: 'Mini Game: Tower Defense',
    x: 21, y: 6, counts: false, action: 'td',
    look: { skin: '#c68850', hair: '#101010', shirt: '#8f2f2f', pants: '#3a3a3a', hat: 'helmet' },
    pages: [
      'BERHENTI! ...Oh, kau pengunjung desa. Maaf, aku Sersan Garda. Monster slime akhir-akhir ini sering menyerbu desa kami dari hutan timur.',
      'Bantu aku mempertahankan desa! Bangun menara Panah dan Meriam di arena, tahan gelombang slime sejauh yang kau bisa. Siap? (Setelah dialog ini, arena akan terbuka)',
    ],
  },
];

// Papan informasi (interaktif)
const SIGNS = [
  {
    id: 'welcome', x: 13, y: 18, name: 'Papan Selamat Datang',
    pages: [
      '🌻 SELAMAT DATANG DI DESA PORTOFOLIO 🌻\nDesa digital milik Rama Hadi Nugraha.',
      'Cara bermain: berjalanlah dengan WASD / tombol panah (di HP pakai D-pad), lalu tekan E atau tombol BICARA saat berdekatan dengan warga untuk mengobrol.',
      'Ada 8 warga yang menyimpan cerita portofolio Rama, 1 kolam pancing, dan 1 arena tower defense. Selamat menjelajah!',
    ],
  },
  {
    id: 'board1', x: 9, y: 11, name: 'Papan Galeri — Desain Visual',
    pages: [
      '🎨 DESAIN VISUAL — Laznas PYI (Feb–Mar 2026)',
      'Sebagai Visual Designer, Rama membuat konten untuk 8 akun Instagram sekaligus. Komposisi insight kontennya terbagi 65% / 22% / 12%, dan tiap akun tumbuh rata-rata +20 pengikut per bulan.',
      'Keahlian desainnya ditopang sertifikasi BNSP Desain Grafis Muda. Alat tempurnya: Photoshop, Illustrator, Figma, Premiere Pro, After Effects, Lightroom.',
    ],
  },
  {
    id: 'board2', x: 12, y: 11, name: 'Papan Galeri — Teknologi Baru',
    pages: [
      '🧪 TEKNOLOGI & RISET',
      'Rama gemar bereksperimen: Web3 & smart contract Solidity, AR dengan Vuforia, deteksi objek YOLOv8, sampai data pipeline Hadoop, OLAP Mondrian, dan Spoon ETL.',
      'Di bidang riset ia memakai PCA, UMAP, Isolation Forest, Association Rule Mining, serta pemodelan statistik LMM dan GEE.',
    ],
  },
  {
    id: 'board3', x: 15, y: 11, name: 'Papan Galeri — Pendidikan',
    pages: [
      '🎓 PENDIDIKAN',
      'S1 Teknik Informatika — Universitas Komputer Indonesia (UNIKOM), 2022–2026. IPK 3,80.',
      'Sertifikasi: BNSP Data Analis (LSP Informatika) dan BNSP Desain Grafis Muda (LKP DITEKINDO & DISPORA Jawa Barat).',
    ],
  },
];
