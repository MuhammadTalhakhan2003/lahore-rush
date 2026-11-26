// Peshawar Rush demo capture (Playwright). Virtualises time so every frame is exactly 1/FPS s apart,
// scripts a short autopilot tour, and writes numbered JPEG frames for ffmpeg.
// Usage: node promo/capture.cjs <url> <out dir> [width height fps]
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const URL = process.argv[2], OUT = process.argv[3];
const W = +(process.argv[4] || 1280), H = +(process.argv[5] || 720), FPS = +(process.argv[6] || 24), DT = 1000 / FPS;
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) fs.unlinkSync(path.join(OUT, f));

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
    for (let g = 0; g < 500; g++) {
      T.timers.sort((a, b) => a.at - b.at);
      const n = T.timers[0];
      if (!n || n.at > end) break;
      T.t = Math.max(T.t, n.at);
      if (n.rep) n.at += n.rep; else T.timers.shift();
      try { typeof n.fn === 'function' ? n.fn(...(n.args || [])) : 0; } catch (e) { console.error(e); }
    }
    T.t = end;
    for (const cb of T.raf.splice(0)) { try { cb(T.t); } catch (e) { console.error(e); } }
    for (const a of document.getAnimations()) { try { a.pause(); a.currentTime = (a.currentTime || 0) + ms; } catch {} }
  };
})();`;

// scenes: [seconds, place, time-of-day, caption, startD, [[t, key], ...]]
const SCENES = [
  { sec: 3.5, menu: true, cap: ['PESHAWAR RUSH', 'Chingchi pe poora Peshawar'] },
  { sec: 8, place: 'qissa', tod: 'shaam', d: 0, cap: ['Qissa Khwani Bazaar', 'Chingchi, truck art, aur dhak dhak dhak'],
    keys: [[1.2, 'ArrowRight'], [2.6, 'ArrowUp'], [3.8, 'ArrowLeft'], [5, 'KeyQ'], [6.6, 'ShiftLeft']] },
  { sec: 7.5, place: 'balahisar', tod: 'shaam', d: 230, cap: ['Bala Hisar Fort', '37 asli jagahain — koi do dafa nahi'],
    keys: [[1.5, 'ArrowLeft'], [3, 'ArrowUp'], [4.4, 'ArrowRight'], [5.5, 'KeyQ']] },
  { sec: 8, place: 'jamrud', tod: 'dopehar', d: 230, cap: ['Bab-e-Khyber, Jamrud', 'Darwaza-e-Khyber ke neechay se guzro'],
    keys: [[1.2, 'ArrowRight'], [2.8, 'ArrowUp'], [4, 'ArrowUp'], [5.2, 'ArrowLeft'], [6.2, 'ShiftLeft']] },
  { sec: 6.5, place: 'hayatabad', tod: 'raat', d: 0, cap: ['Hayatabad ki raat', 'Din se raat tak, barish aur dhool bhi'],
    keys: [[1.5, 'ArrowLeft'], [3, 'ArrowUp'], [4.5, 'ArrowRight']] },
  { sec: 3.5, end: true, place: 'saddar', tod: 'shaam', d: 0, cap: ['PESHAWAR RUSH', 'Free • browser mein • phone pe bhi'] },
];

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.addInitScript(CLOCK);
  await p.addInitScript(`try { localStorage.setItem('peshawar-rush-save-v1', JSON.stringify({ coins: 4200, high: 18400, tutorialDone: true, items: {headstart:0,shieldStart:0}, spinDate: 'x', letters: {date:'x',got:3}, settings: { volume: 0, music: false, quality: 'high', shake: true, muted: true, startTime: 'shaam' }, unlocked: ['qissa','balahisar','jamrud','hayatabad','saddar'] })); } catch {}`);
  await p.goto(URL + '?demo', { waitUntil: 'domcontentloaded', timeout: 120000 });
  for (let i = 0; i < 1500; i++) {
    await p.evaluate(ms => window.__step(ms), DT);
    if (await p.evaluate(() => !!window.__rr && window.__rr.state === 'menu')) break;
    await new Promise(r => setTimeout(r, 15));
  }
  await p.evaluate(() => {
    const st = document.createElement('style');
    st.textContent = `#userbar,#install-card,#debug,#toast,#bubble,#hud-radio,.credits-bar,#credits-bar{display:none!important}
      #promo{position:fixed;inset:0;pointer-events:none;z-index:99;font-family:"Baloo 2",system-ui,sans-serif}
      #promo .cap{position:absolute;left:48px;bottom:56px;padding:14px 26px 12px;color:#fbe39a;background:linear-gradient(180deg,rgba(13,90,55,.85),rgba(6,38,26,.92));border:1px solid rgba(224,176,74,.8);border-radius:8px;box-shadow:0 14px 40px rgba(0,0,0,.45);transition:opacity .4s,transform .4s}
      #promo .cap b{display:block;font:800 34px/1.1 "Baloo 2",Georgia,serif;letter-spacing:.5px}
      #promo .cap i{display:block;font:600 18px/1.3 "Baloo 2",system-ui,sans-serif;color:#f6f1e3;font-style:normal;margin-top:2px}
      #promo .fade{position:absolute;inset:0;background:#06261a;opacity:0}
      #promo .end{position:absolute;inset:0;display:grid;place-items:center;background:rgba(6,38,26,.82);opacity:0;text-align:center;color:#fbe39a}
      #promo .end img{width:200px;height:200px}
      #promo .end h1{font:900 76px/1 Georgia,serif;margin-top:8px}
      #promo .end p{font:700 26px "Baloo 2",system-ui,sans-serif;color:#fff;margin-top:10px}`;
    document.head.appendChild(st);
    const d = document.createElement('div'); d.id = 'promo';
    d.innerHTML = '<div class="cap"><b></b><i></i></div><div class="end"><div><img src="/logo.svg"><h1>Peshawar Rush</h1><p>Chingchi pe poora Peshawar — free, in your browser</p></div></div><div class="fade"></div>';
    document.body.appendChild(d);
  });

  const stepShot = async n => {
    await p.evaluate(ms => window.__step(ms), DT);
    await p.screenshot({ path: path.join(OUT, `f${String(n).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 88 });
  };
  let n = 0;
  const set = (sel, css) => p.evaluate(([s, c]) => Object.assign(document.querySelector('#promo ' + s).style, c), [sel, css]);
  for (const [si, sc] of SCENES.entries()) {
    await p.evaluate(c => { const cap = document.querySelector('#promo .cap'); cap.querySelector('b').textContent = c[0]; cap.querySelector('i').textContent = c[1]; }, sc.cap);
    if (!sc.menu) {
      await p.evaluate(s => {
        const rr = window.__rr;
        if (rr.state !== 'menu') rr.goMenu();
        rr.save.startDistrict = s.place; if (!rr.save.unlocked.includes(s.place)) rr.save.unlocked.push(s.place);
        rr.save.settings.startTime = s.tod; rr.applyStartDistrict(); rr.startRun();
      }, sc);
      for (let i = 0; i < 6; i++) await p.evaluate(ms => window.__step(ms), DT);
      await p.evaluate(s => { const rr = window.__rr; rr.run.power.shield = 999; if (s.d) { rr.run.D = s.d; rr.world.reset(s.d); } }, sc);
    }
    const frames = Math.round(sc.sec * FPS);
    const keys = (sc.keys || []).map(([t, k]) => [Math.round(t * FPS), k]);
    for (let f = 0; f < frames; f++) {
      for (const [kf, k] of keys) if (kf === f) await p.evaluate(code => { window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true })); window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true })); }, k);
      if (sc.keys && f % 30 === 0) await p.evaluate(() => { window.__rr.run.power.shield = 999; });
      const fadeIn = Math.min(1, f / (0.4 * FPS)), fadeOut = Math.min(1, (frames - 1 - f) / (0.4 * FPS));
      await set('.fade', { opacity: String(1 - Math.min(fadeIn, fadeOut)) });
      await set('.cap', { opacity: f > 0.5 * FPS && f < frames - 0.5 * FPS ? '1' : '0', display: sc.end ? 'none' : 'block' });
      if (sc.end) await set('.end', { opacity: String(Math.min(1, f / (0.5 * FPS))) });
      await stepShot(n++);
    }
    console.log('scene', si, 'done, frames', n);
  }
  await b.close();
})();
