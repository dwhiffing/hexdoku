import { describe, it, expect } from 'vitest';
import { solve, ROWS, COLS, BOXES, ROW_SEG, COL_SEG, EMPTY } from '../src/engine';
import { generate, LEVEL } from '../src/generate';
import { rate } from '../src/logic';

function valid(g: number[]) {
  for (const set of [...ROWS, ...COLS, ...BOXES]) {
    const v = set.map((i) => g[i]);
    if (new Set(v).size !== v.length) return false;
  }
  for (let i = 0; i < 64; i++) for (const seg of [ROW_SEG[i], COL_SEG[i]]) {
    let a = 0xf; for (const j of seg) if (g[j] > 0) a &= g[j];
    if (!a) return false;
  }
  return true;
}

describe('generator', () => {
  for (const d of ['easy', 'medium', 'hard'] as const) {
    it(`makes unique ${d} puzzles that need the right technique`, () => {
      let hits = 0;
      for (let seed = 1; seed <= 8; seed++) {
        const t = Date.now();
        const p = generate(seed, d);
        expect(valid(p.solution)).toBe(true);
        expect(solve(p.givens, 2)).toBe(1);
        const r = rate(p.givens);
        if (r === LEVEL[d]) hits++;
        const n = p.givens.filter((x) => x !== EMPTY).length;
        console.log(d, seed, 'givens', n, 'rating', r, Date.now() - t, 'ms');
      }
      expect(hits).toBeGreaterThanOrEqual(7);
    });
  }
});
