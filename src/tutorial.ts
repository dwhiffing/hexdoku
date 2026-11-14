// Tutorial steps and the rules reference, with small illustrated examples.
import { glyph } from './font';
import { hex } from './engine';

type Mark = 'hi' | 'bad' | 'dim' | '' | 'q';

/** A row of mini tiles. `cells` uses hex chars, '.' for empty, '?' for unknown. */
function tiles(cells: string, marks: Mark[] = [], split = 0): string {
  let s = '<div class="mini">';
  [...cells].forEach((c, k) => {
    if (split && k === split) s += '<span class="mini-gap"></span>';
    const cls = marks[k] ?? '';
    const inner = c === '.' ? '' : c === '?' ? '<span class="mini-q">?</span>' : glyph(c);
    s += `<span class="mini-cell ${cls}">${inner}</span>`;
  });
  return s + '</div>';
}

/** Bits of each digit as a column of 1/2/4/8 under its tile; shared bits lit. */
function bitRow(cells: string, shared: number): string {
  let s = '<div class="mini bitrow">';
  for (const c of cells) {
    if (c === '?' || c === '.') { s += '<span class="mini-bits"></span>'; continue; }
    const d = parseInt(c, 16);
    const parts = [1, 2, 4, 8].map((b) =>
      `<b class="${d & b ? (shared & b ? 'on' : 'has') : ''}">${b}</b>`);
    s += `<span class="mini-bits">${parts.join('')}</span>`;
  }
  return s + '</div>';
}

/** A full 4x4 square holding every digit once. */
function square(): string {
  const order = '0123456789ABCDEF';
  let s = '<div class="mini-square">';
  for (const c of order) s += `<span class="mini-cell">${glyph(c)}</span>`;
  return s + '</div>';
}

/** The 8x8 board outline: four 4x4 squares. */
function boardOutline(): string {
  let s = '<div class="mini-board">';
  for (let b = 0; b < 4; b++) {
    s += '<div class="mini-box">';
    for (let k = 0; k < 16; k++) s += '<span></span>';
    s += '</div>';
  }
  return s + '</div>';
}

export interface Step {
  title: string;
  body: string;
  art: string;
}

export const STEPS: Step[] = [
  {
    title: 'Welcome',
    body: 'Fill the 8x8 board with hex digits 0-9 and A-F. The board is made of four 4x4 squares.',
    art: boardOutline(),
  },
  {
    title: 'Rule 1: Squares',
    body: 'Each 4x4 square holds every digit from 0 to F exactly once.',
    art: square(),
  },
  {
    title: 'Rule 2: Shared bits',
    body: 'Every digit is a sum of bits: 1, 2, 4 and 8. The 4 digits in each row and each column of a square must share at least one bit. Here they all contain 1 and 2.',
    art: tiles('37BF', ['hi', 'hi', 'hi', 'hi']) + bitRow('37BF', 3),
  },
  {
    title: 'Rule 3: Zero is free',
    body: '0 has no bits, so it ignores the shared-bit rule. Place it by elimination. Here 5, 7 and D share 1 and 4.',
    art: tiles('057D', ['dim', 'hi', 'hi', 'hi']) + bitRow('057D', 5),
  },
  {
    title: 'Rule 4: Full lines',
    body: 'A digit can appear only once in a full 8-cell row or column, across both squares.',
    art: tiles('5.2.A.5.', ['bad', '', '', '', '', '', 'bad', ''], 4),
  },
  {
    title: 'Rule 5: Find the bit',
    body: 'Shared bits are hidden, so work them out. 8 only has the 8 bit, so this row shares 8. The empty cells must be 0 or a digit with 8: A to F here, since 8 and 9 are used.',
    art: tiles('89??', ['hi', 'hi', 'q', 'q']) + bitRow('89??', 8),
  },
  {
    title: 'How to play',
    body: 'Tap a cell, then tap a digit below the board. Digits that are already used nearby are crossed out. A wrong digit counts as a mistake; solve with none for a Flawless finish. Hold a digit (or right-click it) to mark it as possible. The line under the board shows the bits of the digit you are looking at.',
    art: `<div class="mini bitline">${['1', '+', '2', '+', '4', '+', '8', '=', 'B']
      .map((c, k) => `<span class="${[0, 2, 6, 8].includes(k) ? 'on' : ''}">${glyph(c)}</span>`)
      .join('')}</div>`,
  },
];

/** The compact rules reference shown from the Rules button. */
export function rulesHtml(): string {
  const ex = (s: string) => s.split('').map((c) => glyph(c)).join('');
  return `
    <ol class="rules">
      <li>Each 4x4 square holds every digit 0-F once.</li>
      <li>The 4 digits in each row and column of a square share a bit (1, 2, 4 or 8).</li>
      <li>0 has no bits and ignores rule 2.</li>
      <li>No digit repeats in a full 8-cell row or column.</li>
      <li>Shared bits are hidden: deduce them from the digits you know.</li>
    </ol>
    <div class="bits-table">${[1, 2, 4, 8]
      .map((b) => {
        const ds = [...Array(16).keys()].filter((d) => d & b).map(hex).join('');
        return `<div><span class="lbl">bit ${b}</span><span class="ex">${ex(ds)}</span></div>`;
      })
      .join('')}</div>
    <p class="help">Tap a cell, then a digit. Hold or right-click a digit to mark it possible.</p>`;
}
