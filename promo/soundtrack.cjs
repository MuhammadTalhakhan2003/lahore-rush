// Offline soundtrack for the trailer: replays the capture's per-frame engine state and sound events through the
// game's own audio engine, rendered frame-accurately in an OfflineAudioContext, and writes a 48 kHz stereo WAV.
// Usage: node promo/soundtrack.cjs <puppeteer-core dir> <url> <capture dir>
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(process.argv[2], 'node_modules', 'puppeteer-core'));
const URL = process.argv[3];
const DIR = process.argv[4];
const log = JSON.parse(fs.readFileSync(path.join(DIR, 'audio-log.json'), 'utf8'));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new',
    args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'], protocolTimeout: 600000,
  });
  const p = await browser.newPage();
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  for (let i = 0; i < 240; i++) { if (await p.evaluate(() => window.__rr?.state === 'menu')) break; await new Promise(r => setTimeout(r, 500)); }

  const b64 = await p.evaluate(async log => {
    const FPS = 30, SR = 48000;
    const frames = log.frames, dur = frames.length / FPS + 1.0;
    const off = new OfflineAudioContext(2, Math.ceil(SR * dur), SR);
    let vt = 0;
    // a context whose clock we drive: currentTime = the frame being replayed
    const ctx = new Proxy(off, { get(t, k) { if (k === 'currentTime') return vt; const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; } });
    const A = window.__rr.audio;
    window.AudioContext = function () { return ctx; };
    window.setTimeout = () => 0;                              // no wall-clock side effects during the replay
    A.ctx = null; A.init(); clearInterval(A.timer);
    A.setMuted(false); A.setMusic(false); A.setVolume(0.9);
    const byFrame = new Map();
    for (const e of log.events) { if (e.n === 'clunk' || e.n === 'backfire') continue; (byFrame.get(e.f) || byFrame.set(e.f, []).get(e.f)).push(e); }
    const boom = t => { A.tone(52, 3.2, { type: 'sine', vol: 0.55, to: 30, when: t, attack: 0.02 }); A.noise(2.4, { vol: 0.18, type: 'lowpass', freq: 900, to: 80, when: t, attack: 0.3 }); };
    let lastCard = false;
    for (let i = 0; i < frames.length; i++) {
      vt = i / FPS;
      const fr = frames[i];
      const card = fr.st === 'menu';
      if (i === 0 || (card && !lastCard)) boom(vt + 0.05);
      lastCard = card;
      for (const e of byFrame.get(i) || []) { try { A[e.n](...(e.a || [])); } catch (err) { /* ignore */ } }
      A.engine(fr.s, fr.n, fr.on);
      A.scheduleEngine();
      A.setSiren(fr.siren);
      A.ambience(card ? null : fr.st, fr.ph, !card && fr.on, 1 / FPS);
    }
    vt = frames.length / FPS;
    A.engine(0, 0, false); A.setSiren(0);
    const buf = await off.startRendering();
    // 16-bit stereo WAV
    const n = buf.length, ch = [buf.getChannelData(0), buf.getChannelData(1)];
    const out = new DataView(new ArrayBuffer(44 + n * 4));
    const str = (o, s) => { for (let k = 0; k < s.length; k++) out.setUint8(o + k, s.charCodeAt(k)); };
    str(0, 'RIFF'); out.setUint32(4, 36 + n * 4, true); str(8, 'WAVE'); str(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true);
    out.setUint16(22, 2, true); out.setUint32(24, SR, true); out.setUint32(28, SR * 4, true); out.setUint16(32, 4, true); out.setUint16(34, 16, true);
    str(36, 'data'); out.setUint32(40, n * 4, true);
    let peak = 0; for (const c of ch) for (let k = 0; k < n; k++) peak = Math.max(peak, Math.abs(c[k]));
    const g = peak > 0 ? 0.89 / peak : 1;
    for (let k = 0; k < n; k++) for (let c = 0; c < 2; c++) out.setInt16(44 + k * 4 + c * 2, Math.max(-1, Math.min(1, ch[c][k] * g)) * 32767, true);
    const bytes = new Uint8Array(out.buffer); let s = '';
    for (let k = 0; k < bytes.length; k += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(k, k + 0x8000));
    return btoa(s);
  }, log);
  fs.writeFileSync(path.join(DIR, 'soundtrack.wav'), Buffer.from(b64, 'base64'));
  console.log('soundtrack.wav', (fs.statSync(path.join(DIR, 'soundtrack.wav')).size / 1e6).toFixed(1), 'MB,', log.frames.length, 'frames,', log.events.length, 'events');
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
