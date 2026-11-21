// Cinematic trailer capture for Lahore Rush.
// Usage: node promo/capture.cjs <puppeteer-core dir> <url> <out dir> [width height]
// Virtualises time (rAF, performance.now, timers, CSS animations) so every frame is exactly 1/30 s apart,
// and logs per-frame engine state + every sound event to <out>/audio-log.json for the offline soundtrack render.
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(process.argv[2], 'node_modules', 'puppeteer-core'));
const URL = process.argv[3];
const OUT = process.argv[4];
const W = +(process.argv[5] || 1920), H = +(process.argv[6] || 1080);
const FPS = 30, DT = 1000 / FPS;
const FRAMES = path.join(OUT, 'frames');
fs.mkdirSync(FRAMES, { recursive: true });
for (const f of fs.readdirSync(FRAMES)) fs.unlinkSync(path.join(FRAMES, f));

const CLOCK = `(() => {
  const T = window.__T = { t: 0, raf: [], timers: [], id: 1 };
  performance.now = () => T.t;
  Date.now = (n => () => n + T.t)(Date.now());
  window.requestAnimationFrame = cb => { T.raf.push(cb); return T.id++; };
  window.cancelAnimationFrame = () => {};
  const add = (fn, ms, rep, args) => { const id = T.id++; T.timers.push({ id, fn, at: T.t + Math.max(0, ms || 0), rep: rep ? Math.max(1, ms || 0) : 0, args }); return id; };
  window.setTimeout = (fn, ms, ...a) => add(fn, ms, false, a);
  window.setInterval = (fn, ms, ...a) => add(fn, ms, true, a);
  window.clearTimeout = window.clearInterval = id => { T.timers = T.timers.filter(x => x.id !== id); };
  window.__step = ms => {
    const end = T.t + ms;
    for (let guard = 0; guard < 500; guard++) {
      T.timers.sort((a, b) => a.at - b.at);
      const n = T.timers[0];
      if (!n || n.at > end) break;
      T.t = Math.max(T.t, n.at);
      if (n.rep) n.at += n.rep; else T.timers.shift();
      try { typeof n.fn === 'function' ? n.fn(...(n.args || [])) : 0; } catch (e) { console.error(e); }
    }
    T.t = end;
    const list = T.raf.splice(0);
    for (const cb of list) { try { cb(T.t); } catch (e) { console.error(e); } }
    for (const a of document.getAnimations()) { try { a.pause(); a.currentTime = (a.currentTime || 0) + ms; } catch {} }
  };
})();`;

const ALL = ['delhi','lohari','bhati','taxali','kashmiri','mochi','gawalmandi','qila','rangmahal','anarkali','mall','lakshmi','neela','regal','charing','jail','bilalganj','minar','jinnah','racecourse','jallo','shalimar','modeltown','canal','mughalpura','dharampura','thokar','harbanspura','shahdara','mmalam','liberty','boulevard','kalma','hafeez','johar','dha','fortress'];
const SAVE = JSON.stringify({
  coins: 6400, high: 24880, tutorialDone: true, unlocked: ALL, startDistrict: 'taxali',
  items: { headstart: 0, shieldStart: 0 }, radio: 0, spinDate: 'x', letters: { date: 'x', got: 0 },
  settings: { volume: 0, music: false, quality: 'high', shake: true, muted: true, startTime: 'shaam' },
});

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new',
    args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'], protocolTimeout: 600000,
  });
  const p = await browser.newPage();
  await p.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.evaluateOnNewDocument(CLOCK);
  await p.evaluateOnNewDocument(`try { localStorage.setItem('lahore-rush-save-v1', ${JSON.stringify(SAVE)}); } catch {}`);
  await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  for (let i = 0; i < 900; i++) {
    await p.evaluate(ms => window.__step(ms), DT);
    if (await p.evaluate(() => !!window.__rr && window.__rr.state === 'menu')) break;
    await new Promise(r => setTimeout(r, 20));
  }
  const logo = fs.readFileSync(path.join(__dirname, '..', 'public', 'logo.svg'), 'utf8');

  // overlay: letterbox, classic captions, title + end cards; sound-event logger; autopilot
  await p.evaluate(logo => {
    const st = document.createElement('style');
    st.textContent = `
      #district, #toast, #userbar, #credits-bar, #debug, #hud-radio, #install-card, .hud-left, .hud-right, #hud-letters, #hud-mission, #hud-powers, .nitro-wrap, #hud-errand { display: none !important; }
      #hud { padding-top: 84px !important; padding-bottom: 92px !important; }
      #bubble { top: auto !important; bottom: 150px !important; }
      #promo { position: fixed; inset: 0; pointer-events: none; z-index: 50; font-family: "Baloo 2", system-ui, sans-serif; }
      #promo .bar { position: absolute; left: 0; right: 0; height: 64px; background: #07020a; }
      #promo .bar.t { top: 0; } #promo .bar.b { bottom: 0; }
      #promo .cap { position: absolute; left: 70px; bottom: 120px; padding: 18px 30px 16px 34px; color: #f8efdc;
        background: linear-gradient(180deg, rgba(122,31,31,.55), rgba(42,10,14,.82)); border: 1px solid rgba(224,176,74,.7); border-radius: 6px;
        box-shadow: 0 18px 50px rgba(0,0,0,.45), inset 0 0 0 4px rgba(42,10,14,.35); opacity: 0; transform: translateY(14px); transition: all .5s cubic-bezier(.2,1,.3,1); }
      #promo .cap.on { opacity: 1; transform: none; }
      #promo .cap::before { content: ""; position: absolute; left: 12px; top: 16px; bottom: 16px; width: 3px; background: linear-gradient(#fbe39a, #a8761f); }
      #promo .cap i { display: block; font: italic 400 20px "Playfair Display", Georgia, serif; letter-spacing: 4px; color: #e0b04a; }
      #promo .cap b { display: block; font: 900 50px/1.05 "Playfair Display", Georgia, serif; letter-spacing: .5px; }
      #promo .cap small { display: block; font: 700 22px "Baloo 2", sans-serif; opacity: .9; margin-top: 4px; }
      #promo .card { position: absolute; inset: 0; display: grid; place-items: center; text-align: center; color: #f8efdc; opacity: 0; transition: opacity .8s;
        background: radial-gradient(circle at 50% 42%, rgba(74,15,24,.72), rgba(14,3,6,.96) 70%); }
      #promo .card.on { opacity: 1; }
      #promo .card svg { width: 330px; height: auto; filter: drop-shadow(0 20px 50px rgba(0,0,0,.6)); transform: scale(.92); transition: transform 3s ease-out; }
      #promo .card.on svg { transform: scale(1); }
      #promo .card h1 { margin: 8px 0 0; font: 900 112px/1 "Playfair Display", Georgia, serif; letter-spacing: 4px;
        background: linear-gradient(180deg, #fbe39a, #e0b04a 55%, #a8761f); -webkit-background-clip: text; color: transparent; }
      #promo .card .k { font: italic 400 26px "Playfair Display", Georgia, serif; letter-spacing: 8px; color: #e0b04a; }
      #promo .card .ur { font: 500 40px "Noto Nastaliq Urdu", serif; color: #f3d27a; line-height: 2; }
      #promo .card .url { display: inline-block; margin-top: 20px; font: 800 40px "Baloo 2", sans-serif; padding: 12px 36px; border: 2px solid #e0b04a; border-radius: 999px; color: #fbe39a; background: rgba(42,10,14,.6); }
      #promo .chips { display: flex; gap: 12px; justify-content: center; margin-top: 26px; flex-wrap: wrap; }
      #promo .chips i { font: 700 19px "Baloo 2", sans-serif; font-style: normal; padding: 6px 16px; border-radius: 999px; border: 1px solid rgba(224,176,74,.55); color: #f6e7c1; }
      #promo .by { font: italic 400 24px "Playfair Display", Georgia, serif; opacity: .85; margin-top: 22px; }
      #promo .flash { position: absolute; inset: 0; background: #fff8e6; opacity: 0; transition: opacity .3s; }
      #promo .flash.on { opacity: .8; transition: none; }`;
    document.head.appendChild(st);
    const d = document.createElement('div'); d.id = 'promo';
    d.innerHTML = `<div class="flash"></div>
      <div class="card" id="pc-title"><div>${logo}<div class="k">THE SEQUEL TO RIKSHAW RUSH</div><h1>LAHORE RUSH</h1><div class="ur">لاہور لاہور اے</div></div></div>
      <div class="cap" id="pc-cap"><i></i><b></b><small></small></div>
      <div class="card" id="pc-end"><div>${logo}<h1 style="font-size:92px">PLAY FREE</h1>
        <div class="url">lahore-rush.vercel.app</div>
        <div class="chips"><i>Three.js</i><i>Blender</i><i>Web Audio</i><i>GLSL</i><i>PWA</i></div>
        <div class="by">Made in Pakistan · Muhammad Talha Khan</div></div></div>
      <div class="bar t"></div><div class="bar b"></div>`;
    document.body.appendChild(d);
    window.__promo = {
      cap(k, t, s) { const c = document.getElementById('pc-cap'); c.querySelector('i').textContent = k; c.querySelector('b').textContent = t; c.querySelector('small').textContent = s; c.classList.add('on'); },
      capOff() { document.getElementById('pc-cap').classList.remove('on'); },
      card(id, on) { document.getElementById(id).classList.toggle('on', on); },
      flash() { const f = document.querySelector('#promo .flash'); f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 60); },
    };
    // sound-event log (the offline soundtrack replays these through the game's own audio engine)
    window.__frame = 0;
    window.__alog = { events: [], frames: [] };
    const A = window.__rr.audio;
    for (const n of ['horn', 'kickStart', 'rev', 'shutter', 'whistle', 'bark', 'meow', 'coin', 'jump', 'land', 'launch', 'trick', 'near', 'crash', 'smash', 'bump', 'backfire',
      'splash', 'powerup', 'shieldBreak', 'nitro', 'fare', 'fail', 'gate', 'buy', 'kite', 'chime', 'ring', 'slap', 'thunder', 'gameover', 'clunk']) {
      const f = A[n]; if (typeof f !== 'function') continue;
      A[n] = function (...a) { window.__alog.events.push({ f: window.__frame, n, a }); return f.apply(this, a); };
    }
    // autopilot: dodge hard obstacles, hop breakers / jumpables
    window.__auto = { cd: 0, on: false };
    window.__drive = () => {
      const AU = window.__auto, R = window.__rr.run, P = window.__rr.player;
      if (!AU.on || !R.active) return;
      R.invuln = 99; R.lives = R.maxLives;
      AU.cd = Math.max(0, AU.cd - 1);
      const hard = l => R.obs.some(o => !o.dead && o.lane === l && o.hard && o.z > -30 && o.z < 3 && !(o.T.animal));
      const jumpy = l => R.obs.find(o => !o.dead && o.lane === l && (o.T.jump || o.T.bump || o.T.rough) && o.z > -8 && o.z < -2.5);
      if (AU.cd === 0 && hard(P.lane)) {
        const opts = [P.lane - 1, P.lane + 1].filter(l => l >= 0 && l <= 2 && !hard(l));
        if (opts.length) { R.input(opts[0] > P.lane ? 'right' : 'left'); AU.cd = 12; }
      }
      if (P.grounded && jumpy(P.lane)) R.input('jump');
    };
  }, logo);

  let frame = 0;
  const shot = async () => {
    await p.evaluate(ms => {
      window.__frame++; window.__drive && window.__drive(); window.__step(ms);
      const r = window.__rr, R = r.run, ch = R.law?.chase;
      window.__alog.frames.push({ s: r.state === 'playing' ? +R.speed.toFixed(2) : (r.state === 'menu' ? 0 : 0), on: r.state === 'playing' && R.active, n: R.nitroOn || R.headstart > 0 ? 1 : 0,
        siren: ch ? Math.max(0.12, Math.min(1, 1 - ch.gap / 30)) : 0, st: r.state === 'playing' ? (window.__place || 'androon') : 'menu', ph: R.phase || 'shaam' });
    }, DT);
    await p.screenshot({ path: path.join(FRAMES, `f${String(frame++).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
    if (frame % 60 === 0) console.log('frame', frame);
  };
  const hold = async sec => { for (let i = 0; i < Math.round(sec * FPS); i++) await shot(); };
  const js = (fn, ...a) => p.evaluate(fn, ...a);
  // start a run in a place at a time of day, optionally jump ahead (D) and fast-forward the simulation until `until` is true
  const startIn = async (place, style, tod, opt = {}) => {
    await js((place, style, tod, opt) => {
      const R = window.__rr;
      window.__place = style;
      R.save.startDistrict = place;
      R.applyStartDistrict();
      R.startRun();
      const run = R.run;
      run.time = opt.time || 60; run.speed = 19 + run.time * 0.2;
      run.law.nextZoneA = 1e12; run.errands.callT = 1e9; run.missionTimer = 1e9; run.rival.next = 1e12; run.nextLetterA = 1e12;
      run.weatherT = 9999; R.weather.clear();
      if (opt.D) { run.clearAll(); run.law.nextZoneA = 1e12; run.errands.callT = 1e9; run.D = opt.D; run.rowA = opt.D + 90; R.world.reset(opt.D); }
      if (opt.ff) { // fast-forward the simulation (no rendering) until the shot is set up
        const until = new Function('R', 'return ' + opt.ff);
        for (let t = 0; t < 120 && !until(R); t += 0.05) { run.update(0.05); R.world.update(run.D, 0.05); }
      }
      R.env.tod = tod;
      window.__auto.on = true;
      window.__promo.flash();
    }, place, style, tod, opt);
  };
  const press = a => js(a => window.__rr.run.input(a), a);
  const keepTod = tod => js(t => { window.__rr.env.tod = t; }, tod);
  const cap = (k, t, s) => js((k, t, s) => window.__promo.cap(k, t, s), k, t, s);
  const capOff = () => js(() => window.__promo.capOff());

  // ---- 0: title card over the menu ----
  await js(() => { window.__rr.env.tod = 0.705; window.__promo.card('pc-title', true); });
  await hold(3.4);
  await js(() => window.__promo.card('pc-title', false));
  await hold(0.8);

  // ---- 1: Taxali Gate at shaam, Badshahi Masjid ----
  await startIn('taxali', 'androon', 0.705, { D: 230 });
  await hold(0.6);
  await cap('ANDROON SHEHR', 'Taxali Gate at shaam', 'Badshahi Masjid · 37 real places, no place repeats');
  for (let i = 0; i < 8; i++) { await keepTod(0.705); await hold(0.5); if (i === 2) await press('wheelie'); }
  await capOff();

  // ---- 2: Anarkali by day: bunting, people, a backflip ----
  await startIn('anarkali', 'anarkali', 0.52, { D: 80 });
  await hold(0.5);
  await cap('ANARKALI BAZAAR', 'Jhandiyan, dhabas & Lahori life', 'Hand-built in Blender · stray dogs, billiyan, tongas & chingchis');
  for (let i = 0; i < 9; i++) { await keepTod(0.52); await hold(0.5); if (i === 3) await press('jump'); if (i === 4) await press('jump'); }
  await capOff();

  // ---- 3: Canal Road underpass under the Orange Line ----
  await startIn('canal', 'canal', 0.33, { ff: "R.world.items.some(it => /underpass/.test(it.obj.userData.poolKey) && it.obj.position.z > -140 && it.obj.position.z < -95)" });
  await hold(0.5);
  await cap('CANAL ROAD', 'Underpass after underpass', 'Kalma Chowk to Dharampura · Orange Line overhead');
  for (let i = 0; i < 10; i++) { await keepTod(0.33); await hold(0.5); }
  await capOff();

  // ---- 4: speed camera → e-challan → police chase → chakma ----
  await startIn('liberty', 'gulberg', 0.76, { time: 120 });
  await js(() => { const run = window.__rr.run; run.law.nextZoneA = run.D + 20; });
  await js(() => { const R = window.__rr, run = R.run; for (let t = 0; t < 60; t += 0.05) { run.update(0.05); R.world.update(run.D, 0.05); const z = run.law.zones[0]; if (z && z.camA - run.D < 46) break; } });
  await cap('E-CHALLAN', 'Overspeed? Warden ruk ja keh raha', 'Stop & pay half your earnings — or run from the police 125');
  await hold(3.0);                     // camera flash + warden's "RUKO!" prompt
  await capOff();
  await hold(1.9);                     // stop window runs out → the police 125 comes after you
  await js(() => { const ch = window.__rr.run.law.chase; if (ch) ch.gap = 8.5; });
  await hold(2.6);
  await js(() => { const R = window.__rr.run; R.nitro = 1; R.input('nitro'); if (R.law.chase) R.law.chase.gap = 29.6; });
  await hold(2.2);

  // ---- 5: MM Alam Road at night, nitro ----
  await startIn('mmalam', 'gulberg', 0.93, { time: 90 });
  await hold(0.5);
  await cap('MM ALAM ROAD', 'Gulberg by raat', 'A synthesised 125 · 4-speed box, kick-start & silencer pops');
  await js(() => { window.__rr.run.nitro = 1; window.__rr.run.input('nitro'); });
  for (let i = 0; i < 10; i++) { await keepTod(0.93); await hold(0.5); }
  await capOff();

  // ---- 6: end card ----
  await js(() => window.__promo.card('pc-end', true));
  await hold(4.2);

  fs.writeFileSync(path.join(OUT, 'audio-log.json'), JSON.stringify(await js(() => window.__alog)));
  console.log('frames', frame);
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
