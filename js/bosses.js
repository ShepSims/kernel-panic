'use strict';
// ============================================================
// bosses.js: 3 large multi-phase cinematic bosses
// THE COMPILER / HALLUCINATION / SINGULARITY
// ============================================================
const Boss = {};
G.Boss = Boss;

Boss.KINDS = {
  compiler: {
    name: 'THE COMPILER', sub: 'it optimizes you away',
    spr: 'bossCompiler', hp: 130, r: 30, col: '#7dff8a', dmg: 1,
  },
  hallucination: {
    name: 'HALLUCINATION', sub: 'confidently wrong',
    spr: 'bossHallu', hp: 160, r: 32, col: '#b76bff', dmg: 1,
  },
  singularity: {
    name: 'SINGULARITY', sub: 'the last commit',
    spr: 'bossCore', hp: 230, r: 36, col: '#ff3355', dmg: 2,
  },
  gc: {
    name: 'GARBAGE COLLECTOR', sub: 'you are unreachable code',
    spr: 'bossGC', hp: 150, r: 30, col: '#7dff8a', dmg: 1,
  },
  scheduler: {
    name: 'THE SCHEDULER', sub: 'your time slice expired',
    spr: 'bossSched', hp: 140, r: 28, col: '#ffe24d', dmg: 1,
  },
  forkprime: {
    name: 'FORK PRIME', sub: ':(){ :|:& };:',
    spr: 'bossFork', hp: 150, r: 30, col: '#ff4da6', dmg: 1,
  },
  auditor: {
    name: 'THE AUDITOR', sub: 'discrepancies were found',
    spr: 'bossAudit', hp: 150, r: 30, col: '#eef4ff', dmg: 1,
  },
  balancer: {
    name: 'LOAD BALANCER', sub: 'distributing suffering evenly',
    spr: 'bossBalCore', hp: 160, r: 24, col: '#4dc3ff', dmg: 1,
  },
  rootkitprime: {
    name: 'ROOTKIT PRIME', sub: 'it was always beneath you',
    spr: 'bossRoot', hp: 170, r: 32, col: '#ff5252', dmg: 2,
  },
  leviathan: {
    name: 'LEVIATHAN LEAK', sub: 'it remembers every allocation',
    spr: 'bossLeak', hp: 180, r: 32, col: '#58c9f0', dmg: 1,
  },
};

Boss.forDepth = function (depth) {
  // SINGULARITY guards the kernel; the other nine rotate — no repeats until all seen.
  if (!G.run.endless && depth >= 6) return 'singularity';
  const all = ['compiler', 'hallucination', 'gc', 'scheduler', 'forkprime', 'auditor', 'balancer', 'rootkitprime', 'leviathan'];
  if (G.run.endless) all.push('singularity');
  G.run.usedBosses = G.run.usedBosses || [];
  let pool = all.filter(k => !G.run.usedBosses.includes(k));
  if (!pool.length) { G.run.usedBosses = []; pool = all.filter(k => k !== G.run.lastBossKind); }
  return G.pick(pool);
};

Boss.spawnInRoom = function (room, depth) {
  const kind = Boss.forDepth(depth);
  G.run.lastBossKind = kind;
  let K = Boss.KINDS[kind];
  // skin reskins: name & subtitle only
  const skin = G.Mods.skin();
  if (skin && skin.bosses[kind]) {
    K = Object.assign({}, K, {
      name: skin.bosses[kind].name || K.name,
      sub: skin.bosses[kind].sub || K.sub,
    });
  }
  const e = {
    type: 'boss_' + kind, bossKind: kind, boss: true,
    def: { name: K.name, ai: 'boss', col: K.col, ghost: kind === 'hallucination', size: K.r * 2, shape: 'blob', tag: 'boss' },
    x: G.W / 2, y: G.HUD_H + 90,
    vx: 0, vy: 0, r: K.r,
    hp: K.hp * (1 + (depth - 1) * .3 + (G.run.endless ? G.run.endlessLoop * .8 : 0)),
    dmg: K.dmg, spd: 40,
    state: 'intro', t: 0, tele: 0, cd: 2, flash: 0,
    dead: false, friendly: false,
    status: {}, kx: 0, ky: 0, anim: 0, spawnProt: 2.2,
    phase: 1, phaseT: 0, atkT: 1.5, subT: 0, gearA: 0,
    shields: [], fakes: [],
    champion: null, hurtYou: false, sticky: false, marked: false, segs: null,
  };
  e.hpMax = e.hp;
  // active mod pack
  const pf = G.run.packFx;
  if (pf) {
    const o = pf.bosses[kind];
    e.hp = Math.max(10, Math.round(e.hp * pf.g.bossHp * (o ? o.hp : 1)));
    e.hpMax = e.hp;
    if (o && o.dmg !== null && o.dmg !== undefined) e.dmg = o.dmg;
  }
  (G.run.usedBosses = G.run.usedBosses || []).push(kind);
  if (kind === 'singularity') {
    for (let i = 0; i < 6; i++) {
      const a = i * G.TAU / 6;
      // positioned immediately so they're hittable from frame one
      e.shields.push({ a, hp: 12, dead: false, x: e.x + Math.cos(a) * 52, y: e.y + Math.sin(a) * 40 });
    }
  }
  if (kind === 'balancer') { e.balA = 0; e.balR = 60; }
  if (kind === 'leviathan') { e.grow = 1; }
  room.enemies.push(e);
  G.run.bossIntro = { t: 2.4, name: K.name, sub: K.sub, kind };
  G.run.activeBoss = e;
  Au.sfx('bossIntro');
  Au.setTheme(6);
  G.addShake(8);
  return e;
};

Boss.phaseOf = function (e) {
  const f = e.hp / e.hpMax;
  return f > .66 ? 1 : f > .33 ? 2 : 3;
};

// pick a teleport/emerge spot on a ring around the player — never on top of them
Boss.ringSpot = function (p, minD, maxD) {
  let best = null, bd = -1;
  for (let i = 0; i < 8; i++) {
    const a = G.fR(0, G.TAU), d = G.fR(minD, maxD);
    const x = G.clamp(p.x + Math.cos(a) * d, 70, G.W - 70);
    const y = G.clamp(p.y + Math.sin(a) * d, G.HUD_H + 60, G.H - 60);
    const dd = G.dist(x, y, p.x, p.y);
    if (dd > bd) { bd = dd; best = [x, y]; }
  }
  return best;
};

Boss.ai = function (e, dt, p) {
  e.t += dt; e.phaseT += dt; e.gearA += dt * (2 + e.phase);
  if (e.state === 'intro') { e.spawnProt = Math.max(e.spawnProt, .1); if (G.run.bossIntro == null) { e.state = 'fight'; e.spawnProt = 0; } return; }
  const newPhase = Boss.phaseOf(e);
  if (newPhase !== e.phase) {
    e.phase = newPhase; e.phaseT = 0; e.atkT = 1.2; e.spawnProt = .8;
    G.addShake(10); G.flashScreen('rgba(255,255,255,.35)', .2);
    Fx.ring(e.x, e.y, e.def.col, 10, 120, .6);
    Fx.deathBurst(e.x, e.y, e.def.col, true);
    Au.sfx('bossIntro');
    G.toast(e.def.name + ' EVOLVES', '#ff5252');
    // phase transition: clear bullets for fairness
    G.run.cur.eshots.length = 0;
  }
  Boss[e.bossKind](e, dt, p);
};

// ---------- THE COMPILER ----------
Boss.compiler = function (e, dt, p) {
  const cx = G.W / 2, top = G.HUD_H + 80;
  e.atkT -= dt;
  if (e.phase === 1) {
    // patrol top, 5-way spreads
    e.x = cx + Math.sin(e.t * .8) * 120;
    e.y = top + Math.sin(e.t * 1.7) * 14;
    if (e.atkT <= 0) {
      e.atkT = 1.7;
      const a = G.ang(e.x, e.y, p.x, p.y);
      for (let i = -2; i <= 2; i++) En.eshot(e.x, e.y + 10, a + i * .22, 120, 1, { col: '#7dff8a' });
      Au.sfx('shootBig');
    }
    if (e.subT <= 0) { e.subT = 4.5; if (G.run.cur.enemies.filter(x => !x.dead && !x.boss && !x.friendly).length < 3) En.spawnAt('gnat', e.x, e.y + 20, {}); }
    e.subT -= dt;
  } else if (e.phase === 2) {
    // optimization: dash charges + radial
    if (e.state === 'fight') { e.state = 'aim'; e.tele = .8; }
    if (e.state === 'aim') {
      e.tele -= dt;
      e.dashA = G.aLerp(e.dashA || 0, G.ang(e.x, e.y, p.x, p.y), dt * 3);
      e.vx = e.vy = 0;
      if (e.tele <= 0) { e.state = 'dash'; e.dashT = .8; Au.sfx('shootBig'); }
    } else if (e.state === 'dash') {
      e.dashT -= dt;
      e.x += Math.cos(e.dashA) * 235 * dt;
      e.y += Math.sin(e.dashA) * 235 * dt;
      if (G.frame % 4 === 0) Fx.dust(e.x + G.fR(-10, 10), e.y + 20);
      if (G.frame % 8 === 0) En.eshot(e.x, e.y, e.dashA + Math.PI + G.fR(-.5, .5), 80, 1, { col: '#7dff8a' });
      e.x = G.clamp(e.x, 60, G.W - 60); e.y = G.clamp(e.y, G.HUD_H + 60, G.H - 60);
      if (e.dashT <= 0) {
        e.state = 'aim'; e.tele = .9;
        for (let i = 0; i < 10; i++) En.eshot(e.x, e.y, i * G.TAU / 10, 110, 1, { col: '#7dff8a' });
        G.addShake(5);
      }
    }
  } else {
    // link stage: spiral barrage + minions
    e.x = G.lerp(e.x, cx, dt); e.y = G.lerp(e.y, (G.H + G.HUD_H) / 2 - 20, dt);
    e.spiralA = (e.spiralA || 0) + dt * 3.2;
    if (e.atkT <= 0) {
      e.atkT = .14;
      for (const off of [0, Math.PI]) En.eshot(e.x, e.y, e.spiralA + off, 130, 1, { col: '#7dff8a' });
    }
    if (e.subT <= 0) {
      e.subT = 5;
      if (G.run.cur.enemies.filter(x => !x.dead && !x.boss && !x.friendly).length < 4) En.spawnAt('bug', e.x + G.fR(-40, 40), e.y + 30, {});
    }
    e.subT -= dt;
  }
};

// ---------- HALLUCINATION ----------
Boss.hallucination = function (e, dt, p) {
  e.atkT -= dt;
  if (e.phase === 1) {
    // drift + sine token streams
    const a = G.ang(e.x, e.y, p.x, p.y);
    e.x += Math.cos(a + Math.PI / 2) * 30 * dt + Math.cos(a) * 12 * dt;
    e.y += Math.sin(a + Math.PI / 2) * 30 * dt + Math.sin(a) * 12 * dt;
    e.x = G.clamp(e.x, 70, G.W - 70); e.y = G.clamp(e.y, G.HUD_H + 60, G.H - 60);
    if (e.atkT <= 0) {
      e.atkT = 2.1;
      const base = G.ang(e.x, e.y, p.x, p.y);
      for (let i = 0; i < 7; i++) {
        const s = En.eshot(e.x, e.y, base, 105, 1, { col: '#b76bff' });
      }
      // wave pattern: stagger angles
      let k = 0;
      for (const es of G.run.cur.eshots.slice(-7)) {
        const off = Math.sin(k * 1.1) * .5; k++;
        const sp = Math.hypot(es.vx, es.vy);
        es.vx = Math.cos(base + off) * sp; es.vy = Math.sin(base + off) * sp;
      }
      Au.sfx('shootBig');
    }
  } else if (e.phase === 2) {
    // teleport + radial with gaps + fakes
    if (e.atkT <= 0) {
      e.atkT = 2.4;
      Fx.tp(e.x, e.y, '#b76bff');
      [e.x, e.y] = Boss.ringSpot(p, 90, 200);
      Fx.tp(e.x, e.y, '#b76bff');
      Au.sfx('teleport');
      const gap = G.fR(0, G.TAU);
      for (let i = 0; i < 16; i++) {
        const an = i * G.TAU / 16;
        let d = Math.abs(an - gap); while (d > Math.PI) d = Math.abs(d - G.TAU);
        if (d > .55) En.eshot(e.x, e.y, an, 95, 1, { col: '#b76bff' });
      }
      // spawn a fake copy occasionally — never on top of the player
      if (e.fakes.filter(f => !f.dead).length < 2) {
        const [fx2, fy2] = Boss.ringSpot(p, 90, 220);
        const f = En.mk('daemon', fx2, fy2);
        f.isFake = true; f.hp = f.hpMax = 6; f.alpha = .75;
        G.run.cur.enemies.push(f); e.fakes.push(f);
        Fx.tp(f.x, f.y, '#b76bff');
      }
    }
  } else {
    // dream collapse: fast teleports, spirals, slight pull
    const a = G.ang(p.x, p.y, e.x, e.y);
    p.vx += Math.cos(a) * 26 * dt; p.vy += Math.sin(a) * 26 * dt;
    if (e.atkT <= 0) {
      e.atkT = 1.7;
      Fx.tp(e.x, e.y, '#e587ff');
      [e.x, e.y] = Boss.ringSpot(p, 100, 160); // keeps its distance now
      Fx.tp(e.x, e.y, '#e587ff');
      e.burstN = 3;
      e.burstT = .38; // windup before the first volley — time to react
    }
    if (e.burstN > 0 && !e.burstT) { e.burstT = .22; }
    if (e.burstT) {
      e.burstT -= dt;
      if (e.burstT <= 0) {
        e.burstN--; e.burstT = e.burstN > 0 ? .22 : 0;
        const base = G.ang(e.x, e.y, p.x, p.y);
        for (let i = -1; i <= 1; i++) En.eshot(e.x, e.y, base + i * .35 + G.fR(-.05, .05), 130, 1, { col: '#e587ff' });
      }
    }
  }
};

// ---------- SINGULARITY ----------
Boss.singularity = function (e, dt, p) {
  const cx = G.W / 2, cy = (G.H + G.HUD_H) / 2;
  e.atkT -= dt;
  // shield nodes
  for (const s of e.shields) {
    if (s.dead) continue;
    s.a += dt * (e.phase === 1 ? 1.1 : 1.8);
    s.x = e.x + Math.cos(s.a) * 52;
    s.y = e.y + Math.sin(s.a) * 40;
  }
  const shieldsAlive = e.shields.some(s => !s.dead);
  e.invulnCore = e.phase === 1 && shieldsAlive;
  if (e.phase === 1) {
    e.x = G.lerp(e.x, cx, dt * .8); e.y = G.lerp(e.y, cy - 20, dt * .8);
    if (e.atkT <= 0) {
      e.atkT = 2.2;
      e.wave = (e.wave || 0) + 1;
      for (let i = 0; i < 14; i++) En.eshot(e.x, e.y, i * G.TAU / 14 + e.wave * .22, 85, 1, { col: '#ff3355' });
      Au.sfx('shootBig');
    }
  } else if (e.phase === 2) {
    // roaming pull + arcs
    e.x = cx + Math.sin(e.t * .6) * 100;
    e.y = cy - 20 + Math.cos(e.t * .45) * 50;
    const a = G.ang(p.x, p.y, e.x, e.y);
    p.vx += Math.cos(a) * 34 * dt; p.vy += Math.sin(a) * 34 * dt;
    if (e.atkT <= 0) {
      e.atkT = 1.6;
      const base = G.ang(e.x, e.y, p.x, p.y);
      for (let i = -3; i <= 3; i++) En.eshot(e.x, e.y, base + i * .16, 120, 1, { col: '#ff3355' });
    }
    if (e.subT <= 0) { e.subT = 6; if (G.run.cur.enemies.filter(x => !x.dead && !x.boss && !x.friendly).length < 2) En.spawnAt('daemon', G.fR(80, G.W - 80), G.fR(G.HUD_H + 70, G.H - 70), {}); }
    e.subT -= dt;
  } else {
    // event horizon: double spiral + strong pull
    e.x = G.lerp(e.x, cx, dt); e.y = G.lerp(e.y, cy - 10, dt);
    const a = G.ang(p.x, p.y, e.x, e.y);
    p.vx += Math.cos(a) * 55 * dt; p.vy += Math.sin(a) * 55 * dt;
    e.spiralA = (e.spiralA || 0) + dt * 2.6;
    if (e.atkT <= 0) {
      e.atkT = .16;
      for (const off of [0, Math.PI * 2 / 3, Math.PI * 4 / 3]) En.eshot(e.x, e.y, e.spiralA + off, 105, 1, { col: '#ff3355' });
    }
    if (G.frame % 5 === 0) Fx.spawn(e.x + G.fR(-50, 50), e.y + G.fR(-40, 40), { n: 1, col: ['#ff3355', '#7a1020'], life: .5, spMin: 10, spMax: 30, glow: true });
  }
};

// ---------- GARBAGE COLLECTOR ----------
Boss.gc = function (e, dt, p) {
  const cx = G.W / 2, cy = (G.H + G.HUD_H) / 2;
  e.atkT -= dt; e.subT -= dt;
  if (e.phase === 1) {
    // sweep the arena; spit 3-spread when aligned with you
    e.x = cx + Math.sin(e.t * .9) * 150;
    e.y = G.HUD_H + 78 + Math.sin(e.t * .5) * 12;
    if (e.atkT <= 0 && Math.abs(e.x - p.x) < 40) {
      e.atkT = 1.4;
      for (const da of [-.28, 0, .28]) En.eshot(e.x, e.y + 14, Math.PI / 2 + da, 130, 1, { col: '#7dff8a' });
      Au.sfx('shootBig');
    }
    if (e.subT <= 0) { e.subT = 5; if (G.run.cur.enemies.filter(x => !x.dead && !x.boss && !x.friendly).length < 3) En.spawnAt('memleak', e.x, e.y + 24, {}); }
  } else if (e.phase === 2) {
    // suction: mark-and-sweep pulls you in while rings pulse out
    e.x = G.lerp(e.x, cx, dt); e.y = G.lerp(e.y, cy - 10, dt);
    const a = G.ang(p.x, p.y, e.x, e.y);
    p.vx += Math.cos(a) * 60 * dt; p.vy += Math.sin(a) * 60 * dt;
    if (e.atkT <= 0) {
      e.atkT = 2.1;
      e.wave = (e.wave || 0) + 1;
      for (let i = 0; i < 12; i++) En.eshot(e.x, e.y, i * G.TAU / 12 + e.wave * .26, 88, 1, { col: '#7dff8a' });
    }
  } else {
    // compaction: telegraphed jump-slams onto your position
    if (e.state !== 'windup' && e.state !== 'air') { e.state = 'windup'; e.tele = .8; e.slamX = p.x; e.slamY = p.y; }
    if (e.state === 'windup') {
      e.tele -= dt;
      e.slamX = G.lerp(e.slamX, p.x, dt * 1.5); e.slamY = G.lerp(e.slamY, p.y, dt * 1.5);
      if (e.tele <= 0) { e.state = 'air'; e.airT = .5; }
    } else if (e.state === 'air') {
      e.airT -= dt;
      e.jumpH = Math.sin((1 - e.airT / .5) * Math.PI) * 50;
      e.x = G.lerp(e.x, e.slamX, dt * 6); e.y = G.lerp(e.y, e.slamY, dt * 6);
      if (e.airT <= 0) {
        e.state = 'windup'; e.tele = 1; e.jumpH = 0;
        G.addShake(8); Au.sfx('boom');
        Fx.ring(e.x, e.y, '#7dff8a', 8, 80, .45);
        if (G.dist(e.x, e.y, p.x, p.y) < 60 && p.iframes <= 0) p.hurt(e.dmg, e);
        for (let i = 0; i < 10; i++) En.eshot(e.x, e.y, i * G.TAU / 10, 105, 1, { col: '#7dff8a' });
        if (e.subT <= 0) { e.subT = 6; En.spawnAt('memleak', e.x + G.fR(-30, 30), e.y, {}); }
      }
    }
  }
};

// ---------- THE SCHEDULER ----------
Boss.scheduler = function (e, dt, p) {
  const cx = G.W / 2, cy = (G.H + G.HUD_H) / 2;
  e.spokeA = (e.spokeA || 0) + dt * (e.phase === 1 ? 1.1 : e.phase === 2 ? 1.7 : (Math.sin(e.t * .5) > 0 ? 2.1 : -2.1));
  e.atkT -= dt; e.subT -= dt;
  const arms = e.phase === 1 ? 4 : 6;
  if (e.atkT <= 0) {
    e.atkT = .34 - e.phase * .04;
    for (let i = 0; i < arms; i++) En.eshot(e.x, e.y, e.spokeA + i * G.TAU / arms, 95, 1, { col: '#ffe24d' });
  }
  if (e.phase === 1) {
    e.x = G.lerp(e.x, cx, dt); e.y = G.lerp(e.y, cy - 20, dt);
  } else {
    // on-beat context switches between quadrant anchors
    if (e.subT <= 0) {
      e.subT = e.phase === 2 ? 3 : 2.2;
      // only consider anchors outside the player's protected circle
      const anchors = [[cx - 110, cy - 60], [cx + 110, cy - 60], [cx - 110, cy + 50], [cx + 110, cy + 50]]
        .filter(([ax, ay]) => G.dist(ax, ay, p.x, p.y) > 85);
      const [nx, ny] = anchors.length ? anchors[G.R(0, anchors.length - 1)] : Boss.ringSpot(p, 95, 160);
      Fx.tp(e.x, e.y, '#ffe24d');
      e.x = nx; e.y = ny;
      Fx.tp(e.x, e.y, '#ffe24d');
      Au.sfx('teleport');
      if (e.phase === 3) { const a = G.ang(e.x, e.y, p.x, p.y); for (const da of [-.2, 0, .2]) En.eshot(e.x, e.y, a + da, 150, 1, { col: '#ffe24d' }); }
    }
  }
};

// ---------- FORK PRIME ----------
Boss.forkprime = function (e, dt, p) {
  e.atkT -= dt; e.subT -= dt;
  const a = G.ang(e.x, e.y, p.x, p.y);
  if (e.phase === 1) {
    e.vx = Math.cos(a) * 26; e.vy = Math.sin(a) * 26;
    e.x += e.vx * dt; e.y += e.vy * dt;
    if (e.atkT <= 0) {
      e.atkT = 1.8;
      En.eshot(e.x, e.y, a, 120, 1, { col: '#ff4da6', fork: .45 });
      Au.sfx('shootBig');
    }
  } else if (e.phase === 2) {
    e.x += Math.cos(a + Math.PI / 2) * 42 * dt + Math.cos(a) * 16 * dt;
    e.y += Math.sin(a + Math.PI / 2) * 42 * dt + Math.sin(a) * 16 * dt;
    if (e.atkT <= 0) {
      e.atkT = 1.6;
      for (const da of [-.3, 0, .3]) En.eshot(e.x, e.y, a + da, 110, 1, { col: '#ff4da6', fork: .5 });
    }
    if (e.subT <= 0) {
      e.subT = 7;
      if (G.run.cur.enemies.filter(x => !x.dead && x.type === 'forker' && !x.friendly).length < 2) {
        En.spawnAt('forker', e.x + G.fR(-30, 30), e.y + G.fR(-20, 20), { champion: true });
        G.toast('IT FORKS', '#ff4da6');
      }
    }
  } else {
    e.x += Math.cos(a) * 34 * dt; e.y += Math.sin(a) * 34 * dt;
    if (e.atkT <= 0) {
      e.atkT = .9;
      for (const da of [-.5, 0, .5]) En.eshot(e.x, e.y, a + da, 125, 1, { col: '#ff4da6', fork: .4 });
    }
    if (e.subT <= 0) {
      e.subT = 6;
      if (G.run.cur.enemies.filter(x => !x.dead && !x.boss && !x.friendly).length < 4) En.spawnAt('forker', e.x, e.y, {});
    }
  }
  e.x = G.clamp(e.x, 70, G.W - 70); e.y = G.clamp(e.y, G.HUD_H + 60, G.H - 60);
};

// ---------- THE AUDITOR ----------
Boss.auditor = function (e, dt, p) {
  const cx = G.W / 2;
  e.atkT -= dt;
  if (e.phase === 1) {
    e.x = G.lerp(e.x, cx, dt); e.y = G.lerp(e.y, G.HUD_H + 80, dt);
    if (e.atkT <= 0) {
      if (e.state !== 'aim') { e.state = 'aim'; e.tele = .85; e.aimA = G.ang(e.x, e.y, p.x, p.y); }
      e.aimA = G.aLerp(e.aimA, G.ang(e.x, e.y, p.x, p.y), dt * 2.2);
      e.tele -= dt;
      if (e.tele <= 0) {
        for (let i = 0; i < 3; i++) En.eshot(e.x, e.y, e.aimA, 190 + i * 30, 1, { col: '#eef4ff' });
        e.atkT = 1.9; e.state = 'idle';
        Au.sfx('shootBig');
      }
    }
  } else if (e.phase === 2) {
    // sweeping arc reviews
    e.x = cx + Math.sin(e.t * .7) * 130;
    e.y = G.HUD_H + 76;
    if (e.atkT <= 0) {
      e.atkT = 2.4;
      e.sweepA = G.ang(e.x, e.y, p.x, p.y) - .8;
      e.sweepN = 11;
    }
    if (e.sweepN > 0) {
      e.sweepT = (e.sweepT || 0) - dt;
      if (e.sweepT <= 0) { e.sweepT = .08; e.sweepN--; En.eshot(e.x, e.y, e.sweepA, 160, 1, { col: '#eef4ff' }); e.sweepA += .16; }
    }
  } else {
    // full audit: columns of rain plus aimed pressure
    e.x = G.lerp(e.x, cx, dt); e.y = G.lerp(e.y, G.HUD_H + 70, dt);
    if (e.atkT <= 0) {
      e.atkT = 2.1;
      for (const off of [-70, -35, 0, 35, 70]) {
        const rx = G.clamp(p.x + off, 50, G.W - 50);
        En.eshot(rx, G.HUD_H + 40, Math.PI / 2, 120, 1, { col: '#eef4ff' });
      }
      En.eshot(e.x, e.y, G.ang(e.x, e.y, p.x, p.y), 170, 1, { col: '#ff5252' });
      G.addShake(3);
    }
  }
};

// ---------- LOAD BALANCER ----------
Boss.balancer = function (e, dt, p) {
  const cx = G.W / 2, cy = (G.H + G.HUD_H) / 2;
  e.balA += dt * (e.phase === 1 ? 1.3 : e.phase === 2 ? 2 : 2.7);
  e.balR = e.phase === 3 ? 60 + Math.sin(e.t * 1.4) * 34 : 60;
  e.x = G.lerp(e.x, cx, dt); e.y = G.lerp(e.y, cy - 10, dt);
  // twin orb positions
  e.orb1 = { x: e.x + Math.cos(e.balA) * e.balR, y: e.y + Math.sin(e.balA) * e.balR * .8 };
  e.orb2 = { x: e.x - Math.cos(e.balA) * e.balR, y: e.y - Math.sin(e.balA) * e.balR * .8 };
  e.atkT -= dt;
  if (e.atkT <= 0) {
    e.atkT = e.phase === 1 ? 1.5 : e.phase === 2 ? 1.1 : .8;
    const src = (e.flip = !e.flip) ? e.orb1 : e.orb2;
    const a = G.ang(src.x, src.y, p.x, p.y);
    if (e.phase === 1) En.eshot(src.x, src.y, a, 130, 1, { col: '#4dc3ff' });
    else for (const da of [-.22, 0, .22]) En.eshot(src.x, src.y, a + da, 120, 1, { col: '#4dc3ff' });
  }
  // the tether hurts (phase 2+): stay off the line between the orbs
  if (e.phase >= 2 && p.iframes <= 0) {
    const dx = e.orb2.x - e.orb1.x, dy = e.orb2.y - e.orb1.y;
    const len2 = dx * dx + dy * dy || 1;
    const tt = G.clamp(((p.x - e.orb1.x) * dx + (p.y - e.orb1.y) * dy) / len2, 0, 1);
    const px = e.orb1.x + dx * tt, py = e.orb1.y + dy * tt;
    if (G.dist(p.x, p.y, px, py) < p.r + 4) p.hurt(1, { x: px, y: py });
  }
};

// ---------- ROOTKIT PRIME ----------
Boss.rootkitprime = function (e, dt, p) {
  e.atkT -= dt; e.subT -= dt;
  if (e.state !== 'burrowed' && e.state !== 'emerging' && e.state !== 'surfaced') { e.state = 'surfaced'; e.surfT = 1.2; }
  if (e.state === 'burrowed') {
    e.burT -= dt;
    // rumble toward the player underground
    const a = G.ang(e.x, e.y, p.x, p.y);
    e.x += Math.cos(a) * 80 * dt; e.y += Math.sin(a) * 80 * dt;
    if (G.frame % 5 === 0) Fx.dust(e.x + G.fR(-10, 10), e.y + G.fR(-6, 6));
    if (e.burT <= 0) {
      e.state = 'emerging'; e.tele = .6;
      [e.emX, e.emY] = Boss.ringSpot(p, 70, 120);
    }
  } else if (e.state === 'emerging') {
    e.tele -= dt;
    e.x = e.emX; e.y = e.emY;
    if (e.tele <= 0) {
      // eruption — then it stays surfaced and vulnerable for a real window
      e.state = 'surfaced'; e.surfT = e.phase === 3 ? 1.1 : 1.5;
      G.addShake(7); Au.sfx('boom');
      Fx.ring(e.x, e.y, '#ff5252', 6, 70, .4);
      const n = e.phase === 3 ? 12 : 8;
      for (let i = 0; i < n; i++) En.eshot(e.x, e.y, i * G.TAU / n, 110, 1, { col: '#ff5252' });
      if (G.dist(e.x, e.y, p.x, p.y) < 55 && p.iframes <= 0) p.hurt(e.dmg, e);
      if (e.phase >= 2) G.run.cur.zones.push({ x: e.x + G.fR(-30, 30), y: e.y + G.fR(-20, 20), r: 10, type: 'mine', t: 20, armT: .9 });
      if (e.phase === 3 && e.subT <= 0) { e.subT = 8; if (G.run.cur.enemies.filter(x => !x.dead && !x.boss && !x.friendly).length < 2) En.spawnAt('rootkit', e.x, e.y, {}); }
    }
  } else {
    // surfaced: scuttles at you, takes damage like anything else
    e.surfT -= dt;
    const a = G.ang(e.x, e.y, p.x, p.y);
    e.x += Math.cos(a) * 55 * dt; e.y += Math.sin(a) * 55 * dt;
    e.x = G.clamp(e.x, 70, G.W - 70); e.y = G.clamp(e.y, G.HUD_H + 60, G.H - 60);
    if (e.atkT <= 0 && e.phase >= 2) { e.atkT = .8; En.eshot(e.x, e.y, a, 140, 1, { col: '#ff5252' }); }
    if (e.surfT <= 0) { e.state = 'burrowed'; e.burT = e.phase === 3 ? .9 : 1.4; Fx.dust(e.x, e.y); }
  }
};

// ---------- LEVIATHAN LEAK ----------
Boss.leviathan = function (e, dt, p) {
  e.atkT -= dt; e.subT -= dt;
  const a = G.ang(e.x, e.y, p.x, p.y);
  if (e.grow < 1.6) e.grow += dt * .015;
  e.r = 32 * e.grow;
  // always seeping
  e.oilT = (e.oilT || 0) - dt;
  if (e.oilT <= 0) { e.oilT = 1.4; En.spillOil(e.x + G.fR(-14, 14), e.y + e.r * .6, 13); }
  if (e.phase === 1) {
    e.vx = Math.cos(a) * 22; e.vy = Math.sin(a) * 22;
    e.x += e.vx * dt; e.y += e.vy * dt;
    if (e.atkT <= 0) {
      e.atkT = 2.2;
      // lob heavy droplets that splash into oil
      for (const da of [-.35, 0, .35]) En.eshot(e.x, e.y, a + da, 85, 1, { col: '#58c9f0', r: 6, oil: true });
      Au.sfx('shootBig');
    }
  } else if (e.phase === 2) {
    e.x += Math.cos(a) * 26 * dt; e.y += Math.sin(a) * 26 * dt;
    if (e.atkT <= 0) {
      e.atkT = 2.4;
      e.wave = (e.wave || 0) + 1;
      for (let i = 0; i < 10; i++) En.eshot(e.x, e.y, i * G.TAU / 10 + e.wave * .3, 92, 1, { col: '#58c9f0' });
    }
    if (e.subT <= 0) {
      e.subT = 5;
      if (G.run.cur.enemies.filter(x => !x.dead && x.type === 'memleak' && !x.friendly).length < 3) En.spawnAt('memleak', e.x + G.fR(-20, 20), e.y, {});
    }
  } else {
    // overflow: pulsing waves, faster crawl
    e.x += Math.cos(a) * 44 * dt; e.y += Math.sin(a) * 44 * dt;
    if (e.atkT <= 0) {
      e.atkT = 1.1;
      e.wave = (e.wave || 0) + 1;
      const n = 8 + (e.wave % 2) * 4;
      for (let i = 0; i < n; i++) En.eshot(e.x, e.y, i * G.TAU / n + e.wave * .4, 78 + (e.wave % 3) * 24, 1, { col: '#58c9f0' });
    }
  }
  e.x = G.clamp(e.x, 70, G.W - 70); e.y = G.clamp(e.y, G.HUD_H + 60, G.H - 60);
};

// shield node hit testing: intercept damage in En.damage via Boss.onHurt? Simpler:
// shots collide with shields in Sh update — but we do it here via a check hook called from En.damage.
// live invulnerability check — derived from hp, never from a cached flag,
// so a stalled AI tick can never leave a boss permanently unkillable
Boss.coreShielded = function (e) {
  return e.bossKind === 'singularity' && Boss.phaseOf(e) === 1 && e.shields.some(s => !s.dead);
};

Boss.interceptShot = function (e, shot) {
  // returns true if a shield absorbed the shot
  if (e.bossKind !== 'singularity') return false;
  for (const s of e.shields) {
    if (s.dead || s.x === undefined) continue;
    if (G.dist(shot.x, shot.y, s.x, s.y) < 11) {
      s.hp -= shot.dmg;
      Fx.hitSpark(s.x, s.y, '#ff3355');
      Au.sfx('hit');
      if (s.hp <= 0) { s.dead = true; Fx.deathBurst(s.x, s.y, '#ff3355'); G.addShake(3); }
      return true;
    }
  }
  if (Boss.coreShielded(e)) { Fx.float(e.x, e.y - e.r - 6, 'SHIELDED', '#8a93a8'); return true; }
  return false;
};

Boss.onHurt = function (e) {
  if ((G.frame % 5) === 0) Au.sfx('bossHurt');
};

Boss.onDeath = function (e) {
  G.run.bossesKilled = (G.run.bossesKilled || 0) + 1;
  G.meta.bossKills++;
  G.run.activeBoss = null;
  G.run.bossDying = { t: 2, x: e.x, y: e.y, kind: e.bossKind };
  // kill fakes & minions
  for (const o of G.run.cur.enemies) if (!o.dead && !o.friendly && !o.boss) En.kill(o, {});
  G.run.cur.eshots.length = 0;
  Au.sfx('bossDie');
  G.addShake(14);
  G.hitstop(.25);
  const p = G.run.player;
  // rewards
  It.spawnPedestal(G.run.cur, e.x - 30, e.y, It.roll('b'), 0);
  It.spawnPickup(G.run.cur, e.x + 30, e.y, 'battery');
  if (p.hasUniq('bossReward')) { p.heal(2); p.addCharge(99); }
  if (p.trinket !== null && G.TRINKETS[p.trinket].fx.uniq === 'bossCharge') p.addCharge(1);
  if (p.trinket !== null && G.TRINKETS[p.trinket].fx.uniq === 'bossLoot') It.randomDrop(G.run.cur, e.x, e.y + 20);
  // overclock dealer (devil deal analog): risk/reward
  if (G.chance(.4 + (G.run.stats.damageTaken ? 0 : .25))) {
    G.run.overclockPending = true;
  }
  // trapdoor or victory handled after dying anim in main.js
  G.Meta.check();
  Au.setTheme((G.run.depth) % 6);
};

// ---------- draw ----------
Boss.drawOne = function (x, e) {
  const K = Boss.KINDS[e.bossKind];
  const spr = Spr.cache[K.spr];
  const breathe = 1 + Math.sin(e.t * 2.2) * .03;
  const hover = Math.sin(e.t * 1.6) * 4;
  // burrowed rootkit: just a moving mound
  if (e.bossKind === 'rootkitprime' && e.state === 'burrowed') {
    x.fillStyle = 'rgba(0,0,0,.4)';
    x.beginPath(); x.ellipse(e.x, e.y, 18, 8, 0, 0, G.TAU); x.fill();
    x.fillStyle = Spr.shade(G.Dg.biome().floor, 1.3);
    x.beginPath(); x.ellipse(e.x, e.y - 2, 14 + Math.sin(e.t * 8) * 2, 6, 0, 0, G.TAU); x.fill();
    return;
  }
  // emerging telegraph
  if (e.bossKind === 'rootkitprime' && e.state === 'emerging') {
    x.strokeStyle = 'rgba(255,82,82,' + (.4 + Math.sin(G.time * 12) * .3) + ')';
    x.lineWidth = 2;
    x.beginPath(); x.arc(e.emX, e.emY, 30, 0, G.TAU); x.stroke();
  }
  // gc slam target
  if (e.bossKind === 'gc' && e.state === 'windup') {
    x.strokeStyle = 'rgba(125,255,138,' + (.35 + Math.sin(G.time * 10) * .25) + ')';
    x.lineWidth = 2;
    x.beginPath(); x.arc(e.slamX, e.slamY, 34, 0, G.TAU); x.stroke();
    x.beginPath(); x.moveTo(e.slamX - 8, e.slamY); x.lineTo(e.slamX + 8, e.slamY); x.moveTo(e.slamX, e.slamY - 8); x.lineTo(e.slamX, e.slamY + 8); x.stroke();
  }
  // auditor aim line
  if (e.bossKind === 'auditor' && e.state === 'aim' && e.aimA !== undefined) {
    x.strokeStyle = 'rgba(255,82,82,.4)'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(e.x, e.y); x.lineTo(e.x + Math.cos(e.aimA) * 320, e.y + Math.sin(e.aimA) * 320); x.stroke();
  }
  // balancer tether + orbs
  if (e.bossKind === 'balancer' && e.orb1) {
    if (e.phase >= 2) {
      x.save();
      x.strokeStyle = 'rgba(77,195,255,' + (.5 + Math.sin(G.time * 9) * .3) + ')';
      x.shadowColor = '#4dc3ff'; x.shadowBlur = 6; x.lineWidth = 2;
      x.beginPath(); x.moveTo(e.orb1.x, e.orb1.y);
      const segs = 6;
      for (let i = 1; i <= segs; i++) x.lineTo(G.lerp(e.orb1.x, e.orb2.x, i / segs) + (i < segs ? G.fR(-4, 4) : 0), G.lerp(e.orb1.y, e.orb2.y, i / segs) + (i < segs ? G.fR(-4, 4) : 0));
      x.stroke();
      x.restore();
    }
    const ob = Spr.cache.bossBalOrb;
    for (const o of [e.orb1, e.orb2]) x.drawImage(ob, o.x - ob.width / 2, o.y - ob.height / 2);
  }
  // shadow
  x.fillStyle = 'rgba(0,0,0,.45)';
  x.beginPath(); x.ellipse(e.x, e.y + e.r + 6, e.r * 1.1, e.r * .35, 0, 0, G.TAU); x.fill();
  x.save();
  x.translate(e.x, e.y + (e.bossKind === 'hallucination' ? hover : 0) - (e.jumpH || 0));
  if (e.flash > 0) { x.globalAlpha = .85; x.filter = 'brightness(3)'; }
  const gs = (e.bossKind === 'leviathan') ? e.grow : 1;
  x.scale(breathe * gs, (2 - breathe) * gs);
  if (e.bossKind === 'scheduler') x.rotate(e.spokeA || 0);
  if (e.bossKind === 'hallucination' && e.phase >= 2) x.globalAlpha = .82 + Math.sin(e.t * 6) * .15;
  x.drawImage(spr, -spr.width / 2, -spr.height / 2);
  x.filter = 'none';
  x.restore();
  x.globalAlpha = 1;
  // compiler gears
  if (e.bossKind === 'compiler') {
    const g = Spr.cache.bossGear;
    for (const side of [-1, 1]) {
      x.save();
      x.translate(e.x + side * 46, e.y + Math.sin(e.t * 2 + side) * 6);
      x.rotate(e.gearA * side);
      x.drawImage(g, -g.width / 2, -g.height / 2);
      x.restore();
    }
  }
  // singularity shields
  if (e.bossKind === 'singularity') {
    const s = Spr.cache.bossShield;
    for (const sh of e.shields) {
      if (sh.dead) continue;
      x.save();
      x.shadowColor = '#ff3355'; x.shadowBlur = 6;
      x.drawImage(s, sh.x - s.width / 2, sh.y - s.height / 2);
      x.restore();
    }
    // event horizon vignette in phase 3
    if (e.phase === 3) {
      const grad = x.createRadialGradient(e.x, e.y, 30, e.x, e.y, 240);
      grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(20,0,8,.45)');
      x.fillStyle = grad; x.fillRect(0, G.HUD_H, G.W, G.H - G.HUD_H);
    }
  }
  // aura particles
  if (G.frame % 4 === 0) Fx.spawn(e.x + G.fR(-e.r, e.r), e.y + G.fR(-e.r, e.r) * .7, { n: 1, col: [K.col], life: .4, spMin: 5, spMax: 20, grav: -30, glow: true });
};

// boss HP bar (drawn by UI)
Boss.drawBar = function (x) {
  const e = G.run.activeBoss;
  if (!e || e.dead) return;
  const w = 300, bx = (G.W - w) / 2, by = G.H - 16;
  x.fillStyle = 'rgba(5,5,10,.7)'; x.fillRect(bx - 2, by - 2, w + 4, 10);
  x.fillStyle = '#2a1218'; x.fillRect(bx, by, w, 6);
  const f = G.clamp(e.hp / e.hpMax, 0, 1);
  x.fillStyle = e.def.col; x.fillRect(bx, by, w * f, 6);
  x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(bx, by, w * f, 2);
  x.font = 'bold 7px monospace'; x.textAlign = 'center';
  x.fillStyle = '#eef4ff'; x.fillText(e.def.name + '  ·  PHASE ' + e.phase, G.W / 2, by - 5);
  x.textAlign = 'left';
};
