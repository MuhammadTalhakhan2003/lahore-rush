// DOM-side UI: HUD, popups, toasts, speech bubbles, district banner, and screen switching.
const $ = id => document.getElementById(id);
const els = {};
const timers = {};

function later(name, ms, fn) { clearTimeout(timers[name]); timers[name] = setTimeout(fn, ms); }

export const ui = {
  init() {
    for (const id of ['hud', 'hud-score', 'hud-mult', 'hud-dist', 'hud-coins', 'hud-lives', 'hud-speed', 'hud-nitro', 'hud-powers',
      'hud-mission', 'hud-mission-text', 'hud-mission-time', 'hud-mission-bar', 'popups', 'toast', 'bubble', 'bubble-text',
      'district', 'district-tag', 'district-name', 'district-urdu', 'district-bonus', 'flash', 'speedlines', 'vignette', 'touch-pad', 'hud-gear', 'hud-tod', 'hud-place', 'speedo', 'speedo-needle', 'speedo-limit']) els[id] = $(id);
    this.last = {};
  },

  show(name) {
    document.querySelectorAll('.screen').forEach(s => {
      const on = s.id === `screen-${name}`;
      if (on && s.classList.contains('hidden')) { s.classList.remove('hidden'); s.classList.remove('enter'); void s.offsetWidth; s.classList.add('enter'); }
      else if (!on) s.classList.add('hidden');
    });
  },
  hideScreens() { document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden')); },
  hud(on) { els.hud.classList.toggle('hidden', !on); document.body.classList.toggle('in-run', on); },
  touch(on) { els['touch-pad'].classList.toggle('hidden', !on); },

  /** Cheap HUD refresh — only writes to the DOM when a value changed. */
  update(r, powers) {
    const set = (k, v, el = els[k]) => { if (this.last[k] !== v) { this.last[k] = v; el.textContent = v; } };
    set('hud-score', Math.floor(r.score).toLocaleString());
    set('hud-dist', Math.floor(r.D).toLocaleString());
    set('hud-coins', r.coinsRun.toLocaleString());
    set('hud-speed', Math.round(r.speed * 3.6));
    set('hud-gear', r.gear ? String(r.gear) : 'N');
    const kmh = r.speed * 3.6;
    els['speedo-needle'].style.transform = `rotate(${-120 + Math.min(1, kmh / 180) * 240}deg)`;
    const over = r.law?.limit && kmh > r.law.limit + 6;
    if (this.last.over !== over) { this.last.over = over; els.speedo.classList.toggle('over', !!over); }
    if (r.placeName) set('hud-place', r.placeName);
    const mult = r.mult > 1 ? `x${r.mult}` : '';
    if (this.last.mult !== mult) {
      this.last.mult = mult;
      els['hud-mult'].textContent = mult;
      els['hud-mult'].classList.toggle('hidden', !mult);
      els['hud-mult'].classList.remove('pop'); void els['hud-mult'].offsetWidth; els['hud-mult'].classList.add('pop');
    }
    const lives = r.maxLives > 6 ? `❤ x${r.lives}` : '❤'.repeat(Math.max(0, r.lives)) + '♡'.repeat(Math.max(0, r.maxLives - r.lives));
    set('lives', lives, els['hud-lives']);
    const n = Math.round(r.nitro * 100);
    if (this.last.nitro !== n || this.last.nitroOn !== r.nitroOn) {
      this.last.nitro = n; this.last.nitroOn = r.nitroOn;
      els['hud-nitro'].style.width = n + '%';
      els['hud-nitro'].parentElement.classList.toggle('ready', r.nitro >= 0.3 && !r.nitroOn);
      els['hud-nitro'].parentElement.classList.toggle('on', r.nitroOn);
    }
    const pw = powers.map(p => `<div class="pw ${p.id}"><span>${p.icon}</span><i style="width:${Math.round(p.frac * 100)}%"></i></div>`).join('');
    if (this.last.pw !== pw) { this.last.pw = pw; els['hud-powers'].innerHTML = pw; }
    // speed lines + vignette intensity
    const sl = r.nitroOn ? 0.55 : Math.min(0.4, Math.max(0, (r.speed - 30) / 40));
    els.speedlines.style.opacity = sl.toFixed(2);
    els.speedlines.classList.toggle('nitro', r.nitroOn);
  },

  mission(m) {
    if (!m) { els['hud-mission'].classList.add('hidden'); return; }
    els['hud-mission'].classList.remove('hidden');
    els['hud-mission'].classList.toggle('urgent', !!m.urgent);
    els['hud-mission-text'].textContent = m.text;
    els['hud-mission-time'].textContent = m.time;
    els['hud-mission-bar'].style.width = Math.max(0, Math.min(1, m.frac)) * 100 + '%';
  },

  popup(text, cls = '') {
    const d = document.createElement('div');
    d.className = `popup ${cls}`;
    d.textContent = text;
    d.style.left = 50 + (Math.random() - 0.5) * 16 + '%';
    els.popups.appendChild(d);
    setTimeout(() => d.remove(), 1100);
    while (els.popups.children.length > 5) els.popups.firstChild.remove();
  },

  toast(text, ms = 1800) {
    els.toast.textContent = text;
    els.toast.classList.add('on');
    later('toast', ms, () => els.toast.classList.remove('on'));
  },

  speech(text, ms = 2500) {
    els['bubble-text'].textContent = text;
    els.bubble.classList.add('on');
    later('bubble', ms, () => els.bubble.classList.remove('on'));
  },

  district(d, bonus = '') {
    els['district-tag'].textContent = d.tag;
    els['district-name'].textContent = d.name;
    els['district-urdu'].textContent = d.urdu;
    els['district-bonus'].textContent = bonus;
    els.district.classList.remove('on'); void els.district.offsetWidth;
    els.district.classList.add('on');
    later('district', 3200, () => els.district.classList.remove('on'));
  },

  flash() {
    els.flash.classList.add('on');
    later('flash', 120, () => els.flash.classList.remove('on'));
  },

  /** Speed-limit badge on the speedo while inside a camera zone. */
  limit(l) {
    els['speedo-limit'].textContent = l || '';
    els['speedo-limit'].classList.toggle('hidden', !l);
    if (!l) els.speedo.classList.remove('over');
  },
  camFlash() { const f = $('camflash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); },
  /** Warden's stop window: { frac, fine } or null. */
  challanPrompt(c) {
    const el = $('challan-prompt');
    if (!c) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    $('challan-fine').textContent = c.fine;
    $('challan-bar').style.width = Math.max(0, c.frac) * 100 + '%';
  },
  /** The paper challan slip, shown for a few seconds. */
  challanSlip(c) {
    const el = $('challan-slip');
    const no = 'LHR-' + Math.floor(100000 + Math.random() * 899999);
    const d = new Date();
    const fineLine = c.udhaar
      ? `<div class="slip-fine udhaar"><span>Udhaar</span><b>Rs ${c.fine.toLocaleString()}</b></div><div class="slip-note">Jeb khaali — agli kamai ton katega</div>`
      : `<div class="slip-fine"><span>Jurmana <small>(aadhi kamai)</small></span><b>Rs ${c.fine.toLocaleString()}</b></div>`;
    el.innerHTML = `<div class="slip-head"><small>CITY TRAFFIC POLICE · LAHORE</small><b>${c.title}</b></div>
      <div class="slip-grid"><span>Challan</span><b>${no}</b><span>Waqt</span><b>${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b><span>Gaddi</span><b>125 · LEB-${Math.floor(1000 + Math.random() * 8999)}</b></div>
      <div class="slip-offence">${c.offence}</div>
      ${fineLine}
      <div class="slip-remark">“${c.remark}”</div>
      <div class="slip-stamp">${c.stamp}</div>`;
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    later('slip', 2000, () => el.classList.remove('on'));
  },
  chase(on) {
    $('hud-chase').classList.toggle('hidden', !on);
    $('siren').classList.toggle('on', on);
  },
  chaseGap(frac, flash) {
    $('chase-bar').style.width = Math.max(0, Math.min(1, frac)) * 100 + '%';
    $('siren').classList.toggle('blue', flash);
  },
  /** Ammi's errand chip: { icon, name, m } or null. */
  errand(e) {
    const el = $('hud-errand');
    if (!e) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    const t = `${e.icon} Ammi: ${e.name} — ${e.m} m`;
    if (el.textContent !== t) el.textContent = t;
  },

  /** Time-of-day chip: subah / dopehar / shaam / raat. */
  timeOfDay(ph) {
    const map = { subah: ['🌅', 'Subah'], dopehar: ['☀️', 'Dopehar'], shaam: ['🌇', 'Shaam'], raat: ['🌙', 'Raat'] };
    const [ic, name] = map[ph] || map.subah;
    els['hud-tod'].innerHTML = `<span>${ic}</span>${name}`;
    els['hud-tod'].className = `tod-chip ${ph}`;
    document.body.dataset.tod = ph;
  },

  // ---------- L A H O R E letters ----------
  letters(got, flash = false) {
    const el = $('hud-letters');
    el.innerHTML = 'LAHORE'.split('').map((c, i) => `<span class="${i < got ? 'on' : ''} ${flash && i === got - 1 ? 'new' : ''}">${c}</span>`).join('');
  },

  // ---------- boosts offered at run start ----------
  boosts(windowLeft, items) {
    const el = $('hud-boosts');
    const owned = [['headstart', '⏩', 'B'], ['shieldStart', '🛡️', 'V']].filter(([id]) => items[id] > 0);
    if (windowLeft <= 0 || !owned.length) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    const html = owned.map(([id, ic, k]) => `<button class="boost" data-boost="${id}">${ic}<b>x${items[id]}</b><small>${k}</small></button>`).join('') +
      `<i style="width:${Math.max(0, windowLeft / 7) * 100}%"></i>`;
    if (el.dataset.html !== html.slice(0, 200)) { el.innerHTML = html; el.dataset.html = html.slice(0, 200); }
    else el.querySelector('i').style.width = Math.max(0, windowLeft / 7) * 100 + '%';
  },

  fever(on) { $('fever').classList.toggle('on', on); document.body.classList.toggle('fever', on); },

  race(on) { $('hud-race').classList.toggle('hidden', !on); },
  raceGap(m) {
    $('hud-race-gap').textContent = m > 0 ? `${m}m aage` : 'Overtake!';
    $('hud-race-bar').style.width = Math.max(0, Math.min(100, 100 - m / 1.5)) + '%';
  },

  radio(text) { $('radio-now').textContent = text; },

  // ---------- juice: counters, confetti, ripples, tilt ----------
  countUp(el, to, ms = 1100) {
    const t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / ms);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString();
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  confetti(n = 80) {
    const box = $('confetti');
    const cols = ['#d62828', '#ffd60a', '#0b8f3a', '#1565c0', '#e91e63', '#00e5ff'];
    for (let i = 0; i < n; i++) {
      const d = document.createElement('i');
      d.style.left = Math.random() * 100 + '%';
      d.style.background = cols[i % cols.length];
      d.style.animationDelay = Math.random() * 0.6 + 's';
      d.style.animationDuration = 1.6 + Math.random() * 1.4 + 's';
      d.style.setProperty('--dx', (Math.random() - 0.5) * 200 + 'px');
      d.style.setProperty('--r', Math.random() * 720 + 'deg');
      box.appendChild(d);
      setTimeout(() => d.remove(), 3600);
    }
  },

  /** Click ripples on every .btn, 3D tilt on cards/panels (pointer devices). */
  initJuice() {
    document.addEventListener('pointerdown', e => {
      const b = e.target.closest('.btn, .chip, .tab, .boost');
      if (!b) return;
      const r = b.getBoundingClientRect();
      const rip = document.createElement('span');
      rip.className = 'ripple';
      const size = Math.max(r.width, r.height) * 2;
      rip.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
      b.appendChild(rip);
      setTimeout(() => rip.remove(), 600);
    });
    if (matchMedia('(pointer: fine)').matches) {
      document.addEventListener('pointermove', e => {
        const c = e.target.closest('.card, .ach');
        document.querySelectorAll('.tilt').forEach(x => { if (x !== c) { x.classList.remove('tilt'); x.style.transform = ''; } });
        if (!c) return;
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        c.classList.add('tilt');
        c.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(4px)`;
        c.style.setProperty('--mx', (x + 0.5) * 100 + '%'); c.style.setProperty('--my', (y + 0.5) * 100 + '%');
      });
    }
  },

  clearTransient() {
    els.popups.innerHTML = '';
    els.bubble.classList.remove('on');
    els.toast.classList.remove('on');
    els.district.classList.remove('on');
    els.speedlines.style.opacity = 0;
    this.mission(null);
    this.last = {};
  },
};
