// Puzzle generator: difficulty is set by the hardest technique a puzzle needs.
import { CELLS, EMPTY, Difficulty, Puzzle, fullGrid, makeRng, shuffle } from './engine';
import { Level, logicSolve, rate } from './logic';

export const LEVEL: Record<Difficulty, Level> = { easy: 1, medium: 2, hard: 3 };

/** Short description of each difficulty, shown in the New puzzle sheet. */
export const TECHNIQUES: Record<Difficulty, string> = {
  easy: 'Singles only',
  medium: 'Needs shared-bit deduction',
  hard: 'Needs pairs and pointing',
};

// Easy keeps extra givens so it stays relaxed.
const MIN_GIVENS: Record<Difficulty, number> = { easy: 30, medium: 0, hard: 0 };
const ATTEMPTS = 40;

/**
 * Remove givens while the puzzle stays solvable with techniques up to the
 * target level (which also guarantees a unique solution), then keep the
 * result only if it really needs that level.
 */
export function generate(seed: number, difficulty: Difficulty): Puzzle {
  const rng = makeRng(seed);
  const level = LEVEL[difficulty];
  let fallback: Puzzle | null = null;
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const solution = fullGrid(rng);
    const givens = solution.slice();
    let count = CELLS;
    for (const i of shuffle([...Array(CELLS).keys()], rng)) {
      if (count <= MIN_GIVENS[difficulty]) break;
      const keep = givens[i];
      givens[i] = EMPTY;
      if (logicSolve(givens, level)) count--;
      else givens[i] = keep;
    }
    const puzzle = { seed, difficulty, givens, solution };
    if (rate(givens) === level) return puzzle;
    fallback ??= puzzle;
  }
  return fallback!;
}
