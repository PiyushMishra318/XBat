import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { ControllerManager } from './lib/controller.js';
import { SessionTracker } from './lib/session.js';
import { Storage } from './lib/storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let tray = null;
let controllerManager = null;
let sessionTracker = null;
let storage = null;
let pollInterval = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 560,
    minWidth: 300,
    minHeight: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'src', 'assets', 'icon.png'),
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Close to Tray
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
    return false;
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'src', 'assets', 'icon.png');
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  const updateTrayMenu = () => {
    const { openAtLogin } = app.getLoginItemSettings();
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show/Hide Widget',
        click: () => {
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      {
        label: 'Start with Windows',
        type: 'checkbox',
        checked: openAtLogin,
        click: () => {
          const settings = app.getLoginItemSettings();
          app.setLoginItemSettings({
            openAtLogin: !settings.openAtLogin,
            path: app.getPath('exe'),
          });
          updateTrayMenu();
        },
      },
      { type: 'separator' },
      {
        label: 'Quit XBat',
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);
    tray.setContextMenu(contextMenu);
  };

  tray = new Tray(trayIcon);
  tray.setToolTip('XBat — Xbox Battery Tracker');
  updateTrayMenu();

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

async function startPolling() {
  storage = new Storage(app.getPath('userData'));
  controllerManager = new ControllerManager();
  sessionTracker = new SessionTracker(storage);

  const poll = async () => {
    try {
      const data = await controllerManager.pollAll();
      sessionTracker.update(data);

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('controller-update', {
          controllers: data,
          sessions: sessionTracker.getActiveSessions(),
          history: storage.getHistory(),
          stats: storage.getStats(),
          labels: storage.getLabels(),
        });
      }
    } catch (err) {
      console.error('[XBat] Poll error:', err.message);
    }
  };

  await poll();
  pollInterval = setInterval(poll, 5000);
}

// IPC Handlers
ipcMain.handle('get-data', async () => {
  if (!controllerManager) return null;
  return {
    controllers: await controllerManager.pollAll(),
    sessions: sessionTracker.getActiveSessions(),
    history: storage.getHistory(),
    stats: storage.getStats(),
    labels: storage.getLabels(),
  };
});

ipcMain.handle('set-label', (event, index, label) => storage?.setLabel(index, label));
ipcMain.handle('minimize-window', () => mainWindow?.hide());
ipcMain.handle('close-window', () => {
  // Instead of quitting, just hide by default as it's a "service"
  mainWindow?.hide();
});

// App lifecycle
app.isQuitting = false;

app.whenReady().then(async () => {
  createWindow();
  createTray();
  await startPolling();
  
  // Default auto-start to TRUE for the user's convenience as requested
  if (!app.getLoginItemSettings().wasOpenedAtLogin) {
    app.setLoginItemSettings({ openAtLogin: true });
  }
});

app.on('before-quit', () => {
  if (pollInterval) clearInterval(pollInterval);
  if (sessionTracker) sessionTracker.endAll();
});
