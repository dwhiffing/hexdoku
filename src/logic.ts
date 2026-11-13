// Human-style solver used to rate and build puzzles by the techniques they need.
//
// Level 1 "Singles": naked singles and hidden singles in a 4x4 square, with
//   candidates limited by duplicates and the bits already placed in a segment.
// Level 2 "Bit deduction": work out which bits a 4-cell row/column can still
//   share from the candidates of its empty cells, and drop digits without them.
// Level 3 "Subsets": pointing (a digit locked to one line of a square) and
//   naked pairs in squares, rows and columns.
// Anything that needs more than level 3 is rated 4 (would need guessing).

import { BOXES, CELLS, COLS, COL_SEG, EMPTY, Grid, ROWS, ROW_SEG, candidates } from './engine';

export type Level = 1 | 2 | 3;

const popcount = (m: number) => {
  let n = 0;
  while (m) { m &= m - 1; n++; }
  return n;
};
const lowestDigit = (m: number) => 31 - Math.clz32(m & -m);

// One entry per distinct 4-cell segment.
const SEGMENTS: number[][] = [];
{
  const seen = new Set<string>();
  for (let i = 0; i < CELLS; i++)
    for (const seg of [ROW_SEG[i], COL_SEG[i]]) {
      const k = seg.join(',');
      if (!seen.has(k)) { seen.add(k); SEGMENTS.push(seg); }
    }
}
const LINES = [...ROWS, ...COLS];

/**
 * Try to solve using techniques up to `max`. Returns the hardest level that was
 * needed, or 0 if it got stuck. Deductions are sound, so a solve also proves
 * the solution is unique.
 */
export function logicSolve(start: Grid, max: Level): number {
  const g = start.slice();
  const elim = new Array(CELLS).fill(0);
  let hardest = 1;
  const cands = (i: number) => (g[i] === EMPTY ? candidates(g, i) & ~elim[i] : 0);

  for (;;) {
    let empty = 0;
    for (let i = 0; i < CELLS; i++) if (g[i] === EMPTY) empty++;
    if (!empty) return hardest;

    // Level 1: singles.
    let placed = false;
    for (let i = 0; i < CELLS; i++) {
      if (g[i] !== EMPTY) continue;
      const m = cands(i);
      if (m === 0) return 0; // contradiction
      if (popcount(m) === 1) { g[i] = lowestDigit(m); placed = true; }
    }
    if (placed) continue;
    for (const box of BOXES) {
      for (let d = 0; d < 16 && !placed; d++) {
        let spot = -1;
        let count = 0;
        let present = false;
        for (const i of box) {
          if (g[i] === d) { present = true; break; }
          if (cands(i) & (1 << d)) { spot = i; count++; }
        }
        if (!present && count === 1) { g[spot] = d; placed = true; }
      }
    }
    if (placed) continue;

    // Level 2: bit deduction per segment.
    if (max >= 2) {
      let changed = false;
      for (const seg of SEGMENTS) {
        let viable = 0;
        for (const b of [1, 2, 4, 8]) {
          let ok = true;
          for (const i of seg) {
            if (g[i] !== EMPTY) { if (g[i] > 0 && !(g[i] & b)) { ok = false; break; } continue; }
            const m = cands(i);
            let fits = (m & 1) !== 0; // 0 is exempt
            for (let d = 1; d < 16 && !fits; d++) if (m & (1 << d) && d & b) fits = true;
            if (!fits) { ok = false; break; }
          }
          if (ok) viable |= b;
        }
        for (const i of seg) {
          if (g[i] !== EMPTY) continue;
          const m = cands(i);
          for (let d = 1; d < 16; d++)
            if (m & (1 << d) && !(d & viable)) { elim[i] |= 1 << d; changed = true; }
        }
      }
      if (changed) { hardest = Math.max(hardest, 2); continue; }
    }

    // Level 3: pointing and naked pairs.
    if (max >= 3) {
      let changed = false;
      const drop = (i: number, mask: number) => {
        if (g[i] === EMPTY && cands(i) & mask) { elim[i] |= mask; changed = true; }
      };
      for (const box of BOXES) {
        for (let d = 0; d < 16; d++) {
          const spots = box.filter((i) => cands(i) & (1 << d));
          if (spots.length < 2) continue;
          for (const line of LINES) {
            if (spots.every((i) => line.includes(i)))
              for (const j of line) if (!box.includes(j)) drop(j, 1 << d);
          }
        }
      }
      for (const unit of [...BOXES, ...LINES]) {
        const empties = unit.filter((i) => g[i] === EMPTY);
        for (let a = 0; a < empties.length; a++) {
          const m = cands(empties[a]);
          if (popcount(m) !== 2) continue;
          for (let b = a + 1; b < empties.length; b++) {
            if (cands(empties[b]) !== m) continue;
            for (const j of empties) if (j !== empties[a] && j !== empties[b]) drop(j, m);
          }
        }
      }
      if (changed) { hardest = Math.max(hardest, 3); continue; }
    }
    return 0;
  }
}

/** The lowest level that solves the puzzle, or 4 if none does. */
export function rate(givens: Grid): number {
  for (const lvl of [1, 2, 3] as Level[]) if (logicSolve(givens, lvl)) return lvl;
  return 4;
}
