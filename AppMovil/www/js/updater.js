// updater.js — Actualizacion remota (OTA) del bundle web en la version movil.
//
// Permite corregir errores y publicar mejoras SIN reinstalar la app y SIN
// cambiar la licencia: al abrir la app, consulta el manifiesto publicado en los
// GitHub Releases y, si hay una version mas reciente, descarga el nuevo bundle
// web y lo aplica. El plugin @capgo/capacitor-updater incluye rollback: si el
// bundle nuevo no confirma estar OK al arrancar (notifyAppReady), vuelve solo
// al anterior, de modo que una actualizacion defectuosa no deja la app inservible.
(function () {
  // URL estable: /releases/latest/download/<asset> siempre apunta al ultimo Release.
  var MANIFEST_URL = 'https://github.com/Datnya/controlavander-a/releases/latest/download/mobile-update.json';

  function currentVersion() {
    return (typeof window.__APP_BUNDLE_VERSION__ === 'string') ? window.__APP_BUNDLE_VERSION__ : 'dev';
  }

  async function run() {
    // Solo corre en el dispositivo nativo y si el plugin esta presente.
    if (!window.Capacitor || typeof window.Capacitor.isNativePlatform !== 'function' || !window.Capacitor.isNativePlatform()) return;
    var Updater = window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorUpdater;
    if (!Updater) return;

    // Confirma que el bundle actual arranco bien (cancela el rollback automatico).
    try { await Updater.notifyAppReady(); } catch (e) { /* noop */ }

    try {
      var res = await fetch(MANIFEST_URL + '?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;
      var manifest = await res.json(); // { version, url }
      if (!manifest || !manifest.version || !manifest.url) return;
      if (manifest.version === currentVersion()) return; // ya esta al dia

      console.log('[OTA] Nueva version disponible:', manifest.version, '(actual:', currentVersion() + ')');
      var bundle = await Updater.download({ url: manifest.url, version: manifest.version });
      // Aplica el nuevo bundle: el webview se recarga en la version nueva.
      await Updater.set(bundle);
    } catch (e) {
      console.warn('[OTA] No se pudo actualizar:', (e && e.message) ? e.message : e);
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(run, 0);
  } else {
    document.addEventListener('DOMContentLoaded', run);
  }
})();
