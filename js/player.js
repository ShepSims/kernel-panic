'use strict';
// ============================================================
// player.js: the engineer. stats, mods aggregation, familiars
// hp is counted in HALF battery cells. hpMax in cells.
// ============================================================
const Pl = {};
G.Player = Pl;

Pl.mk = function () {
  const p = {
    x: G.W / 2, y: (G.H + G.HUD_H) / 2 + 40,
    vx: 0, vy: 0, r: 7,
    hpMax: 3, hp: 6, soul: 0,
    coins: 5, bombs: 1, keys: 1,
    items: [], trinket: null, active: null,
    stats: {}, mods: {}, fams: [], orbs: [], tempOrbs: [],
    iframes: 0, fireCd: 0, anim: 0, facing: 1, moving: false,
    shotCounter: 0, lastAim: 0, aimAng: null,
    permDmg: 0, rageStacks: 0, bisectStacks: 0,
    stealthT: 0, rampT: 0, hasteT: 0, mirrorT: 0,
    giantShots: 0, volleyX: 0, hitShield: 0,
    roomShieldUsed: false, dead: false, deathT: 0,
    hurtFlash: 0, walkDust: 0,
  };
  return p;
};

// ---------- fx aggregation ----------
Pl.allFxOf = function (p) {
  const list = p.items.map(i => i.fx);
  if (p.trinket !== null) list.push(G.TRINKETS[p.trinket].fx);
  return list;
};

Pl.recalc = function () {
  const p = G.run.player;
  const all = Pl.allFxOf(p);
  const uniq = {};
  for (const f of all) if (f.uniq) uniq[f.uniq] = (uniq[f.uniq] || 0) + 1;
  // count stat-boost multiplier items
  const mono = uniq.monorepo ? 1.25 : 1;
  let dmgF = 0, dmgX = 0, tears = 0, spd = 0, rng = 0, shotspd = 0, luck = 0, hpB = 0, soulB = 0;
  let critC = 0, critX = 0;
  const m = { pierce: 0, spectral: 0, homing: 0, bounce: 0, split: 0, splitDeep: 0, explode: 0, chain: 0, poison: 0, slow: 0, burn: 0, fear: 0, charm: 0, knock: 0, shotScale: 0, countAdd: 0, spreadAdd: 0, backShot: 0, sideShots: 0, wavy: 0, boomerang: 0, uniq };
  for (const f of all) {
    dmgF += (f.dmg || 0) * mono; dmgX += f.dmgX || 0;
    tears += (f.tears || 0) * mono; spd += (f.spd || 0) * mono;
    rng += (f.rng || 0) * mono; shotspd += (f.shotspd || 0) * mono;
    luck += f.luck || 0; hpB += f.hp || 0; soulB += 0;
    critC += f.critC || 0; critX += f.critX || 0;
    for (const k of ['pierce', 'spectral', 'homing', 'bounce', 'split', 'splitDeep', 'explode', 'chain', 'poison', 'slow', 'burn', 'fear', 'charm', 'knock', 'shotScale', 'countAdd', 'spreadAdd', 'backShot', 'sideShots', 'wavy', 'boomerang'])
      if (f[k]) m[k] += f[k];
  }
  // room buffs / temp
  const rb = G.run.roomBuff || {};
  dmgX += rb.dmg || 0; tears += rb.tears || 0;
  if (p.hasteT > 0) { spd += .3; tears += .4; }
  if (p.ffBuff) { if (p.ffBuff === 'dmg') dmgX += .25; else tears += .3; }
  // uniq stat effects
  if (uniq.glass) { p.hpMax = 1; p.hp = Math.min(p.hp, 2); }
  if (uniq.lowHpPower && p.hp <= 2) dmgX += .5;
  if (uniq.lowHpPowerSmall && p.hp <= p.hpMax) dmgX += .25;
  if (uniq.lowHpSpeed && p.hp <= 4) spd += .25;
  if (uniq.coinPower) dmgF += Math.min(3, p.coins * .04);
  if (uniq.momentum) dmgF += Math.hypot(p.vx, p.vy) * .012;
  if (uniq.rage) dmgF += p.rageStacks * .3;
  if (uniq.floorPower) dmgF += G.run.depth * .4;
  if (uniq.bossPower) dmgF += (G.run.bossesKilled || 0);
  if (uniq.minimal) dmgX += Math.max(0, (14 - p.items.length)) * .05;
  if (uniq.hoard) dmgF += p.items.length * .07;
  if (uniq.darkPower && [1, 5].includes((G.run.depth - 1) % 6)) dmgX += .3;
  if (uniq.fullHpLuck && p.hp >= p.hpMax * 2) luck += 2;
  if (uniq.fullHpTears && p.hp >= p.hpMax * 2) tears += .25;
  if (uniq.turretMode && !p.moving) { tears += .6; dmgF += 1; }
  if (uniq.rampFire) tears += Math.min(.8, p.rampT * .12);
  // hp bonuses from items apply as max increase
  const pf = G.run && G.run.packFx ? G.run.packFx.g : { playerDmg: 1, playerTears: 1, playerSpd: 1, playerHp: 0 };
  const newMax = uniq.glass ? 1 : G.clamp(3 + hpB + pf.playerHp, 1, 12);
  if (newMax > (p._lastMax || 3)) p.hp += (newMax - (p._lastMax || 3)) * 2;
  p.hpMax = newMax; p._lastMax = newMax;
  p.hp = G.clamp(p.hp, 0, p.hpMax * 2);
  // soul from items granted once at pickup
  for (const f of all) if (f.soul && !f._soulGiven) { f._soulGiven = true; p.soul += f.soul; }
  if (uniq.soulConvert) { /* batteries pick up as soul elsewhere */ }
  p.stats = {
    dmg: Math.max(.4, (3.2 + dmgF + p.permDmg) * (1 + dmgX) * pf.playerDmg),
    tears: tears,
    fireRate: G.clamp(2.4 * (1 + tears) * pf.playerTears, .8, 12),
    spd: spd,
    moveSpd: 108 * (1 + spd) * pf.playerSpd,
    range: Math.max(90, 250 + rng),
    shotspd: Math.max(90, 250 * (1 + shotspd)),
    luck, critC, critX,
  };
  p.mods = m;
  Pl.buildFams(p, uniq);
  Pl.buildOrbs(p, all, uniq);
};

Pl.buildFams = function (p, uniq) {
  const types = [];
  for (const it of p.items) if (it.fx.fam) types.push(it.fx.fam);
  if (uniq.duckArmy) { const n = 1 + Math.floor(Math.max(0, p.stats.luck) / 2); for (let i = 0; i < n; i++) types.push('duck2'); }
  // keep positions of existing fams if same count
  if (p.fams.length !== types.length || p.fams.some((f, i) => f.type !== types[i])) {
    p.fams = types.map((t, i) => ({ type: t, x: p.x - 14 - i * 10, y: p.y, cd: 0, i, activeT: 0 }));
  }
};
Pl.buildOrbs = function (p, all, uniq) {
  const orbs = [];
  for (const f of all) if (f.orb) { const n = f.orb.n || 1; for (let i = 0; i < n; i++) orbs.push(Object.assign({ phase: 0 }, f.orb, { idx: orbs.length })); }
  if (p.orbs.length !== orbs.length) p.orbs = orbs;
  for (let i = 0; i < p.orbs.length; i++) p.orbs[i].offset = i * G.TAU / Math.max(1, p.orbs.length);
};

// convenience
Pl.install = function (p) {
  p.recalc = Pl.recalc;
  p.hurt = (n, src, self) => Pl.hurt(p, n, src, self);
  p.heal = n => Pl.heal(p, n);
  p.payHp = n => Pl.payHp(p, n);
  p.addCharge = n => Pl.addCharge(p, n);
  p.hasUniq = k => !!(p.mods && p.mods.uniq && p.mods.uniq[k]);
  p.allFx = () => Pl.allFxOf(p);
};

// ---------- health ----------
Pl.heal = function (p, n) {
  if (p.hasUniq('soulConvert') && n < 900) { p.soul += n; Au.sfx('shield'); return; }
  p.hp = G.clamp(p.hp + n, 0, p.hpMax * 2);
};
Pl.payHp = function (p, cells) {
  let halves = cells * 2;
  if (p.soul >= halves) { p.soul -= halves; return; }
  halves -= p.soul; p.soul = 0;
  p.hpMax = Math.max(1, p.hpMax - Math.ceil(halves / 2));
  p.hp = Math.min(p.hp, p.hpMax * 2);
};
Pl.addCharge = function (p, n) {
  if (!p.active) return;
  const mult = p.hasUniq('chargeUp') ? 1.2 : 1;
  p.active.charge = Math.min(p.active.max, p.active.charge + n * mult);
  if (p.active.charge >= p.active.max) Au.sfx('charge');
};

Pl.hurt = function (p, n, src, selfInflicted) {
  if (p.iframes > 0 || p.dead) return;
  if (G.run.cur.type === 'cursed' && p.hasUniq('curseImmune') && !selfInflicted) return;
  if (p.hasUniq('dodge15') && G.rng() < .15 + p.stats.luck * .01) { Fx.float(p.x, p.y - 12, 'DODGED', '#4df3ff'); return; }
  if (p.hitShield > 0) { p.hitShield--; Fx.float(p.x, p.y - 12, 'ABSORBED', '#58f08a'); Au.sfx('shield'); return; }
  if (p.hasUniq('roomShield') && !G.run.cur.shieldUsed) { G.run.cur.shieldUsed = true; Fx.float(p.x, p.y - 12, 'READ-ONLY', '#4df3ff'); Au.sfx('shield'); return; }
  if (p.hasUniq('fragile') && src && src.contact) n = Math.ceil(n * 1.5);
  if (p.yolo) n *= 2;
  // soul (shield) takes damage first
  let rem = n;
  if (p.soul > 0) { const use = Math.min(p.soul, rem); p.soul -= use; rem -= use; }
  p.hp -= rem;
  p.iframes = p.hasUniq('longIframes') ? 1.6 : 1.1;
  p.hurtFlash = .25;
  G.meta.damageTaken += n;
  G.run.stats.damageTaken = (G.run.stats.damageTaken || 0) + n;
  p.rageStacks++;
  if (src && src.x !== undefined) { const a = G.ang(src.x, src.y, p.x, p.y); p.vx += Math.cos(a) * 200; p.vy += Math.sin(a) * 200; }
  if (src && src.hurtYou !== undefined) src.hurtYou = true;
  G.addShake(6); G.flashScreen('rgba(255,60,60,.28)', .18); G.hitstop(.06);
  Au.sfx('hurt');
  Fx.spawn(p.x, p.y, { n: 10, col: ['#ff5252', '#a03030'], life: .5, spMin: 40, spMax: 120 });
  It.procEv('hurt', { x: p.x, y: p.y });
  if (p.hasUniq('fearAura') && p.hp <= 4) G.En.statusNear(p.x, p.y, 80, 'fear', 2);
  p.recalc();
  if (p.hp <= 0) Pl.tryDie(p);
};

Pl.tryDie = function (p) {
  // revives
  for (const it of p.items) {
    if (it.fx.uniq === 'revive' && !it._used) { it._used = true; p.hp = 2; p.iframes = 2; G.toast('POST-MORTEM: REVIVED', '#58f08a'); Au.sfx('levelup'); Fx.tp(p.x, p.y, '#58f08a'); return; }
    if (it.fx.uniq === 'drPlan' && !it._used && G.rng() < .5) { it._used = true; p.hp = 1; p.iframes = 2; G.toast('FAILOVER SUCCESSFUL', '#58f08a'); return; }
  }
  p.dead = true; p.deathT = 0;
  G.Meta.onDeath();
};

// ---------- update ----------
Pl.update = function (dt) {
  const p = G.run.player;
  if (p.dead) { p.deathT += dt; return; }
  p.iframes = Math.max(0, p.iframes - dt);
  p.hurtFlash = Math.max(0, p.hurtFlash - dt);
  p.hasteT = Math.max(0, p.hasteT - dt);
  p.mirrorT = Math.max(0, p.mirrorT - dt);
  // movement
  const [mx, my] = G.moveVec();
  p.moving = !!(mx || my);
  const accel = p.inOil ? 750 : 1500, fric = p.inOil ? 2.4 : 8; // oil is slick
  p.vx += mx * accel * dt; p.vy += my * accel * dt;
  p.vx -= p.vx * fric * dt; p.vy -= p.vy * fric * dt;
  const sp = Math.hypot(p.vx, p.vy), max = p.stats.moveSpd;
  if (sp > max) { p.vx *= max / sp; p.vy *= max / sp; }
  // knockback decay handled via same velocity
  Pl.moveCollide(p, p.vx * dt, p.vy * dt);
  if (mx) p.facing = mx > 0 ? 1 : -1;
  if (p.moving) {
    p.anim += dt * 9;
    p.walkDust -= dt;
    if (p.walkDust <= 0) { p.walkDust = .12; Fx.dust(p.x + G.fR(-3, 3), p.y + 8); }
    p.stealthT = 0;
  } else { p.anim = 0; p.stealthT += dt; }
  // elemental zones
  p.inOil = false;
  for (const z of G.run.cur.zones) {
    const zd = G.dist(p.x, p.y, z.x, z.y);
    if (z.type === 'oil' && zd < z.r + 4) p.inOil = true;
    if (z.type === 'fire' && zd < z.r + 2 && p.iframes <= 0) {
      const trinketBurnImmune = p.trinket !== null && G.TRINKETS[p.trinket].fx.uniq === 'burnImmune';
      if (p.hasUniq('burnImmune') || trinketBurnImmune) { }
      else if (p.hasUniq('fineDog')) { if (G.frame % 90 === 0) p.heal(1); }
      else p.hurt(1, null, true);
    }
  }
  // spike tiles
  if (G.Dg.tileAt(p.x, p.y) === 4 && p.iframes <= 0) {
    if (p.hasUniq('burnImmune')) { }
    else if (p.hasUniq('fineDog')) { if (G.frame % 60 === 0) p.heal(1); }
    else p.hurt(1, null, true);
  }
  // shooting
  p.fireCd -= dt;
  const aim = G.shootDir();
  p.aimAng = aim;
  if (aim !== null) {
    p.lastAim = aim;
    p.rampT += dt;
    if (p.fireCd <= 0) {
      p.fireCd = 1 / p.stats.fireRate;
      Sh.fire(aim);
      // slight recoil
      p.vx -= Math.cos(aim) * 14; p.vy -= Math.sin(aim) * 14;
    }
  } else p.rampT = Math.max(0, p.rampT - dt * 2);
  // turret mode / momentum need live recalc occasionally
  if ((p.hasUniq('turretMode') || p.hasUniq('momentum') || p.hasUniq('rampFire') || p.hasUniq('coinPower')) && G.frame % 15 === 0) p.recalc();
  // active use
  if (G.hit('active')) It.useActive();
  if (G.hit('bomb')) {
    if (p.bombs > 0) { p.bombs--; Sh.placeBomb(p.x, p.y); }
    else Au.sfx('error');
  }
  if (G.hit('dropTrinket') && p.trinket !== null && !p.hasUniq('cuffed')) {
    It.spawnPickup(G.run.cur, p.x, p.y + 12, 'trinket', p.trinket);
    p.trinket = null; p.recalc();
  }
  // trickle charge
  if (p.hasUniq('trickleCharge') && p.active) Pl.addCharge(p, dt * .04);
  // aura damage
  if (p.hasUniq('aura')) {
    for (const e of G.run.cur.enemies) {
      if (e.dead || e.friendly) continue;
      if (G.dist(p.x, p.y, e.x, e.y) < 34) { e.auraAcc = (e.auraAcc || 0) + dt; if (e.auraAcc > .4) { e.auraAcc = 0; G.En.damage(e, p.stats.dmg * .4, {}); } }
    }
  }
  Pl.updateFams(p, dt);
  Pl.updateOrbs(p, dt);
};

Pl.moveCollide = function (p, dx, dy) {
  // X axis
  let nx = p.x + dx;
  if (!Pl.blocked(nx, p.y, p.r)) p.x = nx; else p.vx = 0;
  let ny = p.y + dy;
  if (!Pl.blocked(p.x, ny, p.r)) p.y = ny; else p.vy = 0;
  p.x = G.clamp(p.x, 38, G.W - 38);
  p.y = G.clamp(p.y, G.HUD_H + 38, G.H - 38);
};
Pl.blocked = function (x, y, r) {
  for (const [ox, oy] of [[-r, 0], [r, 0], [0, -r], [0, r], [-r * .7, -r * .7], [r * .7, -r * .7], [-r * .7, r * .7], [r * .7, r * .7]]) {
    const t = G.Dg.tileAt(x + ox, y + oy);
    if (t === 2 || t === 5 || t === 6 || t === 3) return true; // rock, cracked, terminal, pit block player
  }
  return false;
};

Pl.blink = function () {
  const p = G.run.player;
  const a = p.lastAim || 0;
  for (let d = 90; d > 20; d -= 10) {
    const nx = G.clamp(p.x + Math.cos(a) * d, 40, G.W - 40);
    const ny = G.clamp(p.y + Math.sin(a) * d, G.HUD_H + 40, G.H - 40);
    if (!Pl.blocked(nx, ny, p.r)) {
      Fx.tp(p.x, p.y, '#4df3ff');
      p.x = nx; p.y = ny;
      Fx.tp(p.x, p.y, '#4df3ff');
      Au.sfx('teleport');
      return;
    }
  }
};

// ---------- familiars ----------
const FAM_DEF = {
  duck: { rate: 1.1, dmg: .8, spr: 'fam_duck', blocks: true },
  duck2: { rate: 1.4, dmg: .45, spr: 'fam_duck', blocks: false, small: true },
  drone: { rate: .8, dmg: .7, spr: 'fam_drone', blocks: false },
  orb: { rate: 0, dmg: .6, spr: 'fam_orb', blocks: false, mimic: true },
  cat: { rate: 0, dmg: 1.4, spr: 'fam_cat', contact: true },
  ghost: { rate: 0, dmg: .9, spr: 'fam_ghost', contact: true, fear: true, hunt: true },
  bat: { rate: 0, dmg: 1.1, spr: 'fam_bat', contact: true, hunt: true },
  pagerdrone: { rate: .4, dmg: .8, spr: 'fam_drone', blocks: false, onHurtOnly: true },
  mainframe: { rate: 2.6, dmg: 3.2, spr: 'fam_drone', big: true },
  scrum: { rate: 0, dmg: .3, spr: 'fam_orb', deflect: true },
};
Pl.updateFams = function (p, dt) {
  const powMult = (p.hasUniq('famPower') ? 1.5 : 1) * (p.hasUniq('famPowerSmall') ? 1.2 : 1);
  const rateMult = p.hasUniq('famRate') ? .7 : 1;
  const hunt = p.hasUniq('famHunt');
  let leader = { x: p.x, y: p.y };
  for (const f of p.fams) {
    const d = FAM_DEF[f.type] || FAM_DEF.duck;
    // follow chain or hunt
    let tx = leader.x - 16, ty = leader.y;
    const enemies = G.run.cur.enemies.filter(e => !e.dead && !e.friendly);
    if ((d.hunt || hunt) && enemies.length) {
      let best = null, bd = 1e9;
      for (const e of enemies) { const dd = G.dist(f.x, f.y, e.x, e.y); if (dd < bd) { bd = dd; best = e; } }
      if (best) { tx = best.x; ty = best.y; }
    }
    if (d.deflect) {
      f.orbA = (f.orbA || 0) + dt * 4;
      tx = p.x + Math.cos(f.orbA) * 30; ty = p.y + Math.sin(f.orbA) * 30;
      f.x = tx; f.y = ty;
    } else {
      f.x = G.lerp(f.x, tx, dt * (d.hunt || hunt ? 3.2 : 6));
      f.y = G.lerp(f.y, ty, dt * (d.hunt || hunt ? 3.2 : 6));
    }
    leader = f;
    // behavior
    if (d.onHurtOnly) { f.activeT = p.hurtFlash > 0 ? 5 : Math.max(0, f.activeT - dt); if (f.activeT <= 0) continue; }
    if (d.rate > 0) {
      f.cd -= dt;
      if (f.cd <= 0 && enemies.length) {
        f.cd = d.rate * rateMult;
        let best = null, bd = 1e9;
        for (const e of enemies) { const dd = G.dist(f.x, f.y, e.x, e.y); if (dd < bd) { bd = dd; best = e; } }
        if (best && bd < 220) {
          const a = G.ang(f.x, f.y, best.x, best.y);
          const s = Sh.mkShot(f.x, f.y, a, { dmg: p.stats.dmg * d.dmg * powMult, from: 'fam', noOrbit: true, noSplit: true, spd: 220, life: 1.1, col: '#ffe24d' });
          if (d.big) { s.r *= 2; s.scale *= 2; }
        }
      }
    }
    if (d.mimic && p.aimAng !== null) {
      f.cd -= dt;
      if (f.cd <= 0) { f.cd = 1 / Math.max(1, p.stats.fireRate * .7); Sh.mkShot(f.x, f.y, p.aimAng, { dmg: p.stats.dmg * d.dmg * powMult, from: 'fam', noOrbit: true, noSplit: true, col: '#ffe24d' }); }
    }
    if (d.contact) {
      for (const e of enemies) {
        if (G.dist(f.x, f.y, e.x, e.y) < e.r + 7) {
          e.famAcc = (e.famAcc || 0) + dt;
          if (e.famAcc > .35) { e.famAcc = 0; G.En.damage(e, p.stats.dmg * d.dmg * powMult, {}); if (d.fear) G.En.status(e, 'fear', 1.2); }
        }
      }
    }
    // blocking / deflecting enemy shots
    if (d.blocks || d.deflect) {
      const es = G.run.cur.eshots;
      for (let i = es.length - 1; i >= 0; i--) {
        if (G.dist(f.x, f.y, es[i].x, es[i].y) < 9) { Fx.hitSpark(es[i].x, es[i].y, '#ffe24d'); es.splice(i, 1); }
      }
    }
  }
};
Pl.famBurst = function () {
  const p = G.run.player;
  for (const f of p.fams) for (let i = 0; i < 8; i++) Sh.mkShot(f.x, f.y, i * G.TAU / 8, { dmg: p.stats.dmg * .6, from: 'fam', noOrbit: true, noSplit: true, col: '#ffe24d', life: .6 });
};

Pl.addTempOrb = function (s) {
  const p = G.run.player;
  if (p.tempOrbs.filter(o => !o.moon).length >= 8) return;
  p.tempOrbs.push({ r: G.fR(24, 40), spd: G.fR(2, 3.4), dmg: 1, t: 12, phase: G.fR(0, G.TAU), col: s.col });
  Fx.ring(s.x, s.y, s.col, 2, 14, .25);
};
Pl.updateOrbs = function (p, dt) {
  const spdMult = p.hasUniq('orbSpeed') ? 1.5 : 1;
  const lasers = p.hasUniq('orbLasers');
  // expire temp orbitals (moons persist)
  for (let i = p.tempOrbs.length - 1; i >= 0; i--) {
    const o = p.tempOrbs[i];
    if (!o.moon) { o.t -= dt; if (o.t <= 0) { if (o.x !== undefined) Fx.tp(o.x, o.y, '#4df3ff'); p.tempOrbs.splice(i, 1); } }
  }
  const all = p.orbs.filter(o => !o.eaten).concat(p.tempOrbs);
  let li = 0;
  for (const o of all) {
    if (o.offset === undefined || o._n !== all.length) { o.offset = li * G.TAU / Math.max(1, all.length); o._n = all.length; }
    o.phase += dt * o.spd * spdMult;
    o.x = p.x + Math.cos(o.phase + o.offset) * o.r;
    o.y = p.y + Math.sin(o.phase + o.offset) * o.r * .8;
    li++;
    for (const e of G.run.cur.enemies) {
      if (e.dead || e.friendly) continue;
      if (G.dist(o.x, o.y, e.x, e.y) < e.r + (o.moon ? 9 : 6)) {
        e.orbAcc = (e.orbAcc || 0) + dt;
        if (e.orbAcc > .3) { e.orbAcc = 0; G.En.damage(e, p.stats.dmg * o.dmg * .5, {}); if (o.burn) G.En.status(e, 'burn', 2); if (o.moon) { const a = G.ang(p.x, p.y, e.x, e.y); e.kx = (e.kx || 0) + Math.cos(a) * 200; e.ky = (e.ky || 0) + Math.sin(a) * 200; } }
      }
    }
    if (o.block || o.moon) {
      const es = G.run.cur.eshots;
      for (let i = es.length - 1; i >= 0; i--) if (G.dist(o.x, o.y, es[i].x, es[i].y) < (o.moon ? 11 : 8)) { Fx.hitSpark(es[i].x, es[i].y, '#4df3ff'); es.splice(i, 1); }
    }
    // laser firmware: orbitals fire lasers
    if (lasers) {
      o.laserCd = (o.laserCd === undefined ? G.fR(0, 1.4) : o.laserCd) - dt;
      if (o.laserCd <= 0) {
        o.laserCd = 1.4;
        let best = null, bd = 170;
        for (const e of G.run.cur.enemies) { if (e.dead || e.friendly) continue; const d = G.dist(o.x, o.y, e.x, e.y); if (d < bd) { bd = d; best = e; } }
        if (best) Sh.fireLaser(o.x, o.y, best, p.stats.dmg * (o.moon ? 1.4 : .7));
      }
    }
  }
};

// ---------- floor / room hooks ----------
Pl.onFloorStart = function () {
  const p = G.run.player;
  p.rageStacks = 0; p.bisectStacks = 0;
  if (p.hasUniq('floorHeal')) p.heal(2);
  if (p.hasUniq('floorHealHalf')) p.heal(1);
  if (p.hasUniq('floorSoul')) p.soul += 1;
  if (p.hasUniq('floorGuard')) p.floorGuardReady = true;
  if (p.hasUniq('crunch')) { p.hp = Math.max(1, p.hp - 1); G.toast('CRUNCH TAKES ITS TOLL', '#ff5252'); }
  if (p.hasUniq('debt')) {
    const k = G.pick(['dmg', 'tears', 'spd']);
    p.permDmg -= k === 'dmg' ? .2 : 0;
    G.toast('TECHNICAL DEBT ACCRUES', '#ff5252');
  }
  if (p.hasUniq('karma')) { p.permDmg += .15; G.toast('KARMA: SMALL BLESSING', '#58f08a'); }
  if (p.hasUniq('karmaSmall')) p.permDmg += .08;
  if (p.hasUniq('freeKey')) p.freeUnlocks = (p.freeUnlocks || 0) + 1;
  p.recalc();
};
Pl.onRoomEnter = function (room) {
  const p = G.run.player;
  G.run.roomBuff = null; p.yolo = false;
  if (p.hasUniq('featureFlag')) p.ffBuff = G.chance(.5) ? 'dmg' : 'tears';
  if (p.hasUniq('bossHeal') && room.type === 'boss') p.heal(2);
  p.rollbackHp = p.hp;
  p.recalc();
};
Pl.onRoomClear = function (room) {
  const p = G.run.player;
  Pl.addCharge(p, 1 + (G.run.clearChargeBonus || 0));
  if (p.hasUniq('clearHaste')) p.hasteT = 5;
  if (p.hasUniq('rollback') && p.hp < p.rollbackHp) p.heal(Math.ceil((p.rollbackHp - p.hp) / 2));
  It.procEv('clear', { x: p.x, y: p.y });
  G.meta.roomsCleared++;
};

// ---------- draw ----------
Pl.draw = function (x) {
  const p = G.run.player;
  if (p.dead) {
    const g = Spr.cache.playerGhost;
    x.globalAlpha = Math.max(0, 1 - p.deathT * .5);
    x.drawImage(g, p.x - g.width / 2, p.y - g.height / 2 - p.deathT * 18);
    x.globalAlpha = 1;
    return;
  }
  // shadow
  x.fillStyle = 'rgba(0,0,0,.4)';
  x.beginPath(); x.ellipse(p.x, p.y + 9, 8, 3, 0, 0, G.TAU); x.fill();
  // orbitals below/above by phase
  for (const o of p.orbs.filter(o => !o.eaten).concat(p.tempOrbs)) {
    if (Math.sin(o.phase + (o.offset || 0)) < 0) Pl.drawOrb(x, o);
  }
  // iframe blink
  if (p.iframes > 0 && Math.floor(G.time * 14) % 2 === 0 && p.hurtFlash <= 0) x.globalAlpha = .45;
  // stealth
  if (p.hasUniq('stealth') && p.stealthT > .6) x.globalAlpha = .35;
  const frames = Spr.cache.player;
  const fi = p.moving ? (1 + (Math.floor(p.anim) % 2) * 2) : 0;
  const spr = p.hurtFlash > 0 ? Spr.cache.playerWhite : frames[Math.min(fi, frames.length - 1)];
  const bob = p.moving ? Math.abs(Math.sin(p.anim * 2.4)) * 1.6 : Math.sin(G.time * 2.4) * .8;
  // squash & stretch
  const sy = p.moving ? 1 + Math.sin(p.anim * 4.8) * .05 : 1;
  x.save();
  x.translate(p.x, p.y - 4 - bob);
  x.scale(p.facing, sy);
  if (p.hasUniq('rgbGlow')) { x.shadowColor = 'hsl(' + ((G.time * 120) % 360) + ',90%,60%)'; x.shadowBlur = 8; }
  x.drawImage(spr, -spr.width / 2, -spr.height / 2);
  x.restore();
  x.globalAlpha = 1;
  // aim indicator: subtle eye glint direction
  if (p.aimAng !== null) {
    x.fillStyle = '#4df3ff';
    x.fillRect(p.x + Math.cos(p.lastAim) * 9 - 1, p.y - 6 + Math.sin(p.lastAim) * 5 - 1, 2, 2);
  }
  // familiars
  for (const f of p.fams) {
    const d = FAM_DEF[f.type] || FAM_DEF.duck;
    const s = Spr.cache[d.spr];
    if (!s) continue;
    const fb = Math.sin(G.time * 4 + f.i) * 2;
    x.fillStyle = 'rgba(0,0,0,.3)';
    x.beginPath(); x.ellipse(f.x, f.y + 7, 5, 2, 0, 0, G.TAU); x.fill();
    const sc = d.small ? .75 : d.big ? 1.3 : 1;
    x.save(); x.translate(f.x, f.y - 3 - fb); x.scale(sc, sc);
    x.drawImage(s, -s.width / 2, -s.height / 2);
    x.restore();
  }
  for (const o of p.orbs.filter(o => !o.eaten).concat(p.tempOrbs)) {
    if (Math.sin(o.phase + (o.offset || 0)) >= 0) Pl.drawOrb(x, o);
  }
  // merge conflict aura
  if (p.hasUniq('aura')) {
    x.strokeStyle = 'rgba(255,80,80,' + (0.15 + Math.sin(G.time * 5) * .08) + ')';
    x.beginPath(); x.arc(p.x, p.y, 34, 0, G.TAU); x.stroke();
  }
};
Pl.drawOrb = function (x, o) {
  if (o.x === undefined) return;
  x.save();
  if (o.moon) {
    // a moon: cratered, heavy, proud
    x.shadowColor = '#c3cbdd'; x.shadowBlur = 8;
    x.fillStyle = '#8a93a8';
    x.beginPath(); x.arc(o.x, o.y, 9, 0, G.TAU); x.fill();
    x.fillStyle = '#c3cbdd';
    x.beginPath(); x.arc(o.x - 2, o.y - 2, 7, 0, G.TAU); x.fill();
    x.fillStyle = '#6b7490';
    x.beginPath(); x.arc(o.x + 2, o.y - 3, 1.7, 0, G.TAU); x.arc(o.x - 3, o.y + 2, 2.2, 0, G.TAU); x.arc(o.x + 3, o.y + 3, 1.3, 0, G.TAU); x.fill();
  } else {
    x.shadowColor = o.burn ? '#ff7a5c' : (o.col || '#4df3ff'); x.shadowBlur = 6;
    x.fillStyle = o.burn ? '#ff7a5c' : (o.col || '#7fd4ff');
    x.beginPath(); x.arc(o.x, o.y, 5, 0, G.TAU); x.fill();
    x.fillStyle = '#fff'; x.fillRect(o.x - 1, o.y - 1, 2, 2);
  }
  x.restore();
};
