/* ============================================================
   PENYIMPANAN PROGRES DESA PORTOFOLIO (localStorage)
   Dipakai bersama oleh halaman desa, mancing, dan tower defense
   agar progres pemain tersimpan walau pindah halaman.
   ============================================================ */
(function () {
  'use strict';
  var KEY = 'desaPortofolioSaveV1';
  var defaults = { talked: [], fish: 0, collection: {}, fishScore: 0, tdBest: 0, coins: 0, seenTutorial: false, seenStory: false, house: [], music: true };

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return Object.assign({}, defaults);
      var data = JSON.parse(raw);
      return Object.assign({}, defaults, data);
    } catch (e) {
      return Object.assign({}, defaults);
    }
  }

  function save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* abaikan */ }
  }

  window.DesaSave = { load: load, save: save, defaults: defaults };
})();
