#!/usr/bin/env node
// One-shot ICO generator for the branded favicon. Emits src/app/favicon.ico —
// a 32×32 ICO containing a PNG of the brand mark (dark teal rounded square
// with green "PM" letters). Re-run only when the brand mark changes.
//
//   node scripts/gen-favicon.mjs
//
// We carry both src/app/icon.svg (modern, vector, crisp) AND src/app/favicon.ico
// (legacy fallback for Safari + browsers that hard-request /favicon.ico) so the
// branded mark survives every browser path.

import { writeFileSync } from 'node:fs';
import { deflateSync, crc32 } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SIZE = 32;
const BG = [0x00, 0x35, 0x35, 0xff]; // dark teal #003535
const FG = [0x00, 0xc6, 0x8c, 0xff]; // brand green #00C68C
const TRANSPARENT = [0, 0, 0, 0];

// Hand-drawn 5×7 pixel-art glyphs for P and M, scaled up via pixel doubling.
// 1 = brand green, 0 = teal background.
const P = [
  [1, 1, 1, 1, 0],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 0],
  [1, 0, 0, 0, 0],
  [1, 0, 0, 0, 0],
  [1, 0, 0, 0, 0],
];
const M = [
  [1, 0, 0, 0, 1],
  [1, 1, 0, 1, 1],
  [1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
];

// Build the raw RGBA buffer.
const pixels = new Uint8Array(SIZE * SIZE * 4);
function set(x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  pixels[i] = r;
  pixels[i + 1] = g;
  pixels[i + 2] = b;
  pixels[i + 3] = a;
}

// Rounded-corner teal background (radius 4 px).
const radius = 4;
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    // Distance from nearest corner — outside the rounded region stays transparent.
    const cx = x < radius ? radius : x >= SIZE - radius ? SIZE - 1 - radius : x;
    const cy = y < radius ? radius : y >= SIZE - radius ? SIZE - 1 - radius : y;
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy <= radius * radius) set(x, y, BG);
    else set(x, y, TRANSPARENT);
  }
}

// Draw a 5×7 glyph scaled 2× at (originX, originY).
function drawGlyph(glyph, originX, originY) {
  for (let gy = 0; gy < 7; gy++) {
    for (let gx = 0; gx < 5; gx++) {
      if (!glyph[gy][gx]) continue;
      const px = originX + gx * 2;
      const py = originY + gy * 2;
      // 2×2 block per source pixel
      set(px, py, FG);
      set(px + 1, py, FG);
      set(px, py + 1, FG);
      set(px + 1, py + 1, FG);
    }
  }
}

// Center the two glyphs horizontally: each is 5*2=10 px wide, 1 px gap = 21 px,
// (32 - 21) / 2 = 5.5 → start at x=5. Vertically center: 7*2=14, (32-14)/2 = 9.
drawGlyph(P, 5, 9);
drawGlyph(M, 5 + 10 + 1, 9);

// ── PNG encode ──────────────────────────────────────────────────────────────
function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function makePng() {
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // color type 6 = RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  // IDAT — scanlines prefixed with filter byte 0 (None).
  const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
  for (let y = 0; y < SIZE; y++) {
    raw[y * (SIZE * 4 + 1)] = 0;
    const scanline = pixels.subarray(y * SIZE * 4, (y + 1) * SIZE * 4);
    raw.set(scanline, y * (SIZE * 4 + 1) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── ICO wrap ────────────────────────────────────────────────────────────────
const png = makePng();
const iconDir = Buffer.alloc(6);
iconDir.writeUInt16LE(0, 0); // reserved
iconDir.writeUInt16LE(1, 2); // type: ICO
iconDir.writeUInt16LE(1, 4); // image count

const entry = Buffer.alloc(16);
entry.writeUInt8(SIZE === 256 ? 0 : SIZE, 0); // width (0 = 256)
entry.writeUInt8(SIZE === 256 ? 0 : SIZE, 1); // height
entry.writeUInt8(0, 2); // palette count
entry.writeUInt8(0, 3); // reserved
entry.writeUInt16LE(1, 4); // planes
entry.writeUInt16LE(32, 6); // bpp
entry.writeUInt32LE(png.length, 8);
entry.writeUInt32LE(6 + 16, 12); // PNG offset

const ico = Buffer.concat([iconDir, entry, png]);

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'src/app/favicon.ico');
writeFileSync(out, ico);
console.log(`Wrote ${out} (${ico.length} bytes)`);
