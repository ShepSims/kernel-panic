'use strict';
// ============================================================
// particles & visual effects
// ============================================================
const Fx = { parts: [], floats: [], rings: [] };
G.Fx = Fx;

Fx.clear = function () { Fx.parts.length = 0; Fx.floats.length = 0; Fx.rings.length = 0; };

Fx.spawn = function (x, y, opts) {
  opts = opts || {};
  const n = opts.n || 6;
  for (let i = 0; i < n; i++) {
    const a = opts.ang !== undefined ? opts.ang + G.fR(-(opts.spread || 0.5), opts.spread || 0.5) : G.fR(0, G.TAU);
    const sp = G.fR(opts.spMin || 20, opts.spMax || 90);
    Fx.parts.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      g: opts.grav !== undefined ? opts.grav : 120,
      t: G.fR((opts.life || 0.5) * 0.5, opts.life || 0.5), max: opts.life || 0.5,
      col: Array.isArray(opts.col) ? G.fPick(opts.col) : (opts.col || '#fff'),
      s: G.fR(opts.sMin || 1, opts.sMax || 3),
      glow: opts.glow || false, fric: opts.fric || 0.97,
    });
  }
  if (Fx.parts.length > 900) Fx.parts.splice(0, Fx.parts.length - 900);
};

Fx.ring = function (x, y, col, r0, r1, dur) {
  Fx.rings.push({ x, y, col, r0, r1, t: dur, max: dur });
};
Fx.float = function (x, y, txt, col) {
  Fx.floats.push({ x: x + G.fR(-4, 4), y, txt, col: col || '#fff', t: 0.8 });
  if (Fx.floats.length > 30) Fx.floats.shift();
};

// canned effects
Fx.hitSpark = function (x, y, col) {
  Fx.spawn(x, y, { n: 7, col: [col, '#fff'], life: 0.3, spMin: 40, spMax: 140, grav: 0, sMin: 1, sMax: 2.5, glow: true });
};
Fx.deathBurst = function (x, y, col, big) {
  Fx.spawn(x, y, { n: big ? 26 : 14, col: [col, Spr.shade(col, 0.6), '#fff'], life: big ? 0.8 : 0.55, spMin: 30, spMax: big ? 190 : 130, grav: 100, sMin: 1.5, sMax: big ? 4.5 : 3 });
  Fx.ring(x, y, col, 2, big ? 34 : 20, 0.3);
};
Fx.explosion = function (x, y, r) {
  Fx.spawn(x, y, { n: 30, col: ['#ffb84d', '#ff7a5c', '#ff5252', '#fff'], life: 0.7, spMin: 30, spMax: 220, grav: 40, sMin: 2, sMax: 5, glow: true });
  Fx.spawn(x, y, { n: 14, col: ['#454d63', '#20242e'], life: 1.1, spMin: 10, spMax: 60, grav: -30, sMin: 3, sMax: 6 });
  Fx.ring(x, y, '#ffb84d', 4, r, 0.35);
  G.addShake(7); G.flashScreen('rgba(255,190,90,.25)', 0.12);
};
Fx.dust = function (x, y) {
  Fx.spawn(x, y, { n: 2, col: ['#ffffff22', '#ffffff33'], life: 0.4, spMin: 4, spMax: 16, grav: -14, sMin: 1, sMax: 2.5 });
};
Fx.tp = function (x, y, col) {
  Fx.spawn(x, y, { n: 20, col: [col || '#4df3ff', '#fff'], life: 0.5, spMin: 20, spMax: 90, grav: -60, glow: true });
  Fx.ring(x, y, col || '#4df3ff', 20, 2, 0.3);
};

Fx.update = function (dt) {
  for (let i = Fx.parts.length - 1; i >= 0; i--) {
    const p = Fx.parts[i];
    p.t -= dt; if (p.t <= 0) { Fx.parts.splice(i, 1); continue; }
    p.vy += p.g * dt; p.vx *= p.fric; p.vy *= p.fric;
    p.x += p.vx * dt; p.y += p.vy * dt;
  }
  for (let i = Fx.floats.length - 1; i >= 0; i--) {
    const f = Fx.floats[i]; f.t -= dt; f.y -= 26 * dt;
    if (f.t <= 0) Fx.floats.splice(i, 1);
  }
  for (let i = Fx.rings.length - 1; i >= 0; i--) {
    const r = Fx.rings[i]; r.t -= dt; if (r.t <= 0) Fx.rings.splice(i, 1);
  }
};

Fx.draw = function (x) {
  for (const p of Fx.parts) {
    const a = G.clamp(p.t / p.max, 0, 1);
    x.globalAlpha = a;
    if (p.glow) { x.shadowColor = p.col; x.shadowBlur = 6; }
    x.fillStyle = p.col;
    const s = p.s * (0.5 + a * 0.5);
    x.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    x.shadowBlur = 0;
  }
  x.globalAlpha = 1;
  for (const r of Fx.rings) {
    const k = 1 - r.t / r.max;
    x.globalAlpha = r.t / r.max;
    x.strokeStyle = r.col; x.lineWidth = 2;
    x.beginPath(); x.arc(r.x, r.y, G.lerp(r.r0, r.r1, k), 0, G.TAU); x.stroke();
  }
  x.globalAlpha = 1;
  x.font = 'bold 8px monospace'; x.textAlign = 'center';
  for (const f of Fx.floats) {
    x.globalAlpha = G.clamp(f.t / 0.4, 0, 1);
    x.fillStyle = '#0b0b12'; x.fillText(f.txt, f.x + 1, f.y + 1);
    x.fillStyle = f.col; x.fillText(f.txt, f.x, f.y);
  }
  x.globalAlpha = 1; x.textAlign = 'left';
};
