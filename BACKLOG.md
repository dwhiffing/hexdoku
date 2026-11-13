# Backlog

Features left out so far, roughly in priority order.

- [ ] Decide auto cross-out mode: duplicates only (current) or also shared-bit conflicts (`CONFIG.bitCrossOut`)
- [ ] Bigger "possible" marks on small phones (they're hard to read at 360px wide)
- [ ] Generate puzzles in a Web Worker so Hard (up to ~1s) never blocks the UI
- [ ] Difficulty by required solving techniques, not just number of givens
- [ ] Undo for "possible" marks
- [ ] Auto-remove a digit from peers' possible marks when it is placed (optional setting)
- [ ] Daily puzzle from a date seed; share a puzzle by seed
- [ ] Sound effects
- [ ] Settings screen (theme picker with previews, cross-out mode)
- [ ] Create GitHub repo and deploy to GitHub Pages via Actions

## Done

- [x] PWA: installable, works offline
- [x] Stats history (per difficulty: solved, best, average, perfect, avg mistakes, streak, recent games)
- [x] Haptics with on/off toggle (Android; iOS Safari doesn't support vibration)
