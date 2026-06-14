# Security Policy

## Design principles

UltraPass is built to be trustworthy by construction:

- **Fully offline.** The desktop app makes no network requests. There is no
  telemetry, no analytics, no accounts, and no "phone home". A strict
  Content-Security-Policy in the renderer *and* a main-process request filter
  block all remote content; every permission request (camera, mic, geolocation,
  clipboard-read, …) is denied outright.
- **CSPRNG only.** All randomness comes from the operating system's
  cryptographically secure generator via Node's `crypto.randomInt` /
  `crypto.randomBytes`. We never use `Math.random()`.
- **Unbiased selection.** Character and word selection use rejection-sampled
  integers and a cryptographic Fisher–Yates shuffle to avoid modulo bias.
- **Process isolation.** The renderer runs with `contextIsolation: true`,
  `nodeIntegration: false`, `sandbox: true`, and `webviewTag: false`. It cannot
  touch Node, the filesystem, or Electron internals directly — every privileged
  action goes through a small, explicit `preload.js` bridge. New windows and all
  navigation are blocked at the `web-contents-created` level.
- **No plaintext persistence.** Generated secrets are never written to disk by
  the app. Session history lives in memory only and is masked by default. Only
  your non-secret preferences are saved locally. The clipboard can be configured
  to auto-clear after a chosen delay, and to be wiped when the app quits.
- **Display hygiene.** Outputs can be masked on demand, hidden when the window
  loses focus, and cleared with `Esc`.

## Reporting a vulnerability

If you discover a security issue, please **do not** open a public GitHub issue.
Instead, email **ian@ianlouw.com** with details and steps to reproduce. You can
expect an initial response within a few days.

## Supported versions

The latest released version receives security fixes.
