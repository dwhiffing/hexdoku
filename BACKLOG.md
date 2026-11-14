# Backlog

Features left out so far, roughly in priority order.

- [ ] Decide auto cross-out mode: duplicates only (current) or also shared-bit conflicts (`CONFIG.bitCrossOut`)
- [ ] Bigger "possible" marks on small phones (they're hard to read at 360px wide)
- [ ] Undo for "possible" marks
- [ ] Daily puzzle from a date seed; share a puzzle by seed
- [ ] Sound effects
- [ ] Settings screen (theme picker with previews, cross-out mode)
- [ ] Create GitHub repo and deploy to GitHub Pages via Actions

## Done

- [x] Tutorial (7 illustrated steps, shown on first launch, replayable) and a Rules sheet available during play

- [x] Placing a digit clears it from possible marks in its row, column and square
- [x] Flawless distinction for solves with no mistakes; win ripple animation
- [x] Timer pauses when the window is hidden or loses focus

- [x] Deploy to GitHub Pages (https://dwhiffing.github.io/hexdoku/)
- [x] Difficulty by required technique: Easy = singles, Medium = shared-bit deduction, Hard = pairs and pointing
- [x] Generate puzzles in a Web Worker

- [x] PWA: installable, works offline
- [x] Stats history (per difficulty: solved, best, average, perfect, avg mistakes, streak, recent games)
- [x] Haptics with on/off toggle (Android; iOS Safari doesn't support vibration)
