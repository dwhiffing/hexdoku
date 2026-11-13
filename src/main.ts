import '@fontsource/silkscreen/400.css';
import './style.css';
import { CELLS, EMPTY, SIZE, Difficulty, Grid, Puzzle, usedMask, bitBlockedMask, rowOf, colOf, boxOf, hex } from './engine';
import { generate, TECHNIQUES } from './generate';
import { glyph } from './font';
import { PALETTES, applyPalette } from './palettes';
import { buzz, hapticsEnabled, hapticsSupported, setHaptics } from './haptics';
import { record, loadHistory, summarize, clearHistory } from './stats';

// ---- Settings ------------------------------------------------------------
const CONFIG = {
  /** Also cross out digits that break the shared-bit rule (not just duplicates). */
  bitCrossOut: false,
  longPressMs: 420,
};

// ---- State ---------------------------------------------------------------
interface State {
  puzzle: Puzzle;
  grid: Grid; // current board (givens + correct placements)
  wrong: number[]; // per cell: bitmask of digits tried and rejected
  marks: number[]; // per cell: bitmask of "possible" digits
  mistakes: number;
  elapsed: number; // ms
  selected: number; // cell index or -1
  won: boolean;
}

const SAVE_KEY = 'hexdoku:v1';
const THEME_KEY = 'hexdoku:theme';

const store = {
  get(k: string) {
    try { return localStorage.getItem(k); } catch { return null; }
  },
  set(k: string, v: string) {
    try { localStorage.setItem(k, v); } catch { /* ignore */ }
  },
};

const randomSeed = () => (Math.random() * 2 ** 32) >>> 0;

function newState(difficulty: Difficulty): State {
  return stateFor(generate(randomSeed(), difficulty));
}

function stateFor(puzzle: Puzzle): State {
  return {
    puzzle,
    grid: puzzle.givens.slice(),
    wrong: new Array(CELLS).fill(0),
    marks: new Array(CELLS).fill(0),
    mistakes: 0,
    elapsed: 0,
    selected: -1,
    won: false,
  };
}

function load(): State | null {
  const raw = store.get(SAVE_KEY);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as State;
    return s.grid?.length === CELLS ? s : null;
  } catch {
    return null;
  }
}

let state: State = load() ?? newState('medium');
const save = () => store.set(SAVE_KEY, JSON.stringify(state));
save();

let themeIndex = Math.max(0, PALETTES.findIndex((p) => p.name === store.get(THEME_KEY)));
applyPalette(PALETTES[themeIndex]);

// ---- DOM -----------------------------------------------------------------
const $ = (id: string) => document.getElementById(id)!;
const boardEl = $('board');
const optionsEl = $('options');
const bitsEl = $('bits');
const timerEl = $('timer');
const mistakesEl = $('mistakes');
const overlay = $('overlay');

const cellEls: HTMLElement[] = [];
for (let b = 0; b < 4; b++) {
  const box = document.createElement('div');
  box.className = 'box';
  boardEl.appendChild(box);
}
for (let i = 0; i < CELLS; i++) {
  const el = document.createElement('button');
  el.className = 'cell';
  el.setAttribute('aria-label', `Row ${rowOf(i) + 1}, column ${colOf(i) + 1}`);
  el.addEventListener('click', () => select(i));
  cellEls.push(el);
}
// Append cells into their boxes in reading order within each box.
for (let r = 0; r < SIZE; r++)
  for (let c = 0; c < SIZE; c++) {
    const i = r * SIZE + c;
    boardEl.children[boxOf(i)].appendChild(cellEls[i]);
  }

const optionEls: HTMLButtonElement[] = [];
for (let d = 0; d < 16; d++) {
  const el = document.createElement('button');
  el.className = 'opt';
  el.innerHTML = glyph(hex(d));
  el.setAttribute('aria-label', `Digit ${hex(d)}`);
  optionsEl.appendChild(el);
  optionEls.push(el);
  bindOption(el, d);
}

// ---- Input ---------------------------------------------------------------
let focusDigit = -1; // digit shown in the bits line (hover / press)

function bindOption(el: HTMLButtonElement, d: number) {
  let timer = 0;
  let longFired = false;
  let pointerType = 'mouse';
  const clear = () => {
    clearTimeout(timer);
    timer = 0;
  };
  el.addEventListener('pointerdown', (e) => {
    pointerType = e.pointerType;
    longFired = false;
    if (e.pointerType !== 'mouse') {
      setFocus(d);
      timer = window.setTimeout(() => {
        longFired = true;
        toggleMark(d);
      }, CONFIG.longPressMs);
    }
  });
  el.addEventListener('pointerup', clear);
  el.addEventListener('pointercancel', () => { clear(); setFocus(-1); });
  el.addEventListener('pointerleave', () => { clear(); setFocus(-1); });
  el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') setFocus(d); });
  el.addEventListener('click', () => {
    if (longFired) { longFired = false; return; }
    place(d);
    if (pointerType !== 'mouse') setFocus(-1);
  });
  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (pointerType === 'mouse') toggleMark(d);
  });
}

function setFocus(d: number) {
  focusDigit = d;
  renderBits();
}

function select(i: number) {
  if (state.won) return;
  state.selected = state.selected === i ? -1 : i;
  if (state.selected >= 0) buzz('select');
  render();
}

function editable(i: number) {
  return i >= 0 && !state.won && state.grid[i] === EMPTY;
}

function crossedMask(i: number): number {
  let m = usedMask(state.grid, i) | state.wrong[i];
  if (CONFIG.bitCrossOut) m |= bitBlockedMask(state.grid, i);
  return m;
}

function place(d: number) {
  const i = state.selected;
  if (!editable(i) || crossedMask(i) & (1 << d)) return;
  if (state.puzzle.solution[i] === d) {
    state.grid[i] = d;
    state.marks[i] = 0;
    if (state.grid.every((v, k) => v === state.puzzle.solution[k])) win();
    else buzz('place');
  } else {
    state.wrong[i] |= 1 << d;
    state.marks[i] &= ~(1 << d);
    state.mistakes++;
    flash(cellEls[i]);
    buzz('wrong');
  }
  save();
  render();
}

function toggleMark(d: number) {
  const i = state.selected;
  if (!editable(i) || crossedMask(i) & (1 << d)) return;
  state.marks[i] ^= 1 << d;
  buzz('mark');
  save();
  render();
}

function flash(el: HTMLElement) {
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
}

// Keyboard: arrows move, 0-9/A-F place, Shift+digit marks.
window.addEventListener('keydown', (e) => {
  if (!overlay.hidden) { if (e.key === 'Escape') closeSheet(); return; }
  const k = e.key.toLowerCase();
  const moves: Record<string, [number, number]> = { arrowup: [-1, 0], arrowdown: [1, 0], arrowleft: [0, -1], arrowright: [0, 1] };
  if (moves[k]) {
    e.preventDefault();
    const s = state.selected < 0 ? 0 : state.selected;
    const r = (rowOf(s) + moves[k][0] + SIZE) % SIZE;
    const c = (colOf(s) + moves[k][1] + SIZE) % SIZE;
    state.selected = r * SIZE + c;
    render();
    return;
  }
  const code = e.code.startsWith('Digit') ? e.code.slice(5).toLowerCase() : e.code.startsWith('Key') ? e.code.slice(3).toLowerCase() : k;
  if (/^[0-9a-f]$/.test(code)) {
    const d = parseInt(code, 16);
    if (e.shiftKey) toggleMark(d);
    else place(d);
  }
});

// ---- Rendering -----------------------------------------------------------
function render() {
  const sel = state.selected;
  const selDigit = sel >= 0 ? state.grid[sel] : EMPTY;
  for (let i = 0; i < CELLS; i++) {
    const el = cellEls[i];
    const v = state.grid[i];
    const given = state.puzzle.givens[i] !== EMPTY;
    const peer = sel >= 0 && i !== sel && (rowOf(i) === rowOf(sel) || colOf(i) === colOf(sel) || boxOf(i) === boxOf(sel));
    el.className = 'cell' +
      (given ? ' given' : v !== EMPTY ? ' filled' : '') +
      (i === sel ? ' sel' : '') +
      (peer ? ' peer' : '') +
      (selDigit !== EMPTY && v === selDigit && i !== sel ? ' same' : '');
    const html = v !== EMPTY ? glyph(hex(v)) : marksHtml(state.marks[i]);
    if (el.dataset.html !== html) {
      el.innerHTML = html;
      el.dataset.html = html;
    }
  }
  const crossed = editable(sel) ? crossedMask(sel) : 0;
  for (let d = 0; d < 16; d++) {
    const el = optionEls[d];
    const off = !editable(sel);
    el.className = 'opt' +
      (off ? ' off' : '') +
      (crossed & (1 << d) ? ' crossed' : '') +
      (editable(sel) && state.wrong[sel] & (1 << d) ? ' wrong' : '') +
      (editable(sel) && state.marks[sel] & (1 << d) ? ' possible' : '');
  }
  mistakesEl.innerHTML = `<span class="lbl">Miss</span>${state.mistakes}`;
  renderTimer();
  renderBits();
}

function marksHtml(m: number): string {
  if (!m) return '';
  let s = '<div class="marks">';
  for (let d = 0; d < 16; d++) s += `<span>${m & (1 << d) ? glyph(hex(d)) : ''}</span>`;
  return s + '</div>';
}

function renderBits() {
  let d = focusDigit;
  if (d < 0 && state.selected >= 0) d = state.grid[state.selected];
  const on = (b: number) => (d > 0 && d & b ? ' on' : '');
  const parts = [1, 2, 4, 8].map((b, k) =>
    (k ? `<span class="op">${glyph('+')}</span>` : '') + `<span class="t${on(b)}">${glyph(String(b))}</span>`,
  );
  bitsEl.innerHTML = parts.join('') + `<span class="op">${glyph('=')}</span>` +
    `<span class="t${d >= 0 ? ' on res' : ''}">${glyph(d >= 0 ? hex(d) : '0')}</span>`;
}

function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor(s / 60) % 60).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return (h ? `${h}:` : '') + `${mm}:${ss}`;
}

function renderTimer() {
  timerEl.innerHTML = `<span class="lbl">${state.puzzle.difficulty}</span>${fmtTime(state.elapsed)}`;
}

// ---- Timer ---------------------------------------------------------------
let last = performance.now();
setInterval(() => {
  const now = performance.now();
  const dt = now - last;
  last = now;
  if (state.won || document.hidden || !overlay.hidden) return;
  const before = Math.floor(state.elapsed / 1000);
  state.elapsed += Math.min(dt, 1000);
  if (Math.floor(state.elapsed / 1000) !== before) {
    renderTimer();
    save();
  }
}, 250);
document.addEventListener('visibilitychange', () => { last = performance.now(); });

// ---- Sheets (new game / win) ----------------------------------------------
function showSheet(id: 'newSheet' | 'statsSheet') {
  $('newSheet').hidden = id !== 'newSheet';
  $('statsSheet').hidden = id !== 'statsSheet';
  overlay.hidden = false;
}
function openSheet(title: string, body: string, cancellable: boolean) {
  $('sheetTitle').textContent = title;
  $('sheetBody').textContent = body;
  $('closeSheet').hidden = !cancellable;
  showSheet('newSheet');
}
function closeSheet() {
  if (state.won && !$('newSheet').hidden) return;
  if (state.won) { openWin(); return; }
  overlay.hidden = true;
  last = performance.now();
}

let winText = '';
function openWin() {
  openSheet('Solved!', winText, false);
}

function win() {
  state.won = true;
  state.selected = -1;
  const p = state.puzzle;
  const prev = summarize(loadHistory(), p.difficulty).best;
  record({ at: Date.now(), difficulty: p.difficulty, ms: state.elapsed, mistakes: state.mistakes, seed: p.seed });
  const m = state.mistakes;
  const best = prev === null || state.elapsed < prev;
  winText = `${fmtTime(state.elapsed)} with ${m} mistake${m === 1 ? '' : 's'}.` +
    (best && prev !== null ? ' New best time!' : '') + ' Play again?';
  buzz('win');
  openWin();
}

// ---- Stats sheet ---------------------------------------------------------
let statTab: Difficulty = 'medium';
let clearArmed = false;

function renderStats() {
  const h = loadHistory();
  const s = summarize(h, statTab);
  document.querySelectorAll<HTMLButtonElement>('#statTabs [data-tab]').forEach((b) =>
    b.classList.toggle('on', b.dataset.tab === statTab),
  );
  const t = (v: number | null) => (v === null ? '--' : fmtTime(v));
  const tiles: [string, string][] = [
    ['Solved', String(s.solved)],
    ['Best', t(s.best)],
    ['Average', t(s.average)],
    ['Perfect', String(s.perfect)],
    ['Avg miss', s.avgMistakes === null ? '--' : s.avgMistakes.toFixed(1)],
    ['Streak', String(s.streak)],
  ];
  $('statTiles').innerHTML = tiles.map(([k, v]) => `<div class="tile"><span class="lbl">${k}</span>${v}</div>`).join('');
  const recent = h.filter((g) => g.difficulty === statTab).slice(-8).reverse();
  $('recent').innerHTML = recent.length
    ? recent.map((g) => {
        const d = new Date(g.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        return `<li><span>${d}</span><span>${fmtTime(g.ms)}</span><span>${g.mistakes} miss</span></li>`;
      }).join('')
    : '<li class="empty">No solves yet</li>';
  $('hapticsBtn').textContent = `Haptics: ${hapticsEnabled() ? 'On' : 'Off'}`;
  $('hapticsNote').textContent = hapticsSupported ? '' : 'This browser does not support vibration (iPhone Safari does not).';
  $('clearStats').textContent = clearArmed ? 'Tap again to clear' : 'Clear history';
}

$('statsBtn').addEventListener('click', () => {
  statTab = state.puzzle.difficulty;
  clearArmed = false;
  renderStats();
  showSheet('statsSheet');
});
$('statTabs').addEventListener('click', (e) => {
  const tab = (e.target as HTMLElement).closest<HTMLElement>('[data-tab]')?.dataset.tab;
  if (tab) { statTab = tab as Difficulty; renderStats(); }
});
$('hapticsBtn').addEventListener('click', () => { setHaptics(!hapticsEnabled()); renderStats(); });
$('clearStats').addEventListener('click', () => {
  if (clearArmed) { clearHistory(); clearArmed = false; } else clearArmed = true;
  renderStats();
});
$('closeStats').addEventListener('click', closeSheet);

$('newBtn').addEventListener('click', () => openSheet('New puzzle', 'Pick a difficulty.', true));
$('closeSheet').addEventListener('click', closeSheet);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSheet(); });
// Generate in a worker when possible; fall back to the main thread.
let worker: Worker | null = null;
try {
  worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
} catch {
  worker = null;
}
function requestPuzzle(difficulty: Difficulty): Promise<Puzzle> {
  const seed = randomSeed();
  if (!worker) return Promise.resolve(generate(seed, difficulty));
  return new Promise((resolve) => {
    worker!.onmessage = (e: MessageEvent<Puzzle>) => resolve(e.data);
    worker!.onerror = () => resolve(generate(seed, difficulty));
    worker!.postMessage({ seed, difficulty });
  });
}

let generating = false;
const diffButtons = overlay.querySelectorAll<HTMLButtonElement>('[data-diff]');
diffButtons.forEach((b) => {
  const d = b.dataset.diff as Difficulty;
  b.innerHTML = `${d}<small>${TECHNIQUES[d]}</small>`;
  b.addEventListener('click', async () => {
    if (generating) return;
    generating = true;
    diffButtons.forEach((x) => (x.disabled = true));
    $('sheetBody').textContent = 'Generating…';
    const puzzle = await requestPuzzle(d);
    generating = false;
    diffButtons.forEach((x) => (x.disabled = false));
    state = stateFor(puzzle);
    save();
    overlay.hidden = true;
    last = performance.now();
    render();
  });
});
$('themeBtn').addEventListener('click', () => {
  themeIndex = (themeIndex + 1) % PALETTES.length;
  applyPalette(PALETTES[themeIndex]);
  store.set(THEME_KEY, PALETTES[themeIndex].name);
  $('themeBtn').textContent = PALETTES[themeIndex].name;
});
$('themeBtn').textContent = PALETTES[themeIndex].name;

render();
if (state.won) {
  winText = `${fmtTime(state.elapsed)} with ${state.mistakes} mistakes. Play again?`;
  openWin();
}

// ---- PWA -----------------------------------------------------------------
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
