# Security Policy

## Design principles

UltraPass is built to be trustworthy by construction:

- **Fully offline.** The desktop app makes no network requests. There is no
  telemetry, no analytics, no accounts, and no "phone home". A strict
  Content-Security-Policy in the renderer blocks any remote content.
- **CSPRNG only.** All randomness comes from the operating system's
  cryptographically secure generator via Node's `crypto.randomInt` /
  `crypto.randomBytes`. We never use `Math.random()`.
- **Unbiased selection.** Character and word selection use rejection-sampled
  integers and a cryptographic Fisher–Yates shuffle to avoid modulo bias.
- **Process isolation.** The renderer runs with `contextIsolation: true`,
  `nodeIntegration: false`, and `sandbox: true`. It cannot touch Node, the
  filesystem, or Electron internals directly — every privileged action goes
  through a small, explicit `preload.js` bridge.
- **No plaintext persistence.** Generated secrets are never written to disk by
  the app. Only your non-secret preferences are saved locally. The clipboard
  can be configured to auto-clear after a chosen delay.

## Reporting a vulnerability

If you discover a security issue, please **do not** open a public GitHub issue.
Instead, email **ian@ianlouw.com** with details and steps to reproduce. You can
expect an initial response within a few days.

## Supported versions

The latest released version receives security fixes.
