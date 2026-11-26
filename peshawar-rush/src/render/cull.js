// CPU culling for the curved world.
// Meshes can't use three.js frustum culling (the vertex bend moves them), so every streamed object is
// tested here instead: its bounding sphere is bent the same way the shader bends vertices, then checked
// against the camera frustum and the fog distance. Hidden objects cost no draw calls.
import * as THREE from 'three';
import { curveUniforms } from './curve.js';

const frustum = new THREE.Frustum();
const projView = new THREE.Matrix4();
const sphere = new THREE.Sphere();
const box = new THREE.Box3();

/** Local bounding sphere (centre height + radius), computed once per pooled object. */
function bounds(obj) {
  let b = obj.userData.cull;
  if (b) return b;
  const saved = obj.position.clone(), rot = obj.rotation.clone(), vis = obj.visible;
  obj.position.set(0, 0, 0); obj.rotation.set(0, 0, 0); obj.visible = true;
  obj.updateMatrixWorld(true);
  box.makeEmpty();
  obj.traverse(o => {
    if (!o.geometry) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
  });
  obj.position.copy(saved); obj.rotation.copy(rot); obj.visible = vis;
  obj.updateMatrixWorld(true);
  if (box.isEmpty()) b = { cx: 0, cy: 0, cz: 0, r: 0 };
  else {
    box.getBoundingSphere(sphere);
    // rotation-proof: grow the radius by the centre's horizontal offset
    b = { cy: sphere.center.y, r: sphere.radius + Math.hypot(sphere.center.x, sphere.center.z) };
  }
  obj.userData.cull = b;
  return b;
}

export function beginCull(camera) {
  camera.updateMatrixWorld();
  projView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  frustum.setFromProjectionMatrix(projView);
}

/** Hide children of `root` that are off screen or lost in the fog. Returns how many are drawn. */
export function cullChildren(root, farZ, smallFarZ = farZ) {
  const cy = curveUniforms.uCurveY.value, cx = curveUniforms.uCurveX.value;
  let shown = 0;
  for (const o of root.children) {
    if (o.userData.noCull) { if (o.visible) shown++; continue; }
    const b = bounds(o);
    const p = o.position;
    const d = Math.max(0, -p.z);
    const lim = b.r < 2.5 ? smallFarZ : farZ;
    let vis = d - b.r < lim;
    if (vis) {
      sphere.center.set(p.x + d * d * cx, p.y + b.cy - d * d * cy, p.z);
      sphere.radius = b.r * (1 + d * 0.004) + 0.5;
      vis = frustum.intersectsSphere(sphere);
    }
    o.visible = vis;
    if (vis) shown++;
  }
  return shown;
}
