// Streams the scenery: road tiles, buildings, street furniture, landmarks and place gates.
// Everything is positioned by its route distance `s`; on screen z = D - s (player at z = 0).
import * as THREE from 'three';
import { TILE, VIEW_AHEAD, DISTRICTS, DISTRICT_LENGTH, districtIndexAt, placeAt, placeIndexAt, styleIndex } from '../config.js';
import { Builder, pick, rand, randi } from '../render/kit.js';
import { UNDERPASSES, FLYOVERS } from '../render/textures.js';
import { curveUniforms } from '../render/curve.js';
import { customModel } from '../render/gltf.js';
import { createBuilding } from '../models/buildings.js';
import { createLamp, createTree, createStall, createBillboard, createElectricPole, createGate, createPosterWall, createGroundStain } from '../models/props.js';
import { createFlagLamp, createMinarFallback, createBadshahiFallback, createZamzama, createSwimmers, createSkyKite, createKiteShop, createLassiCart, createDustbin, createFlyover, createUnderpass, createBunting, createChaiDhaba, createOrangeLine } from '../models/landmarks.js';
import { createPedestrian } from '../models/person.js';

const BEHIND = 34;

function createTile(d) {
  const b = new Builder();
  b.plane(9.6, TILE, 'road', 0xffffff, [0, 0, 0], [-Math.PI / 2, 0, 0], { uv: [0, 0, 1, TILE / 12], segH: 12 });
  // patched asphalt, manhole covers, oil stains
  for (let i = 0, n = randi(0, 2); i < n; i++) b.plane(rand(1.2, 3), rand(2, 6), 'solid', pick([0x2c2d31, 0x36373b, 0x404146]), [rand(-3.5, 3.5), 0.012, rand(-TILE / 2 + 3, TILE / 2 - 3)], [-Math.PI / 2, 0, 0]);
  if (Math.random() < 0.45) {
    const x = pick([-1.5, 1.5]), z = rand(-10, 10);
    b.cyl(0.45, 0.45, 0.02, 0x4d4d52, x, 0.014, z, { seg: 16, kind: 'shiny' });
    for (let k = 0; k < 4; k++) b.box(0.8, 0.005, 0.04, 0x2a2a2e, x, 0.026, z - 0.3 + k * 0.2);
  }
  if (Math.random() < 0.5) b.plane(rand(1, 2), rand(1, 2.5), 'shadow', 0xffffff, [pick([-3, 0, 3]), 0.013, rand(-14, 14)], [-Math.PI / 2, 0, 0]);
  if (Math.random() < 0.12) { const z = rand(-12, -6); for (let k = 0; k < 8; k++) b.box(0.55, 0.006, 3.2, 0xecebe4, -4 + k * 1.15, 0.016, z); } // zebra crossing
  for (const s of [-1, 1]) {
    const canalSide = d.id === 'canal' && s < 0;
    b.plane(2.9, TILE, 'walk', d.walk, [s * 6.25, 0.22, 0], [-Math.PI / 2, 0, 0], { uv: [0, 0, 1.45, TILE / 2], segH: 8 });
    // Lahore's black & yellow painted kerbs
    for (let k = 0; k < TILE; k += 1) b.box(0.26, 0.25, 1.0, (k % 2) ? 0x15151a : 0xe2c23a, s * 4.88, 0.115, -TILE / 2 + k + 0.5);
    if (canalSide) continue;
    b.plane(44, TILE, 'ground', d.ground, [s * 29.7, 0.05, 0], [-Math.PI / 2, 0, 0], { uv: [0, 0, 8, TILE / 6], segH: 6 });
  }
  if (d.id === 'canal') {
    // green bank sloping into the nehar, water, far bank with a footpath
    b.plane(5.5, TILE, 'ground', d.ground, [-10.45, 0.05, 0], [-Math.PI / 2, 0, 0], { uv: [0, 0, 1, TILE / 6], segH: 6 });
    b.plane(3.4, TILE, 'ground', 0x6f8f45, [-14.7, -0.72, 0], [-Math.PI / 2, -0.47, 0], { uv: [0, 0, 1, TILE / 6], segH: 6 });
    b.plane(13, TILE, 'water', 0x3f6f5a, [-22.6, -1.5, 0], [-Math.PI / 2, 0, 0], { segH: 8 });
    b.plane(3.4, TILE, 'ground', 0x6f8f45, [-30.5, -0.72, 0], [-Math.PI / 2, 0.47, 0], { uv: [0, 0, 1, TILE / 6], segH: 6 });
    b.plane(40, TILE, 'ground', d.ground, [-52, 0.05, 0], [-Math.PI / 2, 0, 0], { uv: [0, 0, 8, TILE / 6], segH: 6 });
    b.box(0.3, 0.6, TILE, 0xd9cdb5, -8.0, 0.3, 0);                        // low railing wall
    for (let z = -TILE / 2; z < TILE / 2; z += 3) b.box(0.18, 0.9, 0.18, 0xe8e0cc, -8.0, 0.45, z);
  }
  if (d.id === 'minar') for (const s of [-1, 1]) b.box(0.6, 0.3, TILE, 0x3f8f2f, s * 7.4, 0.3, 0);
  if (d.id === 'anarkali') for (const s of [-1, 1]) b.box(0.5, 0.12, TILE, 0x4f7f2f, s * 7.2, 0.28, 0); // grass verge
  return b.build();
}

export class World {
  constructor(scene) {
    this.root = new THREE.Group();
    scene.add(this.root);
    this.items = [];
    this.pools = new Map();
    this.time = 0;
    this.D = 0;
    this.reset(0);
  }

  get district() { return DISTRICTS[districtIndexAt(this.D)]; }
  get place() { return placeAt(this.D); }

  take(key, make) {
    const list = this.pools.get(key);
    const obj = list && list.length ? list.pop() : make();
    obj.userData.poolKey = key;
    this.root.add(obj);
    return obj;
  }
  give(obj) {
    this.root.remove(obj);
    const key = obj.userData.poolKey;
    if (!this.pools.has(key)) this.pools.set(key, []);
    this.pools.get(key).push(obj);
  }
  place(obj, s, x, y = 0, ry = 0, behind = BEHIND) {
    obj.position.set(x, y, this.D - s);
    obj.rotation.y = ry;
    const it = { obj, s, behind, y };
    this.items.push(it);
    return it;
  }

  reset(D) {
    for (const it of this.items) this.give(it.obj);
    this.items.length = 0;
    this.D = D;
    this.tileNext = D - BEHIND - TILE;
    this.sideNext = { L: D - BEHIND, R: D - BEHIND };
    this.lampNext = D - BEHIND;
    this.propNext = D - BEHIND;
    this.gateNext = (Math.floor(D / DISTRICT_LENGTH) + 1) * DISTRICT_LENGTH;
    this.bigNext = D - BEHIND;
    this.kiteNext = D - BEHIND;
    this.pedNext = D - BEHIND;
    this.buntNext = D + 20;
    this.landmarkDone = new Set();
    this.structs = [];  // {s, name} — announced as you ride in
    this.clears = [];   // stretches with no buildings/props (flyover piers, underpass walls)
    this.structNext = D + 350;
    this.plazas = [];   // open garden stretches in front of landmarks (no buildings blocking the view)
    this.fill();
  }

  fill() {
    const limit = this.D + VIEW_AHEAD;
    while (this.tileNext < limit) {
      const s = this.tileNext + TILE / 2;
      const di = districtIndexAt(s);
      this.place(this.take(`tile${di}_${Math.floor(Math.random() * 4)}`, () => createTile(DISTRICTS[di])), s, 0);
      this.tileNext += TILE;
    }
    // place-specific landmarks (once per visit, seen over the rooftops)
    while (this.bigNext < limit + 200) {
      const s = this.bigNext;
      const pl = placeAt(s);
      const local = ((s % DISTRICT_LENGTH) + DISTRICT_LENGTH) % DISTRICT_LENGTH;
      const key = Math.floor(s / DISTRICT_LENGTH);
      if (pl.landmark && local > 120 && local < 900 && !this.landmarkDone.has(key)) {
        this.landmarkDone.add(key);
        if (pl.landmark === 'badshahi') {
          this.place(this.take('badshahi', () => customModel('badshahi')?.group || createBadshahiFallback()), s + 160, -96, 0, 0, 200);
          this.plazas.push([s + 40, s + 230]);          // Hazuri Bagh: open garden in front of the masjid
        } else {
          this.place(this.take('minar', () => customModel('minar')?.group || createMinarFallback()), s + 190, -58, 0, 0, 160);
          this.plazas.push([s + 120, s + 260]);
        }
        this.bigNext += 700;
      } else if (pl.id === 'mall' && local > 200 && local < 900 && !this.landmarkDone.has(key)) {
        this.landmarkDone.add(key);
        this.place(this.take('zamzama', createZamzama), s + 60, 6.6, 0.22, Math.PI);
        this.bigNext += 700;
      } else this.bigNext += 60;
    }
    // flyovers + underpasses (not in the Walled City or the parks)
    while (this.structNext < limit + 200) {
      const s = this.structNext;
      const st = placeAt(s).style;
      if (st !== 'androon' && st !== 'minar' && !this.plazas.some(([a, b]) => s > a - 80 && s < b + 80)) {
        const under = st === 'canal' ? Math.random() < 0.8 : Math.random() < 0.55;
        if (!under) {
          const k = randi(0, FLYOVERS.length - 1), sign = UNDERPASSES.length + k;
          this.place(this.take(`flyover${sign}`, () => createFlyover(sign)), s, 0, 0, 0, 60);
          this.clears.push([s - 16, s + 16, false]);
          this.structs.push({ s: s - 10, name: `🌉 ${FLYOVERS[k]}` });
        } else {
          const sign = randi(0, UNDERPASSES.length - 1);
          this.place(this.take(`underpass${sign}`, () => createUnderpass(sign)), s, 0, 0, 0, 75);
          if (Math.random() < 0.55) { const it = this.place(this.take(`orange${randi(0, 2)}`, createOrangeLine), s - 30, 0, 0, 0, 80); it.train = rand(0, 300); }
          this.clears.push([s - 62, s + 56, true]);
          this.structs.push({ s: s - 58, name: `⤵️ ${UNDERPASSES[sign]}` });
        }
        this.structNext = s + rand(350, 600);
      } else this.structNext = s + 150;
    }
    // buildings on both sides
    for (const side of ['L', 'R']) {
      while (this.sideNext[side] < limit) {
        const s0 = this.sideNext[side];
        const di = districtIndexAt(s0);
        const d = DISTRICTS[di];
        const sg = side === 'L' ? -1 : 1;
        if (d.id === 'canal' && side === 'L') {
          // canal bank: big shady trees, swimmers cooling off, a lassi cart
          const r = Math.random();
          this.place(this.take(`ctree${di}${Math.floor(Math.random() * 4)}`, () => createTree('round')), s0 + 3, -11.5 - rand(0, 1.5));
          if (r < 0.25) this.place(this.take(`swim${Math.floor(Math.random() * 3)}`, createSwimmers), s0 + 8, -22 + rand(-3, 3), -1.5);
          else if (r < 0.4) this.place(this.take(`lassi${Math.floor(Math.random() * 2)}`, () => createLassiCart(-1)), s0 + 8, -6.6);
          if (Math.random() < 0.6) this.place(this.take(`ftree${di}${Math.floor(Math.random() * 4)}`, () => createTree('round')), s0 + 6, -33 - rand(0, 4));
          this.sideNext[side] += rand(10, 16);
          continue;
        }
        if (this.clears.some(([a, b]) => s0 + 6 >= a && s0 - 6 < b)) { this.sideNext[side] += 4; continue; }
        if (side === 'L' && this.plazas.some(([a, b]) => s0 >= a && s0 < b)) {
          const pk = styleIndex('minar');
          const obj = this.take(`plaza_${Math.floor(Math.random() * 6)}`, () => { const r = createBuilding(DISTRICTS[pk]); r.group.userData.w = r.w; return r.group; });
          this.place(obj, s0 + obj.userData.w / 2, -7.9, 0, 0);
          this.sideNext[side] += obj.userData.w + 0.5;
          continue;
        }
        const key = `bld${di}_${Math.floor(Math.random() * 14)}`;
        const obj = this.take(key, () => { const r = createBuilding(d); r.group.userData.w = r.w; return r.group; });
        const w = obj.userData.w;
        this.place(obj, s0 + w / 2, sg * 7.9, 0, side === 'L' ? 0 : Math.PI);
        const gap = d.id === 'androon' ? 0.1 : d.id === 'anarkali' ? rand(0.5, 2) : rand(1.5, 4.5);
        this.sideNext[side] += w + gap;
      }
    }
    // lamps
    while (this.lampNext < limit) {
      const di = districtIndexAt(this.lampNext);
      const d = DISTRICTS[di];
      const style = d.id === 'gulberg' ? 'neon' : d.id === 'androon' || d.id === 'anarkali' ? 'old' : 'sea';
      const inTunnel = this.clears.some(([a, b, t]) => t && this.lampNext + 15 >= a && this.lampNext < b);
      for (const sg of inTunnel ? [] : [-1, 1]) {
        const offset = sg > 0 ? 0 : 15;
        this.place(this.take(`lamp${style}${sg}`, () => createLamp(style, sg)), this.lampNext + offset, sg * 5.2);
      }
      this.lampNext += 30;
    }
    // misc props
    while (this.propNext < limit) {
      const s = this.propNext;
      const di = districtIndexAt(s);
      const d = DISTRICTS[di];
      const sg = Math.random() < 0.5 ? -1 : 1;
      if (this.clears.some(([a, b]) => s + 25 >= a && s - 5 < b)) { this.propNext += 20; continue; }
      if (d.id !== 'minar' && !(d.id === 'canal' && sg < 0) && Math.random() < 0.38) this.place(this.take(`bin${Math.floor(Math.random() * 4)}`, createDustbin), s + rand(2, 12), sg * 7.0, 0.22, sg > 0 ? 0 : Math.PI);
      if (d.id !== 'minar' && Math.random() < 0.3) this.place(this.take(`stain${Math.floor(Math.random() * 4)}`, createGroundStain), s + rand(0, 10), sg * rand(5.3, 7.2), 0.2);
      if (d.id === 'androon') {
        if (Math.random() < 0.5) this.place(this.take(`stall${di}${sg}${Math.floor(Math.random() * 4)}`, () => createStall(sg)), s, sg * 6.6);
        if (Math.random() < 0.55) this.place(this.take(`pole${di}`, createElectricPole), s + 6, 7.3);
        if (Math.random() < 0.2) this.place(this.take(`kshop${sg}${Math.floor(Math.random() * 2)}`, () => createKiteShop(sg)), s + 11, sg * 6.7);
        if (Math.random() < 0.2) this.place(this.take(`pw${di}${sg}${Math.floor(Math.random() * 3)}`, () => createPosterWall(sg)), s + 14, sg * 7.5);
      } else if (d.id === 'anarkali') {
        this.place(this.take(`atree${di}${sg}${Math.floor(Math.random() * 4)}`, () => createTree('round')), s, sg * 6.9);
        if (Math.random() < 0.35) this.place(this.take(`stall${di}${sg}${Math.floor(Math.random() * 3)}`, () => createStall(sg)), s + 8, sg * 6.5);
        if (Math.random() < 0.2) this.place(this.take(`lassiA${sg}`, () => createLassiCart(sg)), s + 12, sg * 6.5);
      } else if (d.id === 'minar') {
        if (Math.random() < 0.6) this.place(this.take(`flag${di}`, createFlagLamp), s, sg * 6.8);
        if (Math.random() < 0.4) this.place(this.take(`stall${di}${sg}${Math.floor(Math.random() * 3)}`, () => createStall(sg)), s + 9, sg * 6.5);
      } else if (d.id === 'canal') {
        this.place(this.take(`rtree${di}${Math.floor(Math.random() * 4)}`, () => createTree('round')), s, 6.9);
        if (Math.random() < 0.3) this.place(this.take(`stall${di}${Math.floor(Math.random() * 3)}`, () => createStall(1)), s + 8, 6.4);
      } else {
        if (Math.random() < 0.6) this.place(this.take(`palm${di}${sg}${Math.floor(Math.random() * 3)}`, () => createTree('palm')), s, sg * 6.9);
        if (Math.random() < 0.35) this.place(this.take(`bb${di}${sg}${Math.floor(Math.random() * 4)}`, () => createBillboard(sg, d.neon)), s + 10, sg * 9.5);
      }
      this.propNext += rand(14, 24);
    }
    // people on the pavements
    while (this.pedNext < limit) {
      const s = this.pedNext, d = DISTRICTS[districtIndexAt(s)];
      const sg = Math.random() < 0.5 ? -1 : 1;
      if (!this.clears.some(([a, b]) => s >= a && s < b) && !(d.id === 'canal' && sg < 0 && Math.random() < 0.6)) {
        const n = d.id === 'androon' || d.id === 'anarkali' ? randi(1, 3) : randi(0, 2);
        for (let i = 0; i < n; i++) this.place(this.take(`ped${randi(0, 11)}`, () => createPedestrian()), s + i * 1.2, sg * rand(5.6, 7.2), 0.22, pick([0, Math.PI, sg > 0 ? -Math.PI / 2 : Math.PI / 2]));
        if ((d.id === 'androon' || d.id === 'anarkali' || d.id === 'canal') && Math.random() < 0.1) this.place(this.take(`dhaba${sg}${randi(0, 1)}`, () => createChaiDhaba(sg)), s + 5, sg * 6.6, 0.22);
      }
      this.pedNext += rand(5, 11);
    }
    // jhandiyan strung across the old streets
    while (this.buntNext < limit) {
      const st = DISTRICTS[districtIndexAt(this.buntNext)].id;
      if ((st === 'androon' || st === 'anarkali') && !this.clears.some(([a, b]) => this.buntNext >= a - 10 && this.buntNext < b + 10)) this.place(this.take(`bunt${randi(0, 3)}`, createBunting), this.buntNext, 0);
      this.buntNext += rand(28, 55);
    }
    // Basant kites drifting over the rooftops
    while (this.kiteNext < limit) {
      for (let i = 0, n = randi(1, 3); i < n; i++) {
        const it = this.place(this.take(`skite${Math.floor(Math.random() * 6)}`, createSkyKite), this.kiteNext + rand(0, 30), pick([-1, 1]) * rand(12, 45), rand(18, 34));
        it.kite = rand(0, 6);
      }
      this.kiteNext += rand(35, 70);
    }
    // gates between places
    while (this.gateNext < limit) {
      const pi = placeIndexAt(this.gateNext + 1);
      this.place(this.take(`gate${pi}`, () => createGate(pi)), this.gateNext, 0);
      this.gateNext += DISTRICT_LENGTH;
    }
  }

  update(D, dt = 0) {
    this.D = D;
    this.time += dt;
    this.fill();
    const items = this.items;
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      const z = D - it.s;
      if (z > it.behind) { this.give(it.obj); items[i] = items[items.length - 1]; items.pop(); continue; }
      it.obj.position.z = z;
      if (it.train !== undefined) { const tr = it.obj.userData.train; tr.position.x = ((this.time * 17 + it.train) % 340) - 170; }
      if (it.kite !== undefined) {   // sway in the wind
        const t = this.time + it.kite;
        it.obj.position.y = it.y + Math.sin(t * 0.9) * 1.2;
        it.obj.rotation.z = Math.sin(t * 1.7) * 0.35;
      }
    }
    for (let i = this.structs.length - 1; i >= 0; i--) {
      if (D >= this.structs[i].s) { this.onStruct?.(this.structs[i].name); this.structs.splice(i, 1); }
    }
    curveUniforms.uCurveX.value = Math.sin(D * 0.0021) * 0.0011 + Math.sin(D * 0.0057 + 1.3) * 0.0005;
  }
}
