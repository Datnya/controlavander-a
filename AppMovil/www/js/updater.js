// updater.js — Actualizacion remota (OTA) del bundle web en la version movil.
//
// Al abrir la app consulta el manifiesto publicado en GitHub Releases y, si hay
// una version mas reciente, descarga el nuevo bundle web y lo aplica, SIN
// reinstalar la app. Muestra avisos en pantalla (toasts) para que el proceso
// sea visible, e incluye rollback automatico del plugin si el bundle nuevo
// fallara al arrancar. window.__checkForUpdate(true) permite forzar la
// comprobacion desde Configuracion.
(function () {
  // Se consulta la API de GitHub (permite CORS: Access-Control-Allow-Origin: *).
  // El link directo del release NO manda CORS tras su redirect, por eso el fetch
  // se bloqueaba en silencio. La API da la version (tag) y la URL del bundle.
  var RELEASE_API = 'https://api.github.com/repos/Datnya/controlavander-a/releases/latest';

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

    var release;
    try {
      var res = await fetch(RELEASE_API + '?t=' + Date.now(), {
        cache: 'no-store',
        headers: { 'Accept': 'application/vnd.github+json' }
      });
      if (!res.ok) { if (manual) notify('error', 'Actualizaciones', 'No se pudo consultar el servidor (HTTP ' + res.status + ').'); return; }
      release = await res.json();
    } catch (e) {
      if (manual) notify('error', 'Actualizaciones', 'Sin conexion para buscar actualizaciones.');
      return;
    }

    // tag tipo "movil-v1.0.17" -> "1.0.17"; bundle.zip desde los assets.
    var newVersion = (release && release.tag_name) ? String(release.tag_name).replace(/^movil-v/i, '').replace(/^v/i, '') : '';
    var assets = (release && release.assets) || [];
    var bundleAsset = assets.filter(function (a) { return a && a.name === 'bundle.zip'; })[0];
    var bundleUrl = bundleAsset ? bundleAsset.browser_download_url : '';

    if (!newVersion || !bundleUrl) {
      if (manual) notify('error', 'Actualizaciones', 'No se encontro el paquete de actualizacion.');
      return;
    }
    if (newVersion === currentVersion()) {
      if (manual) notify('success', 'Todo al dia', 'Ya tienes la ultima version (' + currentVersion() + ').');
      return;
    }

    notify('info', 'Actualizando app', 'Descargando mejoras (v' + newVersion + ')...');
    try {
      var bundle = await Updater.download({ url: bundleUrl, version: newVersion });
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
