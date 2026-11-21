// Speed cameras, challans and the police chase.
//
// Every ~1 km: a speed-limit sign, then (170 m later) a speed camera with a traffic warden.
// Pass the camera over the limit → 📸 challan. Brake inside the stop window to pay the fine,
// or keep going and a police 125 comes after you with the siren on. Out-run it to escape;
// get caught and it's a double fine plus a heart.
import { CHALLAN, LINES, LANES } from '../config.js';
import { audio } from '../core/audio.js';
import { save, persist } from '../core/save.js';
import { pick, rand } from '../render/kit.js';
import { LIMITS } from '../render/textures.js';
import { createSpeedSign, createSpeedCamera } from '../models/props.js';
import { createPoliceBike } from '../models/bike.js';

export class Law {
  constructor(run) {
    this.run = run;
    this.police = createPoliceBike();
    this.police.root.visible = false;
    this.police.head.intensity = 0;
    run.scene.add(this.police.root);
    this.zones = [];
    this.reset();
  }

  reset() {
    for (const z of this.zones) { this.run.give(z.sign); this.run.give(z.cam); }
    this.zones.length = 0;
    this.nextZoneA = rand(500, 800);
    this.limit = null;
    this.challan = null;
    if (this.chase) this.endChase();
    this.chase = null;
    this.police.root.visible = false;
    audio.setSiren(0);
    this.run.ui.limit(null);
    this.run.ui.challanPrompt(null);
    this.run.ui.chase(false);
  }

  /** Settle a fine: take half of this run's earnings. If there's nothing to take, it goes on udhaar (debt). */
  collect(udhaarAmount) {
    const r = this.run;
    const half = Math.floor(r.coinsRun / 2);
    if (half >= 20) { r.coinsRun -= half; r.stats.finesRs += half; return { amount: half, udhaar: false }; }
    save.debt = (save.debt || 0) + udhaarAmount; persist();
    r.stats.finesRs += udhaarAmount;
    return { amount: udhaarAmount, udhaar: true };
  }

  /** The rider braked. Returns true if that answered a warden's "RUKO!". */
  brake() {
    if (!this.challan) return false;
    const r = this.run, c = this.challan;
    this.challan = null;
    r.ui.challanPrompt(null);
    const f = this.collect(CHALLAN.fine);
    r.stats.challans++;
    r.slow = 1;
    audio.buy();
    r.ui.challanSlip({ title: 'E-CHALLAN', offence: `Overspeeding · ${c.kmh} km/h in a ${c.limit} zone`, fine: f.amount, udhaar: f.udhaar, remark: pick(LINES.slip), stamp: f.udhaar ? 'UDHAAR' : 'ADA' });
    setTimeout(() => r.active && r.ui.speech(pick(LINES.stopped), 2400), 600);
    return true;
  }

  nearMiss() { if (this.chase) this.chase.gap += 1.3; }
  hit() { if (this.chase) this.chase.gap -= 6; }

  spawnZone() {
    const r = this.run;
    const kmh = r.baseSpeed * 3.6;
    let idx = 0;
    LIMITS.forEach((l, i) => { if (l <= kmh * 0.86) idx = i; });
    const signA = this.nextZoneA, camA = signA + 170;
    const sign = r.take(`lsign${idx}`, () => createSpeedSign(idx));
    const cam = r.take('scam', createSpeedCamera);
    this.zones.push({ signA, camA, idx, limit: LIMITS[idx], sign, cam, warned: false, checked: false });
    this.nextZoneA = camA + rand(CHALLAN.every[0], CHALLAN.every[1]);
  }

  update(dt) {
    const r = this.run, p = r.player;
    if (r.D + 320 > this.nextZoneA && !this.chase && r.headstart <= 0) this.spawnZone();

    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i];
      z.sign.position.set(5.6, 0.22, r.D - z.signA);
      z.cam.position.set(5.5, 0.22, r.D - z.camA);
      if (!z.warned && r.D > z.signA - 40) {
        z.warned = true;
        this.limit = z.limit;
        r.ui.limit(z.limit);
        r.ui.speech(pick(LINES.speedSign).replace('{l}', z.limit), 2200);
      }
      if (!z.checked && r.D >= z.camA) {
        z.checked = true;
        this.limit = null;
        r.ui.limit(null);
        const kmh = Math.round(r.speed * 3.6);
        if (kmh > z.limit + CHALLAN.tolerance && r.headstart <= 0) this.issue(kmh, z.limit);
        else {
          r.stats.cleanCams++;
          r.score += 300 * r.mult;
          r.ui.popup('LIMIT VICH! 👍 +300', 'good');
          audio.chime();
        }
      }
      if (r.D - z.camA > 40) { r.give(z.sign); r.give(z.cam); this.zones.splice(i, 1); }
    }

    // the warden's stop window
    if (this.challan) {
      this.challan.t -= dt;
      const half = Math.floor(r.coinsRun / 2);
      r.ui.challanPrompt({ frac: this.challan.t / CHALLAN.stopWindow, fine: half >= 20 ? `Rs ${half} (aadhi kamai)` : `Rs ${CHALLAN.fine} udhaar` });
      if (this.challan.t <= 0) this.startChase();
    }
    if (this.chase) this.updateChase(dt, p);
  }

  issue(kmh, limit) {
    const r = this.run;
    const fine = CHALLAN.fine + Math.round((kmh - limit) * 4 / 50) * 50;
    this.challan = { t: CHALLAN.stopWindow, fine, kmh, limit };
    audio.shutter();
    setTimeout(() => audio.whistle(), 250);
    r.ui.camFlash();
    r.ui.popup(`📸 CHALLAN! ${kmh} km/h`, 'bad');
    r.ui.speech(pick(LINES.stopPlease), 2200);
  }

  startChase() {
    const r = this.run, c = this.challan;
    this.challan = null;
    r.ui.challanPrompt(null);
    this.chase = { gap: CHALLAN.startGap, t: 0, fine: c.fine, kmh: c.kmh, limit: c.limit, x: LANES[r.player.lane] };
    this.police.root.visible = true;
    r.ui.chase(true);
    r.ui.speech(pick(LINES.chaseStart), 2600);
    r.stats.chases++;
  }

  updateChase(dt, p) {
    const r = this.run, ch = this.chase;
    p.lookBack = true;
    ch.t += dt;
    const pv = r.baseSpeed * 1.015 + 0.4;
    ch.gap += (r.speed - pv) * dt * 0.9;
    // police sits in the lane next to you, closing in from behind the camera
    const lane = p.lane === 1 ? (ch.t % 8 < 4 ? 0 : 2) : 1;
    const tx = LANES[lane];
    const dx = tx - ch.x;
    ch.x += dx * Math.min(1, dt * 3);
    const m = this.police;
    m.root.position.set(ch.x, 0, 0.6 + Math.max(0, ch.gap) * 0.5);
    m.tilt.rotation.z = Math.max(-0.4, Math.min(0.4, -dx * 0.15));
    for (const w of m.wheels) w.rotation.x -= pv * dt / 0.31;
    const flash = Math.sin(ch.t * 14) > 0;
    m.lights.red.visible = flash; m.lights.blue.visible = !flash;
    m.head.intensity = r.env.night * 30;
    const close = Math.max(0.12, Math.min(1, 1 - ch.gap / CHALLAN.escapeGap));
    audio.setSiren(close);
    r.ui.chaseGap(ch.gap / CHALLAN.escapeGap, flash);

    if (ch.gap <= 0.6) {
      // caught
      const f = this.collect(CHALLAN.fine * 2);
      r.stats.challans++; r.stats.caught++;
      r.ui.challanSlip({ title: 'PAKRE GAYE!', offence: `Overspeeding + bhaagna · ${ch.kmh} km/h in a ${ch.limit} zone`, fine: f.amount, udhaar: f.udhaar, remark: pick(LINES.slip), stamp: f.udhaar ? 'UDHAAR' : 'PAKRE GAYE' });
      r.ui.speech(pick(LINES.caught), 2800);
      audio.slap();
      this.endChase();
      r.lives--; r.invuln = 2.2; p.blink = 2.2; r.slow = 1; r.ui.flash();
      if (r.lives <= 0) r.end();
    } else if (ch.gap >= CHALLAN.escapeGap || ch.t >= CHALLAN.chaseTime) {
      r.stats.escapes++;
      r.coinsRun += 150; r.score += 2500 * r.mult; r.addCombo(3);
      r.ui.popup('CHAKMA DE DITTA! 😎 +Rs 150', 'trick');
      r.ui.speech(pick(LINES.escaped), 2600);
      audio.fare();
      this.endChase();
    }
  }

  endChase() {
    this.chase = null;
    this.run.player.lookBack = false;
    this.police.root.visible = false;
    audio.setSiren(0);
    this.run.ui.chase(false);
  }
}
