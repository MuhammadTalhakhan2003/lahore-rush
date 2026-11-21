// Procedural buildings per district. Local frame: the facade is at x = 0 facing +x,
// the body extends toward -x, and the building is centred on z (width along z).
// Returns { group, w } — w is the frontage width along the road.
import { Builder, pick, rand, randi } from '../render/kit.js';
import { signUV, neonUV, SHOPS, NEON } from '../render/textures.js';
import { posters } from './posters.js';
import { parkSegment } from './landmarks.js';

const FACE = Math.PI / 2; // rotate a +z plane to face +x

function shopFront(b, w, d, district) {
  const shutterCol = pick([0x8a8f96, 0x6b7078, 0x9aa0a8]);
  const n = Math.max(1, Math.floor(w / 3.6));
  const sw = w / n;
  for (let i = 0; i < n; i++) {
    const z = -w / 2 + sw * (i + 0.5);
    const open = Math.random() < 0.7;
    if (open) {
      b.box(0.1, 2.4, sw - 0.5, 0x2a2018, 0.02, 1.3, z);                     // dark interior
      b.box(0.5, 0.8, sw - 0.8, pick([0xd9a52a, 0xc23b22, 0x3f8f2f, 0xe8e2d0]), 0.25, 0.4, z); // goods
      b.box(0.08, 0.12, sw - 0.6, 0xfff0c8, 0.05, 2.45, z, { kind: 'glow' });  // tube light
    } else {
      for (let k = 0; k < 8; k++) b.box(0.06, 0.28, sw - 0.5, shutterCol, 0.04, 0.3 + k * 0.3, z, { kind: 'shiny' });
    }
    // striped awning
    const ac = pick(district.wood);
    for (let k = 0; k < 4; k++) b.box(0.32, 0.05, sw - 0.2, k % 2 ? ac : 0xf5f0e6, 0.25 + k * 0.3, 2.95 - k * 0.07, z);
    // shop sign
    b.plane(sw - 0.4, 0.62, 'sign', 0xffffff, [0.07, 3.45, z], [0, FACE, 0], { uv: signUV(randi(0, SHOPS.length - 1)) });
  }
}

function oldCity(district) {
  const b = new Builder();
  const w = rand(7, 12), floors = randi(2, 4), fh = 3.2, d = rand(7, 10);
  const h = 3.8 + floors * fh;
  const wall = pick(district.walls);
  b.box(d, 3.8, w, wall, -d / 2, 1.9, 0);
  b.box(d, floors * fh, w, wall, -d / 2, 3.8 + (floors * fh) / 2, 0, { kind: 'facade' });
  shopFront(b, w, d, district);
  if (Math.random() < 0.7) posters(b, w, 4.6);
  // weathered stains in the corners of old walls
  for (let i = 0, n = randi(1, 3); i < n; i++) { const z = Math.random() < 0.5 ? -w / 2 + 0.4 : w / 2 - 0.4; b.plane(rand(0.6, 1.1), rand(0.6, 1.1), 'stain', 0xffffff, [0.09 + i * 0.002, rand(0.3, 0.9), z + rand(-0.2, 0.2)], [0, FACE, rand(0, 6)]); }
  b.box(0.3, 0.2, w + 0.1, 0xf5f0e6, 0.1, 3.8, 0);
  // jharokas (wooden balconies)
  const wood = pick(district.wood);
  const nb = Math.max(1, Math.floor(w / 4.5));
  for (let f = 0; f < floors; f++) {
    if (Math.random() < 0.35) continue;
    for (let i = 0; i < nb; i++) {
      const z = -w / 2 + (w / nb) * (i + 0.5);
      const y = 3.8 + f * fh + 1.2;
      b.box(0.9, 0.15, 2.0, wood, 0.45, y - 0.9, z);
      b.box(0.85, 1.4, 1.9, wood, 0.42, y, z);
      b.box(0.05, 0.9, 1.4, 0x26323e, 0.86, y + 0.1, z, { kind: 'glass' });
      b.box(1.1, 0.12, 2.3, wood, 0.48, y + 0.82, z, { r: [0, 0, -0.25] });
      for (let k = 0; k < 4; k++) b.box(0.06, 0.06, 0.06, 0xffd60a, 0.9, y - 0.75, z - 0.75 + k * 0.5, { kind: 'shiny' });
    }
  }
  // parapet + roof clutter
  b.box(d, 0.6, w, wall, -d / 2, h + 0.3, 0);
  b.box(0.3, 0.12, w + 0.2, 0xf5f0e6, 0.05, h + 0.62, 0);
  if (Math.random() < 0.6) b.cyl(0.6, 0.6, 1.1, pick([0x111111, 0x1565c0, 0xf2f2f2]), -d * 0.6, h + 1.15, rand(-w / 3, w / 3), { seg: 10 });
  if (Math.random() < 0.35) {
    // small chhatri (domed kiosk)
    const z = rand(-w / 4, w / 4);
    for (const dx of [-0.8, 0.8]) for (const dz of [-0.8, 0.8]) b.box(0.15, 1.4, 0.15, 0xf5f0e6, -2 + dx, h + 1.3, z + dz);
    b.box(2, 0.2, 2, 0xf5f0e6, -2, h + 2.05, z);
    b.sphere(1.0, 0xf5f0e6, -2, h + 2.1, z, { seg: 10, half: true });
    b.cone(0.1, 0.5, 0xffc93c, -2, h + 3.3, z, { kind: 'shiny' });
  }
  if (Math.random() < 0.5) b.box(0.05, 0.05, rand(1, 2), 0x777777, -d * 0.3, h + 1.8, 0, { r: [0.4, 0, 0] }); // antenna
  // laundry line across the front
  if (Math.random() < 0.4) {
    const y = 3.8 + randi(0, floors - 1) * fh + 2.6;
    b.box(0.02, 0.02, w * 0.8, 0x333333, 0.6, y, 0);
    for (let i = 0; i < 6; i++) b.box(0.04, rand(0.4, 0.7), rand(0.3, 0.6), pick([0xe84a8a, 0x1fa2d6, 0xffd60a, 0xffffff, 0x2e9e5a]), 0.6, y - 0.35, -w * 0.35 + i * w * 0.14);
  }
  return { group: b.build(), w };
}

/** Pastel sea-facing apartment blocks with balconies and a cafe at street level. */
function seaFront(district) {
  const b = new Builder();
  const w = rand(10, 15), d = rand(9, 12);
  const floors = randi(3, 6), fh = 3.1, h = 3.6 + floors * fh;
  const wall = pick(district.walls);
  const accent = pick(district.wood);
  b.box(d, 3.6, w, 0xf5f5f0, -d / 2, 1.8, 0);
  b.box(0.08, 2.6, w - 1.2, 0x9fd8ff, 0.03, 1.5, 0, { kind: 'glass' });
  for (let k = 0; k < 5; k++) b.box(0.3, 0.05, w - 0.4, k % 2 ? accent : 0xffffff, 0.2 + k * 0.28, 3.3 - k * 0.07, 0);
  b.plane(Math.min(w - 2, 6), 0.6, 'sign', 0xffffff, [0.06, 3.85, 0], [0, FACE, 0], { uv: signUV(randi(0, SHOPS.length - 1)) });
  b.box(d, floors * fh, w, wall, -d / 2, 3.6 + (floors * fh) / 2, 0, { kind: 'facade' });
  for (let f = 0; f < floors; f++) {
    const y = 3.6 + f * fh + 0.2;
    b.box(1.1, 0.14, w - 1.2, 0xf0f0f0, 0.55, y, 0);
    b.box(0.05, 0.85, w - 1.2, accent, 1.08, y + 0.45, 0);
    if (Math.random() < 0.35) b.box(0.05, 0.6, rand(0.6, 1.2), pick([0xe84a8a, 0x1fa2d6, 0xffd60a, 0xffffff]), 1.0, y + 0.55, rand(-w / 3, w / 3));
  }
  b.box(d + 0.3, 0.4, w + 0.3, 0xf5f5f5, -d / 2, h + 0.2, 0);
  b.cyl(0.6, 0.6, 1.1, 0x1565c0, -d * 0.6, h + 0.95, rand(-w / 4, w / 4), { seg: 10 });
  if (Math.random() < 0.5) b.box(0.15, 0.15, 2.2, 0x777777, -d * 0.3, h + 1.3, 0, { r: [0.5, 0, 0] });
  return { group: b.build(), w };
}

function neonTower(district) {
  const b = new Builder();
  const w = rand(10, 16), d = rand(10, 16);
  const h = rand(14, 42);
  const wall = pick(district.walls);
  const glassy = Math.random() < 0.6;
  // podium with shop windows
  b.box(d, 4.5, w, 0x2a2e36, -d / 2, 2.25, 0);
  b.box(0.08, 3, w - 1, 0x9fd8ff, 0.02, 2, 0, { kind: 'glass' });
  const col = pick(district.neon);
  b.box(0.1, 0.12, w, col, 0.08, 4.4, 0, { kind: 'glow' });
  if (Math.random() < 0.5) posters(b, w, 1.4, 2);
  b.plane(Math.min(w - 2, 7), 1.4, 'neon', col, [0.12, 5.4, 0], [0, FACE, 0], { uv: neonUV(randi(0, NEON.length - 1)) });
  // tower
  const tw = w - rand(0, 3), td = d - rand(0, 3);
  b.box(td, h, tw, glassy ? 0x6f8fb0 : wall, -td / 2 - 0.5, 4.5 + h / 2, 0, { kind: 'facade' });
  // vertical neon strips on corners
  const strip = pick(district.neon);
  for (const s of [-1, 1]) b.box(0.12, h, 0.12, strip, -0.45, 4.5 + h / 2, s * (tw / 2 + 0.02), { kind: 'glow' });
  b.box(td + 0.4, 0.4, tw + 0.4, 0x2a2e36, -td / 2 - 0.5, 4.5 + h + 0.2, 0);
  b.box(0.1, 0.12, tw + 0.4, strip, -0.25, 4.5 + h + 0.2, 0, { kind: 'glow' });
  if (Math.random() < 0.6) {
    b.box(0.2, 5, 0.2, 0x888888, -td / 2, 4.5 + h + 2.5, 0);
    b.sphere(0.2, 0xff2020, -td / 2, 4.5 + h + 5.1, 0, { kind: 'glow', seg: 6 });
  }
  return { group: b.build(), w };
}

/** Mall Road / Anarkali colonial block: red brick, white arcades, domed corner turrets, the odd clock tower. */
function colonial(district) {
  const b = new Builder();
  const w = rand(14, 22), d = rand(10, 14);
  const brick = pick([0xb5563a, 0xa84a32, 0xc4683f]);
  const white = 0xf3ecdc;
  const h1 = 4.6, h2 = 4.2, H = h1 + h2;
  b.box(d, H, w, brick, -d / 2, H / 2, 0);
  // ground-floor arcade
  const n = Math.max(2, Math.floor(w / 3));
  const aw = w / n;
  for (let i = 0; i < n; i++) {
    const z = -w / 2 + aw * (i + 0.5);
    b.box(0.2, 3.2, aw - 0.8, 0x2a2018, 0.02, 1.6, z);
    b.cyl((aw - 0.8) / 2, (aw - 0.8) / 2, 0.22, 0x2a2018, 0.02, 3.2, z, { r: [0, 0, Math.PI / 2], seg: 12 });
    b.box(0.3, 4.4, 0.4, white, 0.12, 2.2, z - aw / 2);
    b.box(0.08, 0.12, aw - 1.0, 0xfff0c8, 0.1, 3.0, z, { kind: 'glow' });
    if (Math.random() < 0.6) b.plane(aw - 0.6, 0.5, 'sign', 0xffffff, [0.14, 3.95, z], [0, FACE, 0], { uv: signUV(randi(0, SHOPS.length - 1)) });
    // upper floor: tall white-framed windows
    b.box(0.08, 2.4, 1.1, 0x26323e, 0.03, h1 + 1.8, z, { kind: 'glass' });
    b.box(0.12, 0.25, 1.5, white, 0.06, h1 + 3.1, z);
    b.box(0.12, 0.15, 1.4, white, 0.06, h1 + 0.55, z);
  }
  b.box(0.35, 0.35, w + 0.2, white, 0.1, h1, 0);              // string course
  b.box(0.45, 0.4, w + 0.4, white, 0.1, H, 0);                // cornice
  for (let z = -w / 2 + 0.5; z < w / 2; z += 1.2) b.box(0.3, 0.5, 0.5, brick, 0.05, H + 0.45, z); // battlements
  // corner turrets with little white domes
  for (const s of [-1, 1]) {
    b.box(1.6, H + 1.6, 1.6, brick, -0.6, (H + 1.6) / 2, s * (w / 2 - 0.8));
    b.cyl(0.85, 0.85, 0.3, white, -0.6, H + 1.75, s * (w / 2 - 0.8), { seg: 10 });
    b.sphere(0.8, white, -0.6, H + 1.9, s * (w / 2 - 0.8), { seg: 10, half: true, s: [1, 1.3, 1] });
    b.cone(0.08, 0.6, 0xd4af37, -0.6, H + 3.2, s * (w / 2 - 0.8), { kind: 'shiny' });
  }
  if (Math.random() < 0.22) {
    // clock tower
    const th = 9;
    b.box(3, th, 3, brick, -d / 2, H + th / 2, 0);
    for (const [dx, dz, ry] of [[1.52, 0, FACE], [-1.52, 0, -FACE], [0, 1.52, 0], [0, -1.52, Math.PI]]) {
      b.cyl(0.9, 0.9, 0.06, 0xfaf6e8, -d / 2 + dx, H + th - 2, dz, { r: [ry === 0 || ry === Math.PI ? Math.PI / 2 : 0, 0, ry === 0 || ry === Math.PI ? 0 : Math.PI / 2], seg: 16, kind: 'glow' });
    }
    b.box(3.4, 0.4, 3.4, white, -d / 2, H + th, 0);
    b.sphere(1.5, white, -d / 2, H + th + 0.2, 0, { seg: 12, half: true, s: [1, 1.4, 1] });
  }
  return { group: b.build(), w };
}

/** Canal-side bungalow behind a boundary wall draped in bougainvillea. */
function bungalow(district) {
  const b = new Builder();
  const w = rand(14, 20);
  const wall = pick(district.walls);
  b.box(0.3, 2.2, w, wall, 0, 1.1, 0);
  b.box(0.4, 0.15, w + 0.1, 0xb5563a, 0, 2.25, 0);
  const gz = rand(-w / 4, w / 4);
  b.box(0.12, 1.9, 3, pick([0x1b1b1b, 0x3a3a3a, 0x2e6b8a]), 0.12, 0.95, gz, { kind: 'shiny' });   // gate
  for (let i = 0; i < 8; i++) {                                                                       // bougainvillea
    const z = rand(-w / 2, w / 2);
    if (Math.abs(z - gz) < 1.8) continue;
    b.sphere(rand(0.5, 0.9), pick([0xe0218a, 0xd6157a, 0xf06292, 0xff8a3d]), 0.2, 2.2 + rand(0, 0.6), z, { seg: 7, s: [0.6, 0.8, 1.2] });
  }
  const hd = rand(8, 11), hh = randi(1, 2) * 3.4;
  b.box(hd, hh, w - 3, pick([0xf5f0e6, 0xece2cc, 0xe8dcc4]), -4 - hd / 2, hh / 2, 0);
  b.box(hd + 0.6, 0.3, w - 2.4, 0xb5563a, -4 - hd / 2, hh + 0.15, 0);
  for (let z = -w / 2 + 3; z < w / 2 - 2; z += 2.6) b.box(0.08, 1.4, 1.2, 0x26323e, -3.96, Math.min(hh - 1.4, 1.9), z, { kind: 'glass' });
  b.cyl(0.55, 0.55, 1.0, pick([0x111111, 0x1565c0]), -6 - hd / 2, hh + 0.8, rand(-w / 4, w / 4), { seg: 10 });  // water tank
  b.sphere(rand(2, 2.8), pick([0x3f7f2f, 0x2f6b2a]), -2, rand(4.5, 6), rand(-w / 3, w / 3), { seg: 8 });       // lawn tree
  b.cyl(0.18, 0.25, 4.4, 0x5a4030, -2, 2.2, rand(-w / 3, w / 3), { seg: 6 });
  return { group: b.build(), w };
}

export function createBuilding(district) {
  if (district.id === 'minar') return parkSegment(district);
  if (district.id === 'androon') return oldCity(district);
  if (district.id === 'anarkali') return colonial(district);
  if (district.id === 'canal') return bungalow(district);
  return Math.random() < 0.25 ? seaFront(district) : neonTower(district);
}
