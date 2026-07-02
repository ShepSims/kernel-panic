'use strict';
// ============================================================
// KERNEL PANIC — core: namespace, RNG, math, save I/O
// ============================================================
window.G = {
  W: 480, H: 320, TILE: 32, HUD_H: 32,
  RW: 15, RH: 9,               // room size in tiles incl. walls
  state: 'boot',               // boot|title|run|pause|dead|win|stats|ach|help|itemlog|leader|mods|modbrowse|textentry
  time: 0, frame: 0,
  run: null,                   // current run state
  meta: null,                  // persistent save
  shake: 0, shakeX: 0, shakeY: 0,
  flash: 0, flashCol: '#fff',
  slowmo: 0,                   // hitstop timer
  transition: null,            // room slide transition
  msg: [],                     // floating HUD messages
  debug: false,
};

// ---------- seeded RNG (mulberry32) ----------
G.mulberry = function (a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
G.hashStr = function (s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};
G.seedToStr = function (n) { // readable seed like "K3XF-9Q2M"
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = '';
  for (let i = 0; i < 8; i++) { s += A[n % A.length]; n = Math.floor(n / A.length) ^ (n << 3); n = Math.abs(n); if (i === 3) s += '-'; }
  return s;
};

// run rng (deterministic per seed) and fx rng (visual only)
G.rng = G.mulberry(12345);
G.fxr = G.mulberry((Math.random() * 1e9) | 0);
G.setSeed = function (n) { G.rng = G.mulberry(n >>> 0); };

// helpers on run rng
G.R = (a, b) => a + Math.floor(G.rng() * (b - a + 1));      // int [a,b]
G.RF = (a, b) => a + G.rng() * (b - a);                     // float
G.pick = arr => arr[Math.floor(G.rng() * arr.length)];
G.chance = p => G.rng() < p;
G.shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(G.rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
// helpers on fx rng
G.fR = (a, b) => a + G.fxr() * (b - a);
G.fPick = arr => arr[Math.floor(G.fxr() * arr.length)];

// ---------- math ----------
G.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
G.lerp = (a, b, t) => a + (b - a) * t;
G.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
G.ang = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1);
G.norm = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
G.TAU = Math.PI * 2;
G.aLerp = (a, b, t) => { // angle lerp
  let d = b - a; while (d > Math.PI) d -= G.TAU; while (d < -Math.PI) d += G.TAU;
  return a + d * t;
};

// ---------- juice ----------
G.addShake = (n) => { G.shake = Math.min(14, G.shake + n); };
G.hitstop = (t) => { G.slowmo = Math.max(G.slowmo, t); };
G.flashScreen = (col, t) => { G.flash = t; G.flashCol = col; };
G.toast = (txt, col) => { G.msg.push({ txt, col: col || '#cfe8ff', t: 2.6, y: 0 }); if (G.msg.length > 4) G.msg.shift(); };

// ---------- save I/O ----------
G.SAVE_KEY = 'kernelpanic_v1';
G.saveMeta = function () {
  try { localStorage.setItem(G.SAVE_KEY, JSON.stringify(G.meta)); } catch (e) { /* private mode */ }
};
G.loadMeta = function () {
  let m = null;
  try { m = JSON.parse(localStorage.getItem(G.SAVE_KEY)); } catch (e) { }
  G.meta = Object.assign({
    ver: 1,
    runs: 0, wins: 0, deaths: 0, kills: 0, bossKills: 0,
    itemsCollected: 0, coinsCollected: 0, roomsCleared: 0, secretsFound: 0,
    dealsTaken: 0, cursedEntered: 0, challengesWon: 0,
    deepestFloor: 0, bestEndless: 0, totalTime: 0, damageTaken: 0, bombsUsed: 0,
    achievements: {},        // id -> true
    unlocks: {},             // unlock id -> true
    seenItems: {},           // itemId -> true (item log)
    settings: { music: true, sfx: true, screenshake: true },
  }, m || {});
};

// ---------- canvas ----------
G.cv = document.getElementById('game');
G.cx = G.cv.getContext('2d');
G.cx.imageSmoothingEnabled = false;
G.fitCanvas = function () {
  const s = Math.max(1, Math.floor(Math.min(window.innerWidth / G.W, window.innerHeight / G.H)));
  G.cv.style.width = (G.W * s) + 'px'; G.cv.style.height = (G.H * s) + 'px';
};
window.addEventListener('resize', G.fitCanvas);
G.fitCanvas();

// offscreen helper
G.mkCanvas = function (w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
