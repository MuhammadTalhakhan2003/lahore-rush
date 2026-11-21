// Fully synthesised audio: 4-stroke 125 engine, SFX, rain, thunder and a procedural dhol/tumbi soundtrack.
// No audio files — everything is built from oscillators, filters and a noise buffer.

const SCALE = [0, 2, 4, 5, 7, 9, 10, 12, 14, 16]; // Khamaj-like
const ROOT = 146.83; // D3
const hz = semi => ROOT * Math.pow(2, semi / 12);

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.volume = 0.8;
    this.musicOn = true;
    this.muted = false;
    this.mode = 'calm'; // calm | drive | off
    this.step = 0;
    this.nextNote = 0;
    this.phrase = [];
    this.intensity = 0;
    this.style = 'off';   // no background music — the 125 and the city are the soundtrack
  }

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = (this.ctx = new AC());
    this.master = c.createGain();
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    this.master.connect(comp).connect(c.destination);
    this.sfx = c.createGain(); this.sfx.connect(this.master);
    this.music = c.createGain(); this.music.gain.value = 0.55; this.music.connect(this.master);
    this.applyVolume();

    // shared white-noise buffer
    const len = c.sampleRate * 2;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    this.buildEngine();
    this.buildRain();
    this.buildAmbience();
    this.newPhrase();
    this.nextNote = c.currentTime + 0.1;
    this.timer = setInterval(() => { this.schedule(); this.scheduleEngine(); }, 20);
  }

  applyVolume() {
    if (!this.master) return;
    const v = this.muted ? 0 : this.volume;
    this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
    this.music.gain.setTargetAtTime(this.musicOn ? 0.5 : 0, this.ctx.currentTime, 0.1);
  }
  setVolume(v) { this.volume = v; this.applyVolume(); }
  setMusic(on) { this.musicOn = on; this.applyVolume(); }
  setMuted(m) { this.muted = m; this.applyVolume(); }
  setMode(m) { this.mode = m; }

  // ---------- primitives ----------
  tone(freq, dur, { type = 'sine', vol = 0.2, to = 0, when = 0, attack = 0.008, dest } = {}) {
    if (!this.ctx) return;
    const c = this.ctx, t = when || c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest || this.sfx);
    o.start(t); o.stop(t + dur + 0.05);
  }
  noise(dur, { vol = 0.3, type = 'lowpass', freq = 1000, to = 0, q = 1, when = 0, dest, attack = 0.005 } = {}) {
    if (!this.ctx) return;
    const c = this.ctx, t = when || c.currentTime;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = c.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(freq, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(dest || this.sfx);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }

  // ---------- engine: synthesised single-cylinder 4-stroke 125 ----------
  // Real-time combustion pulses: one exhaust pulse per two crank turns (firing Hz = rpm / 120), scheduled
  // ahead of time like drum hits. The pulse timbre (exhaust pipe resonance) stays fixed while only the firing
  // rate changes — which is what makes a real thumper sound right at idle ~11 Hz "dug dug dug" and at
  // 8,500 rpm ~70 Hz "brrraaap". Reference figures measured from a recorded 125 ride: cruise ≈ 30 fires/s,
  // high revs ≈ 44–70 /s, idle ≈ 11–14 /s.
  buildEngine() {
    const c = this.ctx, sr = c.sampleRate;
    const pulse = (load) => {
      const n = Math.round(sr * 0.07), buf = c.createBuffer(1, n, sr), d = buf.getChannelData(0);
      const f1 = 86 + Math.random() * 16, ph = Math.random() * 6;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        const atk = Math.min(1, t / 0.0006);
        d[i] = atk * (
          Math.sin(2 * Math.PI * f1 * t) * Math.exp(-t / (load ? 0.017 : 0.022))                    // exhaust body
          + (load ? 0.62 : 0.35) * Math.sin(2 * Math.PI * f1 * 2.07 * t + ph) * Math.exp(-t / 0.010)  // 2nd pipe mode
          + (load ? 0.36 : 0.12) * Math.sin(2 * Math.PI * 335 * t) * Math.exp(-t / 0.007)             // header ring
          + (load ? 0.22 : 0.05) * Math.sin(2 * Math.PI * 1260 * t) * Math.exp(-t / 0.0028)           // crack
          + (Math.random() * 2 - 1) * (load ? 0.75 : 0.3) * Math.exp(-t / 0.0024));                   // combustion burst
      }
      return buf;
    };
    this.pulsesLoad = Array.from({ length: 6 }, () => pulse(true));
    this.pulsesCoast = Array.from({ length: 6 }, () => pulse(false));
    // valve-train tick
    const tn = Math.round(sr * 0.006); this.tickBuf = c.createBuffer(1, tn, sr);
    const td = this.tickBuf.getChannelData(0);
    for (let i = 0; i < tn; i++) td[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.0012));

    // exhaust chain: soft saturation → body boost → load-dependent lowpass
    this.exBus = c.createGain(); this.exBus.gain.value = 1;
    const shaper = c.createWaveShaper(), curve = new Float32Array(2048);
    for (let i = 0; i < 2048; i++) { const x = i / 1024 - 1; curve[i] = Math.tanh(x * 1.9) / Math.tanh(1.9); }
    shaper.curve = curve;
    const body = c.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 105; body.Q.value = 1.1; body.gain.value = 5;
    this.exLP = c.createBiquadFilter(); this.exLP.type = 'lowpass'; this.exLP.frequency.value = 2200; this.exLP.Q.value = 0.6;
    this.engGain = c.createGain(); this.engGain.gain.value = 0.55;
    this.exBus.connect(shaper).connect(body).connect(this.exLP).connect(this.engGain).connect(this.sfx);
    this.tickBus = c.createBiquadFilter(); this.tickBus.type = 'bandpass'; this.tickBus.frequency.value = 3600; this.tickBus.Q.value = 3;
    const tg = c.createGain(); tg.gain.value = 0.05; this.tickBus.connect(tg).connect(this.sfx);

    // road layers: wind, tyre roar, chain whine
    const loopNoise = (type, f, q) => { const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = c.createGain(); g.gain.value = 0; s.connect(fl).connect(g).connect(this.sfx); s.start(); return g; };
    this.windGain = loopNoise('highpass', 900, 0.5);
    this.tyreGain = loopNoise('bandpass', 170, 0.7);
    this.chain = c.createOscillator(); this.chain.type = 'triangle'; this.chain.frequency.value = 200;
    this.chainGain = c.createGain(); this.chainGain.gain.value = 0;
    this.chain.connect(this.chainGain).connect(this.sfx); this.chain.start();
    this.rattle = this.tyreGain; // (kept for older callers)

    this.eng = { on: false, rpm: 0, target: 0, load: 0.4, gear: 1, shift: 0, shiftDir: 0, blip: 0, kick: 0, nextFire: 0, lastT: c.currentTime, lastSpeed: 0, nitro: 0 };
    this.gear = 1;
  }

  /** Called every ~20 ms: lays down exhaust pulses slightly ahead of time. */
  scheduleEngine() {
    const e = this.eng, c = this.ctx;
    if (!e || !c) return;
    if (!e.on || e.rpm < 300) { e.nextFire = 0; return; }
    const now = c.currentTime;
    if (e.nextFire < now - 0.05) e.nextFire = now + 0.01;
    while (e.nextFire < now + 0.08) {
      this.firePulse(e.nextFire);
      const idle = e.rpm < 2200;
      const jitter = idle ? 0.09 : 0.02;
      e.nextFire += (120 / e.rpm) * (1 + (Math.random() - 0.5) * 2 * jitter);
    }
  }
  firePulse(when) {
    const e = this.eng, c = this.ctx;
    const loaded = e.load > 0.45;
    const bank = loaded ? this.pulsesLoad : this.pulsesCoast;
    const src = c.createBufferSource(); src.buffer = bank[(Math.random() * bank.length) | 0];
    const g = c.createGain();
    let amp = (0.4 + e.load * 0.6) * (0.88 + Math.random() * 0.24);
    if (e.rpm < 2000 && Math.random() < 0.12) amp *= 0.55;          // lazy idle: an occasional soft beat
    g.gain.value = amp;
    src.connect(g).connect(this.exBus);
    src.start(when);
    // tappets
    const t = c.createBufferSource(); t.buffer = this.tickBuf; t.connect(this.tickBus); t.start(when + 0.004);
    // coasting with the throttle shut: the odd silencer crackle
    if (e.load < 0.2 && e.rpm > 3800 && Math.random() < 0.035) this.noise(0.05, { vol: 0.32, type: 'lowpass', freq: 1400, to: 300, when: when + 0.01 });
  }

  /** Gearbox clunk: a dull thud plus the metallic click of the dogs engaging. */
  clunk(when = 0) {
    const t = when || this.ctx.currentTime;
    this.tone(62, 0.09, { type: 'sine', vol: 0.22, to: 40, when: t });
    this.noise(0.035, { vol: 0.16, type: 'bandpass', freq: 2100, q: 4, when: t + 0.005 });
  }

  /** Kick-start: lever + spring, the engine turns over slowly, catches, blips and settles to idle. */
  kickStart() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, e = this.eng;
    this.tone(95, 0.1, { type: 'square', vol: 0.1, to: 50 });
    this.noise(0.08, { vol: 0.2, type: 'bandpass', freq: 1200, q: 3 });
    this.tone(1900, 0.18, { type: 'sine', vol: 0.02, to: 1500, when: t + 0.05 });     // lever spring
    e.on = true; e.kick = 0.9; e.rpm = 420; e.gear = 1; this.gear = 1;
  }
  /** Throttle blip (wheelie pop, menu horn). */
  rev() { if (this.eng) this.eng.blip = 0.6; }

  engine(speed, nitro, on) {
    if (!this.ctx || !this.eng) return;
    const c = this.ctx, e = this.eng, now = c.currentTime;
    const dt = Math.min(0.25, Math.max(0.001, now - e.lastT)); e.lastT = now;
    if (on && !e.on) { e.on = true; e.rpm = Math.max(e.rpm, 1300); }
    if (!on) { e.on = false; e.rpm = 0; this.engGain.gain.setTargetAtTime(0, now, 0.05); this.windGain.gain.setTargetAtTime(0, now, 0.1); this.tyreGain.gain.setTargetAtTime(0, now, 0.1); this.chainGain.gain.setTargetAtTime(0, now, 0.1); return; }
    this.engGain.gain.setTargetAtTime(0.55, now, 0.05);

    // ---- 4-speed gearbox with hysteresis
    const BANDS = [0, 15, 25, 35, 999];
    let want = 1; while (want < 4 && speed > BANDS[want]) want++;
    if (want > e.gear && e.shift <= 0) { e.gear++; e.shift = 0.24; e.shiftDir = 1; this.clunk(now + 0.08); }
    else if (want < e.gear && speed < BANDS[e.gear - 1] - 2 && e.shift <= 0) { e.gear--; e.shift = 0.2; e.shiftDir = -1; e.blip = Math.max(e.blip, 0.25); this.clunk(now + 0.05); }
    this.gear = e.gear;

    // ---- target rpm for this gear (upshift ≈ 8,200 → 5,400 like a real 125)
    const lo = BANDS[e.gear - 1], hi = e.gear === 4 ? 52 : BANDS[e.gear];
    const k = Math.max(0, Math.min(1, (speed - lo) / (hi - lo)));
    let target = speed < 0.8 ? 1350 : e.gear === 1 ? 1700 + k * 6500 : 5400 + k * 3000;
    target += nitro * 600;
    if (e.blip > 0) { target += Math.sin(Math.min(1, e.blip / 0.6) * Math.PI) * 2600; e.blip -= dt; }
    if (e.kick > 0) {                                     // cranking → catch → vroom → idle
      e.kick -= dt;
      const kt = 0.9 - e.kick;           // crank 0.3 s → catches → one proud vroom → straight into gear
      if (kt < 0.3) target = 420; else if (kt < 0.5) target = 1400; else if (kt < 0.75) target = Math.max(target, 4800);
    }
    if (speed < 0.8 && e.kick <= 0) target += Math.sin(now * 2.3) * 60;   // idle hunting

    // ---- throttle / load: accelerating = loaded, easing off = coasting
    const accel = (speed - e.lastSpeed) / dt; e.lastSpeed = speed;
    let load = Math.max(0.15, Math.min(1, 0.5 + accel * 0.12 + nitro * 0.4));
    if (e.shift > 0) {
      e.shift -= dt;
      const ph = 1 - e.shift / (e.shiftDir > 0 ? 0.24 : 0.2);
      if (ph < 0.4) { load = 0.1; target = e.rpm; }   // clutch in, throttle closed: rpm hangs
      else load = Math.min(load, 0.3 + ph * 0.5);   // clutch out, throttle back on
    }
    if (e.blip > 0) load = Math.max(load, 0.85);
    e.load += (load - e.load) * Math.min(1, dt * 12);

    // ---- crank inertia: revs rise faster than they fall
    const rate = target > e.rpm ? (e.shift > 0 ? 14 : 7) : (e.shift > 0 ? 9 : 4);
    e.rpm += (target - e.rpm) * Math.min(1, dt * rate);
    this.rpm = e.rpm;

    // ---- tone shaping + road layers
    this.exLP.frequency.setTargetAtTime(900 + e.load * 2600 + e.rpm * 0.12, now, 0.05);
    const v = Math.min(1, speed / 48);
    this.windGain.gain.setTargetAtTime(v * v * 0.07, now, 0.2);
    this.tyreGain.gain.setTargetAtTime(v * 0.05, now, 0.2);
    this.chain.frequency.setTargetAtTime(120 + speed * 11, now, 0.1);
    this.chainGain.gain.setTargetAtTime(v * 0.006, now, 0.2);
    if (Math.random() < 0.002 && e.load < 0.25 && e.rpm > 4000) this.backfire();
  }

  // ---------- city ambience (instead of music) ----------
  buildAmbience() {
    const c = this.ctx;
    // low traffic rumble + crowd murmur bed
    const n1 = c.createBufferSource(); n1.buffer = this.noiseBuf; n1.loop = true;
    const f1 = c.createBiquadFilter(); f1.type = 'lowpass'; f1.frequency.value = 220;
    this.humGain = c.createGain(); this.humGain.gain.value = 0;
    n1.connect(f1).connect(this.humGain).connect(this.sfx); n1.start();
    const n2 = c.createBufferSource(); n2.buffer = this.noiseBuf; n2.loop = true; n2.playbackRate.value = 0.7;
    const f2 = c.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 700; f2.Q.value = 0.8;
    this.crowdGain = c.createGain(); this.crowdGain.gain.value = 0;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.3; const lg = c.createGain(); lg.gain.value = 0.004;
    lfo.connect(lg).connect(this.crowdGain.gain); lfo.start();
    n2.connect(f2).connect(this.crowdGain).connect(this.sfx); n2.start();
    this.ambT = 2;
    this.siren = null;
  }
  /** style: androon | anarkali | minar | canal | gulberg; phase: subah | dopehar | shaam | raat */
  ambience(style, phase, on, dt) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const busy = style === 'androon' || style === 'anarkali' ? 1 : style === 'gulberg' ? 0.8 : 0.4;
    this.humGain.gain.setTargetAtTime(on ? 0.03 * busy : 0, t, 0.5);
    this.crowdGain.gain.setTargetAtTime(on && (style === 'androon' || style === 'anarkali') && phase !== 'raat' ? 0.012 : 0, t, 0.6);
    if (!on) return;
    this.ambT -= dt;
    if (this.ambT > 0) return;
    this.ambT = 1.5 + Math.random() * 4 / busy;
    const r = Math.random();
    if ((style === 'minar' || style === 'canal') && phase === 'subah' && r < 0.6) {           // morning birds
      for (let i = 0; i < 3; i++) { const f = 2600 + Math.random() * 1600; this.tone(f, 0.09, { type: 'sine', vol: 0.025, to: f * 1.3, when: t + i * 0.12 }); }
    } else if (r < 0.75) {                                                                       // a distant honk somewhere in traffic
      const f = 300 + Math.random() * 400, d = 0.12 + Math.random() * 0.3;
      this.tone(f, d, { type: 'square', vol: 0.018, when: t }); this.tone(f * 1.25, d, { type: 'square', vol: 0.012, when: t });
      if (Math.random() < 0.4) { this.tone(f, d, { type: 'square', vol: 0.016, when: t + d + 0.08 }); }
    } else {                                                                                     // a rickshaw buzzing past in the distance
      this.tone(90 + Math.random() * 30, 1.2, { type: 'sawtooth', vol: 0.012, to: 70, when: t });
    }
  }
  /** Police siren: wailing two-tone, loudness = how close the police bike is (0..1). */
  setSiren(level) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    if (!this.siren && level > 0) {
      const o = c.createOscillator(); o.type = 'sawtooth';
      const lfo = c.createOscillator(); lfo.type = 'triangle'; lfo.frequency.value = 0.9;
      const lg = c.createGain(); lg.gain.value = 260; lfo.connect(lg).connect(o.frequency);
      o.frequency.value = 900;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 1.2;
      const g = c.createGain(); g.gain.value = 0;
      o.connect(f).connect(g).connect(this.sfx); o.start(); lfo.start();
      this.siren = { o, lfo, g };
    }
    if (!this.siren) return;
    this.siren.g.gain.setTargetAtTime(level * 0.09, t, 0.15);
    if (level <= 0) {
      const sr = this.siren; this.siren = null;
      setTimeout(() => { try { sr.o.stop(); sr.lfo.stop(); } catch { /* already stopped */ } }, 800);
    }
  }
  bark() { const t = this.ctx?.currentTime; if (!t) return; for (const d of [0, 0.22]) { this.tone(420, 0.12, { type: 'sawtooth', vol: 0.06, to: 260, when: t + d }); this.noise(0.1, { vol: 0.12, type: 'bandpass', freq: 900, q: 2, when: t + d }); } }
  meow() { const t = this.ctx?.currentTime; if (!t) return; this.tone(620, 0.45, { type: 'triangle', vol: 0.05, to: 900, when: t }); this.tone(900, 0.3, { type: 'triangle', vol: 0.04, to: 500, when: t + 0.35 }); }
  shutter() { this.noise(0.05, { vol: 0.4, type: 'highpass', freq: 3000 }); this.tone(1800, 0.05, { type: 'square', vol: 0.05, when: this.ctx?.currentTime + 0.06 }); this.tone(1200, 0.25, { type: 'sine', vol: 0.06, to: 600 }); }
  whistle() { const t = this.ctx?.currentTime; if (!t) return; for (const [d, l] of [[0, 0.18], [0.25, 0.5]]) { this.tone(2900, l, { type: 'sine', vol: 0.12, when: t + d }); this.noise(l, { vol: 0.05, type: 'bandpass', freq: 2900, q: 8, when: t + d }); } }
  ring() { const t = this.ctx?.currentTime; if (!t) return; for (let k = 0; k < 2; k++) for (let i = 0; i < 8; i++) this.tone(i % 2 ? 1320 : 1760, 0.05, { type: 'square', vol: 0.035, when: t + k * 0.8 + i * 0.05 }); }
  slap() { this.noise(0.12, { vol: 0.35, type: 'bandpass', freq: 1500, q: 1.5 }); this.tone(220, 0.1, { type: 'triangle', vol: 0.1, to: 120 }); }

  // ---------- rain ----------
  buildRain() {
    const c = this.ctx;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2800; f.Q.value = 0.4;
    this.rainGain = c.createGain(); this.rainGain.gain.value = 0;
    s.connect(f).connect(this.rainGain).connect(this.sfx); s.start();
  }
  rain(level) {
    if (!this.ctx) return;
    this.rainGain.gain.setTargetAtTime(level * 0.16, this.ctx.currentTime, 0.4);
  }
  thunder() {
    this.noise(2.8, { vol: 0.5, freq: 380, to: 60, attack: 0.05 });
    this.tone(48, 1.6, { type: 'sine', vol: 0.3, to: 30 });
  }

  // ---------- SFX ----------
  click() { this.tone(660, 0.06, { type: 'triangle', vol: 0.12 }); }
  coin(combo = 0) {
    const t = this.ctx?.currentTime; if (!t) return;
    const p = Math.min(combo, 12) * 35;
    this.tone(1180 + p, 0.07, { type: 'square', vol: 0.05, when: t });
    this.tone(1580 + p, 0.12, { type: 'square', vol: 0.045, when: t + 0.05 });
  }
  jump() { this.tone(260, 0.22, { type: 'triangle', vol: 0.16, to: 620 }); }
  launch() { this.tone(180, 0.5, { type: 'sawtooth', vol: 0.12, to: 900 }); this.noise(0.4, { vol: 0.15, freq: 900, to: 3000 }); }
  land() { this.tone(110, 0.15, { type: 'sine', vol: 0.3, to: 50 }); this.noise(0.12, { vol: 0.12, freq: 500 }); }
  trick() { [0, 4, 7, 12].forEach((s, i) => this.tone(hz(s + 24), 0.14, { type: 'square', vol: 0.06, when: this.ctx.currentTime + i * 0.06 })); }
  near() { this.noise(0.35, { vol: 0.25, type: 'bandpass', freq: 600, to: 2600, q: 2 }); }
  crash() {
    this.noise(0.6, { vol: 0.6, freq: 1800, to: 120 });
    this.tone(90, 0.45, { type: 'square', vol: 0.25, to: 35 });
    this.noise(0.25, { vol: 0.25, type: 'highpass', freq: 3500, when: this.ctx?.currentTime + 0.05 });
  }
  smash() {
    this.noise(0.45, { vol: 0.45, freq: 2500, to: 200 });
    this.tone(140, 0.3, { type: 'square', vol: 0.15, to: 60 });
    this.tone(880, 0.2, { type: 'triangle', vol: 0.06, to: 1760 });
  }
  bump(k = 1) {
    this.tone(65, 0.22, { type: 'sine', vol: 0.45 * k, to: 35 });
    this.noise(0.25, { vol: 0.25 * k, type: 'bandpass', freq: 1400, q: 2 });           // metal rattle
    this.noise(0.12, { vol: 0.15 * k, type: 'highpass', freq: 4000, when: this.ctx?.currentTime + 0.08 });
  }
  backfire() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const dly of [0, 0.07, 0.16]) { this.noise(0.07, { vol: 0.45, type: 'lowpass', freq: 900, to: 200, when: t + dly }); this.tone(58, 0.08, { type: 'square', vol: 0.12, to: 30, when: t + dly }); }
  }
  kite() { const t = this.ctx?.currentTime; if (!t) return; this.tone(700, 0.35, { type: 'triangle', vol: 0.08, to: 1500 }); this.noise(0.4, { vol: 0.1, type: 'bandpass', freq: 2000, q: 4, when: t + 0.05 }); [0, 7, 12].forEach((k, i) => this.tone(hz(k + 24), 0.15, { type: 'square', vol: 0.04, when: t + 0.1 + i * 0.06 })); }
  chime() { const t = this.ctx?.currentTime; if (!t) return; [0, 4, 7, 12].forEach((k, i) => this.tone(hz(k + 24), 0.9, { type: 'sine', vol: 0.05, when: t + i * 0.12 })); }
  splash() { this.noise(0.5, { vol: 0.3, type: 'bandpass', freq: 1200, to: 400, q: 0.7 }); }
  powerup() { [0, 4, 7, 12, 16].forEach((s, i) => this.tone(hz(s + 12), 0.18, { type: 'triangle', vol: 0.1, when: this.ctx.currentTime + i * 0.055 })); }
  shieldBreak() { this.tone(1200, 0.4, { type: 'sawtooth', vol: 0.1, to: 200 }); this.noise(0.3, { vol: 0.2, type: 'highpass', freq: 2000 }); }
  nitro() { this.noise(1.2, { vol: 0.35, type: 'bandpass', freq: 400, to: 3000, q: 1.5 }); this.tone(110, 0.9, { type: 'sawtooth', vol: 0.12, to: 330 }); }
  fare() { [0, 4, 7, 12, 7, 12, 16].forEach((s, i) => this.tone(hz(s + 12), 0.2, { type: 'square', vol: 0.06, when: this.ctx.currentTime + i * 0.08 })); }
  fail() { [7, 5, 2, 0].forEach((s, i) => this.tone(hz(s), 0.3, { type: 'triangle', vol: 0.12, when: this.ctx.currentTime + i * 0.14 })); }
  gate() { [0, 7, 12, 16, 19, 24].forEach((s, i) => this.tone(hz(s + 12), 0.4, { type: 'sawtooth', vol: 0.05, when: this.ctx.currentTime + i * 0.07 })); }
  gameover() { [12, 10, 7, 5, 0].forEach((s, i) => this.tone(hz(s), 0.45, { type: 'triangle', vol: 0.14, when: this.ctx.currentTime + i * 0.18 })); }
  buy() { this.tone(988, 0.1, { type: 'square', vol: 0.06 }); this.tone(1319, 0.25, { type: 'square', vol: 0.06, when: this.ctx.currentTime + 0.08 }); }

  horn(kind = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const hornVoice = (f, start, dur, type = 'sawtooth', vol = 0.12) => {
      const c = this.ctx, o = c.createOscillator(), o2 = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain();
      o.type = type; o2.type = type; o.frequency.value = f; o2.frequency.value = f * 1.26;
      fl.type = 'lowpass'; fl.frequency.value = 2200;
      g.gain.setValueAtTime(0.0001, start); g.gain.exponentialRampToValueAtTime(vol, start + 0.02);
      g.gain.setValueAtTime(vol, start + dur - 0.04); g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      o.connect(fl); o2.connect(fl); fl.connect(g).connect(this.sfx);
      o.start(start); o2.start(start); o.stop(start + dur + 0.05); o2.stop(start + dur + 0.05);
    };
    if (kind === 0) { hornVoice(410, t, 0.12, 'square', 0.09); hornVoice(410, t + 0.17, 0.2, 'square', 0.09); }          // stock 125 'peep peep'
    else if (kind === 1) { hornVoice(520, t, 0.55, 'sawtooth', 0.12); hornVoice(655, t, 0.55, 'sawtooth', 0.08); }      // pressure horn
    else if (kind === 2) { [0, 4, 7, 4, 9, 7].forEach((s, i) => hornVoice(hz(s + 12) * 1.5, t + i * 0.11, 0.1, 'square', 0.07)); }
    else { hornVoice(150, t, 0.7, 'sawtooth', 0.16); hornVoice(190, t, 0.7, 'sawtooth', 0.1); }
  }

  // ---------- music ----------
  newPhrase() {
    // 32-step melodic phrase built from short motifs — repeated with variation
    const motif = () => {
      const m = []; let n = Math.floor(Math.random() * 5);
      for (let i = 0; i < 8; i++) {
        if (Math.random() < 0.3) { m.push(null); continue; }
        n = Math.max(0, Math.min(SCALE.length - 1, n + Math.floor(Math.random() * 5) - 2));
        m.push(n);
      }
      return m;
    };
    const a = motif(), b = motif();
    this.phrase = [...a, ...a, ...b, ...a.map((x, i) => (i > 5 ? 0 : x))];
    this.bassRoots = [0, 0, 5, 3].map(i => SCALE[i]);
  }
  // style: 'dhol' | 'qawwali' | 'lofi' | 'off' (playlist uses an <audio> element instead)
  setStyle(style) { this.style = style; this.step = 0; this.newPhrase(); }

  schedule() {
    if (!this.ctx || this.mode === 'off' || this.style === 'off') return;
    const st = this.style || 'dhol';
    const drive = this.mode === 'drive';
    const bpm = st === 'lofi' ? 84 : st === 'qawwali' ? (drive ? 104 + this.intensity * 20 : 88) : (drive ? 118 + this.intensity * 14 : 96);
    const stepDur = 60 / bpm / 4;
    if (this.nextNote < this.ctx.currentTime - 0.2) this.nextNote = this.ctx.currentTime + 0.05;
    while (this.nextNote < this.ctx.currentTime + 0.12) {
      if (st === 'qawwali') this.playQawwali(this.step, this.nextNote, stepDur);
      else if (st === 'lofi') this.playLofi(this.step, this.nextNote, stepDur);
      else this.playStep(this.step, this.nextNote, stepDur);
      this.nextNote += stepDur;
      this.step = (this.step + 1) % 64;
      if (this.step === 0 && Math.random() < 0.4) this.newPhrase();
    }
  }

  /** Dhol FM — bhangra-style dhol, tumbi plucks, drone. */
  playStep(step, t, sd) {
    const drive = this.mode === 'drive';
    const s16 = step % 16;
    const bar = Math.floor(step / 16);
    const dest = this.music;
    if (drive) {
      if ([0, 3, 6, 8, 11, 14].includes(s16)) this.tone(105, 0.22, { type: 'sine', vol: 0.5, to: 48, when: t, dest });
      if ([2, 4, 7, 10, 12, 15].includes(s16)) this.noise(0.06, { vol: 0.16, type: 'highpass', freq: 3200, when: t, dest });
      if (this.intensity > 0.5 && s16 % 2 === 1) this.noise(0.03, { vol: 0.06, type: 'highpass', freq: 7000, when: t, dest });
    } else if (s16 === 0 || s16 === 8) {
      this.tone(90, 0.3, { type: 'sine', vol: 0.25, to: 50, when: t, dest });
    }
    const root = this.bassRoots[bar % 4];
    if (s16 === 0 || (drive && (s16 === 6 || s16 === 10))) this.tone(hz(root - 12), sd * 3, { type: 'triangle', vol: drive ? 0.22 : 0.14, when: t, dest });
    if (s16 === 0) {
      this.tone(hz(root), sd * 15, { type: 'sawtooth', vol: 0.025, when: t, attack: 0.3, dest });
      this.tone(hz(root + 7), sd * 15, { type: 'sawtooth', vol: 0.018, when: t, attack: 0.3, dest });
    }
    if (step % 2 === 0) {
      const n = this.phrase[(step / 2) % this.phrase.length];
      if (n !== null && n !== undefined) {
        const f = hz(SCALE[n] + 12);
        this.tone(f, sd * 1.6, { type: 'square', vol: drive ? 0.05 : 0.035, when: t, dest, attack: 0.003 });
        this.tone(f * 2, sd * 0.8, { type: 'triangle', vol: 0.02, when: t, dest, attack: 0.002 });
      }
    }
  }

  /** Qawwali Night — harmonium chords, tabla, hand claps. */
  playQawwali(step, t, sd) {
    const drive = this.mode === 'drive';
    const s16 = step % 16, bar = Math.floor(step / 16);
    const dest = this.music;
    // tabla: "dha" (low bend) and "na/ti" (high ring)
    if ([0, 6, 8, 14].includes(s16)) this.tone(130, 0.28, { type: 'sine', vol: 0.4, to: 95, when: t, dest });
    if ([2, 4, 10, 12].includes(s16) || (drive && s16 % 2 === 1 && this.intensity > 0.4)) this.tone(520, 0.09, { type: 'triangle', vol: 0.12, to: 480, when: t, dest });
    // claps on 4 & 12 (and a double at the end of each bar when driving)
    if (s16 === 4 || s16 === 12 || (drive && s16 === 15)) {
      this.noise(0.08, { vol: 0.28, type: 'bandpass', freq: 1400, q: 0.8, when: t, dest });
      this.noise(0.06, { vol: 0.18, type: 'bandpass', freq: 1100, q: 0.8, when: t + 0.012, dest });
    }
    // harmonium: reedy chord, re-pumped every half bar
    const roots = [0, 5, 3, 0];
    const r = SCALE[roots[bar % 4]];
    if (s16 === 0 || s16 === 8) {
      for (const iv of [0, 4, 7]) {
        this.tone(hz(r + iv), sd * 8, { type: 'sawtooth', vol: 0.03, when: t, attack: 0.06, dest });
        this.tone(hz(r + iv) * 1.004, sd * 8, { type: 'square', vol: 0.014, when: t, attack: 0.06, dest });
      }
      this.tone(hz(r - 12), sd * 8, { type: 'triangle', vol: 0.14, when: t, attack: 0.02, dest });
    }
    // sung-like lead with slides
    if (step % 2 === 0) {
      const n = this.phrase[(step / 2) % this.phrase.length];
      if (n !== null && n !== undefined) {
        const f = hz(SCALE[n] + 12);
        this.tone(f * 0.97, sd * 2.2, { type: 'triangle', vol: 0.06, to: f, when: t, attack: 0.03, dest });
      }
    }
  }

  /** Sea Breeze Lo-fi — lazy beat, mellow 7th chords, vinyl crackle. */
  playLofi(step, t, sd) {
    const s16 = step % 16, bar = Math.floor(step / 16);
    const dest = this.music;
    if (s16 === 0 || s16 === 10) this.tone(80, 0.3, { type: 'sine', vol: 0.45, to: 42, when: t, dest });
    if (s16 === 4 || s16 === 12) this.noise(0.18, { vol: 0.14, type: 'bandpass', freq: 1800, q: 0.6, when: t, dest });
    if (s16 % 2 === 0) this.noise(0.04, { vol: 0.04, type: 'highpass', freq: 6000, when: t + (s16 % 4 === 2 ? sd * 0.2 : 0), dest });
    if (Math.random() < 0.3) this.noise(0.02, { vol: 0.015, type: 'highpass', freq: 2500, when: t, dest }); // crackle
    const prog = [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9, 12], [7, 11, 14, 17]];
    if (s16 === 0) for (const iv of prog[bar % 4]) this.tone(hz(iv), sd * 15, { type: 'triangle', vol: 0.035, when: t + Math.random() * 0.03, attack: 0.08, dest });
    if (s16 === 0 || s16 === 7) this.tone(hz(prog[bar % 4][0] - 12), sd * 5, { type: 'sine', vol: 0.2, when: t, dest });
    if (step % 4 === 2 && Math.random() < 0.55) {
      const n = this.phrase[(step / 2) % this.phrase.length];
      if (n !== null && n !== undefined) this.tone(hz(SCALE[n] + 12), sd * 3, { type: 'sine', vol: 0.05, when: t, attack: 0.01, dest });
    }
  }
}

export const audio = new AudioEngine();
