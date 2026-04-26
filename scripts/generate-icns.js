#!/usr/bin/env node
// Build build/icon.icns from public/pwa-512x512.png using macOS sips + iconutil.
// macOS-only (the tools aren't on Windows/Linux). Run via: node scripts/generate-icns.js

import { execSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

if (process.platform !== 'darwin') {
  console.error('generate-icns.js requires macOS (sips + iconutil).');
  process.exit(1);
}

const SRC = 'public/pwa-512x512.png';
const OUT = 'build/icon.icns';

if (!existsSync(SRC)) {
  console.error(`Source icon not found: ${SRC}`);
  process.exit(1);
}

const tmp = mkdtempSync(join(tmpdir(), 'inkmd-icns-'));
const upscaled = join(tmp, 'icon-1024.png');
const iconset = join(tmp, 'inkmd.iconset');
mkdirSync(iconset);

const sips = (size, name) =>
  execSync(`sips -z ${size} ${size} "${upscaled}" --out "${join(iconset, name)}"`, { stdio: 'ignore' });

execSync(`sips -z 1024 1024 "${SRC}" --out "${upscaled}"`, { stdio: 'ignore' });

sips(16,   'icon_16x16.png');
sips(32,   'icon_16x16@2x.png');
sips(32,   'icon_32x32.png');
sips(64,   'icon_32x32@2x.png');
sips(128,  'icon_128x128.png');
sips(256,  'icon_128x128@2x.png');
sips(256,  'icon_256x256.png');
sips(512,  'icon_256x256@2x.png');
sips(512,  'icon_512x512.png');
copyFileSync(upscaled, join(iconset, 'icon_512x512@2x.png'));

mkdirSync('build', { recursive: true });
// NB: iconutil flag order is `-c icns -o OUT INPUT`. Reversing fails silently.
execSync(`iconutil -c icns -o "${OUT}" "${iconset}"`, { stdio: 'inherit' });
rmSync(tmp, { recursive: true, force: true });
console.log(`Wrote ${OUT}`);
