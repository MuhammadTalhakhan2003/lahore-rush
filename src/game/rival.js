// "Billa Wheelie" — an AI rival on a black 125 who challenges you to a race (and can't stop showing off).
// He drives a little faster than your base speed, dodges obstacles, and you win by overtaking him.
import { LANES, RIVAL } from '../config.js';
import { createBike } from '../models/bike.js';

const SKIN = { body: 0x111111, trim: 0xff2e88, kameez: 0x16161c, glow: 0xff2e88 };

export class Rival {
  constructor(scene) {
    this.model = createBike(SKIN);
    this.model.root.visible = false;
    this.model.head.intensity = 0;
    scene.add(this.model.root);
    this.active = false;
    this.next = RIVAL.every[0];
  }

  reset(D) { this.active = false; this.model.root.visible = false; this.next = D + RIVAL.every[0]; }

  start(lane) {
    this.active = true;
    this.lane = lane; this.x = LANES[lane];
    this.z = -45; this.y = 0; this.vy = 0;
    this.t = 0; this.spin = 0;
    this.model.root.visible = true;
  }

  /** Returns 'win' | 'lose' | 'timeout' | null */
  update(dt, run) {
    if (!this.active) return null;
    this.t += dt;
    const base = run.baseSpeed;
    const rv = base * 1.06 + 1;
    this.z -= (rv - run.speed) * dt;     // negative z = ahead of the player

    // AI: look ahead in own lane for anything solid and swerve (or hop over jumpables)
    let threat = null;
    for (const o of run.obs) {
      if (o.dead || o.lane !== this.lane || !(o.hard || o.T.jump)) continue;
      const dz = this.z - o.z;          // positive when obstacle is ahead of the rival
      if (dz > 0 && dz < 22) { threat = o; break; }
    }
    if (threat) {
      const free = [this.lane - 1, this.lane + 1].filter(l => l >= 0 && l <= 2 && !run.obs.some(o => !o.dead && o.hard && o.lane === l && Math.abs(o.z - this.z) < 16));
      if (free.length) this.lane = free[Math.floor(Math.random() * free.length)];
      else if (this.y === 0) this.vy = 9;
    }
    const tx = LANES[this.lane];
    const dx = tx - this.x;
    this.x += dx * Math.min(1, dt * 6);
    if (this.vy || this.y > 0) { this.vy -= 28 * dt; this.y = Math.max(0, this.y + this.vy * dt); if (this.y === 0) this.vy = 0; }

    const m = this.model;
    m.root.position.set(this.x, this.y, this.z);
    m.tilt.rotation.z = Math.max(-0.5, Math.min(0.5, -dx * 0.16));
    const showOff = !threat && Math.sin(this.t * 0.9) > 0.55;   // Billa pulls wheelies on clear road
    m.pitch.rotation.x += ((showOff ? 0.5 : 0) - m.pitch.rotation.x) * Math.min(1, dt * 5);
    m.tilt.rotation.y = -dx * 0.06;
    for (const w of m.wheels) w.rotation.x -= rv * dt / 0.31;
    m.flame.visible = run.speed < rv;
    if (m.riderHead) m.riderHead.rotation.y = this.z < -6 && Math.sin(this.t * 1.1) > 0.4 ? -1.3 : 0;   // Billa looks back to taunt you
    m.head.intensity = run.env.night * 30;

    if (this.z > 4) return this.finish('win');
    if (this.z < -150) return this.finish('lose');
    if (this.t > 45) return this.finish('timeout');
    return null;
  }

  finish(result) {
    this.active = false;
    this.model.root.visible = false;
    return result;
  }
}
