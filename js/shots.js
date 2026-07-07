'use strict';
// ============================================================
// shots.js: player projectiles + THE SYNERGY PIPELINE
// Items don't stack stats — they compose behaviors here.
// ============================================================
const Sh = { list: [], bombs: [], bolts: [] };
G.Sh = Sh;

Sh.clear = function () { Sh.list.length = 0; Sh.bombs.length = 0; Sh.bolts.length = 0; if (Sh.beams) Sh.beams.length = 0; if (G.run) G.run.blackHoles = []; };

// ---------- creation ----------
Sh.mkShot = function (x, y, ang, o) {
  o = o || {};
  const p = G.run.player, st = p.stats, m = p.mods;
  const spd = (o.spd || st.shotspd) * (m.uniq.oldWays ? .45 : 1);
  let scale = 1 + (m.shotScale || 0) + (o.scaleAdd || 0);
  if (m.uniq.oldWays) scale += .8;
  let dmg = o.dmg !== undefined ? o.dmg : st.dmg;
  if (m.uniq.oldWays) dmg *= 2.2;
  if (o.giant) { scale += 1.2; dmg *= 3; }
  if (o.gold) { scale += .4; dmg *= 3; }
  // crit
  let crit = false;
  if (G.rng() < (m.critC || 0) + st.luck * .01) { crit = true; dmg *= 3 + (m.critX || 0); scale += .25; }
  const s = {
    x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
    ang, dmg, r: 3.5 * scale, scale,
    life: o.life !== undefined ? o.life : st.range / spd,
    maxLife: o.life !== undefined ? o.life : st.range / spd,
    from: o.from || 'player',
    pierce: o.pierce !== undefined ? o.pierce : (m.pierce || 0),
    spectral: o.spectral !== undefined ? o.spectral : !!m.spectral,
    homing: m.homing || 0,
    bounce: o.bounce !== undefined ? o.bounce : (m.bounce || 0),
    split: o.noSplit ? 0 : (m.split || 0),
    depth: o.depth || 0,
    boomerang: !!m.boomerang, retT: 0,
    wavy: !!m.wavy, wPhase: G.fR(0, G.TAU),
    crit, gold: !!o.gold, giant: !!o.giant,
    hit: new Set(),
    orbitHold: (m.uniq.orbitShots && !o.noOrbit) ? .55 : 0, orbA: G.fR(0, G.TAU),
    edgeLoop: !!m.uniq.edgeLoop && !o.noOrbit,
    col: o.col || Sh.shotColor(),
    t: 0, didHit: false,
  };
  // momentum: shots inherit a chunk of the player's velocity
  if (o.inherit) { s.vx += p.vx * .42; s.vy += p.vy * .42; }
  Sh.list.push(s);
  return s;
};

Sh.shotColor = function () {
  const m = G.run.player.mods;
  if (m.poison > .3) return '#58f08a';
  if (m.burn > .3) return '#ff7a5c';
  if (m.homing > .5) return '#b76bff';
  if (m.slow > .3) return '#7fd4ff';
  return '#4df3ff';
};

// ---------- the volley builder (synergy: patterns compose) ----------
Sh.fire = function (ang) {
  const p = G.run.player, m = p.mods;
  p.shotCounter = (p.shotCounter || 0) + 1;
  // racy: random double/skip
  if (m.uniq.racy) { const r = G.rng(); if (r < .2) return; }
  const volleys = m.uniq.racy && G.rng() < .3 ? 2 : 1;
  for (let v = 0; v < volleys; v++) {
    let count = 1 + (m.countAdd || 0);
    if (p.volleyX) { count *= p.volleyX; p.volleyX = 0; }
    const spreadN = (m.spreadAdd || 0);
    const jitter = m.uniq.inaccurate ? G.fR(-.22, .22) : 0;
    const shots = [];
    // parallel shots
    for (let i = 0; i < count; i++) {
      const off = (i - (count - 1) / 2) * 8;
      const px = p.x + Math.cos(ang + Math.PI / 2) * off;
      const py = p.y + Math.sin(ang + Math.PI / 2) * off;
      shots.push([px, py, ang + jitter]);
    }
    // spread fan
    for (let i = 1; i <= spreadN; i++) {
      shots.push([p.x, p.y, ang + i * .18 + jitter]);
      shots.push([p.x, p.y, ang - i * .18 + jitter]);
    }
    if (m.backShot || p.mirrorT > 0) shots.push([p.x, p.y, ang + Math.PI]);
    if (m.sideShots) { shots.push([p.x, p.y, ang + Math.PI / 2]); shots.push([p.x, p.y, ang - Math.PI / 2]); }
    if (m.uniq.quadNth && p.shotCounter % 6 === 0) for (let i = 1; i < 4; i++) shots.push([p.x, p.y, ang + i * Math.PI / 2]);
    // nth-shot specials
    const giant = (m.uniq.bigNth && p.shotCounter % 8 === 0) || (p.giantShots > 0);
    if (p.giantShots > 0) p.giantShots--;
    const gold = m.uniq.goldNth && p.shotCounter % 12 === 0;
    const first = m.uniq.firstShot && !G.run.cur.firedIn;
    G.run.cur.firedIn = true;
    for (const [sx, sy, sa] of shots) {
      const s = Sh.mkShot(sx, sy, sa, { giant, gold, inherit: true });
      if (first) s.dmg *= 4;
      // microservices: replace each with 2 weak fast
      if (m.uniq.micro && !giant) {
        s.dmg *= .45; s.scale *= .7; s.r *= .7;
        const s2 = Sh.mkShot(sx, sy, sa + .08, { noOrbit: true, inherit: true }); s2.dmg *= .45; s2.scale *= .7; s2.r *= .7;
      }
    }
  }
  Au.sfx(m.uniq.bigNth && p.shotCounter % 8 === 0 ? 'shootBig' : 'shoot');
  // muzzle particles
  Fx.spawn(p.x + Math.cos(ang) * 8, p.y + Math.sin(ang) * 8, { n: 3, ang, spread: .4, col: [Sh.shotColor(), '#fff'], life: .18, spMin: 40, spMax: 90, grav: 0, glow: true });
};

// ---------- specials ----------
Sh.nova = function (n, pierce) {
  const p = G.run.player;
  for (let i = 0; i < n; i++) {
    const s = Sh.mkShot(p.x, p.y, i * G.TAU / n, { noOrbit: true });
    if (pierce) s.pierce = 99;
  }
  Au.sfx('shootBig');
};
Sh.novaAt = function (x, y, n, dmg) {
  for (let i = 0; i < n; i++) Sh.mkShot(x, y, i * G.TAU / n, { dmg, noOrbit: true, noSplit: true, life: .5 });
};
Sh.spiral = function (n) {
  const p = G.run.player;
  for (let i = 0; i < n; i++) {
    const s = Sh.mkShot(p.x, p.y, i * G.TAU / n * 2, { noOrbit: true, spd: 120 + i * 8 });
    s.pierce = 99;
  }
};
Sh.crossBeams = function () {
  const p = G.run.player;
  for (let d = 0; d < 4; d++) for (let i = 0; i < 9; i++) {
    const s = Sh.mkShot(p.x, p.y, d * Math.PI / 2 + i * .012, { noOrbit: true, spd: 340 + i * 25 });
    s.pierce = 99; s.spectral = true;
  }
  G.addShake(4); Au.sfx('shootBig');
};
Sh.lightningStrike = function () {
  const es = G.run.cur.enemies.filter(e => !e.dead && !e.friendly);
  if (!es.length) return;
  Sh.lightningAt(G.pick(es));
};
Sh.lightningAt = function (e) {
  const dmg = G.run.player.stats.dmg * 1.5;
  G.En.damage(e, dmg, { electric: true });
  Sh.bolts.push({ x1: e.x + G.fR(-30, 30), y1: G.HUD_H, x2: e.x, y2: e.y, t: .15 });
  Fx.hitSpark(e.x, e.y, '#ffe24d');
  Au.sfx('hit'); G.addShake(2);
};
Sh.throwBomb = function () {
  const p = G.run.player;
  const a = p.lastAim || 0;
  Sh.bombs.push({ x: p.x, y: p.y, vx: Math.cos(a) * 190, vy: Math.sin(a) * 190, fuse: .8, r: 60, dmg: p.stats.dmg * 4, thrown: true });
};
Sh.placeBomb = function (x, y) {
  Sh.bombs.push({ x, y, vx: 0, vy: 0, fuse: 1.5, r: 65, dmg: 10 + G.run.player.stats.dmg * 2 });
};
Sh.explodeAt = function (x, y, r, dmg, friendly, playerSafe) {
  Fx.explosion(x, y, r);
  Au.sfx('boom');
  const room = G.run.cur, p = G.run.player;
  for (const e of room.enemies) {
    if (e.dead || e.friendly) continue;
    if (G.dist(x, y, e.x, e.y) < r + e.r) G.En.damage(e, dmg, { explosion: true });
  }
  // physics: shove enemies and pickups away from the blast
  for (const e of room.enemies) {
    if (e.dead || e.boss) continue;
    const d = G.dist(x, y, e.x, e.y);
    if (d < r * 1.5) { const a = G.ang(x, y, e.x, e.y); const f = 260 * (1 - d / (r * 1.5)); e.kx = (e.kx || 0) + Math.cos(a) * f; e.ky = (e.ky || 0) + Math.sin(a) * f; }
  }
  for (const k of room.pickups) {
    const d = G.dist(x, y, k.x, k.y);
    if (d < r * 1.4) { const a = G.ang(x, y, k.x, k.y); const f = 180 * (1 - d / (r * 1.4)); k.vx += Math.cos(a) * f; k.vy += Math.sin(a) * f; }
  }
  // ignite any oil in the blast
  for (const z of room.zones) {
    if (z.type === 'oil' && G.dist(x, y, z.x, z.y) < r + z.r) G.En.igniteZone(z);
  }
  // nest payload: friendly explosions hatch allied spiders
  if (friendly && p.hasUniq('explodeSpiders')) {
    const spiders = room.enemies.filter(e => !e.dead && e.isSpider).length;
    if (spiders < 5) G.En.spawnSpider(x + G.fR(-8, 8), y + G.fR(-8, 8));
  }
  if (!playerSafe && !p.hasUniq('bombImmune') && G.dist(x, y, p.x, p.y) < r * .8) p.hurt(1, null, true);
  G.Dg.bombAt(x, y, r);
  G.meta.bombsUsed++;
};

// ---------- lasers ----------
Sh.beams = [];
Sh.fireLaser = function (x1, y1, target, dmg) {
  const p = G.run.player;
  const a = G.ang(x1, y1, target.x, target.y);
  const x2 = target.x + Math.cos(a) * 60, y2 = target.y + Math.sin(a) * 60;
  const freeze = p.hasUniq('laserFreeze');
  // hit every enemy near the beam segment
  for (const e of G.run.cur.enemies) {
    if (e.dead || e.friendly) continue;
    // point-segment distance
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy || 1;
    const tt = G.clamp(((e.x - x1) * dx + (e.y - y1) * dy) / len2, 0, 1);
    const px = x1 + dx * tt, py = y1 + dy * tt;
    if (G.dist(e.x, e.y, px, py) < e.r + 5) {
      G.En.damage(e, dmg, {});
      if (freeze) G.En.status(e, 'frozen', 1.3);
      Fx.hitSpark(e.x, e.y, freeze ? '#7fd4ff' : '#ff4da6');
    }
  }
  Sh.beams.push({ x1, y1, x2, y2, t: .14, col: freeze ? '#7fd4ff' : '#ff4da6' });
  Au.sfx('shoot');
};

// ---------- update ----------
Sh.update = function (dt) {
  const p = G.run.player, m = p.mods;
  const r = G.run.cur;
  for (let i = Sh.list.length - 1; i >= 0; i--) {
    const s = Sh.list[i];
    s.t += dt;
    // orbit-then-launch (Orbital Review)
    if (s.orbitHold > 0) {
      s.orbitHold -= dt;
      s.orbA += dt * 9;
      s.x = p.x + Math.cos(s.orbA) * 22;
      s.y = p.y + Math.sin(s.orbA) * 22;
      if (s.orbitHold <= 0) { const sp = Math.hypot(s.vx, s.vy); s.vx = Math.cos(s.orbA) * sp; s.vy = Math.sin(s.orbA) * sp; }
      continue;
    }
    // edge loop: circle the room
    if (s.edgeLoop) {
      const cx = G.W / 2, cy = (G.H + G.HUD_H) / 2;
      const a = Math.atan2(s.y - cy, s.x - cx) + dt * 1.8;
      const rad = Math.min(190, G.dist(s.x, s.y, cx, cy) + 40 * dt);
      s.x = cx + Math.cos(a) * rad; s.y = cy + Math.sin(a) * rad * .66;
      s.life -= dt * .5;
    } else {
      // homing
      if (s.homing > 0) {
        let best = null, bd = 130;
        for (const e of r.enemies) { if (e.dead || e.friendly) continue; const d = G.dist(s.x, s.y, e.x, e.y); if (d < bd) { bd = d; best = e; } }
        if (best) {
          const want = G.ang(s.x, s.y, best.x, best.y);
          const cur = Math.atan2(s.vy, s.vx);
          const na = G.aLerp(cur, want, s.homing * dt * 6);
          const sp = Math.hypot(s.vx, s.vy);
          s.vx = Math.cos(na) * sp; s.vy = Math.sin(na) * sp;
        }
      }
      // boomerang
      if (s.boomerang && s.t > s.maxLife * .45) {
        const want = G.ang(s.x, s.y, p.x, p.y);
        const cur = Math.atan2(s.vy, s.vx);
        const na = G.aLerp(cur, want, dt * 8);
        const sp = Math.hypot(s.vx, s.vy) * 1.01;
        s.vx = Math.cos(na) * sp; s.vy = Math.sin(na) * sp;
        if (G.dist(s.x, s.y, p.x, p.y) < 10 && s.t > s.maxLife * .7) { Sh.list.splice(i, 1); continue; }
      }
      // async await: pause then surge
      if (m.uniq.pauseShots) {
        const ph = s.t / s.maxLife;
        const mult = (ph > .3 && ph < .5) ? .1 : (ph >= .5 ? 1.8 : 1);
        s.x += s.vx * dt * mult; s.y += s.vy * dt * mult;
      } else {
        let mult = 1;
        if (m.uniq.accelShots) mult = .6 + s.t * 2;
        if (m.uniq.growShots) { mult = Math.max(.3, 1.2 - s.t * 1.2); s.r = 3.5 * s.scale * (1 + s.t * 1.3); s.dmg += dt * 3; }
        s.x += s.vx * dt * mult; s.y += s.vy * dt * mult;
      }
      if (s.wavy) { const perp = Math.atan2(s.vy, s.vx) + Math.PI / 2; const w = Math.sin(s.t * 14 + s.wPhase) * 60 * dt; s.x += Math.cos(perp) * w; s.y += Math.sin(perp) * w; }
    }
    // quantum duplicate
    if (m.uniq.quantum && G.rng() < dt * .25 && Sh.list.length < 120 && !s.qDup) {
      s.qDup = true;
      const s2 = Object.assign({}, s, { hit: new Set(), qDup: true, ang: s.ang + .3 });
      const sp = Math.hypot(s.vx, s.vy); s2.vx = Math.cos(s.ang + .3) * sp; s2.vy = Math.sin(s.ang + .3) * sp;
      Sh.list.push(s2);
    }
    s.life -= dt;
    // trail
    if ((G.frame + i) % 3 === 0) Fx.parts.push({ x: s.x, y: s.y, vx: 0, vy: 0, g: 0, t: .16, max: .16, col: s.gold ? '#ffe24d' : s.col, s: s.r * .8, glow: false, fric: 1 });
    // tile collision
    if (!s.spectral && G.Dg.solidAt(s.x, s.y)) {
      if (s.bounce > 0) { s.bounce--; Sh.bounceOff(s); }
      else { Sh.pop(s, i); continue; }
    }
    // walls
    if (s.x < 34 || s.x > G.W - 34 || s.y < G.HUD_H + 34 || s.y > G.H - 34) {
      if (s.bounce > 0 && s.life > 0) { s.bounce--; if (s.x < 34 || s.x > G.W - 34) s.vx *= -1; else s.vy *= -1; s.x = G.clamp(s.x, 34, G.W - 34); s.y = G.clamp(s.y, G.HUD_H + 34, G.H - 34); }
      else { Sh.pop(s, i); continue; }
    }
    if (s.life <= 0) { if (m.uniq.splitExpire && s.split > 0) Sh.doSplit(s); Sh.pop(s, i, true); continue; }
    // enemy collision
    let consumed = false;
    for (const e of r.enemies) {
      if (e.dead || e.friendly || s.hit.has(e)) continue;
      if (e.spawnProt > 0) continue;
      const d = G.dist(s.x, s.y, e.x, e.y);
      if (d < s.r + e.r) {
        consumed = Sh.onHit(s, e, i);
        if (consumed) break;
      }
    }
    if (consumed) continue;
  }
  // bombs
  for (let i = Sh.bombs.length - 1; i >= 0; i--) {
    const b = Sh.bombs[i];
    b.vx *= .94; b.vy *= .94;
    b.x += b.vx * dt; b.y += b.vy * dt;
    b.fuse -= dt;
    if (b.fuse <= 0) { Sh.explodeAt(b.x, b.y, b.r, b.dmg, true); Sh.bombs.splice(i, 1); }
  }
  // bolts & beams fade
  for (let i = Sh.bolts.length - 1; i >= 0; i--) { Sh.bolts[i].t -= dt; if (Sh.bolts[i].t <= 0) Sh.bolts.splice(i, 1); }
  for (let i = Sh.beams.length - 1; i >= 0; i--) { Sh.beams[i].t -= dt; if (Sh.beams[i].t <= 0) Sh.beams.splice(i, 1); }
  // black holes
  for (let bi = G.run.blackHoles.length - 1; bi >= 0; bi--) {
    const bh = G.run.blackHoles[bi];
    bh.t -= dt;
    // pull + crush enemies
    for (const e of r.enemies) {
      if (e.dead || e.boss || e.friendly) continue;
      const d = G.dist(e.x, e.y, bh.x, bh.y);
      if (d < 150) {
        const a = G.ang(e.x, e.y, bh.x, bh.y);
        const f = 150 * (1 - d / 170);
        e.x += Math.cos(a) * f * dt; e.y += Math.sin(a) * f * dt;
        if (d < 16) { e.crushAcc = (e.crushAcc || 0) + dt; if (e.crushAcc > .35) { e.crushAcc = 0; G.En.damage(e, p.stats.dmg * .5, {}); } }
      }
    }
    // devour enemy bullets
    const es = r.eshots;
    for (let i = es.length - 1; i >= 0; i--) {
      const d = G.dist(es[i].x, es[i].y, bh.x, bh.y);
      if (d < 90) {
        const a = G.ang(es[i].x, es[i].y, bh.x, bh.y);
        es[i].vx += Math.cos(a) * 500 * dt; es[i].vy += Math.sin(a) * 500 * dt;
        if (d < 12) { Fx.hitSpark(es[i].x, es[i].y, '#b76bff'); es.splice(i, 1); }
      }
    }
    // accretion engine: devour your orbitals, coalesce into moons
    if (m.uniq.bhAccrete) {
      bh.eatT = (bh.eatT || 0) - dt;
      if (bh.eatT <= 0) {
        bh.eatT = .45;
        let eaten = false;
        for (let i = p.tempOrbs.length - 1; i >= 0 && !eaten; i--) {
          const o = p.tempOrbs[i];
          if (!o.moon && o.x !== undefined && G.dist(o.x, o.y, bh.x, bh.y) < 110) { Fx.tp(o.x, o.y, '#b76bff'); p.tempOrbs.splice(i, 1); eaten = true; }
        }
        if (!eaten) for (const o of p.orbs) {
          if (!o.eaten && o.x !== undefined && G.dist(o.x, o.y, bh.x, bh.y) < 110) { Fx.tp(o.x, o.y, '#b76bff'); o.eaten = true; eaten = true; break; }
        }
        if (eaten) {
          bh.consumed++;
          bh.t = Math.min(bh.t + .8, 4);
          if (bh.consumed >= 2 && p.tempOrbs.filter(o => o.moon).length < 3) {
            bh.consumed = 0;
            p.tempOrbs.push({ moon: true, r: 46, spd: 1.1, dmg: 5, t: 9999, block: true, phase: G.fR(0, G.TAU) });
            G.toast('A MOON COALESCES', '#b76bff');
            Au.sfx('levelup');
            Fx.ring(bh.x, bh.y, '#eef4ff', 8, 60, .5);
          }
        }
      }
    }
    Fx.spawn(bh.x + G.fR(-30, 30), bh.y + G.fR(-30, 30), { n: 2, col: ['#b76bff', '#4df3ff'], life: .3, spMin: 10, spMax: 40, glow: true });
    if (bh.t <= 0) G.run.blackHoles.splice(bi, 1);
  }
  // standup timer dot
  if (G.run.dotTimer > 0) {
    G.run.dotTimer -= dt;
    G.run.dotAcc = (G.run.dotAcc || 0) + dt;
    if (G.run.dotAcc >= 1) { G.run.dotAcc -= 1; for (const e of r.enemies) if (!e.dead && !e.friendly) G.En.damage(e, 1.5, {}); }
  }
};

Sh.bounceOff = function (s) {
  // crude normal guess: test axes
  if (G.Dg.solidAt(s.x - s.vx * 0.016, s.y)) s.vy *= -1; else s.vx *= -1;
  Au.sfx('hit');
};

Sh.doSplit = function (s) {
  const base = Math.atan2(s.vy, s.vx);
  const m = G.run.player.mods;
  const powMult = m.uniq.splitPower ? 1 : .65;
  for (const da of [-.5, .5]) {
    const c = Sh.mkShot(s.x, s.y, base + da, {
      dmg: s.dmg * powMult, noOrbit: true, depth: s.depth + 1,
      life: s.maxLife * .5, noSplit: true,
    });
    // children inherit behavior flags — this is where synergies multiply
    c.pierce = s.pierce; c.spectral = s.spectral; c.homing = s.homing;
    c.bounce = s.bounce; c.wavy = s.wavy; c.scale = s.scale * .8; c.r = s.r * .8;
    c.col = s.col;
    // Recursion: children can split again (depth-limited)
    if (m.splitDeep && s.depth < 2) { c.split = 1; c.noSplit = false; }
  }
};

Sh.onHit = function (s, e, idx) {
  const p = G.run.player, m = p.mods;
  s.hit.add(e); s.didHit = true;
  let dmg = s.dmg;
  // distance-scaling items
  if (m.uniq.edgeDmg) dmg *= 1 + Math.min(1.2, s.t * .9);
  if (m.uniq.sniper && G.dist(p.x, p.y, e.x, e.y) > 100) dmg *= 1.35;
  if (e.marked) dmg *= 1.3;
  if (e.sticky) dmg *= 1.1;
  if (m.uniq.blame && e.hurtYou) dmg *= 1.5;
  if (p.bisectStacks) dmg *= 1 + p.bisectStacks * .02;
  // regex lookahead: phase through first enemy hit by this shot
  if (m.uniq.skipFirst && !s.skippedOne) { s.skippedOne = true; return false; }
  G.En.damage(e, dmg, { crit: s.crit, shot: s });
  // statuses (chance-based, luck-scaled)
  const lk = 1 + p.stats.luck * .06;
  if (m.poison && G.rng() < m.poison * lk) G.En.status(e, 'poison', 3);
  if (m.burn && G.rng() < m.burn * lk) G.En.status(e, 'burn', 3);
  if (m.slow && G.rng() < m.slow * lk) G.En.status(e, 'slow', 2.5);
  if (m.fear && G.rng() < m.fear * lk) G.En.status(e, 'fear', 2);
  // (charm now procs on the killing blow — see En.kill — so it's readable)
  if (m.uniq.stickyMark) e.sticky = true;
  if (m.uniq.critStun && s.crit) G.En.status(e, 'frozen', 1.2);
  if (m.knock) { const a = Math.atan2(s.vy, s.vx); e.kx = (e.kx || 0) + Math.cos(a) * 240; e.ky = (e.ky || 0) + Math.sin(a) * 240; }
  // explosive
  if (m.explode && G.rng() < m.explode * lk) Sh.explodeAt(s.x, s.y, 36, dmg * 1.6, true);
  // chain
  if (m.chain) {
    let chained = 0;
    for (const o of G.run.cur.enemies) {
      if (chained >= m.chain) break;
      if (o === e || o.dead || o.friendly || s.hit.has(o)) continue;
      if (G.dist(e.x, e.y, o.x, o.y) < 80) {
        G.En.damage(o, dmg * .6, { electric: true });
        Sh.bolts.push({ x1: e.x, y1: e.y, x2: o.x, y2: o.y, t: .12 });
        chained++;
      }
    }
  }
  // split
  if (s.split > 0) Sh.doSplit(s);
  // bisect stacking
  if (m.uniq.bisect) p.bisectStacks = Math.min(25, (p.bisectStacks || 0) + 0.06);
  It.procEv('hit', { x: e.x, y: e.y });
  // pierce?
  if (s.pierce > 0) { s.pierce--; return false; }
  Sh.pop(s, idx);
  return true;
};

Sh.pop = function (s, idx, quiet) {
  if (!quiet) Fx.hitSpark(s.x, s.y, s.col);
  Sh.list.splice(idx, 1);
  if (s.from !== 'player' && s.from !== undefined) return;
  const p = G.run.player, m = p.mods;
  // satellite protocol: shots that miss become orbitals
  if (m.uniq.bulletOrbit && !s.didHit && !s.gold) G.Player.addTempOrb(s);
  // event horizon rounds: shots may collapse into black holes
  if (m.uniq.tearBlackHole && G.run.blackHoles.length < 2 && G.rng() < .06 + Math.min(.09, p.stats.luck * .01)) {
    G.run.blackHoles.push({ x: s.x, y: s.y, t: 2.6, consumed: 0 });
    Fx.ring(s.x, s.y, '#b76bff', 20, 4, .3);
    Au.sfx('teleport');
  }
};

// ---------- draw ----------
Sh.draw = function (x) {
  for (const s of Sh.list) {
    x.save();
    x.shadowColor = s.gold ? '#ffe24d' : s.col; x.shadowBlur = 7;
    x.fillStyle = s.gold ? '#ffe24d' : s.col;
    x.beginPath(); x.arc(s.x, s.y, s.r, 0, G.TAU); x.fill();
    x.fillStyle = '#ffffff';
    x.beginPath(); x.arc(s.x - s.r * .25, s.y - s.r * .25, s.r * .4, 0, G.TAU); x.fill();
    x.restore();
  }
  for (const b of Sh.bombs) {
    const blink = Math.sin(b.fuse * 20) > 0;
    x.fillStyle = 'rgba(0,0,0,.35)';
    x.beginPath(); x.ellipse(b.x, b.y + 6, 7, 3, 0, 0, G.TAU); x.fill();
    x.fillStyle = blink ? '#ff5252' : '#3d4a63';
    x.beginPath(); x.arc(b.x, b.y, 7, 0, G.TAU); x.fill();
    x.fillStyle = '#6b7ca3'; x.fillRect(b.x - 1, b.y - 10, 2, 4);
  }
  for (const bm of Sh.beams) {
    const a = G.clamp(bm.t / .14, 0, 1);
    x.save();
    x.globalAlpha = a;
    x.shadowColor = bm.col; x.shadowBlur = 8;
    x.strokeStyle = bm.col; x.lineWidth = 3;
    x.beginPath(); x.moveTo(bm.x1, bm.y1); x.lineTo(bm.x2, bm.y2); x.stroke();
    x.strokeStyle = '#fff'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(bm.x1, bm.y1); x.lineTo(bm.x2, bm.y2); x.stroke();
    x.restore();
  }
  for (const bl of Sh.bolts) {
    x.strokeStyle = 'rgba(255,240,140,' + (bl.t / .15) + ')';
    x.lineWidth = 2;
    x.beginPath(); x.moveTo(bl.x1, bl.y1);
    const segs = 5;
    for (let i = 1; i <= segs; i++) {
      const t = i / segs;
      x.lineTo(G.lerp(bl.x1, bl.x2, t) + (i < segs ? G.fR(-7, 7) : 0), G.lerp(bl.y1, bl.y2, t) + (i < segs ? G.fR(-5, 5) : 0));
    }
    x.stroke();
  }
};
