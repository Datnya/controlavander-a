// updater.js — Actualizacion remota (OTA) del bundle web en la version movil.
//
// Al abrir la app consulta el manifiesto publicado en GitHub Releases y, si hay
// una version mas reciente, descarga el nuevo bundle web y lo aplica, SIN
// reinstalar la app. Muestra avisos en pantalla (toasts) para que el proceso
// sea visible, e incluye rollback automatico del plugin si el bundle nuevo
// fallara al arrancar. window.__checkForUpdate(true) permite forzar la
// comprobacion desde Configuracion.
(function () {
  var MANIFEST_URL = 'https://github.com/Datnya/controlavander-a/releases/latest/download/mobile-update.json';

  function currentVersion() {
    return (typeof window.__APP_BUNDLE_VERSION__ === 'string') ? window.__APP_BUNDLE_VERSION__ : 'dev';
  }

  function notify(type, title, msg) {
    try { if (window.toast && typeof window.toast[type] === 'function') window.toast[type](title, msg); } catch (e) {}
    try { console.log('[OTA]', type, title, msg || ''); } catch (e) {}
  }

  async function checkForUpdate(manual) {
    if (!window.Capacitor || typeof window.Capacitor.isNativePlatform !== 'function' || !window.Capacitor.isNativePlatform()) {
      if (manual) notify('info', 'Actualizaciones', 'Solo disponible en la app instalada.');
      return;
    }
    var Updater = window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorUpdater;
    if (!Updater) {
      if (manual) notify('error', 'Actualizaciones', 'El motor de actualizacion no esta disponible en esta instalacion. Reinstala el APK mas reciente.');
      return;
    }

    // Confirma que el bundle actual arranco bien (cancela el rollback automatico).
    try { await Updater.notifyAppReady(); } catch (e) {}

    var manifest;
    try {
      var res = await fetch(MANIFEST_URL + '?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) { if (manual) notify('error', 'Actualizaciones', 'No se pudo consultar el servidor (HTTP ' + res.status + ').'); return; }
      manifest = await res.json();
    } catch (e) {
      if (manual) notify('error', 'Actualizaciones', 'Sin conexion para buscar actualizaciones.');
      return;
    }

    if (!manifest || !manifest.version || !manifest.url) {
      if (manual) notify('error', 'Actualizaciones', 'Respuesta del servidor invalida.');
      return;
    }
    if (manifest.version === currentVersion()) {
      if (manual) notify('success', 'Todo al dia', 'Ya tienes la ultima version (' + currentVersion() + ').');
      return;
    }

    notify('info', 'Actualizando app', 'Descargando mejoras (v' + manifest.version + ')...');
    try {
      var bundle = await Updater.download({ url: manifest.url, version: manifest.version });
      await Updater.set({ id: bundle.id });
      notify('success', 'Actualizacion lista', 'Aplicando la nueva version...');
      setTimeout(function () {
        try { Updater.reload(); } catch (e) { try { window.location.reload(); } catch (e2) {} }
      }, 1400);
    } catch (e) {
      notify('error', 'No se pudo actualizar', (e && e.message) ? e.message : String(e));
    }
  }

  // Disponible para un boton manual en Configuracion.
  window.__checkForUpdate = checkForUpdate;
  window.__bundleVersion = currentVersion;

  function run() { checkForUpdate(false); }
  // Pequeño retraso para que toast y la UI esten listos.
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(run, 1500);
  } else {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(run, 1500); });
  }
})();
