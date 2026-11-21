// Low-poly people: baked into vehicles (drivers/riders) or standalone with a waving arm.
import * as THREE from 'three';
import { Builder, pick } from '../render/kit.js';

const SKIN = [0xc68a5e, 0xa86d45, 0xd9a07a, 0x8d5a3b];
const SHIRT = [0xe8e2d0, 0x3f6fb5, 0xb33a3a, 0x2f7d4f, 0xf2c14e, 0x7a4fa3, 0xffffff, 0xe07b39];
const PANTS = [0x3a3a3a, 0x5a4a3a, 0xe8e2d0, 0x2a3550];

export const randomLook = () => ({ skin: pick(SKIN), shirt: pick(SHIRT), pants: pick(PANTS), hat: Math.random() < 0.35 ? pick([0x2b2b2b, 0xffffff, 0x7a2a2a]) : null, scarf: Math.random() < 0.4 ? pick(SHIRT) : null });

/** Seated person; (x,y,z) = hip point on the seat. Faces -z. */
export function addSeated(b, x, y, z, look = randomLook(), arms = 'forward') {
  b.box(0.42, 0.56, 0.26, look.shirt, x, y + 0.33, z);                     // torso (kurta)
  b.box(0.46, 0.2, 0.3, look.shirt, x, y + 0.08, z);                       // kurta hem
  if (look.scarf) b.box(0.44, 0.1, 0.28, look.scarf, x, y + 0.56, z);
  b.sphere(0.14, look.skin, x, y + 0.78, z, { seg: 8 });
  b.box(0.2, 0.08, 0.12, 0x1a1a1a, x, y + 0.76, z - 0.12);                 // moustache/face hint
  if (look.hat) b.cyl(0.13, 0.15, 0.12, look.hat, x, y + 0.92, z, { seg: 8 });
  else b.sphere(0.145, 0x1a1a1a, x, y + 0.82, z + 0.02, { seg: 8, half: true });
  b.box(0.4, 0.14, 0.46, look.pants, x, y + 0.02, z - 0.2);                // thighs
  b.box(0.36, 0.42, 0.13, look.pants, x, y - 0.2, z - 0.42);               // shins
  if (arms === 'forward') {
    for (const s of [-1, 1]) b.box(0.1, 0.1, 0.42, look.shirt, x + s * 0.26, y + 0.42, z - 0.2, { r: [0.35, 0, 0] });
  } else {
    for (const s of [-1, 1]) b.box(0.1, 0.42, 0.1, look.shirt, x + s * 0.27, y + 0.32, z);
  }
}

/** Standing person group (origin at feet, faces +z by default). Returns {group, arm}. */
export function createStanding(look = randomLook()) {
  const b = new Builder();
  b.box(0.16, 0.8, 0.18, look.pants, -0.12, 0.4, 0);
  b.box(0.16, 0.8, 0.18, look.pants, 0.12, 0.4, 0);
  b.box(0.46, 0.7, 0.28, look.shirt, 0, 1.15, 0);
  b.box(0.5, 0.25, 0.3, look.shirt, 0, 0.82, 0);
  if (look.scarf) b.box(0.48, 0.1, 0.3, look.scarf, 0, 1.45, 0);
  b.sphere(0.15, look.skin, 0, 1.68, 0, { seg: 8 });
  if (look.hat) b.cyl(0.14, 0.16, 0.13, look.hat, 0, 1.83, 0, { seg: 8 });
  else b.sphere(0.155, 0x1a1a1a, 0, 1.72, -0.02, { seg: 8, half: true });
  b.box(0.1, 0.62, 0.1, look.shirt, -0.3, 1.12, 0);                        // left arm
  b.plane(0.9, 0.9, 'shadow', 0xffffff, [0, 0.02, 0], [-Math.PI / 2, 0, 0]);
  const group = b.build();
  const ab = new Builder();
  ab.box(0.1, 0.62, 0.1, look.shirt, 0, 0.28, 0);
  ab.sphere(0.07, look.skin, 0, 0.62, 0, { seg: 6 });
  const arm = ab.build();
  arm.position.set(0.3, 1.42, 0);
  group.add(arm);
  return { group, arm };
}

export const tmpV = new THREE.Vector3();

const KAMEEZ_M = [0xf2efe6, 0xe8e2d0, 0x1e2a44, 0x6b4a2b, 0x9aa6b2, 0x3a3a3a, 0xc9b79a, 0x2f4f3f];
const KAMEEZ_W = [0xe84a8a, 0xc2185b, 0x00897b, 0xf2b705, 0x7b1fa2, 0x1a3c8f, 0xff7043, 0x2e7d32, 0xd4a23a, 0x5e35b1];
const DUPATTA = [0xffd60a, 0xff2e88, 0xffffff, 0x2bbf5a, 0xff7a1a, 0x00acc1, 0xf6e7c1];

/** A Lahori on the pavement: man in shalwar kameez, woman in a bright suit + dupatta, or a kid. Faces +z. */
export function createPedestrian(kind = pick(['man', 'man', 'woman', 'woman', 'kid'])) {
  const b = new Builder();
  const k = kind === 'kid' ? 0.66 : 1;
  const woman = kind === 'woman' || (kind === 'kid' && Math.random() < 0.5);
  const skin = pick(SKIN);
  const top = woman ? pick(KAMEEZ_W) : pick(KAMEEZ_M);
  const bottom = woman ? pick([top, 0xf6e7c1, 0xffffff, pick(KAMEEZ_W)]) : top;
  const S = (w, h, d, c, x, y, z, o) => b.box(w * k, h * k, d * k, c, x * k, y * k, z * k, o);
  S(0.15, 0.62, 0.16, bottom, -0.1, 0.33, 0); S(0.15, 0.62, 0.16, bottom, 0.1, 0.33, 0);        // shalwar legs
  S(0.13, 0.06, 0.24, 0x5a3a20, -0.1, 0.03, 0.03); S(0.13, 0.06, 0.24, 0x5a3a20, 0.1, 0.03, 0.03); // chappal
  S(0.48, 0.92, 0.28, top, 0, 1.02, 0);                                                           // long kameez
  S(0.52, 0.3, 0.3, top, 0, 0.66, 0);                                                             // flared hem
  if (!woman && Math.random() < 0.4) S(0.5, 0.5, 0.3, pick([0x1e1e24, 0x3a2a20, 0x2a3f5f]), 0, 1.22, 0.005); // waistcoat
  b.sphere(0.15 * k, skin, 0, 1.68 * k, 0, { seg: 10 });
  if (woman) {
    b.sphere(0.16 * k, 0x141010, 0, 1.71 * k, -0.03 * k, { seg: 10, s: [1, 1.05, 1] });          // hair
    S(0.12, 0.5, 0.06, 0x141010, 0, 1.38, -0.14);                                                 // plait
    const dp = pick(DUPATTA);
    S(0.56, 0.08, 0.34, dp, 0, 1.5, 0, { r: [0, 0, 0.1] });                                         // dupatta over the shoulders
    S(0.16, 0.8, 0.04, dp, -0.24, 1.08, 0.12, { r: [0.08, 0, 0.12] });                              // the hanging end
    if (Math.random() < 0.5) S(0.2, 0.2, 0.08, pick([0x6b3e1e, 0x1b1b1b, 0xd4a23a]), 0.3, 0.95, 0.05); // handbag
  } else {
    if (Math.random() < 0.45) b.cyl(0.14 * k, 0.15 * k, 0.12 * k, pick([0xffffff, 0x2b2b2b, 0x7a2a2a]), 0, 1.83 * k, 0, { seg: 10 }); // topi
    else b.sphere(0.155 * k, 0x141010, 0, 1.72 * k, -0.02 * k, { seg: 10, half: true });
    if (kind === 'man' && Math.random() < 0.5) b.sphere(0.1 * k, 0x2a1d16, 0, 1.6 * k, 0.05 * k, { seg: 8, s: [1, 0.8, 0.8] }); // beard
  }
  const pose = Math.random();
  S(0.1, 0.6, 0.1, top, -0.3, 1.1, 0);
  if (pose < 0.35) { S(0.1, 0.5, 0.1, top, 0.3, 1.25, 0.15, { r: [-1.2, 0, 0] }); b.sphere(0.06 * k, skin, 0.3 * k, 1.42 * k, 0.32 * k, { seg: 6 }); S(0.06, 0.12, 0.02, 0x111111, 0.3, 1.5, 0.33); } // on the phone
  else if (pose < 0.55) { S(0.1, 0.5, 0.1, top, 0.3, 1.25, 0.15, { r: [-1.2, 0, 0] }); b.cyl(0.04 * k, 0.03 * k, 0.07 * k, 0xffffff, 0.3 * k, 1.36 * k, 0.4 * k, { seg: 8 }); } // chai cup
  else S(0.1, 0.6, 0.1, top, 0.3, 1.1, 0);
  b.plane(0.9 * k, 0.9 * k, 'shadow', 0xffffff, [0, 0.02, 0], [-Math.PI / 2, 0, 0]);
  return b.build();
}
