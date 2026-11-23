// Optional Blender models: drop .glb files into /public/models and list them in models.json.
// Anything listed replaces the procedural model of the same name. Export from Blender as glTF Binary,
// +Y up; in Blender point the front toward +Y (exported as -Z forward); 1 unit = 1 metre; origin on the ground at the centre.
//
// Performance: a Blender export is one mesh per part (the 125 alone is 230+ meshes = 230+ draw calls).
// On load every model is "baked": parts are merged per material, and plain-coloured materials collapse
// into three shared vertex-coloured materials (matte / satin / chrome) plus one unlit glow material.
// The 125 goes from 234 draw calls to ~8, the Badshahi Masjid from 264 to ~3.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { curvify } from './curve.js';
import { Builder, MATS, rmAttr } from './kit.js';

export const CUSTOM = {};

// nodes that move on their own (spinning wheels, trotting legs, the rider's head) keep their own transform
const KEEP = /^(Wheel|Leg_|RiderHead)/i;
// materials that the game recolours (paint jobs, animal fur, rickshaw paint) stay separate
const RECOLOR = new Set(['paint', 'stripe', 'kameez', 'fur', 'body_green', 'trim_yellow', 'canopy', 'seat.001']);

// plain materials go to the shared uber material (per-vertex roughness/metalness) or the unlit glow
const bucketMaterial = kind => (kind === 'glow' ? MATS.glow : MATS.solid);

function classify(mat) {
  if (RECOLOR.has(mat.name) || mat.map || mat.transparent || !mat.isMeshStandardMaterial) return null;
  const e = mat.emissive;
  return e && e.r + e.g + e.b > 0.3 ? 'glow' : 'solid';
}

const _m = new THREE.Matrix4(), _inv = new THREE.Matrix4();

function sub(geo, gr) {
  const g = geo.clone();
  if (g.index) g.setIndex(new THREE.BufferAttribute(g.index.array.slice(gr.start, gr.start + gr.count), 1));
  g.clearGroups();
  return g;
}

/** Merge a scene graph into a few meshes. Returns a new Group with the same outward behaviour. */
function bake(src) {
  src.updateMatrixWorld(true);
  const out = new THREE.Group();
  const holders = new Map([[src, out]]);          // original node → new group
  const groups = new Map();                         // original holder → Map(matKey → {mat, geos[]})
  const keepParent = o => { let p = o.parent; while (p && p !== src && !KEEP.test(p.name)) p = p.parent; return p || src; };

  // 1. keep-nodes become plain groups, parented to their nearest kept ancestor
  const keeps = [];
  src.traverse(o => { if (o !== src && KEEP.test(o.name)) keeps.push(o); });
  for (const k of keeps) { const g = new THREE.Group(); g.name = k.name; holders.set(k, g); }
  for (const k of keeps) {
    const p = keepParent(k);
    _inv.copy(p.matrixWorld).invert();
    _m.multiplyMatrices(_inv, k.matrixWorld);
    const g = holders.get(k);
    _m.decompose(g.position, g.quaternion, g.scale);
    holders.get(p).add(g);
  }

  // 2. bucket every mesh by (holder, material)
  src.traverse(o => {
    if (!o.isMesh) return;
    const holder = KEEP.test(o.name) ? o : keepParent(o);
    _inv.copy(holder.matrixWorld).invert();
    _m.multiplyMatrices(_inv, o.matrixWorld);
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const parts = mats.length > 1 && o.geometry.groups.length
      ? o.geometry.groups.map(gr => ({ mat: mats[gr.materialIndex], geo: sub(o.geometry, gr) }))
      : [{ mat: mats[0], geo: o.geometry }];
    if (!groups.has(holder)) groups.set(holder, new Map());
    const gm = groups.get(holder);
    for (const { mat, geo } of parts) {
      const kind = classify(mat);
      const key = kind || mat.uuid;
      if (!gm.has(key)) gm.set(key, { mat: kind ? bucketMaterial(kind) : mat, geos: [] });
      const g = geo.clone().applyMatrix4(_m);
      for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
      g.morphAttributes = {};
      if (!g.attributes.normal) g.computeVertexNormals();
      if (kind) {
        const c = kind === 'glow' && mat.emissive ? mat.color.clone().lerp(mat.emissive, 0.5) : mat.color;
        const n = g.attributes.position.count, col = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
        g.setAttribute('color', new THREE.BufferAttribute(col, 3));
        if (kind === 'solid') g.setAttribute('rm', rmAttr(n, Math.max(0.12, mat.roughness), Math.min(0.85, mat.metalness)));
      }
      gm.get(key).geos.push(g);
    }
  });

  // 3. merge
  for (const [holder, gm] of groups) {
    const target = holders.get(holder);
    for (const { mat, geos } of gm.values()) {
      const mixed = geos.some(g => g.index) && !geos.every(g => g.index);
      const merged = mergeGeometries(mixed ? geos.map(g => (g.index ? g.toNonIndexed() : g)) : geos, false);
      if (!merged) { console.warn('[models] merge failed', mat.name); continue; }
      const mesh = new THREE.Mesh(merged, mat);
      mesh.frustumCulled = false;
      if (mat.transparent) mesh.renderOrder = 1;
      target.add(mesh);
    }
  }
  return out;
}

export async function loadCustomModels() {
  let list = [];
  try {
    const res = await fetch('/models/models.json', { cache: 'no-cache' });
    if (res.ok && (res.headers.get('content-type') || '').includes('json')) list = (await res.json()).models || [];
  } catch { return; }
  const loader = new GLTFLoader();
  await Promise.all(list.map(async name => {
    try {
      const gltf = await loader.loadAsync(`/models/${name}.glb`);
      gltf.scene.traverse(o => {
        if (!o.isMesh) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(m => curvify(m));
      });
      const root = bake(gltf.scene);
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      CUSTOM[name] = { root, hw: size.x / 2, hl: size.z / 2, h: size.y };
    } catch (e) { console.warn(`[models] could not load ${name}.glb`, e); }
  }));
}

/** Returns a fresh clone wrapped like the procedural factories ({group, hw, hl, h}) or null. */
export function customModel(name) {
  const c = CUSTOM[name];
  if (!c) return null;
  const group = new THREE.Group();
  const root = c.root.clone(true);
  group.add(root);
  // soft blob shadow under every Blender model
  const b = new Builder();
  b.plane(c.hw * 2 + 0.6, c.hl * 2 + 0.8, 'shadow', 0xffffff, [0, 0.03, 0], [-Math.PI / 2, 0, 0]);
  group.add(b.build());
  // nodes named Wheel_* spin in the game
  const wheels = [];
  root.traverse(o => { if (/^Wheel/i.test(o.name)) wheels.push(o); });
  return { group, hw: c.hw, hl: c.hl, h: c.h, wheels };
}
