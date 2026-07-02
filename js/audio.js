'use strict';
// ============================================================
// audio: procedural WebAudio music sequencer + synth SFX
// ============================================================
const Au = { ctx: null, master: null, musicGain: null, sfxGain: null, started: false, theme: -1, step: 0, nextT: 0, timer: null };
G.Au = Au;

Au.init = function () {
  if (Au.started) return;
  try {
    Au.ctx = new (window.AudioContext || window.webkitAudioContext)();
    Au.master = Au.ctx.createGain(); Au.master.gain.value = 0.55; Au.master.connect(Au.ctx.destination);
    Au.musicGain = Au.ctx.createGain(); Au.musicGain.gain.value = 0.5; Au.musicGain.connect(Au.master);
    Au.sfxGain = Au.ctx.createGain(); Au.sfxGain.gain.value = 0.8; Au.sfxGain.connect(Au.master);
    Au.started = true;
    Au.timer = setInterval(Au.schedule, 40);
  } catch (e) { /* no audio */ }
};

// ---------- music ----------
// per-theme: scale (semitones from root), root freq, bpm, character
const THEMES = [
  { root: 110.0, scale: [0, 3, 5, 7, 10], bpm: 96,  bass: 'square',   arp: 'triangle', dens: .55, hat: .5 },  // office - melancholy lofi
  { root: 82.4,  scale: [0, 2, 3, 7, 8],  bpm: 84,  bass: 'sawtooth', arp: 'square',   dens: .4,  hat: .3 },  // legacy - dark crawl
  { root: 98.0,  scale: [0, 3, 7, 10, 12], bpm: 100, bass: 'sine',    arp: 'sine',     dens: .5,  hat: .4 },  // lake - liquid
  { root: 110.0, scale: [0, 1, 5, 7, 8],  bpm: 128, bass: 'sawtooth', arp: 'square',   dens: .7,  hat: .8 },  // gpu - hot techno
  { root: 130.8, scale: [0, 4, 7, 11, 14], bpm: 76, bass: 'sine',     arp: 'triangle', dens: .35, hat: .2 },  // cloud - airy
  { root: 73.4,  scale: [0, 1, 6, 7, 10], bpm: 140, bass: 'sawtooth', arp: 'sawtooth', dens: .8,  hat: .9 },  // kernel - panic
  { root: 92.5,  scale: [0, 2, 3, 6, 7],  bpm: 132, bass: 'sawtooth', arp: 'square',   dens: .85, hat: .9 },  // boss
  { root: 110.0, scale: [0, 3, 7, 10, 14], bpm: 70, bass: 'triangle', arp: 'sine',     dens: .3,  hat: .15 }, // title
];
Au.setTheme = function (i) { if (Au.theme !== i) { Au.theme = i; Au.step = 0; } };
Au.stopMusic = function () { Au.theme = -1; };

Au.schedule = function () {
  if (!Au.started || Au.theme < 0 || !G.meta || !G.meta.settings.music) return;
  const c = Au.ctx, T = THEMES[Au.theme];
  const spb = 60 / T.bpm / 4; // 16th
  if (Au.nextT < c.currentTime) Au.nextT = c.currentTime + 0.05;
  while (Au.nextT < c.currentTime + 0.25) {
    Au.playStep(Au.step, Au.nextT, T);
    Au.nextT += spb; Au.step = (Au.step + 1) % 64;
  }
};
// deterministic pseudo-random per step so tracks loop musically
function stepHash(step, salt) { let h = (step * 374761393 + salt * 668265263) >>> 0; h = (h ^ (h >> 13)) * 1274126177 >>> 0; return ((h ^ (h >> 16)) >>> 0) / 4294967296; }

Au.playStep = function (step, t, T) {
  const bar = Math.floor(step / 16), beat = step % 16;
  const prog = [0, 0, 3, 4]; // scale-degree offsets per bar
  const off = prog[bar % 4];
  // kick
  if (beat % 8 === 0 || (T.dens > .6 && beat === 10)) Au.kick(t);
  // hat
  if (beat % 2 === 1 && stepHash(step, 7) < T.hat) Au.hat(t, stepHash(step, 9) < .2);
  // bass on beats
  if (beat % 4 === 0) {
    const deg = T.scale[(off + (beat === 8 ? 2 : 0)) % T.scale.length];
    Au.note(T.bass, T.root * Math.pow(2, deg / 12), t, 0.22, 0.11, Au.musicGain, 700);
  }
  // arp
  if (stepHash(step, 3) < T.dens) {
    const deg = T.scale[Math.floor(stepHash(step, 5) * T.scale.length)] + 12 + (off ? 12 : 0) % 24;
    Au.note(T.arp, T.root * Math.pow(2, deg / 12) * 2, t, 0.12, 0.035, Au.musicGain, 2400);
  }
  // pad swell each bar
  if (beat === 0 && bar % 2 === 0) {
    const deg = T.scale[off % T.scale.length];
    Au.pad(T.root * Math.pow(2, deg / 12) * 2, t, 60 / T.bpm * 4);
  }
};

Au.note = function (type, freq, t, dur, vol, dest, cutoff) {
  const c = Au.ctx;
  const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
  o.type = type; o.frequency.value = freq;
  f.type = 'lowpass'; f.frequency.value = cutoff || 2000;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f); f.connect(g); g.connect(dest || Au.sfxGain);
  o.start(t); o.stop(t + dur + 0.02);
};
Au.pad = function (freq, t, dur) {
  const c = Au.ctx;
  for (const det of [-4, 3]) {
    const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.value = freq; o.detune.value = det;
    f.type = 'lowpass'; f.frequency.value = 900;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.028, t + dur * 0.4);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(f); f.connect(g); g.connect(Au.musicGain);
    o.start(t); o.stop(t + dur + 0.05);
  }
};
Au.kick = function (t) {
  const c = Au.ctx, o = c.createOscillator(), g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.1);
  g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  o.connect(g); g.connect(Au.musicGain); o.start(t); o.stop(t + 0.16);
};
Au.hat = function (t, open) {
  const c = Au.ctx, len = open ? 0.09 : 0.03;
  const buf = c.createBuffer(1, c.sampleRate * len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = c.createBufferSource(); s.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
  const g = c.createGain(); g.gain.value = 0.09;
  s.connect(f); f.connect(g); g.connect(Au.musicGain); s.start(t);
};

// ---------- SFX ----------
Au.noiseBurst = function (dur, vol, freq, type) {
  if (!Au.started || !G.meta.settings.sfx) return;
  const c = Au.ctx, t = c.currentTime;
  const buf = c.createBuffer(1, Math.max(1, c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.4);
  const s = c.createBufferSource(); s.buffer = buf;
  const f = c.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq;
  const g = c.createGain(); g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(Au.sfxGain); s.start(t);
};
Au.sweep = function (f0, f1, dur, vol, type) {
  if (!Au.started || !G.meta.settings.sfx) return;
  const c = Au.ctx, t = c.currentTime;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type || 'square';
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(Au.sfxGain); o.start(t); o.stop(t + dur + 0.02);
};

Au.sfx = function (name) {
  if (!Au.started || !G.meta || !G.meta.settings.sfx) return;
  switch (name) {
    case 'shoot': Au.sweep(880 + Math.random() * 200, 240, 0.08, 0.05, 'square'); break;
    case 'shootBig': Au.sweep(440, 110, 0.16, 0.09, 'sawtooth'); Au.noiseBurst(0.06, 0.05, 1500); break;
    case 'hit': Au.noiseBurst(0.05, 0.1, 900); Au.sweep(300, 120, 0.06, 0.06, 'triangle'); break;
    case 'kill': Au.noiseBurst(0.18, 0.16, 700); Au.sweep(500, 60, 0.22, 0.1, 'sawtooth'); break;
    case 'hurt': Au.sweep(220, 60, 0.3, 0.18, 'sawtooth'); Au.noiseBurst(0.15, 0.12, 500); break;
    case 'boom': Au.noiseBurst(0.5, 0.3, 300); Au.sweep(120, 30, 0.5, 0.22, 'sine'); break;
    case 'pickup': Au.sweep(660, 1320, 0.09, 0.07, 'square'); break;
    case 'coin': Au.sweep(988, 1976, 0.07, 0.06, 'square'); Au.sweep(1319, 2637, 0.06, 0.04, 'square'); break;
    case 'key': Au.sweep(1200, 900, 0.08, 0.06, 'triangle'); break;
    case 'battery': Au.sweep(523, 1046, 0.12, 0.08, 'triangle'); Au.sweep(659, 1318, 0.12, 0.05, 'triangle'); break;
    case 'item': for (let i = 0; i < 4; i++) setTimeout(() => Au.sweep(523 * Math.pow(1.335, i), 523 * Math.pow(1.335, i), 0.18, 0.07, 'triangle'), i * 90); break;
    case 'door': Au.noiseBurst(0.12, 0.08, 400); Au.sweep(180, 90, 0.14, 0.05, 'square'); break;
    case 'secret': for (let i = 0; i < 3; i++) setTimeout(() => Au.sweep(880 + i * 220, 1760 + i * 220, 0.14, 0.06, 'sine'), i * 70); break;
    case 'active': Au.sweep(300, 1500, 0.2, 0.1, 'sawtooth'); break;
    case 'charge': Au.sweep(700, 1400, 0.06, 0.04, 'sine'); break;
    case 'bossIntro': Au.sweep(80, 40, 0.9, 0.25, 'sawtooth'); Au.noiseBurst(0.8, 0.2, 200); break;
    case 'bossHurt': Au.sweep(200, 80, 0.2, 0.12, 'square'); break;
    case 'bossDie': Au.noiseBurst(1.2, 0.35, 400); Au.sweep(300, 20, 1.2, 0.25, 'sawtooth'); break;
    case 'ui': Au.sweep(660, 880, 0.05, 0.05, 'square'); break;
    case 'uiBack': Au.sweep(440, 330, 0.06, 0.05, 'square'); break;
    case 'error': Au.sweep(200, 150, 0.15, 0.09, 'square'); break;
    case 'devil': Au.sweep(120, 60, 0.6, 0.14, 'sawtooth'); Au.noiseBurst(0.4, 0.08, 250); break;
    case 'teleport': Au.sweep(1600, 200, 0.25, 0.09, 'sine'); break;
    case 'shield': Au.sweep(400, 800, 0.15, 0.07, 'triangle'); break;
    case 'levelup': for (let i = 0; i < 5; i++) setTimeout(() => Au.sweep(440 * Math.pow(1.26, i), 440 * Math.pow(1.26, i) * 1.5, 0.16, 0.06, 'triangle'), i * 70); break;
  }
};
