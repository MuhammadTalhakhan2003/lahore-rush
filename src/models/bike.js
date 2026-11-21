// The player's 125 (Blender model, recoloured per paint job) with a procedural fallback.
// Faces -z. Origin = ground under the middle of the bike.
//
// Pivot stack:  root (position) → tilt (lean / yaw) → flip (backflip, pivots at the centre of mass)
//               → pitch (wheelie, pivots on the rear axle) → body
import * as THREE from 'three';
import { Builder, MATS } from '../render/kit.js';
import { addSeated, randomLook } from './person.js';
import { customModel } from '../render/gltf.js';
import { TEX } from '../render/textures.js';
import { curvify } from '../render/curve.js';

let plateMat = null;
/** Textured number plate laid over the model's blank plate (rear, tilted like the real bracket). */
function addPlate(group) {
  plateMat ||= curvify(new THREE.MeshStandardMaterial({ map: TEX.plate, roughness: 0.45, metalness: 0.1, emissiveMap: TEX.plate, emissive: 0xffffff, emissiveIntensity: 0.12 }));
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.235, 0.132), plateMat);
  plate.position.set(0, 0.7, 0.988);
  plate.rotation.x = 0.25;
  plate.frustumCulled = false;
  group.add(plate);
}
const findNode = (root, name) => { let n = null; root.traverse(o => { if (o.name === name) n = o; }); return n; };

const DARK = 0x151515, CHROME = 0xdedede;
const REAR_AXLE = new THREE.Vector3(0, 0.31, 0.6);
const COM = new THREE.Vector3(0, 0.8, 0);

/** Clone the materials we recolour so every bike can wear its own paint. */
function paintModel(root, skin) {
  root.traverse(o => {
    if (!o.isMesh) return;
    const name = o.material?.name || '';
    if (name === 'paint' || name === 'stripe' || name === 'kameez') {
      o.material = o.material.clone();
      const hex = name === 'paint' ? skin.body : name === 'stripe' ? skin.trim : skin.kameez;
      if (hex !== undefined) o.material.color.setHex(hex);
      if (name === 'paint') { o.material.metalness = 0.45; o.material.roughness = 0.2; }
    }
  });
}

/** Simple stand-in if the .glb is missing. */
function fallbackBody(skin) {
  const b = new Builder();
  b.box(0.34, 0.24, 0.62, skin.body, 0, 0.93, -0.2, { kind: 'shiny' });       // tank
  b.box(0.26, 0.1, 0.7, DARK, 0, 0.9, 0.37);                                   // seat
  b.box(0.24, 0.34, 0.4, 0x8e9196, 0, 0.5, -0.05, { kind: 'shiny' });          // engine
  b.cyl(0.05, 0.05, 0.6, CHROME, 0.2, 0.4, 0.6, { r: [Math.PI / 2, 0, 0], kind: 'shiny', seg: 10 });
  b.cyl(0.1, 0.1, 0.12, CHROME, 0, 0.93, -0.55, { r: [Math.PI / 2, 0, 0], kind: 'shiny', seg: 14 });
  b.cyl(0.08, 0.08, 0.02, 0xfff3c4, 0, 0.93, -0.62, { r: [Math.PI / 2, 0, 0], kind: 'glow', seg: 14 });
  b.box(0.12, 0.06, 0.05, 0xff2020, 0, 0.82, 0.93, { kind: 'glow' });
  b.cyl(0.012, 0.012, 0.74, CHROME, 0, 1.12, -0.32, { r: [0, 0, Math.PI / 2], kind: 'shiny', seg: 6 });
  for (const s of [-1, 1]) b.cyl(0.024, 0.024, 0.7, CHROME, s * 0.085, 0.64, -0.55, { r: [-0.21, 0, 0], kind: 'shiny', seg: 6 });
  addSeated(b, 0, 0.95, 0.15, { skin: 0xa8714a, shirt: skin.kameez, pants: skin.kameez, hat: null, scarf: null }, 'forward');
  const wheels = [];
  const g = b.build();
  for (const z of [-0.64, 0.6]) {
    const w = new Builder();
    w.torus(0.26, 0.055, DARK, 0, 0, 0, { r: [0, Math.PI / 2, 0] });
    w.cyl(0.08, 0.08, 0.13, CHROME, 0, 0, 0, { r: [0, 0, Math.PI / 2], kind: 'shiny', seg: 10 });
    for (let k = 0; k < 6; k++) w.box(0.01, 0.44, 0.01, CHROME, 0, 0, 0, { r: [k * Math.PI / 6, 0, 0], kind: 'shiny' });
    const wg = w.build();
    wg.position.set(0, 0.31, z);
    wg.children.forEach(m => (m.matrixAutoUpdate = true));
    g.add(wg);
    wheels.push(wg);
  }
  return { group: g, wheels };
}

/** Player / rival bike. */
export function createBike(skin) {
  const root = new THREE.Group();
  const tilt = new THREE.Group();
  const flip = new THREE.Group();
  const pitch = new THREE.Group();
  const body = new THREE.Group();
  root.add(tilt);
  tilt.add(flip); flip.position.copy(COM);
  flip.add(pitch); pitch.position.copy(REAR_AXLE).sub(COM);
  pitch.add(body); body.position.copy(REAR_AXLE).negate();

  const custom = customModel('bike');
  let wheels;
  if (custom) {
    paintModel(custom.group, skin);
    addPlate(custom.group);
    body.add(custom.group);
    wheels = custom.wheels;
  } else {
    const f = fallbackBody(skin);
    body.add(f.group);
    wheels = f.wheels;
  }

  // extras baked with the Builder: night headlight pool, contact shadow, optional underglow
  const b = new Builder();
  b.plane(2.6, 12, 'beamSoft', 0xffffff, [0, 0.07, -7.2], [-Math.PI / 2, 0, 0]);
  if (!custom) b.plane(1.0, 2.4, 'shadow', 0xffffff, [0, 0.03, 0], [-Math.PI / 2, 0, 0]);
  if (skin.glow) b.box(0.08, 0.02, 1.1, skin.glow, 0, 0.24, 0, { kind: 'glow' });
  tilt.add(b.build());

  // pillion passenger (toggled), sits on the rear of the seat
  const pb = new Builder();
  addSeated(pb, 0, 0, 0, { skin: 0xc68a5e, shirt: 0x3f6fb5, pants: 0x2a3550, hat: null, scarf: 0xf2c14e }, 'down');
  const passenger = pb.build();
  passenger.position.set(0, 1.0, 0.55).add(body.position);
  passenger.visible = false;
  pitch.add(passenger);

  // nitro flame out of the silencer
  const flameMat = new THREE.MeshBasicMaterial({ color: 0x5ee7ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.7, 8), flameMat);
  flame.rotation.x = Math.PI / 2;
  flame.position.set(0.2, 0.43, 1.22).add(body.position);
  flame.visible = false;
  pitch.add(flame);

  // shield bubble
  const shieldMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { t: { value: 0 }, col: { value: new THREE.Color(0x4fc3f7) }, a: { value: 1 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = -mv.xyz; vP = position; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float t; uniform vec3 col; uniform float a; varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.5);
        float hex = 0.5 + 0.5*sin(vP.y*14.0 - t*4.0)*sin(vP.x*14.0);
        gl_FragColor = vec4(col, (f*0.9 + hex*0.08) * a); }`,
  });
  const shield = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), shieldMat);
  shield.scale.set(0.85, 1.15, 1.35);
  shield.position.set(0, 1.0, 0);
  shield.visible = false;
  tilt.add(shield);

  // headlight spot
  const head = new THREE.SpotLight(0xfff1c8, 0, 60, 0.45, 0.6, 1.2);
  head.position.set(0, 0.95, -0.7);
  head.target.position.set(0, 0, -20);
  root.add(head, head.target);

  const riderHead = custom ? findNode(custom.group, 'RiderHead') : null;
  return { root, tilt, flip, pitch, body, wheels, passenger, flame, shield, head, riderHead };
}

/** Traffic bike (another Lahori on a 125), random paint + clothes, sometimes with a pillion. */
export function createTrafficBike() {
  const look = randomLook();
  const skins = [0xc4121a, 0x121212, 0x1a3c8f, 0xc4121a, 0xb9bdc2, 0x0b6e3a];
  const skin = { body: skins[Math.floor(Math.random() * skins.length)], trim: 0xf5f5f5, kameez: look.shirt };
  const group = new THREE.Group();
  const custom = customModel('bike');
  if (custom) { paintModel(custom.group, skin); addPlate(custom.group); group.add(custom.group); }
  else group.add(fallbackBody(skin).group);
  const b = new Builder();
  b.box(0.12, 0.06, 0.05, 0xff2020, 0, 0.82, 0.96, { kind: 'glow' });
  b.plane(2.2, 8, 'beamSoft', 0xffffff, [0, 0.06, -5], [-Math.PI / 2, 0, 0]);
  if (Math.random() < 0.5) addSeated(b, 0, 1.0, 0.55, randomLook(), 'down');
  group.add(b.build());
  return { group, hw: 0.45, hl: 1.0, h: 1.9, wheels: custom?.wheels || [] };
}

export { MATS };

/** Police 125 with a flashing red/blue light bar on the rear carrier. */
export function createPoliceBike() {
  const m = createBike({ body: 0xf2f2f2, trim: 0x1a3c8f, kameez: 0x1f2a44 });
  const red = new Builder(); red.box(0.16, 0.08, 0.1, 0xff1a1a, -0.1, 1.12, 0.85, { kind: 'glow' });
  const blue = new Builder(); blue.box(0.16, 0.08, 0.1, 0x2b6bff, 0.1, 1.12, 0.85, { kind: 'glow' });
  const bar = new Builder(); bar.box(0.4, 0.05, 0.14, 0x222222, 0, 1.06, 0.85);
  const r = red.build(), bl = blue.build();
  m.pitch.add(r, bl, bar.build());
  [r, bl].forEach(g => g.position.add(m.body.position));
  m.pitch.children.at(-1).position.add(m.body.position);
  m.lights = { red: r, blue: bl };
  return m;
}
