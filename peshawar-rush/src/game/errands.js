// "Ammi da phone": every so often Ammi calls with an errand. Grab the item before you pass it —
// her duas if you do, the chappal if you don't.
import { ERRANDS, LINES, LANES } from '../config.js';
import { audio } from '../core/audio.js';
import { pick, rand } from '../render/kit.js';
import { createErrandItem } from '../models/props.js';

export class Errands {
  constructor(run) { this.run = run; this.reset(); }

  reset() {
    if (this.item) this.run.give(this.item.model);
    this.item = null;
    this.callT = rand(35, 55);
    this.run.ui.errand(null);
  }

  call() {
    const r = this.run;
    const def = pick(ERRANDS);
    audio.ring();
    r.ui.toast('📞 Ammi calling…', 1600);
    setTimeout(() => r.active && r.ui.speech(`Ammi: "${def.ask}"`, 3200), 1300);
    const A = r.D + rand(420, 620);
    const free = [0, 1, 2].filter(l => !r.hardNear(l, A, 10));
    const lane = free.length ? pick(free) : 1;
    const model = r.take(`errand${def.id}`, () => createErrandItem(def.id));
    this.item = { def, A, x: LANES[lane], model };
  }

  update(dt) {
    const r = this.run, p = r.player;
    if (!this.item) {
      this.callT -= dt;
      if (this.callT <= 0 && !r.mission && r.D > 300) { this.call(); this.callT = rand(55, 85); }
      return;
    }
    const it = this.item;
    const z = r.D - it.A;
    it.model.position.set(it.x, 1.35 + Math.sin(r.time * 3) * 0.15, z);
    it.model.rotation.y = r.time * 1.6;
    r.ui.errand({ icon: it.def.icon, name: it.def.name, m: Math.max(0, Math.round(-z)) });
    const reach = r.power.magnet > 0 ? 2.4 : 1.4;
    if (Math.abs(z) < 1.6 && Math.abs(it.x - p.x) < reach && p.y < 2.8) {
      r.give(it.model); this.item = null;
      r.stats.errands++;
      r.coinsRun += 150; r.score += 1500 * r.mult; r.addCombo(2);
      r.ui.popup(`${it.def.icon} ${it.def.name.toUpperCase()} MIL GAYA! +Rs 150`, 'good');
      setTimeout(() => r.active && r.ui.speech(pick(LINES.ammiHappy), 2600), 300);
      audio.fare();
      r.ui.errand(null);
    } else if (z > 4) {
      r.give(it.model); this.item = null;
      r.ui.popup(`${it.def.icon} ${it.def.name} reh gaya! 🩴`, 'bad');
      r.ui.speech(pick(LINES.ammiAngry), 2600);
      audio.slap();
      r.ui.errand(null);
    }
  }
}
