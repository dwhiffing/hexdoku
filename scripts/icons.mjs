// Generates the PWA icons as pixel-art PNGs (no dependencies).
// Run: node scripts/icons.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const BG = [0x14, 0x20, 0x1b];
const TILE = [0x1c, 0x2d, 0x26];
const INK = [0xe8, 0xf0, 0xc8];
const ACCENT = [0xf2, 0xc1, 0x4e];

const GLYPHS = {
  1: '..#.. .##.. ..#.. ..#.. ..#.. ..#.. .###.',
  2: '.###. #...# ....# ..##. .#... #.... #####',
  4: '...#. ..##. .#.#. #..#. ##### ...#. ...#.',
  8: '.###. #...# #...# .###. #...# #...# .###.',
};

/** Draw the logo on a `grid` x `grid` pixel canvas with `pad` pixels of margin. */
function logo(grid, pad) {
  const px = Array.from({ length: grid * grid }, () => BG);
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < grid && y < grid) px[y * grid + x] = c; };
  const inner = grid - pad * 2; // area for 2x2 tiles
  const gap = 2;
  const tile = Math.floor((inner - gap) / 2);
  const off = pad + Math.floor((inner - (tile * 2 + gap)) / 2);
  [1, 2, 4, 8].forEach((d, k) => {
    const tx = off + (k % 2) * (tile + gap);
    const ty = off + Math.floor(k / 2) * (tile + gap);
    for (let y = 0; y < tile; y++) for (let x = 0; x < tile; x++) set(tx + x, ty + y, TILE);
    const rows = GLYPHS[d].split(' ');
    const gx = tx + Math.floor((tile - 5) / 2);
    const gy = ty + Math.floor((tile - 7) / 2);
    rows.forEach((row, y) => [...row].forEach((ch, x) => ch === '#' && set(gx + x, gy + y, k === 3 ? ACCENT : INK)));
  });
  return px;
}

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/** Scale the pixel grid up to `size` (nearest neighbour) and encode as PNG. */
function png(px, grid, size) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const c = px[Math.floor((y * grid) / size) * grid + Math.floor((x * grid) / size)];
      const o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = c[0]; raw[o + 1] = c[1]; raw[o + 2] = c[2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public/icons', { recursive: true });
const normal = logo(32, 2);
const maskable = logo(40, 6); // keeps the logo inside the maskable safe zone
writeFileSync('public/icons/icon-192.png', png(normal, 32, 192));
writeFileSync('public/icons/icon-512.png', png(normal, 32, 512));
writeFileSync('public/icons/maskable-512.png', png(maskable, 40, 512));
writeFileSync('public/icons/apple-touch-icon.png', png(normal, 32, 180));
writeFileSync('public/favicon.png', png(normal, 32, 64));
console.log('icons written to public/icons');
