// Original 5x7 bitmap font for hex digits and a few symbols, rendered as SVG.

const GLYPHS: Record<string, string> = {
  '0': '.###. #...# #..## #.#.# ##..# #...# .###.',
  '1': '..#.. .##.. ..#.. ..#.. ..#.. ..#.. .###.',
  '2': '.###. #...# ....# ..##. .#... #.... #####',
  '3': '####. ....# ....# .###. ....# ....# ####.',
  '4': '...#. ..##. .#.#. #..#. ##### ...#. ...#.',
  '5': '##### #.... ####. ....# ....# #...# .###.',
  '6': '..##. .#... #.... ####. #...# #...# .###.',
  '7': '##### ....# ...#. ..#.. .#... .#... .#...',
  '8': '.###. #...# #...# .###. #...# #...# .###.',
  '9': '.###. #...# #...# .#### ....# ...#. .##..',
  A: '.###. #...# #...# ##### #...# #...# #...#',
  B: '####. #...# #...# ####. #...# #...# ####.',
  C: '.###. #...# #.... #.... #.... #...# .###.',
  D: '###.. #..#. #...# #...# #...# #..#. ###..',
  E: '##### #.... #.... ####. #.... #.... #####',
  F: '##### #.... #.... ####. #.... #.... #....',
  '+': '..... ..#.. ..#.. ##### ..#.. ..#.. .....',
  '=': '..... ..... ##### ..... ##### ..... .....',
  ':': '..... ..#.. ..#.. ..... ..#.. ..#.. .....',
  x: '..... #...# .#.#. ..#.. .#.#. #...# .....',
};

const cache = new Map<string, string>();

/** SVG markup for one glyph, colored with currentColor. */
export function glyph(ch: string, cls = 'g'): string {
  const key = ch + '|' + cls;
  const hit = cache.get(key);
  if (hit) return hit;
  const rows = (GLYPHS[ch] ?? GLYPHS['x']).split(' ');
  let d = '';
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === '#') d += `M${x} ${y}h1v1h-1z`;
  });
  const svg = `<svg class="${cls}" viewBox="0 0 5 7" aria-hidden="true"><path d="${d}"/></svg>`;
  cache.set(key, svg);
  return svg;
}

/** A string of glyphs. */
export const text = (s: string, cls = 'g') => [...s].map((c) => glyph(c, cls)).join('');
