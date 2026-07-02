'use strict';
// ============================================================
// enemies.js: 30 archetypes with readable telegraphed attacks
// ============================================================
const En = {};
G.En = En;

// dmg is in half-batteries. tele = telegraph seconds before attacks.
En.DEFS = {
  gnat:      { name: 'Neural Gnat', shape: 'swarm', size: 14, col: '#9a86ff', hp: 3,  spd: 62,  dmg: 1, ai: 'swarm' },
  bug:       { name: 'Bug', shape: 'spider', size: 18, col: '#58f08a', hp: 6,  spd: 46,  dmg: 1, ai: 'lunger', tele: .5 },
  glitch:    { name: 'Glitchling', shape: 'crystal', size: 16, col: '#ff4da6', hp: 5, spd: 0, dmg: 1, ai: 'teleporter', tele: .4 },
  spambot:   { name: 'Spambot', shape: 'walker', size: 22, col: '#ffb84d', hp: 10, spd: 30, dmg: 1, ai: 'shooter3', tele: .55 },
  webspin:   { name: 'Crawler', shape: 'spider', size: 22, col: '#c3cbdd', hp: 9, spd: 55, dmg: 1, ai: 'webber' },
  daemon:    { name: 'Daemon', shape: 'ghost', size: 20, col: '#b76bff', hp: 8, spd: 38, dmg: 1, ai: 'phaser', ghost: true },
  memleak:   { name: 'Memory Leak', shape: 'blob', size: 20, col: '#58c9f0', hp: 8, spd: 26, dmg: 1, ai: 'grower', splits: 2 },
  nullptr:   { name: 'Null Pointer', shape: 'ghost', size: 18, col: '#454d63', hp: 6, spd: 74, dmg: 2, ai: 'stalker', invis: true },
  racecond:  { name: 'Race Condition', shape: 'crystal', size: 18, col: '#ffe24d', hp: 6, spd: 40, dmg: 1, ai: 'dasher', tele: .6 },
  zombie:    { name: 'Zombie Process', shape: 'walker', size: 20, col: '#7dff8a', hp: 8, spd: 24, dmg: 1, ai: 'chaser', revives: true },
  firewall:  { name: 'Firewall', shape: 'cube', size: 26, col: '#ff7a5c', hp: 16, spd: 20, dmg: 1, ai: 'chaser', shielded: true },
  botnet:    { name: 'Botnet Node', shape: 'cube', size: 24, col: '#8a93a8', hp: 14, spd: 12, dmg: 1, ai: 'spawner', tele: .8, tag: 'turret' },
  tracker:   { name: 'Tracker', shape: 'drone', size: 20, col: '#4dc3ff', hp: 7, spd: 42, dmg: 1, ai: 'homer', tele: .5 },
  adware:    { name: 'Adware', shape: 'cube', size: 18, col: '#ff4da6', hp: 5, spd: 50, dmg: 1, ai: 'chaser', popup: true },
  wormhead:  { name: 'Worm', shape: 'worm', size: 20, col: '#e0a458', hp: 12, spd: 58, dmg: 1, ai: 'worm' },
  trojan:    { name: 'Trojan', shape: 'cube', size: 20, col: '#c9a23d', hp: 10, spd: 55, dmg: 2, ai: 'mimic' },
  ransom:    { name: 'Ransomware', shape: 'ghost', size: 20, col: '#ff5252', hp: 9, spd: 68, dmg: 0, ai: 'thief' },
  looper:    { name: 'Looper', shape: 'orb', size: 18, col: '#7fd4ff', hp: 7, spd: 60, dmg: 1, ai: 'orbiter', tele: .5 },
  smasher:   { name: 'Stack Smasher', shape: 'cube', size: 28, col: '#a06bff', hp: 18, spd: 18, dmg: 2, ai: 'slammer', tele: .8 },
  forker:    { name: 'Forker', shape: 'blob', size: 22, col: '#58f08a', hp: 10, spd: 34, dmg: 1, ai: 'chaser', forkDeath: true },
  phisher:   { name: 'Phisher', shape: 'eye', size: 20, col: '#4dc3ff', hp: 8, spd: 26, dmg: 1, ai: 'hooker', tele: .7 },
  miner:     { name: 'Cryptominer', shape: 'walker', size: 20, col: '#ffe24d', hp: 8, spd: 44, dmg: 1, ai: 'minelayer' },
  watchdog:  { name: 'Watchdog', shape: 'walker', size: 22, col: '#ff7a5c', hp: 10, spd: 0, dmg: 2, ai: 'watcher', tele: .5 },
  pingflood: { name: 'Ping Flooder', shape: 'turret', size: 22, col: '#4df3ff', hp: 12, spd: 0, dmg: 1, ai: 'radial', tele: .7, tag: 'turret' },
  rootkit:   { name: 'Rootkit', shape: 'spider', size: 20, col: '#571f2e', hp: 9, spd: 70, dmg: 2, ai: 'burrower', tele: .5 },
  captcha:   { name: 'CAPTCHA', shape: 'crystal', size: 22, col: '#eef4ff', hp: 10, spd: 22, dmg: 1, ai: 'toggler' },
  cryptojack:{ name: 'Cryptojacker', shape: 'drone', size: 18, col: '#c9a23d', hp: 6, spd: 78, dmg: 1, ai: 'swooper', tele: .4 },
  bitrot:    { name: 'Bit Rot', shape: 'turret', size: 20, col: '#7dff8a', hp: 9, spd: 0, dmg: 1, ai: 'sniper', tele: .6, tag: 'turret' },
  deprec:    { name: 'Deprecation Ghost', shape: 'ghost', size: 24, col: '#8a93a8', hp: 16, spd: 16, dmg: 1, ai: 'chaser', ghost: true, deathRing: true },
  eyecon:    { name: 'Panopticon Eye', shape: 'eye', size: 24, col: '#ff4da6', hp: 11, spd: 0, dmg: 1, ai: 'beamer', tele: .9 },
};

// spawn tables per biome index (weights)
En.TABLES = [
  ['gnat', 'gnat', 'bug', 'bug', 'spambot', 'adware', 'trojan', 'webspin', 'memleak', 'racecond'],
  ['bug', 'zombie', 'zombie', 'memleak', 'glitch', 'daemon', 'bitrot', 'wormhead', 'forker', 'deprec'],
  ['webspin', 'tracker', 'looper', 'memleak', 'phisher', 'pingflood', 'nullptr', 'daemon', 'gnat', 'cryptojack'],
  ['racecond', 'smasher', 'firewall', 'watchdog', 'botnet', 'miner', 'tracker', 'adware', 'rootkit', 'spambot'],
  ['looper', 'glitch', 'daemon', 'captcha', 'eyecon', 'tracker', 'nullptr', 'deprec', 'gnat', 'phisher'],
  ['rootkit', 'firewall', 'smasher', 'watchdog', 'ransom', 'eyecon', 'botnet', 'daemon', 'cryptojack', 'wormhead'],
];

// ---------- spawning ----------
En.mk = function (type, x, y) {
  const d = En.DEFS[type];
  const e = {
    type, def: d, x, y, vx: 0, vy: 0,
    hp: d.hp, hpMax: d.hp, r: d.size / 2,
    dmg: d.dmg, spd: d.spd,
    state: 'idle', t: G.fR(0, 1), tele: 0, cd: G.fR(.5, 1.5),
    flash: 0, dead: false, friendly: false, boss: false,
    status: {}, kx: 0, ky: 0, anim: G.fR(0, 9),
    spawnProt: .45, grow: 1, segs: null, home: { x, y },
    champion: null, hurtYou: false, sticky: false, marked: false,
  };
  // depth scaling
  const depth = G.run ? G.run.depth : 1;
  const sc = 1 + (depth - 1) * .22 + (G.run && G.run.endless ? G.run.endlessLoop * .5 : 0);
  e.hp = Math.round(e.hp * sc); e.hpMax = e.hp;
  // active mod pack multipliers
  const pf = G.run && G.run.packFx;
  if (pf) {
    const o = pf.enemies[type];
    e.hp = Math.max(1, Math.round(e.hp * pf.g.enemyHp * (o ? o.hp : 1)));
    e.hpMax = e.hp;
    e.spd *= pf.g.enemySpd * (o ? o.spd : 1);
    e.dmg = Math.max(0, e.dmg + pf.g.enemyDmg);
    if (o && o.dmg !== null && o.dmg !== undefined) e.dmg = o.dmg;
  }
  return e;
};
En.spawnAt = function (type, x, y, opts) {
  const room = G.run.cur;
  // never spawn inside the player's protected bubble — push out radially
  const p = G.run.player;
  const MIN = (opts && opts.minPlayerDist !== undefined) ? opts.minPlayerDist : 70;
  if (p && MIN > 0) {
    const d = G.dist(x, y, p.x, p.y);
    if (d < MIN) {
      const a = d > .001 ? G.ang(p.x, p.y, x, y) : G.fR(0, G.TAU);
      x = G.clamp(p.x + Math.cos(a) * MIN, 50, G.W - 50);
      y = G.clamp(p.y + Math.sin(a) * MIN, G.HUD_H + 50, G.H - 50);
      if (G.dist(x, y, p.x, p.y) < MIN * .9) { // corner-clamped back in? take the farthest ring spot
        let bx = x, by = y, bd = G.dist(x, y, p.x, p.y);
        for (let i = 0; i < 10; i++) {
          const aa = i * G.TAU / 10;
          const cx2 = G.clamp(p.x + Math.cos(aa) * MIN, 50, G.W - 50);
          const cy2 = G.clamp(p.y + Math.sin(aa) * MIN, G.HUD_H + 50, G.H - 50);
          const dd = G.dist(cx2, cy2, p.x, p.y);
          if (dd > bd) { bd = dd; bx = cx2; by = cy2; }
        }
        x = bx; y = by;
      }
    }
  }
  const e = En.mk(type, x, y);
  if (opts && opts.champion || (!opts && G.chance(.08 + G.run.depth * .012))) En.champify(e);
  if (type === 'wormhead') {
    e.segs = [];
    for (let i = 0; i < 4; i++) e.segs.push({ x: x - (i + 1) * 12, y, hp: 4 });
  }
  room.enemies.push(e);
  Fx.tp(x, y, '#ff5252');
  return e;
};
En.champify = function (e) {
  const kind = G.pick(['crimson', 'volt', 'granite']);
  e.champion = kind;
  if (kind === 'crimson') { e.hp = e.hpMax = Math.round(e.hp * 1.8); e.dmg++; }
  if (kind === 'volt') { e.spd *= 1.5; }
  if (kind === 'granite') { e.hp = e.hpMax = Math.round(e.hp * 2.6); e.spd *= .7; }
};
En.populate = function (room, depth) {
  const table = En.TABLES[(depth - 1) % 6];
  const n = G.R(3, 5 + Math.min(4, Math.floor(depth * .8)));
  const spots = G.Dg.freeSpots(room, n);
  for (let i = 0; i < Math.min(n, spots.length); i++) {
    const t = G.pick(table);
    const e = En.mk(t, spots[i][0], spots[i][1]);
    if (G.chance(.08 + depth * .012)) En.champify(e);
    if (t === 'wormhead') { e.segs = []; for (let s = 0; s < 4; s++) e.segs.push({ x: e.x - (s + 1) * 12, y: e.y, hp: 4 }); }
    if (t === 'trojan') { e.state = 'hidden'; }
    room.enemies.push(e);
  }
};

// friendly units
En.spawnAlly = function (x, y) {
  const room = G.run.cur;
  const e = En.mk('gnat', x, y);
  e.friendly = true; e.hp = e.hpMax = 6; e.allyT = 20;
  room.enemies.push(e);
  Fx.tp(x, y, '#58f08a');
};
En.spawnTurret = function (x, y, dur) {
  const room = G.run.cur;
  const e = En.mk('pingflood', x, y);
  e.friendly = true; e.allyT = dur; e.turret = true;
  room.enemies.push(e);
  Fx.tp(x, y, '#4df3ff');
};
En.spawnSpider = function (x, y) {
  const room = G.run.cur;
  const e = En.mk('webspin', x, y);
  e.friendly = true; e.isSpider = true; e.allyT = 20; e.hp = e.hpMax = 10; e.spawnProt = .2;
  room.enemies.push(e);
  Fx.tp(x, y, '#58f08a');
  return e;
};
// ---------- elemental zones ----------
En.inZone = function (x, y, type) {
  for (const z of G.run.cur.zones) if (z.type === type && G.dist(x, y, z.x, z.y) < z.r + 4) return true;
  return false;
};
En.spillOil = function (x, y, r) {
  const zones = G.run.cur.zones;
  if (zones.filter(z => z.type === 'oil' || z.type === 'fire').length > 24) return;
  zones.push({ x, y, r: r || 13, type: 'oil', t: 30 });
};
En.igniteZone = function (z) {
  if (z.type !== 'oil') return;
  z.type = 'fire'; z.t = 4; z.fireAcc = 0;
  Fx.spawn(z.x, z.y, { n: 10, col: ['#ff7a5c', '#ffb84d', '#fff'], life: .5, spMin: 20, spMax: 80, grav: -80, glow: true });
  Au.sfx('boom');
};
En.spawnDecoy = function (x, y) {
  const room = G.run.cur;
  const e = En.mk('captcha', x, y);
  e.friendly = true; e.decoy = true; e.allyT = 10; e.hp = e.hpMax = 15;
  room.enemies.push(e);
};
En.charm = function (e) {
  if (e.boss) return;
  e.friendly = true; e.allyT = 15;
  Fx.spawn(e.x, e.y, { n: 6, col: ['#ff4da6', '#fff'], life: .5, grav: -60 });
};
En.transformAll = function (stronger) {
  const room = G.run.cur;
  const table = En.TABLES[(G.run.depth - 1 + (stronger ? 1 : 0)) % 6];
  const olds = room.enemies.filter(e => !e.dead && !e.boss && !e.friendly);
  for (const e of olds) {
    e.dead = true;
    En.spawnAt(G.pick(table), e.x, e.y, {});
  }
};

// ---------- status ----------
En.status = function (e, k, dur) {
  if (e.boss && (k === 'fear' || k === 'charm' || k === 'frozen') ) dur *= .35;
  e.status[k] = Math.max(e.status[k] || 0, dur);
};
En.statusNear = function (x, y, r, k, dur) {
  for (const e of G.run.cur.enemies) {
    if (e.dead || e.friendly) continue;
    if (G.dist(x, y, e.x, e.y) < r) En.status(e, k, dur);
  }
  Fx.ring(x, y, k === 'poison' ? '#58f08a' : k === 'fear' ? '#b76bff' : '#7fd4ff', 8, r, .4);
};

// ---------- damage & death ----------
En.damage = function (e, dmg, ctx) {
  if (e.dead || e.spawnProt > 0) return;
  ctx = ctx || {};
  // boss shield nodes / invulnerable core
  if (e.boss) {
    if (ctx.shot && G.Boss.interceptShot(e, ctx.shot)) return;
    if (e.invulnCore) { Fx.float(e.x, e.y - e.r - 6, 'SHIELDED', '#8a93a8'); return; }
  }
  // firewall: shielded from the front
  if (e.def.shielded && ctx.shot) {
    const a = G.ang(e.x, e.y, ctx.shot.x, ctx.shot.y);
    const facing = G.ang(e.x, e.y, G.run.player.x, G.run.player.y);
    let d = Math.abs(a - facing); while (d > Math.PI) d = Math.abs(d - G.TAU);
    if (d < 1.1) { Fx.float(e.x, e.y - 10, 'BLOCKED', '#8a93a8'); Fx.hitSpark(ctx.shot.x, ctx.shot.y, '#ff7a5c'); return; }
  }
  // captcha toggling invulnerability
  if (e.type === 'captcha' && e.state === 'locked') { Fx.float(e.x, e.y - 10, 'VERIFY', '#8a93a8'); return; }
  if (e.state === 'burrowed') return;
  e.hp -= dmg;
  e.flash = .09;
  G.hitstop(.015);
  Fx.hitSpark(e.x + G.fR(-4, 4), e.y + G.fR(-4, 4), ctx.crit ? '#ffe24d' : '#fff');
  Fx.float(e.x, e.y - e.r - 4, (ctx.crit ? '!' : '') + (Math.round(dmg * 10) / 10), ctx.crit ? '#ffe24d' : '#eef4ff');
  Au.sfx('hit');
  // water conducts electricity: arc to everything standing in water
  if (ctx.electric && !ctx.conducted && En.inZone(e.x, e.y, 'water')) {
    Fx.ring(e.x, e.y, '#4dc3ff', 6, 55, .3);
    for (const o of G.run.cur.enemies) {
      if (o === e || o.dead || o.friendly) continue;
      if (En.inZone(o.x, o.y, 'water')) {
        G.Sh.bolts.push({ x1: e.x, y1: e.y, x2: o.x, y2: o.y, t: .15 });
        En.damage(o, dmg * .6, { conducted: true });
      }
    }
  }
  if (e.boss) G.Boss.onHurt(e);
  if (e.hp <= 0) En.kill(e, ctx);
};

En.kill = function (e, ctx) {
  if (e.dead) return;
  // zombie revive
  if (e.def.revives && !e.revived) {
    e.revived = true; e.state = 'downed'; e.downT = 3; e.hp = 1;
    Fx.deathBurst(e.x, e.y, e.def.col);
    return;
  }
  e.dead = true;
  G.meta.kills++; G.run.stats.kills = (G.run.stats.kills || 0) + 1;
  Fx.deathBurst(e.x, e.y, e.def.col, e.r > 12);
  G.addShake(e.r > 12 ? 4 : 2);
  Au.sfx('kill');
  G.hitstop(.03);
  // on-death behaviors
  if (e.def.splits && e.grow >= 1 && !e.isSplit) {
    for (let i = 0; i < e.def.splits; i++) {
      const c = En.mk(e.type, e.x + G.fR(-8, 8), e.y + G.fR(-8, 8));
      c.isSplit = true; c.hp = c.hpMax = Math.max(2, Math.round(e.hpMax * .4)); c.r *= .65; c.spawnProt = .3;
      G.run.cur.enemies.push(c);
    }
  }
  if (e.def.forkDeath && !e.friendly) {
    En.spawnAt('gnat', e.x - 8, e.y, {}); En.spawnAt('gnat', e.x + 8, e.y, {});
  }
  if (e.def.popup && !e.friendly) {
    for (let i = 0; i < 4; i++) En.eshot(e.x, e.y, i * G.TAU / 4 + .78, 120, 1);
  }
  if (e.def.deathRing && !e.friendly) {
    for (let i = 0; i < 8; i++) En.eshot(e.x, e.y, i * G.TAU / 8, 90, 1);
  }
  if (e.status.burn) En.statusNear(e.x, e.y, 40, 'burn', 2);
  // shatter doctrine: frozen enemies explode (safely for you)
  if (!e.friendly && e.status.frozen && G.run.player.hasUniq('freezeExplode')) {
    Sh.explodeAt(e.x, e.y, 42, G.run.player.stats.dmg * 2, true, true);
  }
  // leaky coolant: your kills spill flammable oil
  if (!e.friendly && G.run.player.hasUniq('oilTrails')) En.spillOil(e.x, e.y, 14);
  if (!e.friendly) {
    // marks
    if (G.run.player.hasUniq('markKill')) for (const o of G.run.cur.enemies) if (!o.dead && G.dist(e.x, e.y, o.x, o.y) < 70) o.marked = true;
    // drops
    const luck = G.run.player.stats.luck;
    let dropP = (.07 + luck * .012) * (G.run.packFx ? G.run.packFx.g.dropRate : 1);
    if (e.champion && G.run.player.hasUniq('champLoot')) dropP = 1;
    else if (e.champion) dropP += .25;
    if (G.rng() < dropP) It.randomDrop(G.run.cur, e.x, e.y);
    if (G.run.player.hasUniq('midasTouch') && G.rng() < .12) It.spawnPickup(G.run.cur, e.x, e.y, 'credit');
    It.procEv('kill', { x: e.x, y: e.y });
    G.Meta.check();
  }
  if (e.boss) G.Boss.onDeath(e);
};

// ---------- enemy shots ----------
En.eshot = function (x, y, ang, spd, dmg, opts) {
  opts = opts || {};
  if (G.run.cur.eshots.length > 90) return;
  const slow = G.run.player.hasUniq('slowBullets') ? .8 : 1;
  G.run.cur.eshots.push({
    x, y, vx: Math.cos(ang) * spd * slow, vy: Math.sin(ang) * spd * slow,
    r: opts.r || 4, dmg: dmg || 1, t: 0, life: opts.life || 4,
    col: opts.col || '#ff5252', homing: opts.homing || 0, hook: opts.hook || false,
    from: opts.from, forkT: opts.fork, oil: opts.oil || false,
  });
};

// ---------- AI ----------
const AI = {};
AI.swarm = (e, dt, p) => {
  e.t += dt;
  const a = G.ang(e.x, e.y, p.x, p.y) + Math.sin(e.t * 3 + e.anim) * .8;
  e.vx = G.lerp(e.vx, Math.cos(a) * e.spd, dt * 3);
  e.vy = G.lerp(e.vy, Math.sin(a) * e.spd, dt * 3);
};
AI.chaser = (e, dt, p) => {
  const a = G.ang(e.x, e.y, p.x, p.y);
  e.vx = G.lerp(e.vx, Math.cos(a) * e.spd, dt * 2.2);
  e.vy = G.lerp(e.vy, Math.sin(a) * e.spd, dt * 2.2);
};
AI.lunger = (e, dt, p) => {
  e.cd -= dt;
  if (e.state === 'idle') {
    AI.wander(e, dt);
    if (e.cd <= 0 && G.dist(e.x, e.y, p.x, p.y) < 120) { e.state = 'tele'; e.tele = e.def.tele; }
  } else if (e.state === 'tele') {
    e.vx *= .8; e.vy *= .8;
    e.tele -= dt;
    if (e.tele <= 0) {
      const a = G.ang(e.x, e.y, p.x, p.y);
      e.vx = Math.cos(a) * e.spd * 4.2; e.vy = Math.sin(a) * e.spd * 4.2;
      e.state = 'lunge'; e.cd = G.fR(1.4, 2.4);
    }
  } else { e.vx *= .95; e.vy *= .95; if (Math.hypot(e.vx, e.vy) < 30) e.state = 'idle'; }
};
AI.wander = (e, dt) => {
  e.t += dt;
  if (!e.wa || e.t > 2) { e.t = 0; e.wa = G.fR(0, G.TAU); }
  e.vx = G.lerp(e.vx, Math.cos(e.wa) * e.spd * .5, dt * 2);
  e.vy = G.lerp(e.vy, Math.sin(e.wa) * e.spd * .5, dt * 2);
};
AI.teleporter = (e, dt, p) => {
  e.cd -= dt;
  e.vx = e.vy = 0;
  if (e.cd <= 0) {
    if (e.state !== 'tele') { e.state = 'tele'; e.tele = e.def.tele; }
    e.tele -= dt;
    if (e.tele <= 0) {
      Fx.tp(e.x, e.y, '#ff4da6');
      const s = G.Dg.freeSpots(G.run.cur, 1);
      if (s.length) { e.x = s[0][0]; e.y = s[0][1]; }
      Fx.tp(e.x, e.y, '#ff4da6');
      if (!e.status.mute) En.eshot(e.x, e.y, G.ang(e.x, e.y, p.x, p.y), 150, 1);
      e.cd = G.fR(1.6, 2.6); e.state = 'idle';
    }
  }
};
AI.shooter3 = (e, dt, p) => {
  e.cd -= dt;
  if (e.state === 'idle') {
    AI.chaser(e, dt, p);
    if (e.cd <= 0 && G.dist(e.x, e.y, p.x, p.y) < 190) { e.state = 'tele'; e.tele = e.def.tele; }
  } else {
    e.vx *= .8; e.vy *= .8;
    e.tele -= dt;
    if (e.tele <= 0) {
      if (!e.status.mute) { const a = G.ang(e.x, e.y, p.x, p.y); for (const da of [-.3, 0, .3]) En.eshot(e.x, e.y, a + da, 130, 1); }
      e.cd = G.fR(1.8, 2.8); e.state = 'idle';
    }
  }
};
AI.webber = (e, dt, p) => {
  AI.wander(e, dt);
  e.cd -= dt;
  if (e.cd <= 0) {
    e.cd = G.fR(1.5, 3);
    G.run.cur.zones.push({ x: e.x, y: e.y, r: 16, type: 'web', t: 8 });
  }
  if (G.dist(e.x, e.y, p.x, p.y) < 100) AI.chaser(e, dt, p);
};
AI.phaser = (e, dt, p) => {
  const a = G.ang(e.x, e.y, p.x, p.y);
  const pulse = .5 + Math.sin(G.time * 2 + e.anim) * .5;
  e.vx = Math.cos(a) * e.spd * (0.4 + pulse);
  e.vy = Math.sin(a) * e.spd * (0.4 + pulse);
};
AI.grower = (e, dt, p) => {
  AI.chaser(e, dt, p);
  if (e.grow < 1.8 && !e.isSplit) { e.grow += dt * .05; e.r = e.def.size / 2 * e.grow; e.hpMax += dt * .5; e.hp += dt * .5; }
  // memory leaks leak: flammable coolant trail
  if (!e.friendly) { e.oilT = (e.oilT || G.fR(.5, 1.5)) - dt; if (e.oilT <= 0) { e.oilT = 1.8; En.spillOil(e.x, e.y + 4, 11); } }
};
AI.stalker = (e, dt, p) => {
  AI.chaser(e, dt, p);
  e.alpha = G.clamp(1 - G.dist(e.x, e.y, p.x, p.y) / 130, 0.04, 1);
  if (G.run.player.hasUniq('nightVision')) e.alpha = Math.max(e.alpha, .5);
};
AI.dasher = (e, dt, p) => {
  e.cd -= dt;
  if (e.state === 'idle') {
    AI.wander(e, dt);
    if (e.cd <= 0) { e.state = 'tele'; e.tele = e.def.tele; e.dashA = G.ang(e.x, e.y, p.x, p.y); }
  } else if (e.state === 'tele') {
    e.vx = e.vy = 0;
    e.dashA = G.aLerp(e.dashA, G.ang(e.x, e.y, p.x, p.y), dt * 2);
    e.tele -= dt;
    if (e.tele <= 0) { e.state = 'dash'; e.dashT = .5; }
  } else {
    e.dashT -= dt;
    e.vx = Math.cos(e.dashA) * 300; e.vy = Math.sin(e.dashA) * 300;
    if (e.dashT <= 0) { e.state = 'idle'; e.cd = G.fR(1.2, 2.2); }
  }
};
AI.spawner = (e, dt, p) => {
  e.cd -= dt;
  e.vx = e.vy = 0;
  if (e.cd <= 0) {
    if (e.state !== 'tele') { e.state = 'tele'; e.tele = e.def.tele; }
    e.tele -= dt;
    if (e.tele <= 0) {
      const n = G.run.cur.enemies.filter(x => !x.dead && !x.friendly).length;
      if (n < 12) En.spawnAt('gnat', e.x + G.fR(-16, 16), e.y + G.fR(-16, 16), {});
      e.cd = G.fR(2.5, 4); e.state = 'idle';
    }
  }
};
AI.homer = (e, dt, p) => {
  AI.wander(e, dt);
  e.cd -= dt;
  if (e.cd <= 0) {
    if (e.state !== 'tele') { e.state = 'tele'; e.tele = e.def.tele; }
    e.tele -= dt;
    e.vx *= .7; e.vy *= .7;
    if (e.tele <= 0) {
      if (!e.status.mute) En.eshot(e.x, e.y, G.ang(e.x, e.y, p.x, p.y), 90, 1, { homing: 2, col: '#4dc3ff', life: 3 });
      e.cd = G.fR(2.2, 3.4); e.state = 'idle';
    }
  }
};
AI.worm = (e, dt, p) => {
  AI.chaser(e, dt, p);
  // segments follow
  let lead = e;
  for (const s of e.segs) {
    const d = G.dist(s.x, s.y, lead.x, lead.y);
    if (d > 12) { const a = G.ang(s.x, s.y, lead.x, lead.y); s.x += Math.cos(a) * (d - 12); s.y += Math.sin(a) * (d - 12); }
    lead = s;
  }
};
AI.mimic = (e, dt, p) => {
  if (e.state === 'hidden') {
    e.vx = e.vy = 0;
    if (G.dist(e.x, e.y, p.x, p.y) < 40) {
      e.state = 'idle'; e.spawnProt = 0;
      Fx.deathBurst(e.x, e.y, '#c9a23d');
      G.toast('IT WAS A TROJAN!', '#ff5252'); Au.sfx('error'); G.addShake(3);
    }
  } else AI.chaser(e, dt, p);
};
AI.thief = (e, dt, p) => {
  if (!e.stole) {
    AI.chaser(e, dt, p);
    if (G.dist(e.x, e.y, p.x, p.y) < e.r + p.r + 2 && p.coins > 0) {
      const take = Math.min(p.coins, 5); p.coins -= take; e.stole = take;
      Fx.float(p.x, p.y - 14, '-' + take + '¢', '#ff5252'); Au.sfx('error');
    }
  } else {
    // flee
    const a = G.ang(p.x, p.y, e.x, e.y);
    e.vx = G.lerp(e.vx, Math.cos(a) * e.spd, dt * 3);
    e.vy = G.lerp(e.vy, Math.sin(a) * e.spd, dt * 3);
  }
};
AI.orbiter = (e, dt, p) => {
  e.orbA = (e.orbA || G.fR(0, G.TAU)) + dt * 1.4;
  const cx = G.W / 2, cy = (G.H + G.HUD_H) / 2;
  const tx = cx + Math.cos(e.orbA) * 130, ty = cy + Math.sin(e.orbA) * 80;
  e.vx = (tx - e.x) * 3; e.vy = (ty - e.y) * 3;
  e.cd -= dt;
  if (e.cd <= 0 && !e.status.mute) {
    e.cd = G.fR(2, 3.2);
    for (let i = 0; i < 6; i++) En.eshot(e.x, e.y, e.orbA + i * G.TAU / 6, 110, 1);
  }
};
AI.slammer = (e, dt, p) => {
  e.cd -= dt;
  if (e.state === 'idle') {
    AI.chaser(e, dt, p);
    if (e.cd <= 0 && G.dist(e.x, e.y, p.x, p.y) < 90) { e.state = 'tele'; e.tele = e.def.tele; }
  } else if (e.state === 'tele') {
    e.vx = e.vy = 0; e.jumpH = (e.jumpH || 0) + dt * 60;
    e.tele -= dt;
    if (e.tele <= 0) {
      e.state = 'idle'; e.cd = G.fR(2, 3); e.jumpH = 0;
      G.addShake(6); Au.sfx('boom');
      Fx.ring(e.x, e.y, '#a06bff', 6, 70, .4);
      if (G.dist(e.x, e.y, p.x, p.y) < 70 && p.iframes <= 0) p.hurt(e.dmg, e);
      for (let i = 0; i < 8; i++) En.eshot(e.x, e.y, i * G.TAU / 8, 100, 1);
    }
  }
};
AI.hooker = (e, dt, p) => {
  AI.wander(e, dt);
  e.cd -= dt;
  if (e.cd <= 0) {
    if (e.state !== 'tele') { e.state = 'tele'; e.tele = e.def.tele; }
    e.vx *= .6; e.vy *= .6;
    e.tele -= dt;
    if (e.tele <= 0) {
      if (!e.status.mute) En.eshot(e.x, e.y, G.ang(e.x, e.y, p.x, p.y), 200, 1, { hook: true, col: '#4dc3ff', r: 5, from: e });
      e.cd = G.fR(2.5, 4); e.state = 'idle';
    }
  }
};
AI.minelayer = (e, dt, p) => {
  AI.wander(e, dt);
  e.cd -= dt;
  if (e.cd <= 0) {
    e.cd = G.fR(2.5, 4);
    G.run.cur.zones.push({ x: e.x, y: e.y, r: 10, type: 'mine', t: 30, armT: .8 });
  }
};
AI.watcher = (e, dt, p) => {
  if (e.state === 'idle') {
    e.vx = e.vy = 0;
    // line of sight
    if (Math.abs(e.x - p.x) < 20 || Math.abs(e.y - p.y) < 20) { e.state = 'tele'; e.tele = e.def.tele; }
  } else if (e.state === 'tele') {
    e.tele -= dt;
    if (e.tele <= 0) { e.state = 'charge'; e.chargeT = 1; e.dashA = G.ang(e.x, e.y, p.x, p.y); }
  } else {
    e.chargeT -= dt;
    e.vx = Math.cos(e.dashA) * 260; e.vy = Math.sin(e.dashA) * 260;
    if (e.chargeT <= 0) e.state = 'idle';
  }
};
AI.radial = (e, dt, p) => {
  e.vx = e.vy = 0;
  if (e.friendly) { // ally turret fires at enemies
    e.cd -= dt;
    if (e.cd <= 0) {
      e.cd = .5;
      const es = G.run.cur.enemies.filter(x => !x.dead && !x.friendly);
      if (es.length) { const t = G.pick(es); Sh.mkShot(e.x, e.y, G.ang(e.x, e.y, t.x, t.y), { dmg: G.run.player.stats.dmg * .7, from: 'fam', noOrbit: true, noSplit: true, col: '#4df3ff' }); }
    }
    return;
  }
  e.cd -= dt;
  if (e.cd <= 0) {
    if (e.state !== 'tele') { e.state = 'tele'; e.tele = e.def.tele; }
    e.tele -= dt;
    if (e.tele <= 0) {
      if (!e.status.mute) { e.wave = (e.wave || 0) + 1; for (let i = 0; i < 10; i++) En.eshot(e.x, e.y, i * G.TAU / 10 + e.wave * .3, 95, 1); }
      e.cd = 2.6; e.state = 'idle';
    }
  }
};
AI.burrower = (e, dt, p) => {
  e.cd -= dt;
  if (e.state === 'idle') {
    AI.wander(e, dt);
    if (e.cd <= 0) { e.state = 'burrowed'; e.burT = 1.2; Fx.dust(e.x, e.y); }
  } else if (e.state === 'burrowed') {
    e.burT -= dt;
    // move underground toward player
    const a = G.ang(e.x, e.y, p.x, p.y);
    e.x += Math.cos(a) * e.spd * dt; e.y += Math.sin(a) * e.spd * dt;
    if (G.frame % 6 === 0) Fx.dust(e.x, e.y);
    if (e.burT <= 0) { e.state = 'tele'; e.tele = e.def.tele; }
  } else if (e.state === 'tele') {
    e.tele -= dt; e.vx = e.vy = 0;
    if (e.tele <= 0) {
      e.state = 'idle'; e.cd = G.fR(2, 3.5);
      Fx.ring(e.x, e.y, '#ff5252', 4, 30, .3); G.addShake(2);
      if (G.dist(e.x, e.y, p.x, p.y) < 30 && p.iframes <= 0) p.hurt(e.dmg, e);
    }
  }
};
AI.toggler = (e, dt, p) => {
  AI.chaser(e, dt, p);
  e.t += dt;
  const phase = Math.floor(e.t / 2.5) % 2;
  e.state = phase === 0 ? 'idle' : 'locked';
};
AI.swooper = (e, dt, p) => {
  e.cd -= dt;
  if (e.state === 'idle') {
    AI.swarm(e, dt, p);
    if (e.cd <= 0 && G.dist(e.x, e.y, p.x, p.y) < 140) { e.state = 'tele'; e.tele = e.def.tele; }
  } else if (e.state === 'tele') {
    e.vx *= .8; e.vy *= .8; e.tele -= dt;
    if (e.tele <= 0) { e.state = 'swoop'; e.dashA = G.ang(e.x, e.y, p.x, p.y); e.dashT = .45; }
  } else {
    e.dashT -= dt;
    e.vx = Math.cos(e.dashA) * 260; e.vy = Math.sin(e.dashA) * 260;
    if (G.dist(e.x, e.y, p.x, p.y) < e.r + p.r && p.active && p.active.charge > 0) { p.active.charge = Math.max(0, p.active.charge - 1); Fx.float(p.x, p.y - 14, '-CHARGE', '#ffb84d'); }
    if (e.dashT <= 0) { e.state = 'idle'; e.cd = G.fR(1.8, 3); }
  }
};
AI.sniper = (e, dt, p) => {
  e.vx = e.vy = 0;
  e.cd -= dt;
  if (e.cd <= 0) {
    if (e.state !== 'tele') { e.state = 'tele'; e.tele = e.def.tele; e.aimA = G.ang(e.x, e.y, p.x, p.y); }
    e.aimA = G.aLerp(e.aimA, G.ang(e.x, e.y, p.x, p.y), dt * 3);
    e.tele -= dt;
    if (e.tele <= 0) {
      if (!e.status.mute) { En.eshot(e.x, e.y, e.aimA, 210, 1); setTimeout && En.eshot(e.x, e.y, e.aimA, 170, 1); }
      e.cd = G.fR(2, 3.2); e.state = 'idle';
    }
  }
};
AI.beamer = (e, dt, p) => {
  e.vx = e.vy = 0;
  e.cd -= dt;
  if (e.cd <= 0) {
    if (e.state !== 'tele') { e.state = 'tele'; e.tele = e.def.tele; e.aimA = G.ang(e.x, e.y, p.x, p.y); }
    e.tele -= dt;
    if (e.tele <= 0) {
      if (!e.status.mute) for (let i = 0; i < 12; i++) En.eshot(e.x, e.y, e.aimA, 140 + i * 22, 1, { r: 3 });
      e.cd = G.fR(2.8, 4); e.state = 'idle';
    }
  }
};

AI.boss = (e, dt, p) => G.Boss.ai(e, dt, p);
En.AI = AI;

// ---------- update ----------
En.update = function (dt) {
  const room = G.run.cur, p = G.run.player;
  const aggro = p.hasUniq('slowAggro') ? .6 : p.hasUniq('aggro') ? 1.2 : 1;
  for (let i = room.enemies.length - 1; i >= 0; i--) {
    const e = room.enemies[i];
    if (e.dead) { room.enemies.splice(i, 1); continue; }
    e.spawnProt = Math.max(0, e.spawnProt - dt);
    e.flash = Math.max(0, e.flash - dt);
    e.anim += dt * 6;
    // ally timers
    if (e.friendly && e.allyT !== undefined) { e.allyT -= dt; if (e.allyT <= 0) { e.dead = true; Fx.tp(e.x, e.y, '#58f08a'); continue; } }
    // statuses
    let spdMult = aggro, frozen = false;
    for (const k in e.status) {
      e.status[k] -= dt;
      if (e.status[k] <= 0) { delete e.status[k]; continue; }
      if (k === 'poison') { e.poisonAcc = (e.poisonAcc || 0) + dt; if (e.poisonAcc > .5) { e.poisonAcc = 0; e.hp -= 1; Fx.float(e.x, e.y - e.r, '1', '#58f08a'); if (e.hp <= 0) En.kill(e, {}); } if (G.frame % 10 === 0) Fx.spawn(e.x, e.y, { n: 1, col: ['#58f08a'], life: .4, grav: -40 }); }
      if (k === 'burn') { e.burnAcc = (e.burnAcc || 0) + dt; if (e.burnAcc > .4) { e.burnAcc = 0; e.hp -= 1.2; Fx.float(e.x, e.y - e.r, '1', '#ff7a5c'); if (e.hp <= 0) En.kill(e, {}); } if (G.frame % 8 === 0) Fx.spawn(e.x, e.y, { n: 1, col: ['#ff7a5c', '#ffb84d'], life: .35, grav: -60 }); }
      if (k === 'slow') spdMult *= .45;
      if (k === 'frozen' || k === 'sleep') frozen = true;
      if (k === 'fear') { /* handled below */ }
    }
    if (e.dead) { room.enemies.splice(i, 1); continue; }
    // zombie downed state
    if (e.state === 'downed') {
      e.downT -= dt;
      e.vx = e.vy = 0;
      if (e.downT <= 0) { e.state = 'idle'; e.hp = Math.round(e.hpMax * .5); Fx.tp(e.x, e.y, '#7dff8a'); }
      continue;
    }
    if (!frozen) {
      // stealth: enemies lose you
      const stealthed = p.hasUniq('stealth') && p.stealthT > .6;
      let target = p;
      if (e.friendly) {
        // allies target enemies
        const foes = room.enemies.filter(x => !x.dead && !x.friendly);
        if (foes.length) {
          let best = null, bd = 1e9;
          for (const f of foes) { const d = G.dist(e.x, e.y, f.x, f.y); if (d < bd) { bd = d; best = f; } }
          target = best;
        } else target = null;
        if (e.decoy) target = null;
      }
      // decoy taunting: enemies target nearest decoy
      if (!e.friendly) {
        const decoys = room.enemies.filter(x => !x.dead && x.decoy);
        if (decoys.length) target = decoys[0];
      }
      if (e.status.confuse && !e.friendly) {
        const foes = room.enemies.filter(x => !x.dead && x !== e && !x.friendly);
        if (foes.length) target = foes[0];
      }
      if (target && !(stealthed && !e.friendly)) {
        if (e.status.fear && !e.friendly) {
          const a = G.ang(target.x, target.y, e.x, e.y);
          e.vx = G.lerp(e.vx, Math.cos(a) * e.spd, dt * 3);
          e.vy = G.lerp(e.vy, Math.sin(a) * e.spd, dt * 3);
        } else {
          (AI[e.def.ai] || AI.chaser)(e, dt, target);
        }
      } else { e.vx *= .9; e.vy *= .9; }
    } else { e.vx = 0; e.vy = 0; }
    // knockback
    e.kx = (e.kx || 0) * (1 - dt * 6); e.ky = (e.ky || 0) * (1 - dt * 6);
    // webs slow
    let zoneMult = 1;
    for (const z of room.zones) if (z.type === 'web' && G.dist(e.x, e.y, z.x, z.y) < z.r + e.r && !e.friendly) zoneMult = 1; // webs only affect player
    // move
    let nx = e.x + (e.vx * spdMult + e.kx) * dt;
    let ny = e.y + (e.vy * spdMult + e.ky) * dt;
    if (e.def.ghost || e.state === 'burrowed') {
      e.x = nx; e.y = ny;
    } else {
      if (!En.blocked(nx, e.y, e.r)) e.x = nx; else e.vx *= -0.5;
      if (!En.blocked(e.x, ny, e.r)) e.y = ny; else e.vy *= -0.5;
    }
    e.x = G.clamp(e.x, 38, G.W - 38);
    e.y = G.clamp(e.y, G.HUD_H + 38, G.H - 38);
    // contact with player
    if (!e.friendly && e.state !== 'hidden' && e.state !== 'burrowed' && p.iframes <= 0 && !p.dead) {
      if (G.dist(e.x, e.y, p.x, p.y) < e.r + p.r - 1) {
        if (e.dmg > 0) { p.hurt(e.dmg, Object.assign(e, { contact: true })); e.hurtYou = true; }
        if (p.hasUniq('contactKnock')) { const a = G.ang(p.x, p.y, e.x, e.y); e.kx = Math.cos(a) * 320; e.ky = Math.sin(a) * 320; }
      }
    }
    // friendly contact damage to enemies
    if (e.friendly && !e.turret && !e.decoy) {
      for (const f of room.enemies) {
        if (f.dead || f.friendly) continue;
        if (G.dist(e.x, e.y, f.x, f.y) < e.r + f.r) {
          f.allyAcc = (f.allyAcc || 0) + dt;
          if (f.allyAcc > .4) { f.allyAcc = 0; En.damage(f, 2, {}); }
        }
      }
    }
    // swarm license: spiders fire your tears — full synergy pipeline
    if (e.isSpider && p.hasUniq('spiderTears')) {
      e.fireCd = (e.fireCd === undefined ? G.fR(0, 1) : e.fireCd) - dt;
      if (e.fireCd <= 0) {
        const foes = room.enemies.filter(f => !f.dead && !f.friendly);
        if (foes.length) {
          e.fireCd = 1 / Math.max(.8, p.stats.fireRate * .5);
          let best = null, bd = 210;
          for (const f of foes) { const d = G.dist(e.x, e.y, f.x, f.y); if (d < bd) { bd = d; best = f; } }
          if (best) Sh.mkShot(e.x, e.y, G.ang(e.x, e.y, best.x, best.y), { dmg: p.stats.dmg * .5, from: 'fam', noOrbit: true });
        } else e.fireCd = .5;
      }
    }
    // worm segments hurt player
    if (e.segs) {
      for (const s of e.segs) {
        if (p.iframes <= 0 && G.dist(s.x, s.y, p.x, p.y) < 8 + p.r) p.hurt(1, s);
      }
    }
  }
  // zones (webs, mines, oil, fire, water)
  for (let i = room.zones.length - 1; i >= 0; i--) {
    const z = room.zones[i];
    z.t -= dt;
    if (z.armT) z.armT -= dt;
    if (z.type === 'web' && G.dist(p.x, p.y, z.x, z.y) < z.r + p.r) { p.vx *= .93; p.vy *= .93; }
    if (z.type === 'mine' && (!z.armT || z.armT <= 0) && G.dist(p.x, p.y, z.x, z.y) < z.r + p.r) {
      Sh.explodeAt(z.x, z.y, 40, 4, false);
      room.zones.splice(i, 1); continue;
    }
    if (z.type === 'oil') {
      // burning enemies ignite the slick
      for (const e of room.enemies) {
        if (!e.dead && e.status.burn && G.dist(e.x, e.y, z.x, z.y) < z.r + e.r) { En.igniteZone(z); break; }
      }
    }
    if (z.type === 'fire') {
      // burn whoever stands in it
      z.fireAcc = (z.fireAcc || 0) + dt;
      if (z.fireAcc > .45) {
        z.fireAcc = 0;
        for (const e of room.enemies) {
          if (e.dead || e.friendly || e.state === 'burrowed') continue; // your summons don't burn
          if (G.dist(e.x, e.y, z.x, z.y) < z.r + e.r) { En.damage(e, 1.2, {}); En.status(e, 'burn', 1.5); }
        }
      }
      // fire spreads to touching oil
      for (const oz of room.zones) {
        if (oz.type === 'oil' && G.dist(z.x, z.y, oz.x, oz.y) < z.r + oz.r + 4) En.igniteZone(oz);
      }
      if (G.frame % 4 === 0) Fx.spawn(z.x + G.fR(-z.r, z.r) * .7, z.y + G.fR(-z.r, z.r) * .5, { n: 1, col: ['#ff7a5c', '#ffb84d'], life: .4, spMin: 5, spMax: 25, grav: -90, glow: true });
    }
    if (z.t <= 0) room.zones.splice(i, 1);
  }
  // enemy shots
  En.updateEshots(dt, room, p);
};

En.blocked = function (x, y, r) {
  for (const [ox, oy] of [[-r, 0], [r, 0], [0, -r], [0, r]]) {
    const t = G.Dg.tileAt(x + ox, y + oy);
    if (t === 2 || t === 5 || t === 6) return true;
  }
  return false;
};

En.updateEshots = function (dt, room, p) {
  const btSlow = G.run.bulletTime > 0 ? .4 : 1;
  if (G.run.bulletTime > 0) G.run.bulletTime -= dt;
  for (let i = room.eshots.length - 1; i >= 0; i--) {
    const s = room.eshots[i];
    s.t += dt;
    if (s.homing) {
      const want = G.ang(s.x, s.y, p.x, p.y);
      const cur = Math.atan2(s.vy, s.vx);
      const na = G.aLerp(cur, want, s.homing * dt);
      const sp = Math.hypot(s.vx, s.vy);
      s.vx = Math.cos(na) * sp; s.vy = Math.sin(na) * sp;
    }
    s.x += s.vx * dt * btSlow; s.y += s.vy * dt * btSlow;
    // fork prime: shots split mid-flight
    if (s.forkT !== undefined) {
      s.forkT -= dt;
      if (s.forkT <= 0 && room.eshots.length < 80) {
        const a0 = Math.atan2(s.vy, s.vx), sp = Math.hypot(s.vx, s.vy);
        for (const da of [-.45, .45]) En.eshot(s.x, s.y, a0 + da, sp, s.dmg, { col: s.col });
        Fx.hitSpark(s.x, s.y, s.col);
        room.eshots.splice(i, 1); continue;
      }
    }
    if (s.t > s.life || s.x < 34 || s.x > G.W - 34 || s.y < G.HUD_H + 34 || s.y > G.H - 34) { if (s.oil) En.spillOil(s.x, s.y, 11); room.eshots.splice(i, 1); continue; }
    if (!s.ghost && G.Dg.solidAt(s.x, s.y)) { if (s.oil) En.spillOil(s.x, s.y, 11); Fx.hitSpark(s.x, s.y, s.col); room.eshots.splice(i, 1); continue; }
    if (p.iframes <= 0 && !p.dead && G.dist(s.x, s.y, p.x, p.y) < s.r + p.r - 1) {
      p.hurt(s.dmg, s);
      if (s.hook && s.from && !s.from.dead) {
        // phisher hook: yank player toward source
        const a = G.ang(p.x, p.y, s.from.x, s.from.y);
        p.vx += Math.cos(a) * 400; p.vy += Math.sin(a) * 400;
      }
      room.eshots.splice(i, 1); continue;
    }
  }
};

// ---------- draw ----------
En.draw = function (x) {
  const room = G.run.cur;
  // zones under entities
  for (const z of room.zones) {
    if (z.type === 'water') {
      x.fillStyle = 'rgba(45,120,190,.35)';
      x.beginPath(); x.ellipse(z.x, z.y, z.r, z.r * .65, 0, 0, G.TAU); x.fill();
      x.strokeStyle = 'rgba(120,200,255,.35)'; x.lineWidth = 1;
      x.beginPath(); x.ellipse(z.x, z.y, z.r, z.r * .65, 0, 0, G.TAU); x.stroke();
      x.fillStyle = 'rgba(200,240,255,.25)';
      x.fillRect(z.x - z.r * .4, z.y - z.r * .25 + Math.sin(G.time * 2 + z.x) * 2, z.r * .5, 2);
    } else if (z.type === 'oil') {
      x.fillStyle = 'rgba(25,15,40,.75)';
      x.beginPath(); x.ellipse(z.x, z.y, z.r, z.r * .6, 0, 0, G.TAU); x.fill();
      x.fillStyle = 'rgba(150,90,220,.18)';
      x.beginPath(); x.ellipse(z.x - 2, z.y - 2, z.r * .55, z.r * .3, 0, 0, G.TAU); x.fill();
    } else if (z.type === 'fire') {
      const fl = .75 + Math.sin(G.time * 11 + z.x) * .25;
      x.save();
      x.globalAlpha = fl;
      x.shadowColor = '#ff7a5c'; x.shadowBlur = 10;
      x.fillStyle = 'rgba(255,110,60,.55)';
      x.beginPath(); x.ellipse(z.x, z.y, z.r, z.r * .6, 0, 0, G.TAU); x.fill();
      x.fillStyle = 'rgba(255,200,90,.6)';
      x.beginPath(); x.ellipse(z.x, z.y, z.r * .5, z.r * .3, 0, 0, G.TAU); x.fill();
      x.restore();
    } else if (z.type === 'web') {
      x.strokeStyle = 'rgba(200,210,230,.35)'; x.lineWidth = 1;
      for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(z.x, z.y, z.r - i * 5, 0, G.TAU); x.stroke(); }
      x.beginPath(); x.moveTo(z.x - z.r, z.y); x.lineTo(z.x + z.r, z.y); x.moveTo(z.x, z.y - z.r); x.lineTo(z.x, z.y + z.r); x.stroke();
    } else if (z.type === 'mine') {
      const armed = !z.armT || z.armT <= 0;
      x.fillStyle = armed && Math.sin(G.time * 8) > 0 ? '#ff5252' : '#7a5a20';
      x.beginPath(); x.arc(z.x, z.y, 5, 0, G.TAU); x.fill();
      x.fillStyle = '#ffe24d'; x.fillRect(z.x - 1, z.y - 1, 2, 2);
    }
  }
  const sorted = room.enemies.slice().sort((a, b) => a.y - b.y);
  for (const e of sorted) {
    if (e.state === 'hidden') { // trojan disguise: draw as chest
      const s = Spr.cache.chest;
      x.drawImage(s, e.x - s.width / 2, e.y - s.height / 2);
      continue;
    }
    if (e.bossKind) { G.Boss.drawOne(x, e); continue; }
    const burrowed = e.state === 'burrowed';
    // shadow
    x.fillStyle = 'rgba(0,0,0,.35)';
    x.beginPath(); x.ellipse(e.x, e.y + e.r * .8, e.r * .8, e.r * .3, 0, 0, G.TAU); x.fill();
    if (burrowed) continue;
    const frames = Spr.enemy(e.def.shape, e.def.size, e.def.col);
    const fi = Math.floor(e.anim * 1.5) % 2;
    let spr = e.flash > 0 ? Spr.enemyWhite(e.def.shape, e.def.size, e.def.col) : frames[fi];
    // worm segments first
    if (e.segs) {
      for (let i = e.segs.length - 1; i >= 0; i--) {
        const s = e.segs[i];
        const seg = Spr.enemy('worm', 16, e.def.col)[fi];
        x.drawImage(seg, s.x - seg.width / 2, s.y - seg.height / 2);
      }
    }
    x.save();
    const scale = e.grow || 1;
    const jump = e.jumpH || 0;
    let alpha = e.alpha !== undefined ? e.alpha : 1;
    if (e.friendly) { x.shadowColor = '#58f08a'; x.shadowBlur = 6; }
    if (e.status.sleep) alpha *= .8;
    x.globalAlpha = alpha;
    // telegraph shake
    let sx = 0;
    if (e.state === 'tele' || (e.tele > 0 && e.state !== 'idle')) sx = G.fR(-1.2, 1.2);
    x.translate(e.x + sx, e.y - jump);
    const squish = 1 + Math.sin(e.anim * 2) * .04;
    x.scale(scale, scale * squish);
    x.drawImage(spr, -spr.width / 2, -spr.height / 2);
    x.restore();
    x.globalAlpha = 1;
    // champion ring
    if (e.champion) {
      x.strokeStyle = e.champion === 'crimson' ? '#ff5252' : e.champion === 'volt' ? '#ffe24d' : '#8a93a8';
      x.lineWidth = 1;
      x.beginPath(); x.arc(e.x, e.y + e.r * .8, e.r * .9, 0, G.TAU); x.stroke();
    }
    // captcha lock indicator
    if (e.type === 'captcha') {
      x.fillStyle = e.state === 'locked' ? '#ff5252' : '#58f08a';
      x.fillRect(e.x - 3, e.y - e.r - 8, 6, 6);
      if (e.state !== 'locked') { x.strokeStyle = '#0b0b12'; x.lineWidth = 1; x.beginPath(); x.moveTo(e.x - 2, e.y - e.r - 5); x.lineTo(e.x, e.y - e.r - 3); x.lineTo(e.x + 2, e.y - e.r - 7); x.stroke(); }
    }
    // telegraph "!"
    if ((e.state === 'tele' || e.tele > 0) && e.state !== 'idle' && e.state !== 'hidden') {
      x.font = 'bold 10px monospace'; x.textAlign = 'center';
      x.fillStyle = '#0b0b12'; x.fillText('!', e.x + 1, e.y - e.r - 7);
      x.fillStyle = '#ffe24d'; x.fillText('!', e.x, e.y - e.r - 8);
      x.textAlign = 'left';
    }
    // dash line telegraph
    if (e.state === 'tele' && (e.def.ai === 'dasher' || e.def.ai === 'watcher') && e.dashA !== undefined) {
      x.strokeStyle = 'rgba(255,226,77,.3)'; x.lineWidth = 2;
      x.beginPath(); x.moveTo(e.x, e.y); x.lineTo(e.x + Math.cos(e.dashA) * 120, e.y + Math.sin(e.dashA) * 120); x.stroke();
    }
    if (e.state === 'tele' && (e.def.ai === 'sniper' || e.def.ai === 'beamer') && e.aimA !== undefined) {
      x.strokeStyle = 'rgba(255,82,82,.35)'; x.lineWidth = 1;
      x.beginPath(); x.moveTo(e.x, e.y); x.lineTo(e.x + Math.cos(e.aimA) * 300, e.y + Math.sin(e.aimA) * 300); x.stroke();
    }
    // health bars
    if ((G.run.player.hasUniq('healthBars') || e.boss) && e.hp < e.hpMax && !e.boss) {
      x.fillStyle = '#0b0b12'; x.fillRect(e.x - 10, e.y - e.r - 5, 20, 3);
      x.fillStyle = '#ff5252'; x.fillRect(e.x - 9, e.y - e.r - 4, 18 * G.clamp(e.hp / e.hpMax, 0, 1), 1);
    }
    // downed zombie
    if (e.state === 'downed') {
      x.globalAlpha = .5;
      x.fillStyle = '#7dff8a'; x.font = '7px monospace'; x.textAlign = 'center';
      x.fillText('rebooting...', e.x, e.y - e.r - 4);
      x.textAlign = 'left'; x.globalAlpha = 1;
    }
  }
  // enemy shots
  for (const s of room.eshots) {
    x.save();
    x.shadowColor = s.col; x.shadowBlur = 5;
    x.fillStyle = s.col;
    x.beginPath(); x.arc(s.x, s.y, s.r, 0, G.TAU); x.fill();
    x.fillStyle = 'rgba(255,255,255,.7)';
    x.beginPath(); x.arc(s.x - s.r * .3, s.y - s.r * .3, s.r * .35, 0, G.TAU); x.fill();
    x.restore();
    if (s.hook) { x.strokeStyle = 'rgba(77,195,255,.4)'; x.lineWidth = 1; x.beginPath(); x.moveTo(s.x, s.y); if (s.from) x.lineTo(s.from.x, s.from.y); x.stroke(); }
  }
};
