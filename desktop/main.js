'use strict';

const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  shell,
  dialog,
  nativeTheme,
  clipboard,
  session,
} = require('electron');
const path = require('path');
const fs = require('fs');

const core = require('@ultrapass/core');
const generator = core; // generatePassword, generatePronounceable, generatePin, generateBulk
const passphrase = core; // generatePassphrase, passphraseEntropy
const strength = core; // evaluateStrength
const hasher = require('./src/core/hasher');
const qr = require('./src/core/qr');

const isDev = process.argv.includes('--dev');
const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');

const DEFAULT_SETTINGS = {
  theme: 'system', // 'light' | 'dark' | 'system'
  clipboardClearSeconds: 20, // 0 disables auto-clear
  hideOnBlur: false, // clear displayed secrets when the window loses focus
  clearClipboardOnQuit: true, // wipe a copied secret when the app exits
  password: {
    length: 20,
    uppercase: true,
    lowercase: true,
    digits: true,
    symbols: true,
    excludeAmbiguous: false,
    excludeChars: '',
    requireEach: true,
  },
  passphrase: {
    words: 5,
    separator: '-',
    capitalize: true,
    includeNumber: true,
    includeSymbol: false,
  },
};

let mainWindow = null;
let clipboardTimer = null;
// Remember the last secret we placed on the clipboard so we can wipe it on quit
// (only if it is still there — we never clobber something the user copied later).
let lastCopiedSecret = null;

// ── Settings persistence ──────────────────────────────────────────────────────

function loadSettings() {
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8');
    return deepMerge(structuredClone(DEFAULT_SETTINGS), JSON.parse(raw));
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

function saveSettings(settings) {
  const merged = deepMerge(loadSettings(), settings || {});
  try {
    fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(merged, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
  applyTheme(merged.theme);
  return merged;
}

function deepMerge(target, source) {
  for (const key of Object.keys(source || {})) {
    const sv = source[key];
    if (sv && typeof sv === 'object' && !Array.isArray(sv)) {
      target[key] = deepMerge(target[key] || {}, sv);
    } else if (sv !== undefined) {
      target[key] = sv;
    }
  }
  return target;
}

function applyTheme(theme) {
  if (['light', 'dark', 'system'].includes(theme)) {
    nativeTheme.themeSource = theme;
  }
}

// ── Window ────────────────────────────────────────────────────────────────────

function createWindow() {
  const settings = loadSettings();
  applyTheme(settings.theme);

  mainWindow = new BrowserWindow({
    width: 980,
    height: 760,
    minWidth: 720,
    minHeight: 560,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#15171c' : '#f5f7fa',
    title: 'UltraPass',
    icon: path.join(__dirname, 'build', 'icon.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      sandbox: true,
      webviewTag: false, // we never embed <webview>; disabling shrinks attack surface
      spellcheck: false,
      enableBlinkFeatures: '',
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => mainWindow.show());
  if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });

  // Open external links in the user's browser, never inside the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault();
      if (url.startsWith('https://')) shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── Application menu ────────────────────────────────────────────────────────────

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac
      ? [{
          label: app.name,
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' },
          ],
        }]
      : []),
    {
      label: 'File',
      submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(isDev ? [{ role: 'toggleDevTools' }] : []),
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Project on GitHub',
          click: () => shell.openExternal('https://github.com/ian-louw/password-generator'),
        },
        {
          label: 'Report an Issue',
          click: () => shell.openExternal('https://github.com/ian-louw/password-generator/issues'),
        },
        { type: 'separator' },
        {
          label: 'About UltraPass',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About UltraPass',
              message: `UltraPass ${app.getVersion()}`,
              detail:
                'A fast, private, offline desktop tool for generating secure ' +
                'passwords, passphrases and PINs, analysing strength, and ' +
                'producing bcrypt/SHA hashes.\n\nMIT Licensed • © 2026 Ian Louw',
              buttons: ['OK'],
            });
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── IPC handlers ────────────────────────────────────────────────────────────────

function registerIpc() {
  ipcMain.handle('generate-password', (_e, opts) => generator.generatePassword(opts));
  ipcMain.handle('generate-pronounceable', (_e, opts) => generator.generatePronounceable(opts));
  ipcMain.handle('generate-passphrase', (_e, opts) => passphrase.generatePassphrase(opts));
  ipcMain.handle('generate-pin', (_e, len) => generator.generatePin(len));
  ipcMain.handle('generate-bulk', (_e, count, opts) => generator.generateBulk(count, opts));
  ipcMain.handle('evaluate-strength', (_e, pw) => strength.evaluateStrength(pw));
  ipcMain.handle('passphrase-entropy', (_e, n) => passphrase.passphraseEntropy(n));

  ipcMain.handle('bcrypt-hash', (_e, pw, rounds) => hasher.bcryptHash(pw, rounds));
  ipcMain.handle('bcrypt-verify', (_e, pw, hash) => hasher.bcryptVerify(pw, hash));
  ipcMain.handle('scrypt-hash', (_e, pw) => hasher.scryptHash(pw));
  ipcMain.handle('pbkdf2-hash', (_e, pw) => hasher.pbkdf2Hash(pw));
  ipcMain.handle('digests', (_e, pw) => hasher.allDigests(pw));
  ipcMain.handle('qr-code', (_e, text) => qr.toDataURL(text, nativeTheme.shouldUseDarkColors));

  ipcMain.handle('get-settings', () => loadSettings());
  ipcMain.handle('save-settings', (_e, s) => saveSettings(s));

  // Clipboard with optional auto-clear for sensitive data.
  ipcMain.handle('copy-to-clipboard', (_e, text) => {
    const value = String(text ?? '');
    clipboard.writeText(value);
    lastCopiedSecret = value;
    if (clipboardTimer) clearTimeout(clipboardTimer);
    const { clipboardClearSeconds } = loadSettings();
    if (clipboardClearSeconds > 0) {
      clipboardTimer = setTimeout(() => {
        // Only clear if the clipboard still holds what we wrote.
        if (clipboard.readText() === value) clipboard.clear();
        if (lastCopiedSecret === value) lastCopiedSecret = null;
        clipboardTimer = null;
      }, clipboardClearSeconds * 1000);
    }
    return { ok: true, clearSeconds: clipboardClearSeconds };
  });

  ipcMain.handle('export-passwords', async (_e, content, suggestedName) => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export passwords',
      defaultPath: suggestedName || 'passwords.txt',
      filters: [
        { name: 'Text', extensions: ['txt'] },
        { name: 'CSV', extensions: ['csv'] },
      ],
    });
    if (canceled || !filePath) return { ok: false };
    fs.writeFileSync(filePath, content, 'utf-8');
    return { ok: true, filePath };
  });
}

// ── Security hardening ──────────────────────────────────────────────────────────

function hardenSession() {
  const ses = session.defaultSession;

  // This is an offline app: deny every permission request (camera, mic,
  // geolocation, notifications, clipboard-read, etc.) outright.
  ses.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  ses.setPermissionCheckHandler(() => false);

  // Block any attempt to load remote resources. Only local app files load.
  ses.webRequest.onBeforeRequest((details, callback) => {
    const allowed =
      details.url.startsWith('file://') ||
      details.url.startsWith('devtools://') ||
      details.url.startsWith('chrome-extension://') ||
      details.url.startsWith('data:');
    callback({ cancel: !allowed });
  });
}

// Refuse to attach the preload to, or allow navigation in, any unexpected
// web contents (defence in depth on top of the per-window handlers).
app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  contents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) event.preventDefault();
  });
  contents.on('will-attach-webview', (event) => event.preventDefault());
});

function wipeClipboardIfSecret() {
  if (lastCopiedSecret && clipboard.readText() === lastCopiedSecret) {
    clipboard.clear();
  }
  lastCopiedSecret = null;
}

// ── App lifecycle ────────────────────────────────────────────────────────────────

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    hardenSession();
    registerIpc();
    buildMenu();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('before-quit', () => {
    if (loadSettings().clearClipboardOnQuit) wipeClipboardIfSecret();
  });
}
