import fs from 'fs';
import { deflateSync } from 'zlib';

const RED = [0xc5, 0x23, 0x2a];
const CREAM = [0xfa, 0xf6, 0xf0];

function dist(x1, y1, x2, y2) { return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2); }
function distSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, lenSq = dx * dx + dy * dy;
  if (!lenSq) return dist(px, py, x1, y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return dist(px, py, x1 + t * dx, y1 + t * dy);
}

function drawIcon(size) {
  const c = size / 2, cornerR = size * 0.12;
  const spokeR = size * 0.328, circleR = size * 0.3125;
  const circleW = size * 0.05, spokeW = size * 0.05, hubR = size * 0.065;
  const spokes = [];
  for (let i = 0; i < 7; i++) {
    const a = (i * 2 * Math.PI / 7) - Math.PI / 2;
    spokes.push({ x: c + spokeR * Math.cos(a), y: c + spokeR * Math.sin(a) });
  }
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const l = 0, r = size - 1, t = 0, b = size - 1, cr = cornerR;
      let inRect = false;
      if (x >= l + cr && x <= r - cr && y >= t && y <= b) inRect = true;
      else if (y >= t + cr && y <= b - cr && x >= l && x <= r) inRect = true;
      else {
        for (const [cx2, cy2] of [[l + cr, t + cr], [r - cr, t + cr], [l + cr, b - cr], [r - cr, b - cr]]) {
          if (dist(x, y, cx2, cy2) <= cr) { inRect = true; break; }
        }
      }
      if (!inRect) { pixels[i] = 0; pixels[i + 1] = 0; pixels[i + 2] = 0; pixels[i + 3] = 0; continue; }
      let isCream = false;
      if (dist(x, y, c, c) <= hubR) isCream = true;
      if (!isCream && Math.abs(dist(x, y, c, c) - circleR) <= circleW / 2) isCream = true;
      if (!isCream) { for (const s of spokes) { if (distSeg(x, y, c, c, s.x, s.y) <= spokeW / 2) { isCream = true; break; } } }
      if (isCream) { pixels[i] = CREAM[0]; pixels[i + 1] = CREAM[1]; pixels[i + 2] = CREAM[2]; pixels[i + 3] = 0xff; }
      else { pixels[i] = RED[0]; pixels[i + 1] = RED[1]; pixels[i + 2] = RED[2]; pixels[i + 3] = 0xff; }
    }
  }
  return pixels;
}

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (const b of data) { crc ^= b; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0); }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makePNG(size) {
  const pixels = drawIcon(size);
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const compressed = deflateSync(raw);
  const chunks = [Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])];

  function addChunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const typeB = Buffer.from(type);
    const crcVal = crc32(Buffer.concat([typeB, data]));
    const crcB = Buffer.alloc(4); crcB.writeUInt32BE(crcVal);
    chunks.push(len, typeB, data, crcB);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  addChunk('IHDR', ihdr);
  addChunk('IDAT', compressed);
  addChunk('IEND', Buffer.alloc(0));
  return Buffer.concat(chunks);
}

for (const [size, name] of [[192, 'public/pwa-192x192.png'], [512, 'public/pwa-512x512.png'], [180, 'public/apple-touch-icon.png']]) {
  const png = makePNG(size);
  fs.writeFileSync(name, png);
  console.log(`Created ${name} (${png.length} bytes)`);
}
