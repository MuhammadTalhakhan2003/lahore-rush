// Peshawar scenery: parks, landmarks (all procedural), river-road life, patang kites.
import { Builder, pick, rand } from '../render/kit.js';
import { signUV, SHOPS, roadsignUV, gateUV } from '../render/textures.js';

const GREEN = 0x0b6e3a;
const KITE_COLS = [0xd62828, 0xffd60a, 0x0b8f3a, 0x1565c0, 0xe91e63, 0xff7f11, 0x6a1b9a, 0xffffff];

function flagPole(b, x, z) {
  b.cyl(0.06, 0.08, 9, 0xdddddd, x, 4.5, z, { seg: 6, kind: 'shiny' });
  b.box(0.05, 1.6, 0.8, 0xffffff, x, 8.2, z + 0.45);                 // white band
  b.box(0.05, 1.6, 1.9, GREEN, x, 8.2, z + 1.8);                     // green field
  b.torus(0.42, 0.09, 0xffffff, x + 0.04, 8.25, z + 1.8, { r: [0, Math.PI / 2, 0], arc: Math.PI * 1.35 });
  b.sphere(0.12, 0xffffff, x + 0.04, 8.6, z + 2.15, { seg: 5 });
}

/** Garden strip: hedges, fountains, flags, trees. Faces +x like the buildings. */
export function parkSegment() {
  const b = new Builder();
  const w = rand(16, 24);
  b.box(0.8, 0.9, w, 0x2f6b2a, -0.6, 0.45, 0);                         // hedge
  for (let z = -w / 2; z <= w / 2; z += 4) b.box(0.18, 1.2, 0.18, 0xb5563a, -0.2, 0.6, z); // red-brick posts
  b.box(4, 0.06, w, 0xd8d2c4, -6, 0.08, 0);                            // walkway
  const r = Math.random();
  if (r < 0.4) {
    // Mughal-style fountain pool with jets
    b.box(5.2, 0.5, 5.2, 0xb5563a, -12, 0.25, 0);
    b.box(4.6, 0.05, 4.6, 0x4fc3f7, -12, 0.48, 0, { kind: 'water' });
    for (const dx of [-1.4, 0, 1.4]) b.cone(0.18, 1.6, 0xbfe9ff, -12 + dx, 1.3, 0, { seg: 6, kind: 'glow' });
  } else if (r < 0.6) {
    // a family picnic on a durrie
    b.box(2.4, 0.03, 2, pick([0xd62828, 0x1565c0, 0xf2b705]), -10, 0.07, 0);
    for (let i = 0; i < 3; i++) { const x = -10.6 + i * 0.6; b.box(0.36, 0.5, 0.3, pick([0xe84a8a, 0xf5f5f0, 0x2e9e5a]), x, 0.32, 0.3); b.sphere(0.13, 0xa86d45, x, 0.68, 0.3, { seg: 6 }); }
    b.cyl(0.12, 0.12, 0.25, 0xc0c0c0, -9.2, 0.2, -0.3, { seg: 8, kind: 'shiny' });  // thermos of chaa
  } else {
    for (let i = 0; i < 3; i++) b.sphere(rand(1.2, 1.8), pick([0x3f7f2f, 0x4f8f35, 0x2f6b2a]), -10 - rand(0, 6), rand(2.4, 3.4), -w / 3 + i * (w / 3), { seg: 7 });
    for (let i = 0; i < 3; i++) b.cyl(0.15, 0.2, 2.4, 0x5a4030, -10 - rand(0, 6), 1.2, -w / 3 + i * (w / 3), { seg: 5 });
  }
  if (Math.random() < 0.5) flagPole(b, -3, rand(-w / 3, w / 3));
  for (let i = 0; i < 4; i++) b.box(1.6, 0.25, 1.6, pick([0xe84a8a, 0xffd60a, 0xff7a1a, 0xffffff]), -3.5 - rand(0, 2), 0.15, -w / 2 + 2 + i * (w / 4));
  return { group: b.build(), w };
}

export function createFlagLamp() {
  const b = new Builder();
  flagPole(b, 0, 0);
  return b.build();
}

/** Merlons (battlements) along a wall that runs along z at x. */
function merlons(b, x, y, z0, z1, color, step = 2.4) {
  for (let z = z0; z <= z1; z += step) b.box(1.4, 1.1, 1.4, color, x, y + 0.55, z);
}

/** Bala Hisar Fort — the brown mud-and-brick fortress above the old city, with its flag. Faces +x. */
export function createFortFallback() {
  const b = new Builder();
  const C = 0x8a6a4a, D = 0x6f5238, L = 0xa88660;
  b.box(8, 15, 150, C, 0, 7.5, 0);                                           // long curtain wall
  merlons(b, 0, 15, -72, 72, D);
  b.box(7, 3, 150, D, 4.2, 1.5, 0);                                          // sloping base
  for (const z of [-75, -25, 25, 75]) {                                      // round bastions
    b.cyl(8, 9, 20, L, 3, 10, z, { seg: 14 });
    b.cyl(8.8, 8.8, 1.2, D, 3, 20.5, z, { seg: 14 });
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; b.box(1.6, 1.4, 1.6, D, 3 + Math.cos(a) * 8, 21.4, z + Math.sin(a) * 8); }
  }
  b.box(14, 26, 22, L, 5, 13, 0);                                            // gatehouse
  b.box(1, 14, 10, 0x1d130c, 12.2, 8, 0);                                    // dark arched gate
  b.sphere(5, 0x1d130c, 12.2, 15, 0, { s: [0.18, 1, 1], seg: 10 });
  merlons(b, 5, 26, -9, 9, D, 2.2);
  for (let i = 0; i < 4; i++) b.box(0.4, 3, 0.4, 0xd4af37, 12.4, 4 + i * 0.001, -9 + i * 6, { kind: 'shiny' });
  b.box(0.3, 22, 0.3, 0xcfcfcf, 5, 38, 0, { kind: 'shiny' });                // flag pole
  b.box(0.1, 3.2, 5, 0x0b6e3a, 5, 47, -2.7);                                 // Pakistani flag: green field...
  b.box(0.1, 3.2, 1.4, 0xffffff, 5, 47, -5.4);                               // ...white hoist stripe
  b.sphere(0.9, 0xffffff, 5.1, 47, -2.6, { seg: 8 });                        // ...and the crescent hint
  for (const z of [-40, 40]) b.box(10, 8, 12, D, -6, 19, z);                 // inner buildings peeking over the wall
  return b.build();
}

/** Mahabat Khan Masjid — the Mughal mosque of the old city: white-cream facade, three domes, two minarets. Faces +x. */
export function createMahabatFallback() {
  const b = new Builder();
  const W = 0xefe6d2, S = 0xd8cdb2, G = 0x2f7f55;
  b.box(14, 18, 62, W, 0, 9, 0);                                             // prayer hall
  b.box(15, 3, 64, S, 0, 1.5, 0);                                            // plinth
  b.box(3, 24, 18, W, 7.4, 12, 0);                                           // central iwan
  b.box(2, 18, 11, 0x1b3a2c, 8.4, 11, 0);                                    // recessed arch
  b.sphere(3.6, G, 8.4, 20, 0, { s: [0.4, 1, 1], seg: 12 });
  for (const [z, r] of [[0, 9], [-19, 6.5], [19, 6.5]]) {                    // three domes
    b.cyl(r, r * 1.1, 3, S, 0, 19.5, z, { seg: 14 });
    b.sphere(r, W, 0, 21, z, { seg: 16, s: [1, 1.2, 1] });
    b.cyl(0.18, 0.18, r * 0.6, 0xd4af37, 0, 21 + r * 1.2 + 0.4, z, { kind: 'shiny' });
  }
  for (const z of [-34, 34]) {                                               // twin minarets
    b.box(4.4, 3, 4.4, S, 8, 1.5, z);
    b.cyl(1.7, 2.1, 36, W, 8, 21, z, { seg: 10 });
    b.cyl(2.6, 2.6, 0.9, S, 8, 28, z, { seg: 10 });
    b.cyl(2.2, 2.2, 0.8, S, 8, 38, z, { seg: 10 });
    b.cyl(1.5, 1.7, 4, W, 8, 40.5, z, { seg: 10 });
    b.sphere(1.9, G, 8, 43.4, z, { seg: 10, s: [1, 1.25, 1] });
  }
  merlons(b, 7.2, 18, -28, 28, S, 3);
  return b.build();
}

/** Islamia College — red-brick Gothic revival, long arcaded wings and a tall central tower. Faces +x. */
export function createIslamiaFallback() {
  const b = new Builder();
  const B = 0xa84a32, T = 0xe9dfc8;
  b.box(14, 16, 110, B, 0, 8, 0);
  b.box(15, 1.2, 111, T, 0, 16.6, 0);
  for (let z = -50; z <= 50; z += 5) {                                       // arcade of windows + white stone piers
    b.box(0.5, 9, 1.4, 0x2a2e38, 7.1, 8, z, { kind: 'glass' });
    b.box(0.7, 12, 0.6, T, 7.3, 8, z + 2.5);
  }
  b.box(16, 34, 16, B, 2, 17, 0);                                            // central tower
  b.box(17, 1.5, 17, T, 2, 34.7, 0);
  b.box(6, 7, 6, B, 2, 39, 0);
  b.cone(5, 14, 0x3a3a40, 2, 49, 0, { seg: 4, r: [0, Math.PI / 4, 0] });
  b.box(0.3, 3.4, 3.4, 0xf6f3ea, 10.6, 37, 0);                               // clock face
  for (const z of [-55, 55]) { b.box(9, 24, 9, B, 0, 12, z); b.cone(4.2, 8, 0x3a3a40, 0, 28, z, { seg: 4, r: [0, Math.PI / 4, 0] }); }
  merlons(b, 0, 16.6, -52, 52, T, 3);
  return b.build();
}

/** Ghanta Ghar — Peshawar's red-brick Victoria clock tower. Faces +x. */
export function createGhantaGhar() {
  const b = new Builder();
  const B = 0xa84a32, T = 0xe9dfc8;
  b.box(11, 3, 11, T, 0, 1.5, 0);
  b.box(8.4, 22, 8.4, B, 0, 14, 0);
  for (const y of [8, 17, 25]) b.box(9.2, 0.7, 9.2, T, 0, y, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(0.55, 0.55, 22, T, sx * 4.4, 14, sz * 4.4, { seg: 8 });
  b.box(9.4, 7, 9.4, B, 0, 29.5, 0);
  for (const [x, z, alongX] of [[4.8, 0, true], [-4.8, 0, true], [0, 4.8, false], [0, -4.8, false]]) {
    b.cyl(2.7, 2.7, 0.4, 0xf6f3ea, x, 29.5, z, { r: alongX ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0], seg: 20 });   // clock face
    b.box(alongX ? 0.2 : 0.3, 2.2, alongX ? 0.3 : 0.2, 0x111111, x * 1.04, 29.9, z * 1.04);                           // hands
  }
  b.box(10.4, 1.2, 10.4, T, 0, 33.4, 0);
  b.cone(6.6, 10, 0x3a3a40, 0, 39, 0, { seg: 4, r: [0, Math.PI / 4, 0] });
  b.cyl(0.12, 0.12, 4, 0xd4af37, 0, 46.5, 0, { kind: 'shiny' });
  return b.build();
}

/** Bab-e-Khyber — the great ceremonial gate at Jamrud, the doorway of the Khyber Pass. Spans the road; faces -z. */
export function createBabKhyber(gateIdx) {
  const b = new Builder();
  const W = 0xe7dcc2, S = 0xcbbf9f, G = 0x2f7f55;
  for (const s of [-1, 1]) {
    b.box(6.2, 22, 8, W, s * 9.7, 11, 0);                                    // pillars
    b.box(7, 2, 9, S, s * 9.7, 1, 0);
    b.cyl(2.4, 2.8, 8, S, s * 9.7, 26, 0, { seg: 10 });                      // towers on top
    b.sphere(3, G, s * 9.7, 31, 0, { seg: 12, s: [1, 1.25, 1] });
    b.cyl(0.14, 0.14, 3, 0xd4af37, s * 9.7, 35.2, 0, { kind: 'shiny' });
    merlons(b, s * 9.7, 22, -3, 3, S, 2.2);
  }
  b.box(26, 8, 8, W, 0, 18, 0);                                              // the arch deck
  b.box(27, 1.2, 9, S, 0, 22.4, 0);
  b.box(27, 1.2, 9, S, 0, 13.6, 0);
  for (let x = -12; x <= 12; x += 2.4) b.box(1.4, 1.3, 1.4, S, x, 23.6, 0);
  b.plane(15, 3.6, 'gate', 0xffffff, [0, 18, -4.1], [0, Math.PI, 0], { uv: gateUV(gateIdx) });   // banner on the arch (seen from the road)
  b.plane(15, 3.6, 'gate', 0xffffff, [0, 18, 4.1], [0, 0, 0], { uv: gateUV(gateIdx) });
  for (const s of [-1, 1]) {                                                 // green & white flags
    b.box(0.2, 9, 0.2, 0xcfcfcf, s * 4.5, 28, 0, { kind: 'shiny' });
    b.box(3.4, 2.2, 0.1, G, s * 4.5 + 1.8, 31.6, 0);
  }
  return b.build();
}

/** Qehwa stall (Peshawari green tea) — kept as the drinks cart prop. */

/** Lads cooling off in the nehar: heads, waving arms, splash rings. */
export function createSwimmers() {
  const b = new Builder();
  for (let i = 0, n = 2 + Math.floor(Math.random() * 3); i < n; i++) {
    const x = rand(-3, 3), z = rand(-3, 3);
    b.sphere(0.16, pick([0xa86d45, 0x8d5a3b, 0xc68a5e]), x, 1.62, z, { seg: 8 });
    b.sphere(0.165, 0x141010, x, 1.66, z + 0.02, { seg: 8, half: true });
    if (Math.random() < 0.6) b.box(0.08, 0.6, 0.08, pick([0xa86d45, 0x8d5a3b]), x + 0.2, 1.85, z, { r: [0, 0, -0.4] });
    b.torus(0.4, 0.04, 0xe8f6ff, x, 1.52, z, { r: [Math.PI / 2, 0, 0] });
  }
  return b.build();
}

/** A patang (kite) — diamond with a tail. Built facing +z. */
function kite(b, x, y, z, s = 1) {
  const c1 = pick(KITE_COLS), c2 = pick(KITE_COLS);
  b.plane(0.9 * s, 0.9 * s, 'kite', c1, [x, y, z], [0, 0, Math.PI / 4]);
  b.plane(0.45 * s, 0.45 * s, 'kite', c2, [x, y + 0.15 * s, z + 0.01], [0, 0, Math.PI / 4]);
  b.box(0.02 * s, 1.25 * s, 0.02 * s, 0x5a3a1a, x, y, z + 0.02);
  b.box(0.3 * s, 0.25 * s, 0.01, c2, x, y - 0.75 * s, z, { r: [0, 0, Math.PI / 4] });
}

/** Kite in the sky with a long string down to some rooftop. */
export function createSkyKite() {
  const b = new Builder();
  kite(b, 0, 0, 0, 2.2);
  b.box(0.025, 30, 0.025, 0xffffff, 3, -14, 4, { kind: 'string', r: [0.25, 0, -0.2] });
  return b.build();
}

/** Collectible kite (gameplay pickup): big, bright, with a gold ring. */
export function createKitePickup() {
  const b = new Builder();
  kite(b, 0, 0, 0, 1.4);
  b.torus(1.0, 0.05, 0xffd60a, 0, 0, -0.02, { kind: 'glow' });
  b.plane(1.6, 1.6, 'pool', 0xffffff, [0, -3, 0], [-Math.PI / 2, 0, 0]);
  return b.build();
}

/** Patang shop: kites and charkhis (spools) hanging out front. Faces the road. */
export function createKiteShop(side) {
  const b = new Builder();
  b.box(1.4, 2.6, 2.2, pick([0x7a1f1f, 0x0b5e3a, 0x1a3c8f]), -0.7, 1.3, 0);
  b.box(1.6, 0.12, 2.5, 0x3a3a3a, -0.6, 2.66, 0);
  for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) kite(b, 0.05, 1.2 + j * 0.9, -0.85 + i * 0.42, 0.5);
  for (let i = 0; i < 4; i++) b.cyl(0.12, 0.12, 0.22, pick([0xd62828, 0xffd60a, 0x0b8f3a]), 0.3, 0.55, -0.6 + i * 0.4, { r: [0, 0, Math.PI / 2], seg: 8 });
  b.box(0.6, 0.5, 1.8, 0x6b4a2b, 0.3, 0.25, 0);
  b.plane(2.2, 0.45, 'sign', 0xffffff, [0.06, 2.95, 0], [0, Math.PI / 2, 0], { uv: signUV(SHOPS.indexOf('Patang Ghar')) });
  b.plane(2.4, 2.6, 'shadow', 0xffffff, [-0.3, 0.03, 0], [-Math.PI / 2, 0, 0]);
  const g = b.build();
  g.rotation.y = side > 0 ? Math.PI : 0;
  return g;
}

/** Qehwa wala's cart: a big brass samovar and little glasses of green tea. */
export function createLassiCart(side) {
  const b = new Builder();
  b.box(1.0, 0.8, 1.8, 0x1f6b4a, 0, 0.7, 0);
  b.box(1.1, 0.06, 1.9, 0xd9d0c0, 0, 1.12, 0);
  b.cyl(0.35, 0.28, 0.6, 0xc9971c, 0, 1.45, -0.4, { seg: 12, kind: 'shiny' }); b.cyl(0.1, 0.1, 0.25, 0xc9971c, 0, 1.9, -0.4, { seg: 8, kind: 'shiny' });
  for (let i = 0; i < 5; i++) b.cyl(0.06, 0.05, 0.22, 0xd9efc8, -0.2 + (i % 2) * 0.2, 1.26, 0.2 + i * 0.13, { seg: 8 });
  for (const z of [-0.7, 0.7]) b.cyl(0.25, 0.25, 0.06, 0x222222, 0.52, 0.25, z, { r: [0, 0, Math.PI / 2], seg: 10 });
  b.cyl(0.02, 0.02, 1.4, 0x888888, -0.3, 1.8, 0.7, { seg: 4 });
  for (let i = 0; i < 6; i++) b.box(0.6, 0.04, 0.3, i % 2 ? 0xd62828 : 0xffffff, -0.3, 2.5, 0.7 - i * 0.28 + 0.7, { r: [0, 0, 0.1] });
  b.plane(1.6, 2.4, 'shadow', 0xffffff, [0, 0.03, 0], [-Math.PI / 2, 0, 0]);
  const g = b.build();
  g.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
  return g;
}

/** The big yellow municipal garbage container on the pavement — with the usual overflow beside it. */
export function createDustbin() {
  const b = new Builder();
  const Y = 0xf2c200, DK = 0x1b1b1b;
  b.box(1.0, 1.15, 1.35, Y, 0, 0.75, 0, { kind: 'shiny' });
  b.box(1.04, 0.1, 1.4, Y, 0, 0.2, 0);
  b.box(1.08, 0.08, 1.42, DK, 0.04, 1.37, 0, { r: [0, 0, 0.12] });             // lid, slightly lifted
  b.box(1.02, 0.16, 1.37, 0x0b6e3a, 0.0, 1.0, 0);                                // green band
  for (const z of [-0.5, 0.5]) for (const x of [-0.35, 0.35]) b.cyl(0.08, 0.08, 0.06, DK, x, 0.09, z, { r: [Math.PI / 2, 0, 0], seg: 8 });
  for (const z of [-0.69, 0.69]) b.box(0.08, 0.06, 0.06, DK, 0.5, 1.2, z * 0.98);  // handles
  if (Math.random() < 0.7) for (let i = 0; i < 3 + (Math.random() * 3 | 0); i++) b.sphere(0.22 + Math.random() * 0.12, pick([0x111111, 0x2a3f8f, 0x3a3a3a, 0xe8e2d0]), 0.55 + Math.random() * 0.4, 0.2, -0.9 + Math.random() * 1.8, { seg: 7, s: [1, 0.8, 1] });
  b.plane(1.8, 2.2, 'shadow', 0xffffff, [0, 0.03, 0], [-Math.PI / 2, 0, 0]);
  return b.build();
}

function deckTraffic(b, y, len) {
  for (let i = 0; i < 6; i++) {
    const x = -len / 2 + 6 + Math.random() * (len - 12), z = (i % 2 ? -1.6 : 1.6);
    const c = pick([0xf5f5f5, 0xb3202a, 0x1f4e9c, 0x1d1d1f, 0xffd60a]);
    b.box(4.0, 1.2, 1.7, c, x, y + 0.75, z, { kind: 'shiny' });
    b.box(2.0, 0.6, 1.5, 0x1e2a36, x - 0.2, y + 1.55, z, { kind: 'glass' });
  }
}

/** Flyover crossing above the road: concrete deck, piers outside the pavements, a green sign facing you. */
export function createFlyover(signIdx) {
  const b = new Builder();
  const L = 110, H = 8.2, CON = 0xb9b4aa;
  b.box(L, 1.4, 13, CON, 0, H, 0);
  b.box(L, 0.25, 13.6, 0x8f8a80, 0, H - 0.8, 0);
  for (const z of [-6.6, 6.6]) { b.box(L, 1.0, 0.35, 0xd9d4c8, 0, H + 1.2, z); b.box(L, 0.18, 0.4, 0xf2c200, 0, H + 1.75, z); }
  for (const x of [-10, 10, -30, 30, -50, 50]) {
    b.box(2.4, H - 0.7, 2.4, CON, x, (H - 0.7) / 2, 0);
    b.box(3.4, 0.8, 10, CON, x, H - 1.1, 0);
    for (let k = 0; k < 4; k++) b.box(2.42, 0.06, 2.42, 0xa8a398, x, 1 + k * 1.6, 0);
  }
  deckTraffic(b, H + 0.7, L);
  for (let x = -L / 2 + 8; x < L / 2; x += 16) { b.cyl(0.08, 0.08, 3, 0x777777, x, H + 2.6, 6.6, { seg: 5 }); b.box(1, 0.12, 0.3, 0xfff0c8, x + 0.4, H + 4.1, 6.6, { kind: 'glow' }); }
  b.plane(8, 1.5, 'roadsign', 0xffffff, [0, H + 0.1, 7.0], [0, 0, 0], { uv: roadsignUV(signIdx) });
  b.plane(14, 20, 'shadow', 0xffffff, [0, 0.04, 0], [-Math.PI / 2, 0, 0]);
  return b.build();
}

/** Underpass: the road runs between clad retaining walls under a cross-road deck — sleek, well lit, planted on top. */
export function createUnderpass(signIdx) {
  const b = new Builder();
  const L = 110, H = 6.4;
  const TILE_A = 0xdcd8d0, TILE_B = 0xc9c5bc, TRIM = 0x3a4a5a;
  for (const s of [-1, 1]) {
    b.box(0.8, H, L, 0xb9b4aa, s * 8.1, H / 2, 0);                                                       // structural wall
    for (let z = -L / 2 + 1.5, k = 0; z < L / 2; z += 3, k++) {                                           // tiled cladding panels
      b.box(0.06, 2.6, 2.9, k % 2 ? TILE_A : TILE_B, s * 7.68, 1.75, z, { kind: 'shiny' });
      b.box(0.06, 2.0, 2.9, k % 2 ? TILE_B : TILE_A, s * 7.68, 4.2, z, { kind: 'shiny' });
    }
    b.box(0.08, 0.12, L, TRIM, s * 7.64, 3.1, 0);                                                         // dark trim line
    b.box(0.1, 0.07, L - 2, 0xe8f4ff, s * 7.6, 3.32, 0, { kind: 'glow' });                                // continuous LED strip
    b.box(0.1, 0.05, L - 2, 0x29b6f6, s * 7.6, 0.75, 0, { kind: 'glow' });                                // low accent line
    for (let z = -L / 2 + 10; z < L / 2 - 8; z += 22) b.plane(9, 1.6, 'art', 0xffffff, [s * 7.63, 1.75, z], [0, -s * Math.PI / 2, 0], { uv: [0, 0.25, 1, 0.75] }); // mural panels
    b.box(1.1, 0.35, L, 0xa8a398, s * 8.1, H + 0.18, 0);                                                  // coping
    for (let z = -L / 2 + 2; z < L / 2; z += 4) b.box(0.05, 1.0, 0.05, 0x5a6470, s * 7.75, H + 0.85, z, { kind: 'shiny' });   // railing posts
    b.box(0.05, 0.05, L, 0x5a6470, s * 7.75, H + 1.35, 0, { kind: 'shiny' });
    for (let z = -L / 2 + 4; z < L / 2; z += 7) {                                                         // planters with greenery on top
      b.box(1.1, 0.5, 2.2, 0x8f8a80, s * 9.2, H + 0.6, z);
      b.sphere(0.8, 0x3f8f2f, s * 9.2, H + 1.2, z, { seg: 7, s: [0.7, 0.6, 1.2] });
    }
    b.box(0.18, 0.3, L, 0xf2c200, s * 7.62, 0.37, 0);                                                     // kerb band
  }
  // cross-road deck overhead with a recessed-light ceiling and its own traffic
  const DW = 22;
  b.box(80, 1.4, DW, 0xb9b4aa, 0, H + 0.7, 0);
  for (const z of [-DW / 2 - 0.2, DW / 2 + 0.2]) { b.box(80, 1.1, 0.4, 0xd9d4c8, 0, H + 1.9, z); b.box(80, 0.16, 0.45, 0xf2c200, 0, H + 2.5, z); }
  deckTraffic(b, H + 1.4, 80);
  b.box(15.2, 0.08, DW - 0.4, 0x2a2e36, 0, H - 0.02, 0);
  for (let x = -6; x <= 6; x += 2) for (let z = -DW / 2 + 2; z < DW / 2 - 1; z += 3) b.box(0.9, 0.04, 0.35, 0xeef6ff, x, H - 0.08, z, { kind: 'glow' });
  b.plane(9, 1.7, 'roadsign', 0xffffff, [0, H - 0.25, DW / 2 + 0.45], [0, 0, 0], { uv: roadsignUV(signIdx) });
  // entry portal: a clean steel gantry with the name and a height limit
  const PZ = L / 2 + 3;
  b.box(17.4, 0.6, 0.5, 0x3a4a5a, 0, 6.9, PZ, { kind: 'shiny' });
  for (const s of [-1, 1]) b.box(0.4, 6.9, 0.4, 0x3a4a5a, s * 8.5, 3.45, PZ, { kind: 'shiny' });
  b.plane(7, 1.3, 'roadsign', 0xffffff, [0, 6.0, PZ + 0.3], [0, 0, 0], { uv: roadsignUV(signIdx) });
  b.box(16.6, 0.06, 0.1, 0xe8f4ff, 0, 6.58, PZ + 0.27, { kind: 'glow' });
  b.plane(16, L, 'shadow', 0xffffff, [0, 0.035, 0], [-Math.PI / 2, 0, 0]);
  return b.build();
}

/** Jhandiyan: strings of colourful pennants across the street. */
export function createBunting() {
  const b = new Builder();
  const cols = [0xd62828, 0xffd60a, 0x0b8f3a, 0x1565c0, 0xe91e63, 0xff7f11, 0xffffff, 0x7b1fa2];
  for (let r = 0; r < 2; r++) {
    const y0 = 7.6 + r * 0.9, zr = r * 1.2;
    for (let i = 0; i <= 26; i++) {
      const t = i / 26, x = -7.6 + t * 15.2, y = y0 - Math.sin(t * Math.PI) * 1.0;
      if (i < 26) b.box(0.6, 0.02, 0.02, 0x333333, x + 0.29, y, zr, { r: [0, 0, Math.atan2(-Math.cos(t * Math.PI) * Math.PI / 26, 0.585)] });
      b.plane(0.34, 0.34, 'kite', cols[(i + r * 3) % cols.length], [x, y - 0.18, zr], [0, 0, Math.PI / 4]);
    }
  }
  return b.build();
}

/** Chai dhaba: a big kettle on the stove, cups, and regulars on a charpai. Faces the road. */
export function createChaiDhaba(side) {
  const b = new Builder();
  b.box(1.0, 0.9, 1.6, 0x6b4a2b, -0.5, 0.45, 0);                                           // counter
  b.cyl(0.25, 0.3, 0.3, 0x333333, -0.5, 1.05, -0.4, { seg: 10 });                         // stove
  b.cyl(0.18, 0.18, 0.06, 0xff7a1a, -0.5, 1.21, -0.4, { seg: 10, kind: 'glow' });
  b.cyl(0.2, 0.24, 0.32, 0xb8b8b8, -0.5, 1.4, -0.4, { seg: 12, kind: 'shiny' });          // kettle
  b.cyl(0.03, 0.03, 0.25, 0xb8b8b8, -0.3, 1.45, -0.4, { r: [0, 0, -0.9], kind: 'shiny', seg: 5 });
  for (let i = 0; i < 6; i++) b.cyl(0.04, 0.032, 0.08, 0xffffff, -0.65 + (i % 3) * 0.12, 0.95, 0.2 + Math.floor(i / 3) * 0.14, { seg: 8 });
  b.box(1.8, 0.06, 2.2, 0x2a4f8f, -0.4, 2.3, 0, { r: [0, 0, 0.12] });                   // tarp
  for (const z of [-1, 1]) b.cyl(0.03, 0.03, 2.3, 0x555555, 0.4, 1.15, z, { seg: 5 });
  // charpai with woven rope top
  b.box(1.0, 0.08, 1.9, 0x8b5a2b, 1.0, 0.45, 0.2);
  for (let i = 0; i < 7; i++) b.box(0.95, 0.015, 0.04, 0xd9c08a, 1.0, 0.5, -0.6 + i * 0.27, { r: [0, 0.6, 0] });
  for (const x of [0.55, 1.45]) for (const z of [-0.7, 1.1]) b.box(0.07, 0.45, 0.07, 0x6b4a2b, x, 0.22, z);
  for (const z of [-0.3, 0.6]) addSeatedChai(b, 1.0, 0.5, z);
  b.plane(3, 3, 'shadow', 0xffffff, [0.3, 0.03, 0], [-Math.PI / 2, 0, 0]);
  const g = b.build();
  g.rotation.y = side > 0 ? Math.PI : 0;
  return g;
}
function addSeatedChai(b, x, y, z) {
  const c = pick([0xf2efe6, 0x1e2a44, 0xc9b79a, 0x6b4a2b]);
  b.box(0.42, 0.55, 0.3, c, x, y + 0.32, z);
  b.sphere(0.14, pick([0xa86d45, 0x8d5a3b, 0xc68a5e]), x, y + 0.75, z, { seg: 8 });
  if (Math.random() < 0.5) b.cyl(0.14, 0.15, 0.11, 0xffffff, x, y + 0.88, z, { seg: 8 });
  b.box(0.38, 0.14, 0.42, c, x - 0.15, y + 0.05, z, { r: [0, 0, 0] });
  b.box(0.1, 0.4, 0.1, c, x - 0.15, y + 0.45, z + 0.2, { r: [-0.9, 0, 0] });
  b.cyl(0.035, 0.03, 0.07, 0xffffff, x - 0.15, y + 0.62, z + 0.38, { seg: 8 });
}

/** Orange Line Metro: an elevated viaduct crossing high over the road, with an orange train that runs across it.
 *  The train is a separate child so the world can animate it (userData.train). */
export function createOrangeLine() {
  const b = new Builder();
  const H = 13, L = 180, CON = 0xcfcac0;
  b.box(L, 1.3, 9, CON, 0, H, 0);
  for (const z of [-4.3, 4.3]) b.box(L, 1.2, 0.4, 0xe2ddd2, 0, H + 1.1, z);
  b.box(L, 0.2, 9.1, 0xff7a1a, 0, H - 0.55, 0);                                    // orange fascia stripe
  for (const x of [-14, 14, -45, 45, -76, 76]) {
    b.cyl(1.3, 1.5, H - 1, CON, x, (H - 1) / 2, 0, { seg: 16 });
    b.box(3.6, 1.2, 8, CON, x, H - 1.2, 0);
  }
  for (const z of [-1.5, 1.5]) for (const o of [-0.72, 0.72]) b.box(L, 0.12, 0.1, 0x777777, 0, H + 0.72, z + o, { kind: 'shiny' }); // rails
  for (let x = -L / 2 + 10; x < L / 2; x += 20) { b.box(0.15, 3.5, 0.15, 0x888888, x, H + 2.4, -4.1); b.box(0.1, 0.1, 4, 0x888888, x, H + 4.1, -2.2); }
  const g = b.build();
  // the train: 3 cars, orange with a white band and dark windows
  const t = new Builder();
  for (let c = 0; c < 3; c++) {
    const x0 = (c - 1) * 19.5;
    t.box(19, 3.3, 2.9, 0xff7a1a, x0, H + 2.5, -1.5, { kind: 'shiny' });
    t.box(18.6, 1.0, 2.95, 0x1a222c, x0, H + 3.0, -1.5, { kind: 'glass' });
    t.box(19, 0.18, 2.95, 0xffffff, x0, H + 2.2, -1.5);
    for (let d = -6; d <= 6; d += 6) t.box(1.3, 2.4, 2.96, 0xe0e0e0, x0 + d, H + 2.3, -1.5);
    t.box(18.6, 0.3, 2.6, 0xd9d9d9, x0, H + 4.25, -1.5);
  }
  for (const s of [-1, 1]) t.box(0.1, 0.3, 1.8, 0xfff3c4, s * 29.3, H + 1.6, -1.5, { kind: 'glow' });
  const train = t.build();
  g.add(train);
  g.userData.train = train;
  return g;
}
