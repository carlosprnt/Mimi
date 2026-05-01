// Generates assets/splash.png — a 1290×2796 (iPhone 15 Pro Max class)
// dark-blue → blue-black vertical gradient with ~250 randomised
// twinkling-style stars baked in, matching the in-app night
// backdrop (#14235A → #020410).
//
// Pure Node (no deps). Hand-rolls a PNG using zlib. Run with:
//   node scripts/generate_splash.js
//
// Re-run anytime to regenerate with a fresh random star pattern.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// --- Config -----------------------------------------------------
const W = 1290;
const H = 2796;
const TOP = { r: 0x14, g: 0x23, b: 0x5a }; // #14235A — colors.night.top
const BOT = { r: 0x02, g: 0x04, b: 0x10 }; // #020410 — colors.night.bottom
const STAR_COUNT = 260;
// ---------------------------------------------------------------

// PNG row format: each row is prefixed with a 1-byte filter type
// (0 = no filter), followed by W*4 RGBA bytes.
const ROW_BYTES = W * 4 + 1;
const pixels = Buffer.alloc(H * ROW_BYTES);

// Vertical gradient: lerp top → bottom row by row.
for (let y = 0; y < H; y++) {
  const t = y / (H - 1);
  const r = Math.round(TOP.r + (BOT.r - TOP.r) * t);
  const g = Math.round(TOP.g + (BOT.g - TOP.g) * t);
  const b = Math.round(TOP.b + (BOT.b - TOP.b) * t);
  const rowStart = y * ROW_BYTES;
  pixels[rowStart] = 0; // filter type
  for (let x = 0; x < W; x++) {
    const off = rowStart + 1 + x * 4;
    pixels[off] = r;
    pixels[off + 1] = g;
    pixels[off + 2] = b;
    pixels[off + 3] = 255;
  }
}

// Helper: blend a white-ish dot into the gradient at (x, y) with the
// given opacity. Approximates StarField's faint dots.
const drawStar = (cx, cy, size, opacity) => {
  for (let dy = -size; dy <= size; dy++) {
    for (let dx = -size; dx <= size; dx++) {
      const px = cx + dx;
      const py = cy + dy;
      if (px < 0 || py < 0 || px >= W || py >= H) continue;
      // Soft falloff so the star edges aren't a harsh square.
      const distSq = dx * dx + dy * dy;
      const radiusSq = size * size;
      if (distSq > radiusSq) continue;
      const falloff = 1 - distSq / (radiusSq + 0.5);
      const a = Math.max(0, Math.min(1, opacity * falloff));
      const off = py * ROW_BYTES + 1 + px * 4;
      // Blend toward (221, 229, 255) — same tint as in StarField.
      pixels[off] = Math.round(pixels[off] * (1 - a) + 221 * a);
      pixels[off + 1] = Math.round(pixels[off + 1] * (1 - a) + 229 * a);
      pixels[off + 2] = Math.round(pixels[off + 2] * (1 - a) + 255 * a);
    }
  }
};

// Sprinkle stars across the canvas. Bigger ones rare, small ones
// common — same 1 / 2 / 4 px feel as the live StarField.
const SIZE_BUCKETS = [1, 1, 1, 1, 2, 2, 3];
for (let i = 0; i < STAR_COUNT; i++) {
  const cx = Math.floor(Math.random() * W);
  const cy = Math.floor(Math.random() * H);
  const size = SIZE_BUCKETS[Math.floor(Math.random() * SIZE_BUCKETS.length)];
  const opacity = 0.4 + Math.random() * 0.55;
  drawStar(cx, cy, size, opacity);
}

// --- PNG encoder (manual) --------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c >>> 0;
  }
  return t;
})();

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crcBuf]);
};

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
ihdr[10] = 0; // compression (deflate)
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace

const idatData = zlib.deflateSync(pixels, { level: 9 });

const signature = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const png = Buffer.concat([
  signature,
  chunk('IHDR', ihdr),
  chunk('IDAT', idatData),
  chunk('IEND', Buffer.alloc(0)),
]);

const outPath = path.resolve(__dirname, '..', 'assets', 'splash.png');
fs.writeFileSync(outPath, png);

const sizeKB = Math.round(png.length / 1024);
console.log(`Wrote ${outPath} (${W}×${H}, ${sizeKB} KB)`);
