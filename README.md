# Hexdoku

A mobile-first hex-digit logic puzzle. See `SPEC.md` for the rules and `BACKLOG.md` for what's next.

## Run

```sh
npm install
npm run dev      # open the printed URL; --host is on, so your phone on the same Wi-Fi can open it too
npm test         # engine tests
npm run build    # static site in dist/
npm run preview  # serve the build (the service worker only runs in builds)
```

## Install on a phone

It's a PWA. Open the built site over HTTPS (or localhost), then use "Add to Home Screen"
(iOS Safari share menu) or "Install app" (Android Chrome). It works offline after the first load.
A plain `http://192.168.x.x` LAN address won't install, because browsers require HTTPS for
service workers, so use the GitHub Pages build: https://dwhiffing.github.io/hexdoku/

## Where things live

- `src/engine.ts`: rules and backtracking solver
- `src/logic.ts`: human-style solver that rates puzzles by technique (singles, bit deduction, subsets)
- `src/generate.ts`: seeded generator; difficulty = hardest technique needed (runs in `src/worker.ts`)
- `src/main.ts`: game state, input and rendering. `CONFIG.bitCrossOut` turns on shared-bit cross-out.
- `src/stats.ts`: solve history and per-difficulty summaries (localStorage)
- `src/haptics.ts`: vibration patterns (Android only; iOS Safari has no vibration API)
- `src/palettes.ts`: all colors. Add an object to `PALETTES` to add a theme.
- `src/font.ts`: the 5x7 pixel font for digits
- `public/sw.js`, `public/manifest.webmanifest`: offline support and install metadata
- `scripts/icons.mjs`: regenerates the app icons (`node scripts/icons.mjs`)
