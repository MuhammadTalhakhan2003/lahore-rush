// Optional bloom post-processing (auto-disabled on low quality / touch devices).
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export class Post {
  constructor(renderer, scene, camera) {
    this.renderer = renderer; this.scene = scene; this.camera = camera;
    this.enabled = false;
    this.composer = null;
  }
  setEnabled(on) {
    this.enabled = on;
    if (on && !this.composer) {
      const size = this.renderer.getSize(new THREE.Vector2());
      // multisampled target keeps edges smooth even with post-processing on
      const rt = new THREE.WebGLRenderTarget(size.x, size.y, { samples: 4, type: THREE.HalfFloatType });
      this.composer = new EffectComposer(this.renderer, rt);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.25, 0.35, 0.9);
      this.composer.addPass(this.bloom);
      this.composer.addPass(new OutputPass());
      this.resize();
    }
  }
  resize() {
    if (!this.composer) return;
    const s = this.renderer.getSize(new THREE.Vector2());
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(s.x, s.y);
  }
  render(night, boost) {
    if (this.enabled) {
      // gentle: only real light sources (lamps, tail lights) get a soft halo
      this.bloom.strength = 0.1 + night * 0.22 + boost * 0.22;
      this.bloom.threshold = 0.9 - night * 0.06;
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
