// The Peshawar CHINGCHI (qingqi) — the player's hero ride. A motorcycle front pulling a roofed, truck-art passenger tub
// on two rear wheels. It uses the same pivot stack as the 125 so the Player code drives both:
//   root (position) → tilt (lean / yaw / two-wheel stunt) → flip (backflip, centre of mass)
//   → pitch (nose-up, rear axle) → body
// Faces -z. Origin = ground under the middle of the vehicle.
import * as THREE from 'three';
import { Builder, MATS } from '../render/kit.js';
import { artUV } from '../render/textures.js';
import { addSeated } from './person.js';
import { makeShield } from './bike.js';

const DARK = 0x1a1a1a, CHROME = 0xdedede, SEAT = 0x8b1a1a;
const REAR_AXLE = new THREE.Vector3(0, 0.34, 1.2);
const COM = new THREE.Vector3(0, 1.0, 0.5);
const FRINGE = [0xd62828, 0xffd60a, 0xffffff, 0x1565c0, 0x0b8f3a];

/** Driver in a Peshawari look: pakol cap + patou shawl over the kameez. */
function addDriver(b, x, y, z, shirt) {
  addSeated(b, x, y, z, { skin: 0xc8946a, shirt, pants: 0x55524a, hat: null, scarf: null }, 'forward');
  b.cyl(0.16, 0.15, 0.1, 0xc9b184, x, y + 0.9, z, { seg: 10 });                    // rolled brim of the pakol
  b.sphere(0.15, 0x8c7650, x, y + 0.93, z, { seg: 8, half: true });                 // flat woollen crown
  b.box(0.5, 0.1, 0.34, 0x6b4a2b, x, y + 0.56, z + 0.01);                            // patou shawl over the shoulders
  b.box(0.12, 0.34, 0.06, 0x6b4a2b, x + 0.16, y + 0.34, z - 0.13);
}

export function createChingchi(skin) {
  const root = new THREE.Group();
  const tilt = new THREE.Group();
  const flip = new THREE.Group();
  const pitch = new THREE.Group();
  const body = new THREE.Group();
  root.add(tilt);
  tilt.add(flip); flip.position.copy(COM);
  flip.add(pitch); pitch.position.copy(REAR_AXLE).sub(COM);
  pitch.add(body); body.position.copy(REAR_AXLE).negate();

  const paint = skin.body, trim = skin.trim, canopy = skin.canopy ?? 0x1a1a1a;
  const glow = skin.glow ?? 0xffe2a8;
  const b = new Builder();

  // ---- motorcycle front end ----
  b.box(0.5, 0.16, 0.9, paint, 0, 0.74, -1.1, { kind: 'shiny' });                    // tank / front cowl
  b.box(0.34, 0.1, 0.5, trim, 0, 0.84, -1.1, { kind: 'shiny' });                     // tank stripe
  b.box(0.1, 0.62, 0.1, CHROME, -0.16, 0.7, -1.52, { kind: 'shiny', r: [-0.18, 0, 0] });   // fork
  b.box(0.1, 0.62, 0.1, CHROME, 0.16, 0.7, -1.52, { kind: 'shiny', r: [-0.18, 0, 0] });
  b.box(0.42, 0.06, 0.62, paint, 0, 0.7, -1.55, { kind: 'shiny' });                  // front mudguard
  b.cyl(0.035, 0.035, 0.92, CHROME, 0, 1.16, -1.22, { r: [0, 0, Math.PI / 2], kind: 'shiny', seg: 6 }); // handlebar
  b.cyl(0.18, 0.16, 0.2, CHROME, 0, 1.0, -1.5, { r: [Math.PI / 2, 0, 0], kind: 'shiny', seg: 14 });     // headlamp shell
  b.cyl(0.14, 0.14, 0.02, 0xfff3c4, 0, 1.0, -1.61, { r: [Math.PI / 2, 0, 0], kind: 'glow', seg: 14 });
  for (const s of [-1, 1]) {
    b.cyl(0.015, 0.015, 0.4, CHROME, s * 0.5, 1.4, -1.2, { r: [0, 0, s * 0.5], kind: 'shiny', seg: 4 });   // mirrors
    b.sphere(0.08, CHROME, s * 0.6, 1.58, -1.2, { kind: 'shiny', s: [1, 0.7, 0.35], seg: 8 });
    b.box(0.1, 0.07, 0.05, 0xffa000, s * 0.3, 1.0, -1.45, { kind: 'glow' });         // indicators
  }
  // chrome crash bumper in front, with a gold cow-catcher bar
  b.cyl(0.03, 0.03, 0.72, CHROME, 0, 0.55, -1.8, { r: [0, 0, Math.PI / 2], kind: 'shiny', seg: 6 });
  for (const s of [-1, 1]) b.cyl(0.025, 0.025, 0.5, CHROME, s * 0.34, 0.6, -1.62, { r: [Math.PI / 2 - 0.3, 0, 0], kind: 'shiny', seg: 5 });

  // ---- chassis + tub ----
  b.box(0.7, 0.12, 3.2, DARK, 0, 0.5, 0.3);                                          // frame
  b.box(1.56, 0.12, 2.4, DARK, 0, 0.58, 1.0);                                        // floor
  b.box(1.6, 0.06, 2.46, trim, 0, 0.48, 1.0, { kind: 'shiny' });                     // gold edge under the floor
  for (const s of [-1, 1]) b.box(0.07, 0.5, 2.4, paint, s * 0.78, 0.88, 1.0, { kind: 'shiny' }); // side panels
  b.box(1.6, 0.5, 0.07, paint, 0, 0.88, 2.2, { kind: 'shiny' });                     // tailgate
  b.box(1.64, 0.06, 2.46, trim, 0, 1.14, 1.0, { kind: 'shiny' });                    // gold rail along the top
  // truck-art panels (painted flowers, hunting scenes, "Peshawar" lettering)
  b.plane(2.1, 0.44, 'art', 0xffffff, [0.82, 0.88, 1.0], [0, Math.PI / 2, 0], { uv: artUV.flowers });
  b.plane(2.1, 0.44, 'art', 0xffffff, [-0.82, 0.88, 1.0], [0, -Math.PI / 2, 0], { uv: artUV.flowers });
  b.plane(1.5, 0.44, 'art', 0xffffff, [0, 0.88, 2.25], [0, 0, 0], { uv: artUV.band });
  // benches: passengers sit facing each other along the sides
  for (const s of [-1, 1]) {
    b.box(0.42, 0.14, 2.0, SEAT, s * 0.52, 0.8, 1.05);
    b.box(0.08, 0.42, 2.0, SEAT, s * 0.7, 1.05, 1.05);
  }
  b.box(0.7, 0.12, 0.9, 0x4a4a4a, 0, 0.7, 1.05);                                     // step between the benches
  // driver saddle + driver
  b.box(0.42, 0.14, 0.6, DARK, 0, 0.92, -0.4);
  addDriver(b, 0, 0.98, -0.34, skin.kameez ?? 0xd9d2bf);

  // ---- roof: tin canopy over everything, jhalar fringe, chrome pillars ----
  for (const [x, z] of [[-0.78, -0.62], [0.78, -0.62], [-0.78, 0.2], [0.78, 0.2], [-0.78, 1.15], [0.78, 1.15], [-0.78, 2.15], [0.78, 2.15]]) {
    b.cyl(0.03, 0.03, 1.2, CHROME, x, 1.6, z, { kind: 'shiny', seg: 6 });
  }
  b.box(1.72, 0.1, 3.1, canopy, 0, 2.2, 0.8);
  b.cyl(0.86, 0.86, 3.1, canopy, 0, 2.22, 0.8, { r: [Math.PI / 2, 0, 0], s: [1, 1, 0.26], seg: 14 });
  b.box(1.78, 0.05, 3.18, trim, 0, 2.14, 0.8, { kind: 'shiny' });                    // gold trim under the roof
  for (let i = 0; i < 18; i++) {
    const z = -0.7 + i * 0.172;
    for (const s of [-1, 1]) b.box(0.02, 0.18, 0.09, FRINGE[i % FRINGE.length], s * 0.88, 2.03, z);
  }
  for (let i = 0; i < 10; i++) b.box(0.09, 0.18, 0.02, FRINGE[i % FRINGE.length], -0.8 + i * 0.178, 2.03, -0.78);
  // roof rack with a rolled carpet and a sack — a proper working chingchi
  b.box(1.5, 0.04, 1.6, CHROME, 0, 2.38, 1.2, { kind: 'shiny' });
  b.cyl(0.14, 0.14, 1.2, 0xb5563a, -0.3, 2.55, 1.2, { r: [0, 0, Math.PI / 2], seg: 8 });
  b.box(0.5, 0.3, 0.6, 0xc9b184, 0.35, 2.55, 1.3);
  // headlamp-height lights + tail lights + plate
  for (const s of [-1, 1]) b.box(0.2, 0.12, 0.05, 0xff2a2a, s * 0.55, 1.0, 2.26, { kind: 'glow' });
  b.box(0.44, 0.16, 0.03, 0xf5f5f0, 0, 0.64, 2.27);
  b.cyl(0.03, 0.03, 1.5, CHROME, 0, 0.5, 2.3, { r: [0, 0, Math.PI / 2], kind: 'shiny', seg: 6 });         // rear step bar
  b.cyl(0.055, 0.055, 0.7, CHROME, 0.52, 0.4, 2.4, { r: [Math.PI / 2, 0, 0], kind: 'shiny', seg: 8 });    // exhaust
  // LED strip under the canopy + optional underglow
  for (const s of [-1, 1]) b.box(0.03, 0.03, 2.9, glow, s * 0.82, 1.98, 0.8, { kind: 'glow' });
  if (skin.glow) b.box(1.3, 0.03, 2.8, skin.glow, 0, 0.26, 0.6, { kind: 'glow' });
  body.add(b.build());

  // ---- wheels (front + two rear), each its own group so they can spin ----
  const wheels = [];
  const wheel = (x, z, r = 0.34, w = 0.16) => {
    const wb = new Builder();
    wb.cyl(r, r, w, 0x151515, 0, 0, 0, { r: [0, 0, Math.PI / 2], seg: 16 });
    wb.cyl(r * 0.55, r * 0.55, w + 0.02, CHROME, 0, 0, 0, { r: [0, 0, Math.PI / 2], kind: 'shiny', seg: 10 });
    wb.box(w + 0.04, 0.05, r * 1.7, 0x444444, 0, 0, 0);
    wb.box(w + 0.04, r * 1.7, 0.05, 0x444444, 0, 0, 0);
    const g = wb.build();
    g.position.set(x, r, z);
    g.children.forEach(m => (m.matrixAutoUpdate = true));
    body.add(g);
    wheels.push(g);
  };
  wheel(0, -1.52, 0.33, 0.14);
  wheel(-0.8, 1.2); wheel(0.8, 1.2);
  for (const s of [-1, 1]) {                                                         // rear mudguards
    const mg = new Builder();
    mg.box(0.26, 0.05, 0.9, paint, s * 0.8, 0.74, 1.2);
    body.add(mg.build());
  }

  // headlight beam on the road + soft shadow
  const bb = new Builder();
  bb.plane(3.4, 12, 'beamSoft', 0xffffff, [0, 0.07, -7.8], [-Math.PI / 2, 0, 0]);
  bb.plane(2.2, 4.4, 'shadow', 0xffffff, [0, 0.03, 0.2], [-Math.PI / 2, 0, 0]);
  tilt.add(bb.build());

  // sawari on the bench (toggled)
  const pb = new Builder();
  addSeated(pb, 0, 0, 0, { skin: 0xc68a5e, shirt: 0xf2efe6, pants: 0x2a3550, hat: 0xc9b184, scarf: 0x6b4a2b }, 'down');
  const passenger = pb.build();
  passenger.rotation.y = Math.PI / 2;
  passenger.position.set(0.52, 0.88, 1.0).add(body.position);
  passenger.visible = false;
  pitch.add(passenger);

  // nitro flame out of the exhaust
  const flameMat = new THREE.MeshBasicMaterial({ color: 0x5ee7ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.0, 8), flameMat);
  flame.rotation.x = Math.PI / 2;
  flame.position.set(0.52, 0.4, 3.0).add(body.position);
  flame.visible = false;
  pitch.add(flame);

  const shield = makeShield();
  shield.scale.set(1.3, 1.4, 2.5);
  shield.position.set(0, 1.15, 0.45);
  tilt.add(shield);

  const head = new THREE.SpotLight(0xfff1c8, 0, 60, 0.5, 0.6, 1.2);
  head.position.set(0, 1.1, -1.6);
  head.target.position.set(0, 0, -20);
  root.add(head, head.target);

  return { root, tilt, flip, pitch, body, wheels, passenger, flame, shield, head, riderHead: null, kind: 'chingchi' };
}

export { MATS };
