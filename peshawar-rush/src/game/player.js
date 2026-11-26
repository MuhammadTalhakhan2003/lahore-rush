// The player's ride — a Peshawar chingchi or a 125: lane switching, jumps, ramp launches, backflips, braking,
// and a signature stunt: the 125 pulls a WHEELIE, the chingchi goes up on two wheels (DO PAHIYA).
import { LANES, WHEELIE } from '../config.js';
import { createBike } from '../models/bike.js';
import { createChingchi } from '../models/chingchi.js';

const G = 28, JUMP_V = 9, RAMP_V = 13.5;
const TAU = Math.PI * 2;

export class Player {
  constructor(scene, skin, vehicle = 'chingchi') {
    this.scene = scene;
    this.vehicle = vehicle;
    this.tiltSide = 1;
    this.setSkin(skin);
    this.reset();
  }

  get isChingchi() { return this.vehicle === 'chingchi'; }

  setVehicle(vehicle, skin) { this.vehicle = vehicle; this.setSkin(skin); }

  setSkin(skin) {
    const prev = this.model;
    this.skin = skin;
    this.model = this.isChingchi ? createChingchi(skin) : createBike(skin);
    if (prev) {
      this.model.root.position.copy(prev.root.position);
      this.model.passenger.visible = prev.passenger.visible;
      this.scene.remove(prev.root);
    }
    this.scene.add(this.model.root);
  }

  reset() {
    this.lane = 1;
    this.x = 0; this.y = 0; this.vy = 0;
    this.grounded = true;
    this.lastLaneChange = -10;
    this.time = 0;
    this.spin = 0; this.spinning = false; this.tricksThisAir = 0;
    this.airTime = 0; this.launched = false;
    this.brake = 0;
    this.roll = 0;
    this.pitchA = 0;
    this.wheelieT = 0; this.wheelieCD = 0; this.wheelieOn = false;
    this.wheelSpin = 0;
    this.blink = 0;
    this.events = [];
  }

  move(dir) {
    const n = Math.max(0, Math.min(2, this.lane + dir));
    if (n === this.lane) { this.events.push('bump'); return false; }
    this.lane = n;
    this.lastLaneChange = this.time;
    return true;
  }

  jump() {
    if (this.grounded) {
      this.endWheelie();
      this.vy = JUMP_V; this.grounded = false; this.launched = false; this.airTime = 0; this.tricksThisAir = 0;
      this.events.push('jump');
      return;
    }
    // second press in the air → backflip (needs some height)
    if (!this.spinning && this.vy > -6 && this.y > 0.9) {
      this.spinning = true; this.spin = 0;
      this.events.push('trickStart');
    }
  }

  /** Pop the front wheel up. Points tick while it's up. */
  wheelie() {
    if (!this.grounded || this.wheelieOn || this.wheelieCD > 0) return false;
    this.wheelieOn = true; this.wheelieT = 0;
    this.tiltSide = this.x > 0.5 ? -1 : this.x < -0.5 ? 1 : -this.tiltSide;   // lift the side away from the kerb
    this.events.push('wheelieStart');
    return true;
  }
  endWheelie() {
    if (!this.wheelieOn) return;
    this.wheelieOn = false;
    this.wheelieCD = WHEELIE.cooldown;
    this.events.push('wheelieEnd');
  }

  launch() {
    if (!this.grounded && this.vy > 0) return;
    this.endWheelie();
    this.vy = RAMP_V; this.grounded = false; this.launched = true; this.airTime = 0; this.tricksThisAir = 0;
    this.events.push('launch');
  }

  /** Small involuntary hop from a speed breaker / rough road. */
  bump(v) {
    if (!this.grounded) return;
    this.endWheelie();
    this.vy = v; this.grounded = false; this.launched = false; this.airTime = 0; this.bumped = true;
  }

  down() {
    if (!this.grounded) { this.vy = Math.min(this.vy, -16); return; }  // slam down
    if (this.wheelieOn) { this.endWheelie(); return; }
    this.brake = 0.8;
  }

  update(dt, speed, nitro) {
    this.time += dt;
    const tx = LANES[this.lane];
    const dx = tx - this.x;
    this.x += dx * Math.min(1, dt * 11);
    if (!this.grounded) {
      this.airTime += dt;
      this.vy -= G * dt;
      this.y += this.vy * dt;
      if (this.spinning) {
        this.spin += dt * TAU * 1.9;
        if (this.spin >= TAU) { this.spin = 0; this.spinning = false; this.tricksThisAir++; this.events.push('trick'); }
      }
      if (this.y <= 0) {
        this.y = 0; this.vy = 0; this.grounded = true;
        if (this.spinning) { this.spinning = false; this.spin = 0; this.events.push('sloppy'); }
        if (this.bumped) { this.bumped = false; } else this.events.push(this.airTime > 0.5 ? 'landHard' : 'land');
      }
    }
    if (this.wheelieOn) {
      this.wheelieT += dt;
      if (this.wheelieT >= WHEELIE.max) this.endWheelie();
    }
    this.wheelieCD = Math.max(0, this.wheelieCD - dt);
    this.brake = Math.max(0, this.brake - dt);
    this.blink = Math.max(0, this.blink - dt);

    // ---- visuals ----
    const m = this.model;
    const rick = this.isChingchi;
    // a bike leans INTO the lane change; a rickshaw's body rolls a little the other way on its soft springs
    const leanTarget = rick
      ? Math.max(-0.12, Math.min(0.12, dx * 0.05)) + Math.sin(this.time * 0.9) * 0.008
      : Math.max(-0.5, Math.min(0.5, -dx * 0.16)) + Math.sin(this.time * 0.7) * 0.015;
    this.roll += (leanTarget - this.roll) * Math.min(1, dt * 9);
    // DO PAHIYA: the rickshaw rides up on the two wheels of one side, pivoting on them
    const sideTarget = rick && this.wheelieOn ? 0.42 + Math.sin(this.time * 6) * 0.05 : 0;
    this.sideA = (this.sideA || 0) + (sideTarget - (this.sideA || 0)) * Math.min(1, dt * 8);
    const th = -this.tiltSide * this.sideA;
    m.root.position.set(this.x, this.y, 0);
    m.tilt.rotation.z = this.roll + th;
    m.tilt.rotation.y = -dx * (rick ? 0.035 : 0.05);
    const rumble = this.grounded ? Math.abs(Math.sin(this.time * (rick ? 23 : 19))) * (rick ? 0.018 : 0.012) : 0;
    m.tilt.position.set(this.tiltSide * 0.72 * (1 - Math.cos(th)), 0.72 * Math.abs(Math.sin(th)) + rumble, 0);
    // wheelie wobble on the rear axle; nose up when rising in the air; dive under braking
    let pt = 0;
    if (this.wheelieOn && !rick) pt = 0.52 + Math.sin(this.time * 7) * 0.06;
    else if (!this.grounded) pt = Math.max(-0.2, Math.min(0.3, this.vy * 0.025));
    else if (this.brake > 0) pt = -0.05;
    this.pitchA += (pt - this.pitchA) * Math.min(1, dt * (this.wheelieOn ? 6 : 10));
    m.pitch.rotation.x = this.pitchA;
    m.flip.rotation.x = this.spinning ? this.spin : 0;
    if (m.riderHead) {
      let yaw = -dx * 0.28;
      this.headYaw = (this.headYaw || 0) + (yaw - (this.headYaw || 0)) * Math.min(1, dt * 6);
      m.riderHead.rotation.y = this.headYaw;
      m.riderHead.rotation.x = this.wheelieOn ? -0.2 : 0;
    }
    this.wheelSpin += speed * dt / 0.31;
    for (const w of m.wheels) w.rotation.x = -this.wheelSpin;
    m.flame.visible = nitro > 0;
    if (nitro > 0) {
      const f = 0.8 + Math.random() * 0.6;
      m.flame.scale.set(f, 1 + Math.random() * 0.8, f);
    }
    m.root.visible = this.blink <= 0 || Math.floor(this.blink * 14) % 2 === 0;
  }

  get box() { return this.isChingchi ? { x: this.x, y: this.y, hw: 0.7, hl: 1.55 } : { x: this.x, y: this.y, hw: 0.5, hl: 1.0 }; }
}
