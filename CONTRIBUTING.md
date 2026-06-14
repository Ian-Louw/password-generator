# Contributing to UltraPass

Thanks for your interest in improving UltraPass! Contributions of all kinds are
welcome — bug reports, feature ideas, docs, and code.

## Project layout

```
.
├── core/                       # @ultrapass/core — shared TypeScript logic
│   ├── src/                    # generator, passphrase, strength, wordlist, RNG
│   └── test/                   # node:test unit tests (run against dist/)
├── desktop/                    # UltraPass desktop app (Electron)
│   ├── main.js                 # Electron main process + IPC (uses @ultrapass/core)
│   ├── preload.js              # Secure context bridge
│   ├── src/core/               # Desktop-only bits: bcrypt/scrypt hasher, QR
│   ├── src/renderer/           # UI (HTML/CSS/JS)
│   └── test/                   # node:test unit tests
├── web/                        # UltraPass web app (Next.js + shadcn/ui)
│   ├── app/                    # App Router pages + layout
│   ├── components/             # UI + shadcn/ui components + feature tabs
│   └── lib/                    # Web-only hasher (SubtleCrypto) + helpers
└── .github/workflows/          # CI: core/desktop/web builds, installers, deploy
```

### Shared core

The cryptographically-sensitive logic lives once in **`@ultrapass/core`** (a
local `file:` package) and is consumed by both apps. It uses `globalThis.crypto`
(the Web Crypto API), which works in browsers and in Node/Electron 18+. Build it
with `cd core && npm run build` — though `npm install` in either app runs that
automatically via the package's `prepare` script. Hashing stays per-app because
it is genuinely platform-specific (Node `crypto` + scrypt on desktop, SubtleCrypto
in the browser).

## Developing the desktop app

```bash
cd desktop
npm install
npm start        # launch the app
npm run dev      # launch with DevTools open
npm test         # run the unit tests
```

The security-sensitive logic lives in `src/core/` and is plain Node with no DOM
or Electron dependencies, so it is easy to unit test. Please add or update tests
in `desktop/test/` for any change to that code.

## Developing the web app

```bash
cd web
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (also type-checks)
```

The web app mirrors the desktop logic in TypeScript under `web/lib/core/`,
using the Web Crypto API so it stays fully client-side. UI is built with
shadcn/ui components in `web/components/ui/`.

## Building installers locally

```bash
cd desktop
npm run dist            # build for the current OS
npm run dist:win        # Windows (.exe NSIS + portable)
npm run dist:mac        # macOS (.dmg + .zip)
npm run dist:linux      # Linux (.AppImage + .deb)
```

Output lands in `desktop/release/`. Building for a given OS is most reliable on
that OS; CI builds all three on every push.

## Guidelines

- Keep the renderer free of Node/Electron access — route privileged actions
  through `preload.js`.
- Never add network calls. UltraPass is, and should remain, fully offline.
- Match the existing code style (2-space indent, `'use strict'`, small modules).
- Run `npm test` before opening a PR.

## Reporting security issues

Please see [SECURITY.md](SECURITY.md) — do not open public issues for
vulnerabilities.
