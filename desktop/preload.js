'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// Expose a minimal, explicit API to the renderer. The renderer never touches
// Node, the filesystem, or Electron internals directly — every privileged
// action goes through one of these audited channels.
contextBridge.exposeInMainWorld('ultrapass', {
  generatePassword: (opts) => ipcRenderer.invoke('generate-password', opts),
  generatePronounceable: (opts) => ipcRenderer.invoke('generate-pronounceable', opts),
  generatePassphrase: (opts) => ipcRenderer.invoke('generate-passphrase', opts),
  generatePin: (len) => ipcRenderer.invoke('generate-pin', len),
  generateBulk: (count, opts) => ipcRenderer.invoke('generate-bulk', count, opts),

  evaluateStrength: (pw) => ipcRenderer.invoke('evaluate-strength', pw),
  passphraseEntropy: (n) => ipcRenderer.invoke('passphrase-entropy', n),

  bcryptHash: (pw, rounds) => ipcRenderer.invoke('bcrypt-hash', pw, rounds),
  bcryptVerify: (pw, hash) => ipcRenderer.invoke('bcrypt-verify', pw, hash),
  scryptHash: (pw) => ipcRenderer.invoke('scrypt-hash', pw),
  pbkdf2Hash: (pw) => ipcRenderer.invoke('pbkdf2-hash', pw),
  digests: (pw) => ipcRenderer.invoke('digests', pw),
  qrCode: (text) => ipcRenderer.invoke('qr-code', text),

  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (s) => ipcRenderer.invoke('save-settings', s),

  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  exportPasswords: (content, name) => ipcRenderer.invoke('export-passwords', content, name),
});
