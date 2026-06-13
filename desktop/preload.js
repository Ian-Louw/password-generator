'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// Expose a minimal, explicit API to the renderer. The renderer never touches
// Node, the filesystem, or Electron internals directly — every privileged
// action goes through one of these audited channels.
contextBridge.exposeInMainWorld('ultrapass', {
  generatePassword: (opts) => ipcRenderer.invoke('generate-password', opts),
  generatePassphrase: (opts) => ipcRenderer.invoke('generate-passphrase', opts),
  generatePin: (len) => ipcRenderer.invoke('generate-pin', len),
  generateBulk: (count, opts) => ipcRenderer.invoke('generate-bulk', count, opts),

  evaluateStrength: (pw) => ipcRenderer.invoke('evaluate-strength', pw),
  passphraseEntropy: (n) => ipcRenderer.invoke('passphrase-entropy', n),

  bcryptHash: (pw, rounds) => ipcRenderer.invoke('bcrypt-hash', pw, rounds),
  bcryptVerify: (pw, hash) => ipcRenderer.invoke('bcrypt-verify', pw, hash),
  digests: (pw) => ipcRenderer.invoke('digests', pw),

  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (s) => ipcRenderer.invoke('save-settings', s),

  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  exportPasswords: (content, name) => ipcRenderer.invoke('export-passwords', content, name),
});
