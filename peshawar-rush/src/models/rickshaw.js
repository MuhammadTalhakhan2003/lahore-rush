// Auto-rickshaws. The player's one uses the same pivot stack as the 125 so the Player code drives both:
//   root (position) → tilt (lean / yaw / two-wheel stunt) → flip (backflip, centre of mass)
//   → pitch (nose-up, rear axle) → body
// Faces -z. Origin = ground under the middle of the vehicle.
import * as THREE from 'three';
import { Builder, MATS, pick } from '../render/kit.js';
import { artUV } from '../render/textures.js';
import { addSeated } from './person.js';
import { customModel } from '../render/gltf.js';
import { makeShield } from './bike.js';

const DARK = 0x1a1a1a, CHROME = 0xdedede, SEAT = 0x8b1a1a;
const REAR_AXLE = new THREE.Vector3(0, 0.31, 0.92);
const COM = new THREE.Vector3(0, 0.95, 0.1);

/** Recolour the Blender rickshaw: paint, trim, canopy and seat (each instance gets its own materials). */
function paint(group, skin, classy) {
  group.traverse(o => {
    if (!o.isMesh) return;
    const n = o.material?.name;
    const hex = n === 'body_green' ? skin.body : n === 'trim_yellow' ? skin.trim : n === 'canopy' ? skin.canopy : n === 'seat.001' ? skin.seat : undefined;
    if (hex === undefined) return;
    o.material = o.material.clone();
    o.material.color.setHex(hex);
    if (classy && n === 'body_green') { o.material.metalness = 0.5; o.material.roughness = 0.18; }     // metallic show paint
    if (classy && n === 'trim_yellow') { o.material.metalness = 0.7; o.material.roughness = 0.22; }
    if (classy && n === 'canopy') { o.material.roughness = 0.45; o.material.metalness = 0.1; }          // leather-look roof
  });
}

/** Procedural stand-in if the .glb is missing. */
function proceduralBody(b, skin) {
  // chassis + rear tub
  b.box(1.3, 0.14, 2.7, DARK, 0, 0.42, 0.05);
  b.box(1.52, 0.62, 1.35, skin.body, 0, 0.8, 0.62);
  b.box(1.58, 0.07, 1.4, skin.trim, 0, 1.13, 0.62, { kind: 'shiny' });
  b.box(1.58, 0.05, 1.4, skin.trim, 0, 0.5, 0.62, { kind: 'shiny' });
  // truck-art panels on the sides and back
  b.plane(1.22, 0.46, 'art', 0xffffff, [0.77, 0.8, 0.62], [0, Math.PI / 2, 0], { uv: artUV.flowers });
  b.plane(1.22, 0.46, 'art', 0xffffff, [-0.77, 0.8, 0.62], [0, -Math.PI / 2, 0], { uv: artUV.flowers });
  b.plane(1.3, 0.5, 'art', 0xffffff, [0, 0.8, 1.3], [0, 0, 0], { uv: artUV.band });
  b.plane(1.3, 0.16, 'art', 0xffffff, [0, 2.04, 1.38], [0, 0, 0], { uv: artUV.small });
  // tail lights + plate
  for (const s of [-1, 1]) b.box(0.2, 0.12, 0.05, 0xff2a2a, s * 0.58, 1.0, 1.31, { kind: 'glow' });
  b.box(0.42, 0.14, 0.03, 0xf5f5f5, 0, 0.6, 1.32);
  // driver section
  b.box(1.05, 0.08, 1.0, DARK, 0, 0.52, -0.52);
  b.box(1.02, 0.86, 0.16, skin.body, 0, 0.96, -1.02, { r: [-0.18, 0, 0] });
  b.box(0.92, 0.12, 0.5, skin.body, 0, 0.56, -0.9);
  b.plane(0.7, 0.3, 'art', 0xffffff, [0, 0.82, -1.13], [-0.18 + Math.PI, 0, Math.PI], { uv: artUV.small });
  // headlight + indicators
  b.cyl(0.14, 0.14, 0.08, CHROME, 0, 1.16, -1.14, { r: [Math.PI / 2, 0, 0], kind: 'shiny', seg: 14 });
  b.cyl(0.11, 0.11, 0.02, 0xfff3c4, 0, 1.16, -1.19, { r: [Math.PI / 2, 0, 0], kind: 'glow', seg: 14 });
  for (const s of [-1, 1]) b.box(0.1, 0.07, 0.05, 0xffa000, s * 0.42, 0.7, -1.13, { kind: 'glow' });
  // windscreen + frame
  b.box(1.08, 0.62, 0.03, 0x2a3b4c, 0, 1.7, -1.0, { kind: 'glass', r: [-0.12, 0, 0] });
  b.box(1.14, 0.05, 0.07, CHROME, 0, 1.39, -1.03, { kind: 'shiny' });
  // pillars
  for (const [x, z] of [[-0.74, -0.98], [0.74, -0.98], [-0.74, 1.27], [0.74, 1.27], [-0.74, 0.0], [0.74, 0.0]]) {
    b.cyl(0.032, 0.032, 1.0, CHROME, x, 1.6, z, { kind: 'shiny', seg: 6 });
  }
  // canopy roof
  b.box(1.6, 0.1, 2.55, skin.canopy, 0, 2.12, 0.14);
  b.cyl(0.8, 0.8, 2.55, skin.canopy, 0, 2.15, 0.14, { r: [Math.PI / 2, 0, 0], s: [1, 1, 0.28], seg: 14 });
  b.box(1.65, 0.05, 2.62, skin.trim, 0, 2.06, 0.14, { kind: 'shiny' });
  // jhalar fringe
  const fr = skin.stripe;
  for (let i = 0; i < 15; i++) {
    const z = -1.1 + i * 0.17;
    for (const s of [-1, 1]) b.box(0.02, 0.17, 0.085, fr[i % fr.length], s * 0.83, 1.96, z);
  }
  for (let i = 0; i < 9; i++) b.box(0.085, 0.17, 0.02, fr[i % fr.length], -0.72 + i * 0.18, 1.96, -1.17);
  // side canvas flaps (rolled)
  for (const s of [-1, 1]) b.cyl(0.07, 0.07, 1.25, skin.canopy, s * 0.8, 2.0, 0.6, { r: [Math.PI / 2, 0, 0], seg: 6 });
  // seats
  b.box(1.3, 0.18, 0.62, SEAT, 0, 1.18, 0.84);
  b.box(1.3, 0.62, 0.12, SEAT, 0, 1.55, 1.2);
  b.box(0.56, 0.14, 0.45, DARK, 0, 1.08, -0.22);
  // handlebar, column, mirrors
  b.cyl(0.03, 0.03, 0.92, CHROME, 0, 1.33, -0.78, { r: [0, 0, Math.PI / 2], kind: 'shiny', seg: 6 });
  b.cyl(0.035, 0.035, 0.7, CHROME, 0, 0.98, -0.94, { r: [0.3, 0, 0], kind: 'shiny', seg: 6 });
  for (const s of [-1, 1]) {
    b.cyl(0.015, 0.015, 0.38, CHROME, s * 0.52, 1.5, -0.8, { r: [0, 0, s * 0.55], kind: 'shiny', seg: 4 });
    b.sphere(0.08, CHROME, s * 0.62, 1.67, -0.8, { kind: 'shiny', s: [1, 0.7, 0.35], seg: 8 });
    b.box(0.26, 0.06, 0.78, skin.body, s * 0.68, 0.7, 0.92);     // rear mudguards
    b.box(0.05, 0.5, 0.05, CHROME, s * 0.13, 0.55, -1.16, { kind: 'shiny' }); // front fork
  }
  b.box(0.28, 0.06, 0.6, skin.trim, 0, 0.67, -1.17, { kind: 'shiny' });
  b.cyl(0.055, 0.055, 0.6, CHROME, 0.45, 0.36, 1.3, { r: [Math.PI / 2, 0, 0], kind: 'shiny', seg: 8 });
  if (skin.glow) b.box(1.2, 0.03, 2.4, skin.glow, 0, 0.33, 0.05, { kind: 'glow' });
  addSeated(b, 0, 1.12, -0.22, { skin: 0xb07a52, shirt: skin.kameez ?? 0xd9d2bf, pants: 0x55524a, hat: 0x2b2b2b, scarf: 0xb33a3a });
}

/** The player's rickshaw. `skin` = a paint job from config (body / trim / kameez / glow). */
export function createRickshaw(skin) {
  const root = new THREE.Group();
  const tilt = new THREE.Group();
  const flip = new THREE.Group();
  const pitch = new THREE.Group();
  const body = new THREE.Group();
  root.add(tilt);
  tilt.add(flip); flip.position.copy(COM);
  flip.add(pitch); pitch.position.copy(REAR_AXLE).sub(COM);
  pitch.add(body); body.position.copy(REAR_AXLE).negate();

  const look = { body: skin.body, trim: skin.trim, canopy: skin.canopy ?? 0x121212, seat: skin.seat ?? 0x5a0f14, kameez: skin.kameez, stripe: [skin.trim, 0xd62828, 0xffd60a, 0x1565c0] };
  const custom = customModel('rickshaw');
  let wheels = [];
  if (custom) {
    paint(custom.group, look, true);
    body.add(custom.group);
    wheels = custom.wheels;
  } else {
    const b = new Builder();
    proceduralBody(b, look);
    body.add(b.build());
    const wheel = (x, y, z) => {
      const w = new Builder();
      w.cyl(0.3, 0.3, 0.2, 0x151515, 0, 0, 0, { r: [0, 0, Math.PI / 2], seg: 14 });
      w.cyl(0.17, 0.17, 0.22, CHROME, 0, 0, 0, { r: [0, 0, Math.PI / 2], kind: 'shiny', seg: 8 });
      w.box(0.23, 0.05, 0.3, 0x444444, 0, 0, 0);
      const g = w.build();
      g.position.set(x, y, z);
      g.children.forEach(m => (m.matrixAutoUpdate = true));
      body.add(g);
      wheels.push(g);
    };
    wheel(-0.7, 0.3, 0.92); wheel(0.7, 0.3, 0.92); wheel(0, 0.3, -1.18);
  }

  // premium touches: chrome side rails, warm LED strip under the canopy, optional neon underglow
  const x = new Builder();
  for (const s of [-1, 1]) {
    x.cyl(0.025, 0.025, 1.9, CHROME, s * 0.86, 0.62, 0.15, { r: [Math.PI / 2, 0, 0], kind: 'shiny', seg: 6 });
    x.box(0.03, 0.03, 2.3, skin.glow ?? 0xffe2a8, s * 0.8, 1.92, 0.12, { kind: 'glow' });
  }
  x.box(1.5, 0.03, 0.03, skin.glow ?? 0xffe2a8, 0, 1.92, -1.08, { kind: 'glow' });
  if (skin.glow) x.box(1.2, 0.03, 2.3, skin.glow, 0, 0.22, 0.05, { kind: 'glow' });
  body.add(x.build());

  const b = new Builder();
  b.plane(3.2, 12, 'beamSoft', 0xffffff, [0, 0.07, -7.2], [-Math.PI / 2, 0, 0]);
  if (!custom) b.plane(2.1, 3.7, 'shadow', 0xffffff, [0, 0.03, 0.1], [-Math.PI / 2, 0, 0]);
  tilt.add(b.build());

  // sawari on the back seat (toggled)
  const pb = new Builder();
  addSeated(pb, 0, 0, 0, { skin: 0xc68a5e, shirt: 0x3f6fb5, pants: 0x2a3550, hat: null, scarf: 0xf2c14e }, 'down');
  const passenger = pb.build();
  passenger.position.set(0.28, 1.2, 0.86).add(body.position);
  passenger.visible = false;
  pitch.add(passenger);

  // nitro flame out of the exhaust (rear right)
  const flameMat = new THREE.MeshBasicMaterial({ color: 0x5ee7ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.9, 8), flameMat);
  flame.rotation.x = Math.PI / 2;
  flame.position.set(0.45, 0.36, 1.95).add(body.position);
  flame.visible = false;
  pitch.add(flame);

  const shield = makeShield();
  shield.scale.set(1.3, 1.4, 2.0);
  shield.position.set(0, 1.15, 0.1);
  tilt.add(shield);

  const head = new THREE.SpotLight(0xfff1c8, 0, 60, 0.5, 0.6, 1.2);
  head.position.set(0, 1.2, -1.2);
  head.target.position.set(0, 0, -20);
  root.add(head, head.target);

  return { root, tilt, flip, pitch, body, wheels, passenger, flame, shield, head, riderHead: null, kind: 'rickshaw' };
}

const TRAFFIC_LOOKS = [
  { body: 0x1b7f3b, trim: 0xffd60a, canopy: 0x141414, seat: 0x5a0f14 },
  { body: 0x0b5e3a, trim: 0xf2c14e, canopy: 0x1c1c1c, seat: 0x7a1f1f },
  { body: 0xc81d25, trim: 0xf5f5f5, canopy: 0x202020, seat: 0x3a2a1a },
  { body: 0x1a3c8f, trim: 0xffd60a, canopy: 0x151515, seat: 0x5a0f14 },
  { body: 0xe0a81c, trim: 0x1b7f3b, canopy: 0x111111, seat: 0x6b0f1a },
];
/** A traffic rickshaw in one of the city's usual colours. */
export function createTrafficRickshawModel() {
  const look = pick(TRAFFIC_LOOKS);
  const c = customModel('rickshaw');
  if (c) { paint(c.group, look, false); return c.group; }
  const b = new Builder();
  proceduralBody(b, { ...look, kameez: 0xd9d2bf, stripe: [0xd62828, 0xffd60a] });
  b.plane(2.1, 3.7, 'shadow', 0xffffff, [0, 0.03, 0.1], [-Math.PI / 2, 0, 0]);
  return b.build();
}

export { MATS };
