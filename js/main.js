'use strict';
// ============================================================
// main.js: boot, game loop, state machine, run orchestration
// ============================================================

// ---------- run creation ----------
G.startRun = function (opts) {
  opts = opts || {};
  const seedStr = opts.seedStr || (opts.continueData ? opts.continueData.seedStr : G.seedToStr((Math.random() * 1e9) | 0));
  const seed = G.hashStr(seedStr);
  G.run = {
    seed, seedStr, // internal only — runs are always freshly random
    endless: !!opts.endless || (opts.continueData ? opts.continueData.endless : false),
    endlessLoop: 0,
    depth: opts.continueData ? opts.continueData.depth : 1,
    time: opts.continueData ? opts.continueData.time : 0,
    rooms: null, cur: null, bossRoom: null,
    stats: opts.continueData ? opts.continueData.stats : {},
    flags: {}, bossesKilled: opts.continueData ? opts.continueData.bossesKilled : 0,
    activeBoss: null, bossIntro: null, bossDying: null, overclockPending: false,
    floorBanner: null, blackHoles: [], bulletTime: 0, dotTimer: 0,
    roomBuff: null, lastActive: null, clearChargeBonus: 0, bossHurtTaken: false,
    floorStartTime: 0,
  };
  // ruleset: restore the save's mod if continuing, else use the active one
  if (opts.continueData && opts.continueData.rulesetId) {
    const saved = opts.continueData.rulesetId;
    if (saved !== G.Mods.rulesetIdOf(G.Mods.active)) {
      const found = G.Mods.local.find(m => G.Mods.rulesetIdOf(m) === saved);
      G.Mods.setActive(saved.startsWith('official') ? null : (found || null));
    }
  }
  G.run.runId = opts.continueData && opts.continueData.runId ? opts.continueData.runId : G.Net.uuid();
  G.Mods.applyActive(); // sets G.run.packFx, mutates item defs from pristine
  G.run.rulesetId = G.Mods.rulesetIdOf(G.Mods.active);
  G.run.won = false; G.run.submitted = false;
  // player
  const p = Pl.mk();
  G.run.player = p;
  Pl.install(p);
  It.buildPools();
  // restore continue data
  if (opts.continueData) {
    const c = opts.continueData.player;
    p.hpMax = c.hpMax; p.hp = c.hp; p.soul = c.soul;
    p.coins = c.coins; p.bombs = c.bombs; p.keys = c.keys;
    p.permDmg = c.permDmg || 0;
    p.trinket = c.trinket;
    for (const id of c.items) { const def = G.PASSIVES[id]; if (def) { p.items.push(def); G.run.taken[It.keyOf(def)] = true; } }
    if (c.active) { const def = G.ACTIVES[c.active.id]; if (def) { p.active = { def, charge: c.active.charge, max: def.charge }; G.run.taken[It.keyOf(def)] = true; } }
  }
  p.recalc();
  p.hp = G.clamp(p.hp, 1, p.hpMax * 2);
  // floor
  G.setSeed(G.hashStr(seedStr + ':floor:' + G.run.depth));
  Dg.genFloor(G.run.depth);
  G.run.cur = G.run.rooms['0,0'];
  G.run.cur.visited = true; G.run.cur.seen = true;
  for (const d in G.run.cur.doors) G.run.cur.doors[d].to.seen = true;
  p.x = G.W / 2; p.y = (G.H + G.HUD_H) / 2 + 30;
  Sh.clear(); Fx.clear();
  Pl.onFloorStart();
  const biome = Spr.BIOMES[(G.run.depth - 1) % 6];
  G.run.floorBanner = { t: 3, name: biome.name, depth: G.run.depth };
  G.meta.deepestFloor = Math.max(G.meta.deepestFloor, G.run.depth);
  G.state = 'run';
  G.stateT = 0;
  Au.init();
  Au.setTheme((G.run.depth - 1) % 6);
  G.saveRun();
};

// hook floor timing for speedrun achievement + reseed each floor
const _origNextFloor = Dg.nextFloor;
Dg.nextFloor = function () {
  if (G.run.depth === 1 && G.run.time - G.run.floorStartTime < 90) G.run.flags.fastFloor = true;
  G.setSeed(G.hashStr(G.run.seedStr + ':floor:' + (G.run.depth + 1)));
  _origNextFloor();
  G.run.floorStartTime = G.run.time;
  G.Meta.check();
};

// track boss-fight damage for Clean Deploy
const _origSpawnBoss = Boss.spawnInRoom;
Boss.spawnInRoom = function (room, depth) { G.run.bossHurtTaken = false; return _origSpawnBoss(room, depth); };
const _origBossDeath = Boss.onDeath;
Boss.onDeath = function (e) {
  if (!G.run.bossHurtTaken) { G.run.flags.cleanBoss = true; }
  _origBossDeath(e);
};
const _origHurt = Pl.hurt;
Pl.hurt = function (p, n, src, self) {
  const before = p.hp + p.soul;
  _origHurt(p, n, src, self);
  if (G.run && G.run.activeBoss && (p.hp + p.soul) < before) G.run.bossHurtTaken = true;
};
// re-install wrapper on player (install binds at mk time)
const _origInstall = Pl.install;
Pl.install = function (p) {
  _origInstall(p);
  p.hurt = (n, src, self) => Pl.hurt(p, n, src, self);
};

// ---------- update ----------
function updateRun(dt) {
  const run = G.run, p = run.player;
  run.time += dt;
  // transition animation
  if (G.transition) {
    G.transition.t += dt * 3.2;
    if (G.transition.t >= 1) {
      const tr = G.transition;
      G.transition = null;
      Dg.enterRoom(tr.to, tr.dir);
    }
    return;
  }
  // boss intro cinematic
  if (run.bossIntro) {
    run.bossIntro.t -= dt;
    if (G.frame % 5 === 0) G.addShake(1.5);
    if (run.bossIntro.t <= 0) run.bossIntro = null;
    Fx.update(dt);
    return;
  }
  // boss death cinematic
  if (run.bossDying) {
    const bd = run.bossDying;
    bd.t -= dt;
    G.addShake(3);
    if (G.frame % 6 === 0) {
      Fx.explosion(bd.x + G.fR(-40, 40), bd.y + G.fR(-30, 30), 30);
    }
    if (bd.t <= 0) {
      run.bossDying = null;
      if (run.depth >= 6 && !run.endless) { Meta.onWin(); return; }
      run.cur.trapdoor = { x: G.W / 2, y: (G.H + G.HUD_H) / 2 };
      if (run.overclockPending) {
        run.overclockPending = false;
        It.spawnPedestal(run.cur, G.W / 2 - 60, (G.H + G.HUD_H) / 2 - 40, It.roll('d'), 0, 1);
        It.spawnPedestal(run.cur, G.W / 2 + 60, (G.H + G.HUD_H) / 2 - 40, It.roll('d'), 0, 1);
        G.toast('THE OVERCLOCK DEALER OFFERS...', '#ff3355');
        Au.sfx('devil');
      }
      G.saveRun();
    }
    Fx.update(dt);
    Sh.update(dt);
    return;
  }
  if (p.dead) {
    Fx.update(dt);
    return;
  }
  Pl.update(dt);
  En.update(dt);
  Sh.update(dt);
  It.updatePickups(dt);
  It.updatePedestals(dt);
  Fx.update(dt);
  Dg.checkClear();
  Dg.tryDoors();
  // terminal reading
  const room = run.cur;
  G.nearTerminal = null;
  for (const t of room.terminals) {
    const tx = t.tx * G.TILE + 16, ty = G.HUD_H + t.ty * G.TILE + 16;
    if (G.dist(p.x, p.y, tx, ty) < 34) {
      G.nearTerminal = t;
      if (!t.read) { t.read = true; Au.sfx('ui'); }
    }
  }
  if (G.hit('pause')) { G.state = 'pause'; UI.sel = 0; }
  if (G.hit('mute')) { G.meta.settings.music = !G.meta.settings.music; G.saveMeta(); G.toast(G.meta.settings.music ? 'MUSIC ON' : 'MUSIC OFF', '#8a93a8'); }
  if (run.floorBanner) { run.floorBanner.t -= dt; if (run.floorBanner.t <= 0) run.floorBanner = null; }
}

// ---------- render ----------
function renderRun(x) {
  const run = G.run, p = run.player;
  const B = Dg.biome();
  x.fillStyle = '#05050a';
  x.fillRect(0, 0, G.W, G.H);
  x.save();
  // screen shake
  if (G.shake > 0 && G.meta.settings.screenshake) {
    G.shakeX = G.fR(-G.shake, G.shake) * .6;
    G.shakeY = G.fR(-G.shake, G.shake) * .6;
    x.translate(G.shakeX | 0, G.shakeY | 0);
  }
  if (G.transition) {
    // slide between rooms
    const tr = G.transition;
    const k = 1 - Math.pow(1 - Math.min(1, tr.t), 3); // ease out cubic
    const dx = tr.dir === 'w' ? 1 : tr.dir === 'e' ? -1 : 0;
    const dy = tr.dir === 'n' ? 1 : tr.dir === 's' ? -1 : 0;
    const W = G.W, H = G.H - G.HUD_H;
    Dg.drawRoom(x, tr.from, dx * k * W, dy * k * H);
    Dg.drawRoom(x, tr.to, dx * (k - 1) * W, dy * (k - 1) * H);
  } else {
    Dg.drawRoom(x, run.cur, 0, 0);
    It.drawPickups(x);
    En.draw(x);
    if (!p.dead || p.deathT < 2) Pl.draw(x);
    Sh.draw(x);
    Fx.draw(x);
    // black hole visuals
    for (const bh of run.blackHoles) {
      x.save();
      x.shadowColor = '#b76bff'; x.shadowBlur = 12;
      x.fillStyle = '#0b0b12';
      x.beginPath(); x.arc(bh.x, bh.y, 11 + Math.sin(G.time * 10) * 3, 0, G.TAU); x.fill();
      x.strokeStyle = '#b76bff'; x.lineWidth = 2;
      x.beginPath(); x.ellipse(bh.x, bh.y, 18, 7, G.time * 2.5, 0, G.TAU); x.stroke();
      x.restore();
    }
  }
  // lighting: darkness with hole around player
  let dark = B.dark;
  if (p.hasUniq('nightVision') || (p.trinket !== null && G.TRINKETS[p.trinket].fx.uniq === 'nightVision')) dark *= .5;
  if (dark > 0.05 && !G.transition) {
    const grd = x.createRadialGradient(p.x, p.y, 40, p.x, p.y, 230);
    grd.addColorStop(0, 'rgba(4,4,10,0)');
    grd.addColorStop(1, 'rgba(4,4,10,' + dark + ')');
    x.fillStyle = grd;
    x.fillRect(0, G.HUD_H, G.W, G.H - G.HUD_H);
  }
  x.restore();
  // HUD (not shaken)
  UI.drawHUD(x);
  // terminal text
  if (G.nearTerminal) {
    const txt = G.nearTerminal.text;
    x.fillStyle = 'rgba(5,5,10,.88)';
    x.fillRect(20, G.H - 34, G.W - 40, 26);
    x.strokeStyle = B.accent; x.lineWidth = 1;
    x.strokeRect(20.5, G.H - 33.5, G.W - 41, 25);
    x.font = '7px monospace'; x.fillStyle = B.accent;
    // wrap into two lines
    if (txt.length > 70) {
      const cut = txt.lastIndexOf(' ', 70);
      x.fillText(txt.slice(0, cut), 26, G.H - 23);
      x.fillText(txt.slice(cut + 1), 26, G.H - 13);
    } else {
      x.fillText(txt, 26, G.H - 18);
    }
  }
  // floor banner
  if (run.floorBanner) {
    const fb = run.floorBanner;
    const a = G.clamp(Math.min(fb.t, 3 - fb.t) * 1.2, 0, 1);
    x.globalAlpha = a;
    x.textAlign = 'center';
    x.font = 'bold 16px monospace';
    x.fillStyle = '#05050a'; x.fillText(fb.name, G.W / 2 + 1, 141);
    x.fillStyle = B.accent; x.fillText(fb.name, G.W / 2, 140);
    x.font = '8px monospace'; x.fillStyle = '#8a93a8';
    x.fillText('· basement level ' + fb.depth + ' ·', G.W / 2, 156);
    x.textAlign = 'left';
    x.globalAlpha = 1;
  }
  // boss intro cinematic: letterbox + name
  if (run.bossIntro) {
    const bi = run.bossIntro;
    const k = G.clamp((2.4 - bi.t) * 2, 0, 1);
    x.fillStyle = '#000';
    x.fillRect(0, 0, G.W, 36 * k);
    x.fillRect(0, G.H - 36 * k, G.W, 36 * k);
    if (bi.t < 1.9) {
      x.textAlign = 'center';
      const shakeX = bi.t > 1.6 ? G.fR(-2, 2) : 0;
      x.font = 'bold 22px monospace';
      x.fillStyle = '#ff3355'; x.fillText(bi.name, G.W / 2 + shakeX + 1, 150);
      x.fillStyle = '#eef4ff'; x.fillText(bi.name, G.W / 2 + shakeX, 148);
      x.font = 'italic 8px monospace'; x.fillStyle = '#8a93a8';
      x.fillText('— ' + bi.sub + ' —', G.W / 2, 166);
      x.textAlign = 'left';
    }
  }
  // toasts
  UI.drawToasts(x);
  // screen flash
  if (G.flash > 0) {
    x.fillStyle = G.flashCol;
    x.globalAlpha = G.clamp(G.flash * 4, 0, .6);
    x.fillRect(0, 0, G.W, G.H);
    x.globalAlpha = 1;
  }
  // subtle scanlines
  x.fillStyle = 'rgba(0,0,0,.08)';
  for (let sy = 0; sy < G.H; sy += 2) x.fillRect(0, sy, G.W, 1);
  // death overlay handled in state
}

// ---------- master loop ----------
let lastT = 0;
function frame(ts) {
  requestAnimationFrame(frame);
  if (!lastT) lastT = ts;
  let dt = Math.min(0.05, (ts - lastT) / 1000);
  lastT = ts;
  G.frame++;
  G.time += dt;
  G.stateT = (G.stateT || 0) + dt;
  // hitstop
  if (G.slowmo > 0) { G.slowmo -= dt; dt *= .2; }
  G.shake = Math.max(0, G.shake - 30 * (dt || .016));
  G.flash = Math.max(0, G.flash - dt);
  UI.updateToasts(dt);
  const x = G.cx;
  x.imageSmoothingEnabled = false;
  switch (G.state) {
    case 'title':
      Au.setTheme(7);
      UI.title(x, dt);
      break;
    case 'run':
      updateRun(dt);
      if (G.state === 'run' || G.state === 'pause') renderRun(x);
      if (G.run && G.run.player.dead && G.run.player.deathT > 1.2 && G.state === 'run') {
        // Meta.onDeath was called at death; state switched there
      }
      break;
    case 'pause':
      renderRun(x);
      UI.pause(x);
      break;
    case 'dead':
      renderRun(x);
      UI.dead(x, dt);
      break;
    case 'win':
      renderRun(x);
      UI.win(x, dt);
      break;
    case 'stats': UI.stats(x); break;
    case 'ach': UI.ach(x); break;
    case 'itemlog': UI.itemlog(x); break;
    case 'help': UI.help(x); break;
    case 'leader': UI.leader(x); break;
    case 'mods': UI.mods(x); break;
    case 'modbrowse': UI.modbrowse(x); break;
    case 'textentry': UI.textentry(x); break;
  }
  G.clearHits();
}

// ---------- boot ----------
G.loadMeta();
Spr.init();
G.Mods.init();
G.Net.init();
G.state = 'title';
// unlock audio on first interaction
window.addEventListener('keydown', function once() { Au.init(); }, { once: true });
window.addEventListener('mousedown', function once2() { Au.init(); }, { once: true });
// save on exit
window.addEventListener('beforeunload', () => { if (G.state === 'run' || G.state === 'pause') G.saveRun(); G.saveMeta(); });
requestAnimationFrame(frame);
