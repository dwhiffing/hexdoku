// Generates puzzles off the main thread so the UI never freezes.
import { generate } from './generate';
import type { Difficulty } from './engine';

self.onmessage = (e: MessageEvent<{ seed: number; difficulty: Difficulty }>) => {
  self.postMessage(generate(e.data.seed, e.data.difficulty));
};
