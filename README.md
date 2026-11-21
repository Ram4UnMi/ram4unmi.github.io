# Desa Portofolio — Portofolio Interaktif Rama Hadi Nugraha

Website portofolio berbentuk **game petualangan pixel 2D ala Stardew Valley** — fullscreen tanpa tepi halaman: layar penuh berisi desa, navbar kaca berisi koin & progres, popup tutorial, dan tombol pintas ke setiap bagian portofolio. Pengunjung berperan sebagai karakter utama (MC) yang datang ke **Desa Portofolio**, mengobrol dengan warga (NPC) yang masing-masing menampilkan bagian portofolio — tentang saya, proyek, keahlian, pengalaman, kontak — plus 2 mini game di halaman terpisah: **mancing** 🎣 dan **tower defense** 🏰.

> **100% offline & tanpa library eksternal.** Semua sprite, tile, dan animasi digambar prosedural oleh kode JavaScript murni (Canvas 2D) — tidak ada CDN, tidak ada modul ES, jadi **langsung jalan dibuka sebagai file biasa** (`file://`) tanpa server, tanpa internet. (Versi 3D sebelumnya gagal di `file://` karena browser memblokir modul ES via CORS — versi ini menghilangkan masalah itu sepenuhnya.)

## Fitur

- **Dua bahasa (English utama / Bahasa Indonesia)** 🌐: seluruh situs — navbar, popup, dialog warga, toko, panel info, halaman teks, dan kedua mini game — tersedia dalam Bahasa Inggris (default) dan Bahasa Indonesia. Ganti bahasa lewat tombol **🌐 di navbar** atau tombol **English / Indonesia di popup pertama**; pilihan tersimpan dan berlaku di semua halaman. Papan nama rumah pun ikut berganti (VILLAGE HALL, BLACKSMITH, GUEST HOUSE, dst.).
- **Rumah 4 gaya arsitektur dunia**: setiap bangunan kini bergaya khas — **Medieval Eropa** (Balai Desa & Kantor Pos: batu + rangka kayu, atap curam, panji), **Timur Tengah** (Pandai Besi: batu pasir, kubah tembaga, pintu lengkung, kanopi bergaris), **Asia Timur** (Arena & Penginapan: atap melengkung berujung terangkat, pilar merah, lentera kertas), dan **Asia Tenggara** (Galeri & Rumah Tamu: rumah panggung kayu, atap jerami tinggi, gabel ukiran, tangga depan).
- **Rumah Tamu & Toko Dekorasi** 🛒: ada rumah khusus untukmu di tenggara desa (rumah panggung Asia Tenggara). Kumpulkan koin lalu belanja 6 perabotan untuk mempercantiknya: Cat Rumah Baru (40🪙), Atap Terakota Premium (60🪙), Taman Bunga (30🪙), Lentera Teras (25🪙), Pagar Kayu (35🪙), dan Air Mancur Mini beranimasi (80🪙). Semua perubahan langsung terlihat di desa dan tersimpan permanen. Buka toko lewat tombol 🛒 di navbar atau dengan menekan E di depan Rumah Tamu.
- **Grafis pixel-art kaya bernuansa desa tua** (mengikuti referensi Graveyard Keeper): palet olive-cokelat yang hangat, rumput bertekstur bercak tanah & daun gugur beterbangan, jalan tanah berbatu, pohon hijau tua + oranye musim gugur + pohon mati, batu & tunggul pohon, cerobong berasap; karakter bersprite detail (grid 32×48: wajah bermata berbinar, blush, rambut berponi, baju berkerah & gesper) 4 arah dengan animasi jalan; air kolam beranimasi; cahaya lentera hangat di depan rumah; bayangan awan melayang; vignette sinematik.
- **Musik latar orisinal** 🎵: melodi lembut mengalir bergaya musik desa (terinspirasi nuansa karya Evan Call) yang **digenerate langsung oleh WebAudio** — tanpa file audio, tetap offline. Mulai berbunyi setelah interaksi pertama (aturan autoplay browser); bisa dimatikan/dinyalakan lewat tombol 🎵 di navbar dan pilihanmu tersimpan. (Lagu asli Evan Call berhak cipta sehingga tidak bisa dipasang sebagai file.)
- **Dialog di tengah layar untuk HP portrait**: di layar tegak (handphone), kotak percakapan warga tampil di tengah layar agar nyaman dibaca; di layar landscape/desktop tetap di bawah seperti game RPG klasik.
- **Kamera mengikuti player** mengelilingi desa 26×19 tile yang lebih besar dari layar.
- **Navbar HUD**: saldo 🪙 koin desa, progres warga (0/8), ikan tertangkap, rekor wave — plus tombol **Proyek / Tentang / Keahlian / Pengalaman / Kontak** yang membuka panel info dan bisa **teleport** langsung ke warga yang bersangkutan.
- **Popup tutorial** selalu tampil saat halaman dibuka/di-refresh (bisa dibuka lagi lewat tombol ❓) — lengkap dengan pilihan bahasa di bagian atasnya. Tidak ada lagi cerita pembuka: pengunjung langsung melihat isi portofolio.
- **Sistem koin**: +15 🪙 setiap pertama kali mengobrol dengan warga; poin mancing dan bonus wave tower defense juga menjadi koin.
- **Progres tersimpan** di localStorage (warga, koin, ikan, rekor) — dipakai bersama oleh semua halaman.
- Halaman terpisah: `portofolio.html` (versi teks modern untuk rekruter), `fishing.html`, `td.html`.

## Cara Membuka (lokal)

1. Ekstrak ZIP ini.
2. Buka `index.html` — cukup **klik dua kali**, tidak perlu server, tidak perlu internet.
3. Baca popup tutorial, lalu tekan **MULAI BERMAIN**.

## Cara Online (GitHub Pages) — gratis

1. Buat repository GitHub baru bernama `Ram4UnMi.github.io`.
2. Upload semua file/folder ini ke repository tersebut.
3. **Settings → Pages** → sumber branch `main` / root. Tunggu ±1 menit.
4. Situs online di **https://Ram4UnMi.github.io** — cantumkan di CV & LinkedIn.

Alternatif: Netlify Drop (drag & drop folder ke app.netlify.com/drop) atau Vercel.

## Cara Bermain

| Aksi | Desktop | HP / Tablet |
|---|---|---|
| Bergerak | WASD / tombol panah | D-pad di layar |
| Bicara / lanjut dialog | E / Spasi | Tombol **BICARA** / tap kotak dialog |
| Pintas portofolio | Klik tombol di navbar → baca panel → **Kunjungi di Desa** untuk teleport | Sama |
| Mancing | Bicara dengan Kakek Tirta di kolam, atau tombol 🎣 di navbar | Sama |
| Tower Defense | Bicara dengan Sersan Garda di arena, atau tombol 🏰 di navbar | Sama |

Misi utama: ajak bicara **8 warga** bertanda "!" untuk membuka seluruh isi portofolio dan mengumpulkan koin.

## Mengubah Isi Portofolio

- Teks dialog & data desa: **`js/data.js`**.
- Panel info navbar (Proyek/Tentang/dll.): objek `INFO` di **`js/game2d.js`**.
- Konten versi teks: **`portofolio.html`**.

Struktur file:

```
portofolio-game/
├── index.html        # Desa pixel fullscreen + navbar + tutorial
├── portofolio.html   # Versi teks modern (untuk rekruter)
├── fishing.html      # Halaman mini game mancing
├── td.html           # Halaman mini game tower defense
├── css/style.css     # Gaya semua halaman
├── js/storage.js     # Simpan progres & koin (localStorage)
├── js/data.js        # Konten desa: NPC, dialog, bangunan
├── js/game2d.js      # Engine desa pixel 2D (Canvas, tanpa library)
├── js/fishing.js     # Mini game mancing
├── js/td.js          # Mini game tower defense
└── README.md
```
