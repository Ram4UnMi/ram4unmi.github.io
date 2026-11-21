/* ============================================================
   Bahasa untuk halaman pendamping (portofolio.html, fishing.html, td.html).
   Membaca elemen [data-i18n] dan kamus window.PAGE_I18N di halaman itu.
   Bahasa tersimpan bersama progres desa (DesaSave.lang), default: English.
   ============================================================ */
(function () {
  'use strict';
  function lang() {
    try { return (window.DesaSave ? DesaSave.load().lang : null) || 'en'; }
    catch (e) { return 'en'; }
  }
  function apply() {
    var l = lang(), D = window.PAGE_I18N || {};
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = D[el.getAttribute('data-i18n')];
      if (v) el.innerHTML = v[l] || v.en;
    });
    var b = document.getElementById('pf-lang');
    if (b) b.textContent = l === 'en' ? '🌐 EN' : '🌐 ID';
    document.documentElement.lang = l;
  }
  var b = document.getElementById('pf-lang');
  if (b) {
    b.addEventListener('click', function () {
      var l = lang() === 'en' ? 'id' : 'en';
      if (window.DesaSave) {
        var d = DesaSave.load();
        d.lang = l;
        DesaSave.save(d);
      }
      apply();
      // Halaman dengan teks dinamis (mini game) memuat ulang agar semua teks ikut berganti
      if (window.PAGE_DYNAMIC_LANG) location.reload();
    });
  }
  apply();
})();
