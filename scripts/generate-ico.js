/**
 * Generates a multi-size ICO: white circle with 7 spokes on a red rounded square.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RED = [0xc5, 0x23, 0x2a];
const CREAM = [0xfa, 0xf6, 0xf0];

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return dist(px, py, x1, y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return dist(px, py, x1 + t * dx, y1 + t * dy);
}

function drawIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const c = size / 2;
  const cornerR = size * 0.15;

  // Spoke endpoints (7 spokes, evenly spaced, starting from top)
  const spokeR = size * 0.328; // radius to spoke tips
  const spokes = [];
  for (let i = 0; i < 7; i++) {
    const angle = (i * 2 * Math.PI / 7) - Math.PI / 2;
    spokes.push({
      x: c + spokeR * Math.cos(angle),
      y: c + spokeR * Math.sin(angle),
    });
  }

  const circleR = size * 0.3125; // outer circle radius
  const circleW = size * 0.055;  // circle stroke width
  const spokeW = size * 0.055;   // spoke stroke width
  const hubR = size * 0.07;      // center hub radius

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;

      // Rounded rect test
      const inRect = (() => {
        const m = 0;
        const l = m, r = size - m - 1, t = m, b = size - m - 1;
        const cr = cornerR;
        if (x >= l + cr && x <= r - cr) return y >= t && y <= b;
        if (y >= t + cr && y <= b - cr) return x >= l && x <= r;
        const corners = [[l + cr, t + cr], [r - cr, t + cr], [l + cr, b - cr], [r - cr, b - cr]];
        for (const [cx2, cy2] of corners) {
          if (dist(x, y, cx2, cy2) <= cr) return true;
        }
        return false;
      })();

      if (!inRect) {
        pixels[i] = 0; pixels[i + 1] = 0; pixels[i + 2] = 0; pixels[i + 3] = 0;
        continue;
      }

      let isCream = false;

      // Hub (filled circle at center)
      if (dist(x, y, c, c) <= hubR) {
        isCream = true;
      }

      // Outer circle ring
      if (!isCream) {
        const d = Math.abs(dist(x, y, c, c) - circleR);
        if (d <= circleW / 2) isCream = true;
      }

      // Spokes
      if (!isCream) {
        for (const s of spokes) {
          if (distToSegment(x, y, c, c, s.x, s.y) <= spokeW / 2) {
            isCream = true;
            break;
          }
        }
      }

      if (isCream) {
        pixels[i] = CREAM[2]; pixels[i + 1] = CREAM[1]; pixels[i + 2] = CREAM[0]; pixels[i + 3] = 0xff;
      } else {
        pixels[i] = RED[2]; pixels[i + 1] = RED[1]; pixels[i + 2] = RED[0]; pixels[i + 3] = 0xff;
      }
    }
  }
  return pixels;
}

function createBmpEntry(size, pixels) {
  const bmpInfoSize = 40;
  const rowSize = size * 4;
  const maskRowSize = Math.ceil(size / 32) * 4;
  const dataSize = bmpInfoSize + size * rowSize + size * maskRowSize;
  const buf = Buffer.alloc(dataSize);
  buf.writeUInt32LE(bmpInfoSize, 0);
  buf.writeInt32LE(size, 4);
  buf.writeInt32LE(size * 2, 8);
  buf.writeUInt16LE(1, 12);
  buf.writeUInt16LE(32, 14);
  buf.writeUInt32LE(0, 16);
  buf.writeUInt32LE(size * rowSize + size * maskRowSize, 20);
  for (let y = size - 1; y >= 0; y--) {
    const srcOff = y * size * 4;
    const dstOff = bmpInfoSize + (size - 1 - y) * rowSize;
    pixels.copy(buf, dstOff, srcOff, srcOff + rowSize);
  }
  return buf;
}

function createIco(sizes) {
  const entries = sizes.map((s) => ({ size: s, data: createBmpEntry(s, drawIcon(s)) }));
  const headerSize = 6 + entries.length * 16;
  let offset = headerSize;
  const buf = Buffer.alloc(headerSize + entries.reduce((sum, e) => sum + e.data.length, 0));
  buf.writeUInt16LE(0, 0); buf.writeUInt16LE(1, 2); buf.writeUInt16LE(entries.length, 4);
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i], dirOff = 6 + i * 16;
    buf.writeUInt8(e.size >= 256 ? 0 : e.size, dirOff);
    buf.writeUInt8(e.size >= 256 ? 0 : e.size, dirOff + 1);
    buf.writeUInt8(0, dirOff + 2); buf.writeUInt8(0, dirOff + 3);
    buf.writeUInt16LE(1, dirOff + 4); buf.writeUInt16LE(32, dirOff + 6);
    buf.writeUInt32LE(e.data.length, dirOff + 8); buf.writeUInt32LE(offset, dirOff + 12);
    offset += e.data.length;
  }
  offset = headerSize;
  for (const e of entries) { e.data.copy(buf, offset); offset += e.data.length; }
  return buf;
}

const ico = createIco([16, 32, 48, 256]);
const outPath = path.join(__dirname, '..', 'build', 'icon.ico');
fs.writeFileSync(outPath, ico);
console.log(`Created ${outPath} (${ico.length} bytes)`);
