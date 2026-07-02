'use strict';
// ============================================================
// items.js: pools, pedestals, pickups, active effects, procs
// ============================================================
const It = {};
G.It = It;

// ---------- pools ----------
It.buildPools = function () {
  const locked = id => false; // unlock gating handled via meta in isUnlocked
  const pools = { t: [], s: [], b: [], d: [], x: [], c: [], u: [] };
  for (const it of G.PASSIVES) if (It.isUnlocked(it) && !it.modRemoved) pools[it.pool] ? pools[it.pool].push(it) : pools.t.push(it);
  for (const it of G.ACTIVES) if (It.isUnlocked(it) && !it.modRemoved) (pools[it.pool] || pools.t).push(it);
  // every special pool also gets a sampling of treasure items
  G.run.pools = pools;
  G.run.taken = {}; // "p12" / "a4" taken this run
};
It.isUnlocked = function (it) {
  const U = G.UNLOCK_ITEMS || {};
  const req = U[it.kind + ':' + it.name];
  return !req || G.meta.unlocks[req];
};
It.keyOf = it => (it.kind === 'active' ? 'a' : 'p') + it.id;

It.roll = function (poolId, rngFn) {
  const rng = rngFn || G.rng;
  let pool = (G.run.pools[poolId] || []).filter(i => !G.run.taken[It.keyOf(i)]);
  if (poolId !== 't' && (pool.length === 0 || rng() < 0.25)) pool = pool.concat(G.run.pools.t.filter(i => !G.run.taken[It.keyOf(i)]));
  if (!pool.length) pool = G.PASSIVES.filter(i => !G.run.taken[It.keyOf(i)]);
  if (!pool.length) return G.PASSIVES[0];
  // quality weighting: modest luck influence
  const luck = G.run.player ? G.run.player.stats.luck : 0;
  let tries = 1 + (luck > 2 ? 1 : 0);
  let best = null;
  for (let i = 0; i < tries; i++) {
    const cand = pool[Math.floor(rng() * pool.length)];
    if (!best || cand.q > best.q) best = cand;
  }
  return best;
};

// ---------- giving items ----------
It.givePassive = function (def) {
  const p = G.run.player;
  G.run.taken[It.keyOf(def)] = true;
  p.items.push(def);
  G.meta.itemsCollected++; G.meta.seenItems['p' + def.id] = true;
  // instant effects
  const fx = def.fx;
  if (fx.heal) p.heal(fx.heal);
  if (fx.healFull) p.heal(999);
  if (fx.uniq === 'coins15') p.coins += 15;
  if (fx.uniq === 'coins25') p.coins += 25;
  if (fx.uniq === 'investor') { const r = G.run.cur; It.spawnPedestal(r, 240, 160, It.roll('s'), 0); }
  p.recalc();
  if (fx.hp > 0 || fx.soul) p.heal(0); // clamp handled in recalc
  G.toast(def.name.toUpperCase(), '#4df3ff');
  G.toast(def.desc, '#8a93a8');
  Au.sfx('item'); G.Meta.check();
};
It.giveActive = function (def) {
  const p = G.run.player;
  G.run.taken[It.keyOf(def)] = true;
  G.meta.seenItems['a' + def.id] = true; G.meta.itemsCollected++;
  if (p.active) { // swap: drop old on floor
    const old = p.active;
    const r = G.run.cur;
    r.pedestals.push({ x: p.x, y: p.y - 20, def: old.def, taken: false, price: 0, hpCost: 0 });
    delete G.run.taken[It.keyOf(old.def)];
  }
  p.active = { def, charge: def.charge, max: def.charge };
  G.toast(def.name.toUpperCase(), '#ffb84d');
  G.toast(def.desc, '#8a93a8');
  Au.sfx('item'); G.Meta.check();
};
It.giveTrinket = function (id) {
  const p = G.run.player;
  const def = G.TRINKETS[id];
  if (p.trinket !== null && !p.hasUniq('cuffed')) {
    It.spawnPickup(G.run.cur, p.x, p.y - 20, 'trinket', p.trinket);
  }
  p.trinket = id;
  G.meta.seenItems['t' + id] = true;
  p.recalc();
  G.toast(def.name.toUpperCase(), '#58f08a');
  G.toast(def.desc, '#8a93a8');
  Au.sfx('pickup'); G.Meta.check();
};

// ---------- pedestals ----------
It.spawnPedestal = function (room, x, y, def, price, hpCost) {
  room.pedestals.push({ x, y, def, taken: false, price: price || 0, hpCost: hpCost || 0 });
};
It.updatePedestals = function (dt) {
  const r = G.run.cur, p = G.run.player;
  for (const pd of r.pedestals) {
    if (pd.taken || !pd.def) continue;
    if (G.dist(p.x, p.y, pd.x, pd.y - 8) < 16) {
      if (pd.price > 0) {
        if (p.coins >= pd.price) { p.coins -= pd.price; It.take(pd); }
        else if (!pd.warned) { pd.warned = true; G.toast('NEED ' + pd.price + ' CREDITS', '#ff5252'); Au.sfx('error'); }
      } else if (pd.hpCost > 0) {
        if (p.hpMax > pd.hpCost || p.soul > 0) {
          p.payHp(pd.hpCost); It.take(pd);
          G.meta.dealsTaken++; Au.sfx('devil');
        } else if (!pd.warned) { pd.warned = true; G.toast('NOT ENOUGH LIFE LEFT', '#ff5252'); Au.sfx('error'); }
      } else It.take(pd);
    } else pd.warned = false;
  }
};
It.take = function (pd) {
  pd.taken = true;
  Fx.tp(pd.x, pd.y - 10, '#4df3ff');
  if (pd.def.kind === 'active') It.giveActive(pd.def); else It.givePassive(pd.def);
  // choice pedestals: taking one removes siblings
  const r = G.run.cur;
  if (pd.group) for (const o of r.pedestals) if (o.group === pd.group && o !== pd) o.taken = true;
};

// ---------- pickups ----------
const PICKUP_DEFS = {
  battery: { spr: 'battery' }, batteryHalf: { spr: 'batteryHalf' }, batteryGold: { spr: 'batteryGold' },
  credit: { spr: 'credit' }, creditBig: { spr: 'creditBig' }, token: { spr: 'token' },
  bombP: { spr: 'bombP' }, cell: { spr: 'cell' },
  chest: { spr: 'chest' }, chestGold: { spr: 'chestGold' }, chestLocked: { spr: 'chestLocked' },
  trinket: { spr: null },
};
It.spawnPickup = function (room, x, y, type, arg) {
  room.pickups.push({ x, y, vx: G.fR(-30, 30), vy: G.fR(-50, -10), type, arg, t: 0, bob: G.fR(0, 6) });
};
It.randomDrop = function (room, x, y) {
  const p = G.run.player;
  const luck = p ? p.stats.luck : 0;
  const lootUp = p && p.hasUniq('lootUp') ? .12 : 0;
  const r = G.rng();
  let type = 'credit';
  if (r < .32) type = 'credit';
  else if (r < .45 + lootUp) type = G.rng() < .18 + luck * .02 ? 'battery' : 'batteryHalf';
  else if (r < .6) type = 'bombP';
  else if (r < .72) type = 'token';
  else if (r < .8) type = 'cell';
  else if (r < .84 + luck * .01) type = 'batteryGold';
  else type = 'credit';
  It.spawnPickup(room, x, y, type);
};
It.updatePickups = function (dt) {
  const r = G.run.cur, p = G.run.player;
  const magnet = p.hasUniq('magnet') ? 120 : p.hasUniq('magnetSmall') ? 60 : 0;
  for (let i = r.pickups.length - 1; i >= 0; i--) {
    const k = r.pickups[i];
    k.t += dt;
    k.vx *= .92; k.vy *= .92;
    k.x += k.vx * dt; k.y += k.vy * dt;
    k.x = G.clamp(k.x, 40, G.W - 40); k.y = G.clamp(k.y, G.HUD_H + 40, G.H - 40);
    if (magnet && k.t > .5 && !k.type.startsWith('chest')) {
      const d = G.dist(k.x, k.y, p.x, p.y);
      if (d < magnet) { const a = G.ang(k.x, k.y, p.x, p.y); k.x += Math.cos(a) * 90 * dt; k.y += Math.sin(a) * 90 * dt; }
    }
    if (k.t > .3 && G.dist(k.x, k.y, p.x, p.y) < 14) {
      if (It.collect(k)) { r.pickups.splice(i, 1); }
    }
  }
};
It.collect = function (k) {
  const p = G.run.player;
  switch (k.type) {
    case 'battery': if (p.hp >= p.hpMax * 2 && !p.hasUniq('soulConvert')) return false; p.heal(2); Au.sfx('battery'); Fx.float(k.x, k.y, '+BATTERY', '#58f08a'); break;
    case 'batteryHalf': if (p.hp >= p.hpMax * 2 && !p.hasUniq('soulConvert')) return false; p.heal(1); Au.sfx('battery'); Fx.float(k.x, k.y, '+', '#58f08a'); break;
    case 'batteryGold': p.soul += 2; Au.sfx('shield'); Fx.float(k.x, k.y, '+SHIELD', '#ffb84d'); break;
    case 'credit': { let v = 1; if (p.hasUniq('stockOptions') && p.hp >= p.hpMax * 2) v = 2; p.coins += v; G.meta.coinsCollected += v; Au.sfx('coin'); It.procEv('coin', {}); break; }
    case 'creditBig': p.coins += 5; G.meta.coinsCollected += 5; Au.sfx('coin'); Fx.float(k.x, k.y, '+5', '#4df3ff'); break;
    case 'token': p.keys++; Au.sfx('key'); break;
    case 'bombP': p.bombs++; Au.sfx('pickup'); break;
    case 'cell': p.addCharge(1); Au.sfx('charge'); break;
    case 'trinket': It.giveTrinket(k.arg); break;
    case 'chest': case 'chestGold': case 'chestLocked': {
      if (k.type === 'chestLocked') {
        if (p.keys < 1) { if (!k.warned) { k.warned = true; G.toast('NEEDS ACCESS TOKEN', '#ff5252'); } return false; }
        p.keys--;
      }
      It.openChest(k); break;
    }
  }
  return true;
};
It.openChest = function (k) {
  const r = G.run.cur;
  Fx.deathBurst(k.x, k.y, '#c9a23d');
  Au.sfx('secret');
  const gold = k.type !== 'chest';
  if (gold && G.chance(.45)) {
    It.spawnPedestal(r, k.x, k.y - 6, It.roll(G.chance(.5) ? 'b' : 't'), 0);
  } else if (G.chance(.25)) {
    It.spawnPickup(r, k.x, k.y, 'trinket', G.R(0, G.TRINKETS.length - 1));
  } else {
    const n = G.R(2, gold ? 5 : 3);
    for (let i = 0; i < n; i++) It.randomDrop(r, k.x + G.fR(-10, 10), k.y + G.fR(-10, 10));
  }
};
It.drawPickups = function (x) {
  const r = G.run.cur;
  for (const k of r.pickups) {
    const bob = Math.sin(G.time * 3 + k.bob) * 2;
    // shadow
    x.fillStyle = 'rgba(0,0,0,.35)';
    x.beginPath(); x.ellipse(k.x, k.y + 8, 6, 2.5, 0, 0, G.TAU); x.fill();
    if (k.type === 'trinket') {
      const ic = Spr.itemIcon(k.arg, G.TRINKETS[k.arg].name, 'trinket');
      x.drawImage(ic, k.x - ic.width / 2, k.y - ic.height / 2 + bob - 4);
    } else {
      const s = Spr.cache[PICKUP_DEFS[k.type].spr];
      if (s) x.drawImage(s, k.x - s.width / 2, k.y - s.height / 2 + bob - 2);
    }
  }
  // pedestals
  for (const pd of r.pedestals) {
    if (pd.taken || !pd.def) continue;
    const ped = Spr.cache.pedestal;
    x.drawImage(ped, pd.x - ped.width / 2, pd.y - 4);
    const ic = Spr.itemIcon(pd.def.id, pd.def.name, pd.def.kind);
    const bob = Math.sin(G.time * 2.2 + pd.x) * 2.5;
    // glow
    const glowCol = pd.hpCost ? '#ff3355' : pd.def.kind === 'active' ? '#ffb84d' : '#4df3ff';
    x.save(); x.shadowColor = glowCol; x.shadowBlur = 10;
    x.drawImage(ic, pd.x - ic.width / 2, pd.y - 24 + bob);
    x.restore();
    x.font = '7px monospace'; x.textAlign = 'center';
    if (pd.price) { x.fillStyle = '#ffb84d'; x.fillText(pd.price + '¢', pd.x, pd.y + 16); }
    if (pd.hpCost) { x.fillStyle = '#ff3355'; x.fillText(pd.hpCost + ' BATTERY', pd.x, pd.y + 16); }
    // name when near
    const p = G.run.player;
    if (G.dist(p.x, p.y, pd.x, pd.y) < 44) {
      x.fillStyle = '#eef4ff'; x.fillText(pd.def.name, pd.x, pd.y - 30);
      x.fillStyle = '#8a93a8'; x.fillText(pd.def.desc, pd.x, pd.y - 22);
    }
    x.textAlign = 'left';
  }
};

// ---------- proc system ----------
const PROC_DO = {
  drop: (c) => It.randomDrop(G.run.cur, c.x, c.y),
  coin: (c) => It.spawnPickup(G.run.cur, c.x, c.y, 'credit'),
  healHalf: () => G.run.player.heal(1),
  halfHeart: (c) => It.spawnPickup(G.run.cur, c.x, c.y, 'batteryHalf'),
  explode: (c) => G.Sh.explodeAt(c.x, c.y, 40, G.run.player.stats.dmg * 2, true),
  charge: () => G.run.player.addCharge(.34),
  ally: (c) => G.En.spawnAlly(c.x, c.y),
  lightning: () => G.Sh.lightningStrike(),
  soulFrag: () => { G.run.player.soul += 1; Au.sfx('shield'); },
  fearNova: (c) => G.En.statusNear(c.x, c.y, 90, 'fear', 2.5),
  nova: () => G.Sh.nova(12, false),
  miniNova: (c) => G.Sh.novaAt(c.x, c.y, 6, G.run.player.stats.dmg * .6),
  blink: () => G.Player.blink(),
};
It.procEv = function (ev, ctx) {
  const p = G.run.player; if (!p) return;
  const entropy = p.hasUniq('entropyUp') ? 1.25 : p.hasUniq('entropySmall') ? 1.1 : 1;
  const luck = p.stats.luck;
  for (const src of p.allFx()) {
    if (!src.proc) continue;
    for (const pr of src.proc) {
      if (pr.ev !== ev) continue;
      let chance = pr.p * entropy * (1 + luck * .06);
      if (p.hasUniq('rhythm')) { p._rhythm = (p._rhythm || 0) + pr.p; if (p._rhythm >= 1) { p._rhythm -= 1; chance = 1; } else chance = 0; }
      if (chance >= 1 || G.rng() < chance) PROC_DO[pr.do] && PROC_DO[pr.do](ctx || { x: p.x, y: p.y });
    }
  }
};

// ---------- active item effects ----------
function allEnemies() { return G.run.cur.enemies.filter(e => !e.dead && !e.friendly); }
function dmgAll(d) { for (const e of allEnemies()) G.En.damage(e, d, { fromActive: true }); G.addShake(6); }
function statusAll(k, t) { for (const e of allEnemies()) G.En.status(e, k, t); }

const ACTIVE_FX = {
  nuke: a => { dmgAll(a); G.flashScreen('rgba(120,220,255,.3)', .15); Fx.spawn(240, 176, { n: 40, col: ['#4df3ff', '#fff'], life: .8, spMin: 60, spMax: 260, glow: true }); },
  nukeStun: a => { dmgAll(a); statusAll('frozen', 1.5); },
  nukeExecute: a => { dmgAll(a); for (const e of allEnemies()) if (e.hp < e.hpMax * .3) G.En.damage(e, 999, { fromActive: true }); },
  freeze: a => { statusAll('frozen', a); G.flashScreen('rgba(140,200,255,.25)', .12); },
  freezeOne: a => { const es = allEnemies(); if (es.length) { es.sort((x, y) => G.dist(x.x, x.y, G.run.player.x, G.run.player.y) - G.dist(y.x, y.y, G.run.player.x, G.run.player.y)); G.En.status(es[0], 'frozen', a); } },
  fearAll: a => statusAll('fear', a),
  charmN: a => { const es = allEnemies().slice(0, a); for (const e of es) G.En.charm(e); },
  slowAll: a => statusAll('slow', a),
  bulletTime: a => { G.run.bulletTime = a; statusAll('slow', a); },
  heal: a => G.run.player.heal(a),
  healFull: () => G.run.player.heal(999),
  soul: a => { G.run.player.soul += a; Au.sfx('shield'); },
  invuln: a => { G.run.player.iframes = Math.max(G.run.player.iframes, a); Au.sfx('shield'); },
  invulnNova: a => { G.run.player.iframes = Math.max(G.run.player.iframes, a); ACTIVE_FX.push(); },
  tpRandom: () => G.Dg.teleportRandom(),
  tpStart: () => G.Dg.teleportStart(),
  tpUnexplored: () => G.Dg.teleportUnexplored(),
  blink: () => G.Player.blink(),
  blinkPush: () => { G.Player.blink(); ACTIVE_FX.push(); },
  rerollSelf: () => {
    const p = G.run.player;
    const n = p.items.length;
    p.items = [];
    for (let i = 0; i < n; i++) { const it = It.roll('t'); G.run.taken[It.keyOf(it)] = true; p.items.push(it); }
    p.recalc(); G.toast('REALITY RECOMPILED', '#b76bff'); Au.sfx('levelup');
  },
  rerollItems: () => { for (const pd of G.run.cur.pedestals) if (!pd.taken && pd.def) pd.def = It.roll(pd.def.kind === 'active' ? 't' : 't'); Au.sfx('active'); },
  rerollChaotic: () => { ACTIVE_FX.rerollItems(); ACTIVE_FX.rerollPickups(); if (G.chance(.2)) ACTIVE_FX.rerollSelf(); },
  rerollPickups: () => { const r = G.run.cur; for (const k of r.pickups) if (!k.type.startsWith('chest')) { k.type = G.pick(['credit', 'batteryHalf', 'bombP', 'token', 'cell', 'battery']); } Au.sfx('active'); },
  rerollEnemies: () => { G.En.transformAll(); },
  dupePickup: () => { const r = G.run.cur; if (r.pickups.length) { const k = G.pick(r.pickups); It.spawnPickup(r, k.x + 8, k.y, k.type, k.arg); } },
  dupeAll: () => { const r = G.run.cur; const cur = r.pickups.slice(); for (const k of cur) It.spawnPickup(r, k.x + 8, k.y, k.type, k.arg); },
  coins: a => { for (let i = 0; i < a + G.R(-1, 1); i++) It.spawnPickup(G.run.cur, G.run.player.x + G.fR(-20, 20), G.run.player.y + G.fR(-20, 20), 'credit'); },
  key: () => It.spawnPickup(G.run.cur, G.run.player.x, G.run.player.y - 16, 'token'),
  bombs: a => { for (let i = 0; i < a; i++) It.spawnPickup(G.run.cur, G.run.player.x + G.fR(-16, 16), G.run.player.y - 16, 'bombP'); },
  drop: a => { for (let i = 0; i < a; i++) It.randomDrop(G.run.cur, G.run.player.x + G.fR(-20, 20), G.run.player.y + G.fR(-20, 20)); },
  turret: a => G.En.spawnTurret(G.run.player.x, G.run.player.y, a),
  allies: a => { for (let i = 0; i < a; i++) G.En.spawnAlly(G.run.player.x + G.fR(-20, 20), G.run.player.y + G.fR(-20, 20)); },
  bloodMoney: a => { const p = G.run.player; if (p.hp > 2 || p.soul > 0) { p.payHp(1); ACTIVE_FX.coins(a); } else G.toast('TOO WEAK', '#ff5252'); },
  buyHealth: a => { const p = G.run.player; if (p.coins >= a) { p.coins -= a; p.heal(4); } else G.toast('NEED ' + a + ' CREDITS', '#ff5252'); },
  soulSell: a => { const p = G.run.player; const n = p.soul; p.soul = 0; p.coins += n * a; if (n) Au.sfx('coin'); },
  hpForDmg: () => { const p = G.run.player; if (p.hpMax > 1) { p.hpMax--; p.hp = Math.min(p.hp, p.hpMax * 2); p.permDmg = (p.permDmg || 0) + .8; p.recalc(); G.toast('POWER AT A PRICE', '#ff3355'); Au.sfx('devil'); } },
  hpForItem: () => { const p = G.run.player; if (p.hpMax > 1) { p.hpMax--; p.hp = Math.min(p.hp, p.hpMax * 2); p.recalc(); It.spawnPedestal(G.run.cur, p.x, p.y - 30, It.roll('d'), 0); Au.sfx('devil'); } },
  coinsToHp: a => { const p = G.run.player; const heal = Math.floor(p.coins / a); p.coins -= heal * a; p.heal(heal); },
  nova: a => G.Sh.nova(a, false),
  novaPierce: a => G.Sh.nova(a, true),
  cross: () => G.Sh.crossBeams(),
  poisonCloud: () => G.En.statusNear(G.run.player.x, G.run.player.y, 110, 'poison', 5),
  burnWave: () => { statusAll('burn', 4); G.flashScreen('rgba(255,120,60,.25)', .15); },
  blackHole: a => { G.run.blackHoles.push({ x: G.run.player.x, y: G.run.player.y, t: a, consumed: 0 }); },
  push: () => { for (const e of allEnemies()) { const an = G.ang(G.run.player.x, G.run.player.y, e.x, e.y); e.kx = Math.cos(an) * 380; e.ky = Math.sin(an) * 380; } G.addShake(5); Fx.ring(G.run.player.x, G.run.player.y, '#4df3ff', 6, 90, .3); },
  lightning: a => { for (let i = 0; i < a; i++) G.Sh.lightningStrike(); },
  lightningAll: () => { for (const e of allEnemies()) G.Sh.lightningAt(e); },
  giantNext: a => { G.run.player.giantShots = a; },
  tearsRoom: () => { G.run.roomBuff = G.run.roomBuff || {}; G.run.roomBuff.tears = 1; G.run.player.recalc(); },
  dmgRoom: () => { G.run.roomBuff = G.run.roomBuff || {}; G.run.roomBuff.dmg = 1; G.run.player.recalc(); },
  allRoom: () => { G.run.roomBuff = { tears: .6, dmg: .6 }; G.run.player.recalc(); },
  mapReveal: () => G.Dg.revealMap(false),
  mapSecrets: () => G.Dg.revealMap(true),
  openDoors: () => G.Dg.openAllDoors(),
  freeUnlock: () => { G.run.player.freeUnlocks = (G.run.player.freeUnlocks || 0) + 1; G.toast('ONE FREE UNLOCK', '#4df3ff'); },
  breakRocks: () => G.Dg.breakAllRocks(),
  trapdoor: () => { G.Dg.nextFloor(); },
  gamble: () => {
    const r = G.rng();
    if (r < .3) ACTIVE_FX.coins(3);
    else if (r < .5) It.spawnPickup(G.run.cur, G.run.player.x, G.run.player.y - 16, 'battery');
    else if (r < .65) ACTIVE_FX.bombs(1);
    else if (r < .8) ACTIVE_FX.key();
    else { for (let i = 0; i < 3; i++) G.En.spawnAt('gnat', G.run.player.x + G.fR(-40, 40), G.run.player.y + G.fR(-40, 40)); G.toast('BUGS!', '#ff5252'); }
  },
  roulette: () => {
    const r = G.rng();
    if (r < .25) { ACTIVE_FX.dmgRoom(); G.toast('JACKPOT: DEMO MODE', '#58f08a'); }
    else if (r < .5) { ACTIVE_FX.heal(2); G.toast('LUCKY: HEALED', '#58f08a'); }
    else if (r < .7) { ACTIVE_FX.nuke(12); G.toast('CRITICAL SUCCESS', '#58f08a'); }
    else if (r < .9) { G.run.player.hurt(1, null, true); G.toast('IT BLEW UP', '#ff5252'); }
    else { ACTIVE_FX.rerollSelf(); }
  },
  mystery: () => { const keys = ['nuke', 'freeze', 'coins', 'heal', 'nova', 'push', 'gamble', 'allies']; const k = G.pick(keys); ACTIVE_FX[k](k === 'nuke' ? 10 : k === 'freeze' ? 3 : k === 'coins' ? 3 : k === 'heal' ? 2 : k === 'nova' ? 12 : 4); },
  copycat: () => { const other = G.pick(G.ACTIVES.filter(a => a.fx[0] !== 'copycat' && a.fx[0] !== 'repeat')); ACTIVE_FX[other.fx[0]](other.fx[1]); G.toast('COPIED: ' + other.name, '#8a93a8'); },
  repeat: () => { const last = G.run.lastActive; if (last && ACTIVE_FX[last[0]]) ACTIVE_FX[last[0]](last[1]); },
  famBurst: () => G.Player.famBurst(),
  dot: a => { G.run.dotTimer = a; },
  selfBomb: () => { G.Sh.explodeAt(G.run.player.x, G.run.player.y, 70, G.run.player.stats.dmg * 4, true); },
  bossPeek: () => { G.Dg.revealBoss(); G.run.clearChargeBonus = 1; },
  cursedCompile: () => { G.En.transformAll(true); const r = G.run.cur; for (let i = 0; i < 3; i++) It.randomDrop(r, 240 + G.fR(-40, 40), 176 + G.fR(-30, 30)); },
  mirror: a => { G.run.player.mirrorT = a; },
  hallPass: () => { G.run.player.hallPass = true; },
  sleepAll: () => statusAll('sleep', 12),
  muteAll: a => statusAll('mute', a),
  volleyX: a => { G.run.player.volleyX = a; },
  haste: a => { G.run.player.hasteT = a; G.run.player.recalc(); },
  magnetAll: () => { const r = G.run.cur; for (const k of r.pickups) { k.vx = (G.run.player.x - k.x) * 2; k.vy = (G.run.player.y - k.y) * 2; } },
  executeWeak: a => { const es = allEnemies().sort((x, y) => x.hp - y.hp).slice(0, a); for (const e of es) G.En.damage(e, 999, { fromActive: true }); },
  clearBullets: () => { G.run.cur.eshots.length = 0; Fx.ring(G.run.player.x, G.run.player.y, '#fff', 10, 120, .4); },
  identify: () => { G.toast('ALL EFFECTS ANNOTATED', '#8a93a8'); G.run.player.identified = true; },
  spiral: a => G.Sh.spiral(a),
  decoys: a => { for (let i = 0; i < a; i++) G.En.spawnDecoy(G.run.player.x + G.fR(-30, 30), G.run.player.y + G.fR(-30, 30)); },
  throwBomb: () => G.Sh.throwBomb(),
  shieldHits: a => { G.run.player.hitShield = a; Au.sfx('shield'); },
  rebootHeal: () => { const p = G.run.player; p.soul = 0; p.heal(999); },
  goldChest: () => It.spawnPickup(G.run.cur, G.run.player.x, G.run.player.y - 24, 'chestGold'),
  warranty: () => { G.run.player.warranty = true; },
  yolo: () => { G.run.roomBuff = G.run.roomBuff || {}; G.run.roomBuff.dmg = 2; G.run.player.yolo = true; G.run.player.recalc(); },
  openChests: () => { const r = G.run.cur; for (let i = r.pickups.length - 1; i >= 0; i--) { const k = r.pickups[i]; if (k.type.startsWith('chest')) { r.pickups.splice(i, 1); It.openChest(k); } } },
  killTurrets: () => { for (const e of allEnemies()) if (e.def.tag === 'turret') G.En.damage(e, 999, { fromActive: true }); },
  swapHp: () => { const p = G.run.player; const h = p.hp; p.hp = Math.min(p.hpMax * 2, p.soul); p.soul = h; },
  executeLow: a => { for (const e of allEnemies()) if (!e.boss && e.hp < e.hpMax * a) G.En.damage(e, 999, { fromActive: true }); },
  selfCharge: a => { const p = G.run.player; if (p.active) p.active.charge = Math.min(p.active.max, p.active.charge + a); },
  tarpit: a => statusAll('slow', a),
  confuse: a => statusAll('confuse', a),
};
It.ACTIVE_FX = ACTIVE_FX;

It.useActive = function () {
  const p = G.run.player;
  if (!p.active) return;
  if (p.active.charge < p.active.max) { Au.sfx('error'); return; }
  const [fn, arg] = p.active.def.fx;
  if (ACTIVE_FX[fn]) ACTIVE_FX[fn](arg);
  G.run.lastActive = p.active.def.fx;
  if (p.warranty) { p.warranty = false; G.toast('WARRANTY HONORED', '#58f08a'); }
  else p.active.charge = 0;
  Au.sfx('active');
  Fx.ring(p.x, p.y, '#ffb84d', 4, 40, .35);
  G.Meta.stat('activesUsed');
};
