# Hexdoku: game spec

A mobile-first web puzzle game. Mechanics and UX follow dan's description of a game they play on desktop; the name, visuals and puzzles are original.

## Rules

- 8x8 grid made of four 4x4 squares, using hex digits 0-F.
1. Each 4x4 square contains every digit 0-F exactly once.
2. Within a square, the 4 digits of each row and of each column share at least one bit (1, 2, 4 or 8).
3. 0 is exempt from the shared-bit rule; place it by elimination.
4. A digit appears at most once in any full 8-cell row or column.
5. Shared bits are hidden: deduce each 4-cell row's and column's shared bit from the other rules.

Each puzzle has exactly one solution.

## Play loop

- Tap a cell, then tap a digit in the options panel (below the board on phones, beside it on desktop).
- Digits already in the cell's square, row or column are crossed out.
- A wrong digit is crossed out for that cell and adds a mistake.
- Hold (mobile) or right-click (desktop) a digit to mark it as possible; marks show small in the cell. Placing a digit clears it from marks in the same row, column and square.
- Mistakes are unlimited; a solve with no mistakes earns a Flawless distinction.
- The timer pauses while the window is hidden or unfocused.
- The line under the board breaks the hovered or selected digit into bits, e.g. 1+2+8=B.
- No level list: pick Easy (singles only), Medium (needs shared-bit deduction) or Hard (needs pairs and pointing) for a new puzzle. Timer and mistake count are shown; win screen at the end.

## Open questions

1. Should auto cross-out also use the shared-bit rule? (Currently duplicates only; see CONFIG.bitCrossOut.)
