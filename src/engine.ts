// Puzzle engine: rules, solver and generator.
// Grid is 8x8, stored row-major as numbers 0-15, or -1 for empty.

export const SIZE = 8;
export const CELLS = SIZE * SIZE;
export const EMPTY = -1;
export type Grid = number[];

export const rowOf = (i: number) => Math.floor(i / SIZE);
export const colOf = (i: number) => i % SIZE;
export const boxOf = (i: number) => Math.floor(rowOf(i) / 4) * 2 + Math.floor(colOf(i) / 4);

// Precomputed peer lists.
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
export const ROWS = range(SIZE).map((r) => range(SIZE).map((c) => r * SIZE + c));
export const COLS = range(SIZE).map((c) => range(SIZE).map((r) => r * SIZE + c));
export const BOXES = range(4).map((b) => {
  const r0 = Math.floor(b / 2) * 4;
  const c0 = (b % 2) * 4;
  return range(16).map((k) => (r0 + Math.floor(k / 4)) * SIZE + c0 + (k % 4));
});
// The 4-cell row segment and column segment (inside its box) for each cell.
export const ROW_SEG = range(CELLS).map((i) => {
  const r = rowOf(i);
  const c0 = Math.floor(colOf(i) / 4) * 4;
  return range(4).map((k) => r * SIZE + c0 + k);
});
export const COL_SEG = range(CELLS).map((i) => {
  const c = colOf(i);
  const r0 = Math.floor(rowOf(i) / 4) * 4;
  return range(4).map((k) => (r0 + k) * SIZE + c);
});

const ALL = 0xffff;

/** Bitmask of digits already used in the cell's square, full row and full column. */
export function usedMask(g: Grid, i: number): number {
  let m = 0;
  for (const j of ROWS[rowOf(i)]) if (j !== i && g[j] >= 0) m |= 1 << g[j];
  for (const j of COLS[colOf(i)]) if (j !== i && g[j] >= 0) m |= 1 << g[j];
  for (const j of BOXES[boxOf(i)]) if (j !== i && g[j] >= 0) m |= 1 << g[j];
  return m;
}

/** AND of the non-zero digits in a segment (excluding cell i); 0xf if none. */
function segAnd(g: Grid, seg: number[], i: number): number {
  let a = 0xf;
  for (const j of seg) if (j !== i && g[j] > 0) a &= g[j];
  return a;
}

/** Bitmask of digits that break the shared-bit rule if placed at i. */
export function bitBlockedMask(g: Grid, i: number): number {
  const ar = segAnd(g, ROW_SEG[i], i);
  const ac = segAnd(g, COL_SEG[i], i);
  let m = 0;
  for (let d = 1; d < 16; d++) if ((d & ar) === 0 || (d & ac) === 0) m |= 1 << d;
  return m;
}

/** Bitmask of digits legal at i under all rules. */
export function candidates(g: Grid, i: number): number {
  return ALL & ~usedMask(g, i) & ~bitBlockedMask(g, i);
}

const popcount = (m: number) => {
  let n = 0;
  while (m) {
    m &= m - 1;
    n++;
  }
  return n;
};

export type Rng = () => number;

/** Mulberry32 seeded PRNG. */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(arr: number[], rng: Rng): number[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Backtracking search. Counts solutions up to `limit`; if `out` is given,
 * the first solution found is written there. Optional rng randomizes order.
 */
export function solve(
  start: Grid,
  limit = 2,
  out?: Grid,
  rng?: Rng,
  budget = { nodes: 200000 },
): number {
  const g = start.slice();
  let found = 0;
  const rec = (): boolean => {
    if (--budget.nodes < 0) return true;
    // Most-constrained cell.
    let best = -1;
    let bestMask = 0;
    let bestCount = 99;
    for (let i = 0; i < CELLS; i++) {
      if (g[i] !== EMPTY) continue;
      const m = candidates(g, i);
      const n = popcount(m);
      if (n < bestCount) {
        best = i;
        bestMask = m;
        bestCount = n;
        if (n === 0) return false;
      }
    }
    if (best < 0) {
      found++;
      if (out && found === 1) for (let k = 0; k < CELLS; k++) out[k] = g[k];
      return found >= limit;
    }
    let digits: number[] = [];
    for (let d = 0; d < 16; d++) if (bestMask & (1 << d)) digits.push(d);
    if (rng) digits = shuffled(digits, rng);
    for (const d of digits) {
      g[best] = d;
      if (rec()) return true;
    }
    g[best] = EMPTY;
    return false;
  };
  rec();
  if (budget.nodes < 0) return -1; // gave up
  return found;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Puzzle {
  seed: number;
  difficulty: Difficulty;
  givens: Grid;
  solution: Grid;
}

/** A random complete, valid grid. */
export function fullGrid(rng: Rng): Grid {
  for (;;) {
    const out: Grid = new Array(CELLS).fill(EMPTY);
    const n = solve(new Array(CELLS).fill(EMPTY), 1, out, rng, { nodes: 50000 });
    if (n === 1) return out;
  }
}

export function shuffle(arr: number[], rng: Rng): number[] {
  return shuffled(arr, rng);
}

/** The bits that make up a digit, e.g. 11 -> [1, 2, 8]. */
export const bitsOf = (d: number) => [1, 2, 4, 8].filter((b) => d & b);
export const hex = (d: number) => d.toString(16).toUpperCase();
