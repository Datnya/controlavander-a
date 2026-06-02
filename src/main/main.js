const { app, BrowserWindow } = require('electron');
const path = require('path');

// Auto-actualizador de GitHub
require('update-electron-app')();

// Manejar eventos de Squirrel (instalador Windows)
if (require('electron-squirrel-startup')) app.quit();

const { initDatabase } = require('./database');
const { isLicenseValid } = require('./license');
const { registerIpcHandlers } = require('./ipc-handlers');

let mainWindow = null;

/**
 * Crea la ventana principal de la aplicación.
 * @param {string} page - Página HTML a cargar
 */
function createWindow(page) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: 'Control de Lavandería',
    icon: path.join(__dirname, '../../assets/icon.png'),
    frame: false,
    backgroundColor: '#f8fafc',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', page));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Cambia la vista de la ventana principal.
 * @param {string} page - Nueva página HTML
 */
function loadPage(page) {
  if (mainWindow) {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', page));
  }
}

// Evitar múltiples instancias
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(async () => {
  // 1. Inicializar base de datos
  initDatabase();

  // 2. Registrar handlers IPC
  registerIpcHandlers();

  // 3. Verificar estado de licencia
  const licenseStatus = await isLicenseValid();

  if (!licenseStatus.valid) {
    if (licenseStatus.reason === 'no-license') {
      // Primera vez — mostrar pantalla de activación
      createWindow('activation.html');
    } else {
      // Licencia suspendida/bloqueada
      createWindow('blocked.html');
    }
  } else {
    // Licencia válida — mostrar app principal
    createWindow('index.html');
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

// Exponer función para cambiar de página desde los IPC handlers
const { ipcMain } = require('electron');

ipcMain.handle('app:loadPage', async (_, page) => {
  loadPage(page);
});

ipcMain.handle('app:relaunch', async () => {
  app.relaunch();
  app.exit(0);
});
