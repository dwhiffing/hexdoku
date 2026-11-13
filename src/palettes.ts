// Every color in the game comes from here. To add a theme, add an entry.
// Each key becomes a CSS variable: `ink` -> `--ink`.

export interface Palette {
  name: string;
  bg: string; // page background
  panel: string; // cells, option buttons, overlays
  line: string; // button edges, frame shadow
  frame: string; // board frame
  ink: string; // given digits, main text
  fill: string; // digits the player placed
  dim: string; // muted text, crossed-out options
  accent: string; // selected cell, highlights
  peer: string; // cells sharing a row, column or square with the selection
  bad: string; // mistakes
  mark: string; // "possible" marks
}

export const PALETTES: Palette[] = [
  {
    name: 'Moss',
    bg: '#14201b', panel: '#1c2d26', line: '#2c4a3d', frame: '#3a6150', ink: '#e8f0c8',
    fill: '#9fe0a8', dim: '#4f7565', accent: '#f2c14e', peer: '#263d33', bad: '#e2675a', mark: '#b9d27a',
  },
  {
    name: 'Dusk',
    bg: '#1b1428', panel: '#251c38', line: '#3a2d55', frame: '#5a4a80', ink: '#e9e4ff',
    fill: '#7fd8e6', dim: '#5e5480', accent: '#ff8fb1', peer: '#31264a', bad: '#ff6b6b', mark: '#a99cff',
  },
  {
    name: 'Paper',
    bg: '#efe6d2', panel: '#e4d8bd', line: '#c7b590', frame: '#9d8a63', ink: '#2b2620',
    fill: '#2f5d8a', dim: '#a8987a', accent: '#d9573b', peer: '#d8c9a6', bad: '#b8322a', mark: '#6b7f3a',
  },
  {
    name: 'Ember',
    bg: '#1f1311', panel: '#2b1a17', line: '#4a2b24', frame: '#74402f', ink: '#ffe6cf',
    fill: '#ffb36b', dim: '#7a5546', accent: '#ffd34e', peer: '#3a241f', bad: '#ff5e57', mark: '#f59b7c',
  },
];

export function applyPalette(p: Palette) {
  const root = document.documentElement.style;
  for (const [k, v] of Object.entries(p)) if (k !== 'name') root.setProperty(`--${k}`, v);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', p.bg);
}
