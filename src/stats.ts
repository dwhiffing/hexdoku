// Solve history, stored locally on the device.
import type { Difficulty } from './engine';

const KEY = 'hexdoku:stats';
const MAX = 500;

export interface GameRecord {
  at: number; // finish time, epoch ms
  difficulty: Difficulty;
  ms: number; // solve time
  mistakes: number;
  seed: number;
}

export interface Summary {
  solved: number;
  best: number | null; // fastest ms
  average: number | null; // mean ms
  perfect: number; // solves with 0 mistakes
  avgMistakes: number | null;
  streak: number; // current run of perfect solves
}

export function loadHistory(): GameRecord[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function record(r: GameRecord) {
  const h = loadHistory();
  // Don't double count a puzzle (e.g. win screen re-shown after reload).
  if (h.some((x) => x.seed === r.seed && x.difficulty === r.difficulty)) return;
  h.push(r);
  try { localStorage.setItem(KEY, JSON.stringify(h.slice(-MAX))); } catch { /* ignore */ }
}

export function summarize(h: GameRecord[], difficulty: Difficulty): Summary {
  const games = h.filter((g) => g.difficulty === difficulty);
  const n = games.length;
  let streak = 0;
  for (let i = n - 1; i >= 0 && games[i].mistakes === 0; i--) streak++;
  return {
    solved: n,
    best: n ? Math.min(...games.map((g) => g.ms)) : null,
    average: n ? games.reduce((s, g) => s + g.ms, 0) / n : null,
    perfect: games.filter((g) => g.mistakes === 0).length,
    avgMistakes: n ? games.reduce((s, g) => s + g.mistakes, 0) / n : null,
    streak,
  };
}

export function clearHistory() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
