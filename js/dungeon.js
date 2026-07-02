'use strict';
// ============================================================
// dungeon.js: procedural floors, room templates, doors, specials
// ============================================================
const Dg = {};
G.Dg = Dg;

const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const OPP = { n: 's', s: 'n', w: 'e', e: 'w' };
const DOOR_TILE = { n: [7, 0], s: [7, 8], w: [0, 4], e: [14, 4] };

// ---------- floor generation ----------
Dg.genFloor = function (depth) {
  const rooms = {};
  const key = (x, y) => x + ',' + y;
  const mkRoom = (gx, gy, type) => ({
    gx, gy, type, visited: false, seen: false, cleared: type !== 'normal' && type !== 'boss' && type !== 'challenge' && type !== 'cursed',
    doors: {}, tiles: null, enemies: [], pickups: [], pedestals: [], eshots: [], zones: [],
    terminals: [], graffiti: null, trapdoor: null, waveN: 0, firedIn: false, shieldUsed: false,
  });
  rooms[key(0, 0)] = mkRoom(0, 0, 'start');
  const target = Math.min(14, 6 + depth + G.R(0, 2));
  let placed = 1, guard = 0;
  while (placed < target && guard++ < 400) {
    const all = Object.values(rooms);
    const r = G.pick(all);
    const d = G.pick(['n', 's', 'w', 'e']);
    const nx = r.gx + DIRS[d][0], ny = r.gy + DIRS[d][1];
    if (rooms[key(nx, ny)]) continue;
    // limit adjacency to keep corridor feel
    let adj = 0;
    for (const dd in DIRS) if (rooms[key(nx + DIRS[dd][0], ny + DIRS[dd][1])]) adj++;
    if (adj > 1 && G.rng() < .7) continue;
    rooms[key(nx, ny)] = mkRoom(nx, ny, 'normal');
    placed++;
  }
  // connect doors between adjacent rooms
  for (const k in rooms) {
    const r = rooms[k];
    for (const d in DIRS) {
      const n = rooms[key(r.gx + DIRS[d][0], r.gy + DIRS[d][1])];
      if (n) r.doors[d] = { to: n, dir: d, locked: false, secret: false, open: false, spiked: false };
    }
  }
  // dead ends by distance
  const start = rooms['0,0'];
  const deadends = Object.values(rooms).filter(r => r !== start && Object.keys(r.doors).length === 1)
    .sort((a, b) => (Math.abs(b.gx) + Math.abs(b.gy)) - (Math.abs(a.gx) + Math.abs(a.gy)));
  const assign = (type) => { const r = deadends.shift() || Object.values(rooms).find(x => x.type === 'normal'); if (r) { r.type = type; r.cleared = (type === 'treasure' || type === 'shop'); } return r; };
  const bossRoom = assign('boss');
  assign('treasure');
  assign('shop');
  if (depth >= 2 && G.chance(.85)) assign('challenge');
  const moreCursed = G.run.player && G.run.player.trinket !== null && G.TRINKETS[G.run.player.trinket].fx.uniq === 'moreCursed';
  if (G.chance(.5 + (moreCursed ? .35 : 0))) assign('cursed');
  // secret room: empty cell adjacent to most rooms
  let bestCell = null, bestAdj = 0;
  for (const k in rooms) {
    const r = rooms[k];
    for (const d in DIRS) {
      const cx = r.gx + DIRS[d][0], cy = r.gy + DIRS[d][1];
      if (rooms[key(cx, cy)]) continue;
      let adj = 0;
      for (const dd in DIRS) { const nb = rooms[key(cx + DIRS[dd][0], cy + DIRS[dd][1])]; if (nb && nb.type !== 'boss') adj++; }
      const secretUp = G.run.player && G.run.player.trinket !== null && G.TRINKETS[G.run.player.trinket].fx.uniq === 'secretUp';
      if (adj > bestAdj || (adj === bestAdj && G.chance(.3))) { bestAdj = adj; bestCell = [cx, cy]; }
    }
  }
  if (bestCell) {
    const sr = mkRoom(bestCell[0], bestCell[1], 'secret');
    sr.cleared = true;
    rooms[key(bestCell[0], bestCell[1])] = sr;
    for (const d in DIRS) {
      const nb = rooms[key(sr.gx + DIRS[d][0], sr.gy + DIRS[d][1])];
      if (nb && nb.type !== 'boss' && nb.type !== 'secret') {
        sr.doors[d] = { to: nb, dir: d, locked: false, secret: true, open: false, spiked: false };
        nb.doors[OPP[d]] = { to: sr, dir: OPP[d], locked: false, secret: true, open: false, spiked: false };
      }
    }
  }
  // build interiors
  for (const k in rooms) Dg.buildRoom(rooms[k], depth);
  G.run.rooms = rooms;
  G.run.bossRoom = bossRoom;
  return rooms;
};

// ---------- room interiors ----------
Dg.buildRoom = function (room, depth) {
  const T = []; // RH rows x RW cols
  for (let y = 0; y < G.RH; y++) {
    T.push([]);
    for (let x = 0; x < G.RW; x++) T[y].push((x === 0 || y === 0 || x === G.RW - 1 || y === G.RH - 1) ? 1 : 0);
  }
  room.tiles = T;
  const inX = (x) => x >= 2 && x <= G.RW - 3, inY = (y) => y >= 2 && y <= G.RH - 3;
  const clearLanes = (x, y) => (x === 7 || y === 4); // door lanes stay walkable
  const stamp = (x, y, t) => { if (inX(x) && inY(y) && !clearLanes(x, y)) T[y][x] = t; };
  if (room.type === 'normal' || room.type === 'cursed' || room.type === 'challenge') {
    const pat = G.R(0, 7);
    const obs = G.chance(.25) ? 3 : G.chance(.2) ? 4 : 2; // pits / wires / racks
    if (pat === 1) { // corner blocks
      for (const [cx, cy] of [[3, 2], [11, 2], [3, 6], [11, 6]]) { stamp(cx, cy, obs); stamp(cx + 1, cy, obs); }
    } else if (pat === 2) { // center cross
      for (let i = -1; i <= 1; i++) { stamp(7 + i, 3, obs); stamp(7 + i, 5, obs); }
    } else if (pat === 3) { // pillars
      for (const cx of [4, 7, 10]) for (const cy of [3, 5]) stamp(cx, cy, obs);
    } else if (pat === 4) { // side walls
      for (let y = 2; y <= 6; y++) { stamp(4, y, obs); stamp(10, y, obs); }
    } else if (pat === 5) { // random scatter (symmetric)
      for (let i = 0; i < 5; i++) { const rx = G.R(2, 6), ry = G.R(2, 6); stamp(rx, ry, obs); stamp(G.RW - 1 - rx, G.RH - 1 - ry, obs); }
    } else if (pat === 6) { // pit ring
      for (let x = 5; x <= 9; x++) { stamp(x, 2, 3); stamp(x, 6, 3); }
      for (let y = 3; y <= 5; y++) { stamp(5, y, 3); stamp(9, y, 3); }
    } else if (pat === 7) { // wire hazard rows
      for (const cx of [3, 5, 9, 11]) stamp(cx, 4 === 4 ? (cx % 2 ? 2 : 4) : 4, cx % 2 ? 4 : 2);
      stamp(7, 2, 4); stamp(7, 6, 4);
    }
    // cracked variants
    for (let y = 1; y < G.RH - 1; y++) for (let x = 1; x < G.RW - 1; x++) if (T[y][x] === 2 && G.chance(.18)) T[y][x] = 5;
    // the data lake seeps: standing water conducts electricity
    if ((depth - 1) % 6 === 2 && G.chance(.65)) {
      const n = G.R(1, 2);
      for (let i = 0; i < n; i++) {
        const wx = G.R(3, 11) * G.TILE + 16, wy = G.HUD_H + G.R(2, 6) * G.TILE + 16;
        room.zones.push({ x: wx, y: wy, r: G.R(26, 40), type: 'water', t: 99999 });
      }
    }
    // lore terminal
    if (G.chance(.28) && room.type === 'normal') {
      const spots = [[2, 2], [12, 2], [2, 6], [12, 6]].filter(([x, y]) => T[y][x] === 0 && !clearLanes(x, y));
      if (spots.length) {
        const [tx, ty] = G.pick(spots);
        T[ty][tx] = 6;
        room.terminals.push({ tx, ty, text: G.Lore.terminal(depth), read: false });
      }
    }
    if (G.chance(.22)) room.graffiti = G.Lore.graffiti(depth);
  }
  if (room.type === 'start') {
    T[2][2] = 6;
    room.terminals.push({ tx: 2, ty: 2, text: G.Lore.floorIntro(depth), read: false });
  }
  if (room.type === 'treasure') {
    const p = G.run.player;
    const choice2 = p && p.hasUniq('choice2');
    const doubleChance = p && p.trinket !== null && G.TRINKETS[p.trinket].fx.uniq === 'doubleItemChance' && G.chance(.25);
    if (choice2 || doubleChance) {
      const a = It.roll('t'), b = It.roll('t');
      It.spawnPedestal(room, G.W / 2 - 40, (G.H + G.HUD_H) / 2, a, 0);
      It.spawnPedestal(room, G.W / 2 + 40, (G.H + G.HUD_H) / 2, b, 0);
      if (choice2 && !doubleChance) { room.pedestals[0].group = 1; room.pedestals[1].group = 1; }
    } else {
      It.spawnPedestal(room, G.W / 2, (G.H + G.HUD_H) / 2, It.roll('t'), 0);
    }
    // treasure needs a key on later floors — lock BOTH sides so the key is
    // spent on the way in, never demanded on the way out
    if (depth >= 3) for (const d in room.doors) {
      const door = room.doors[d];
      if (door.secret) continue;
      door.locked = true;
      const other = door.to.doors[OPP[d]];
      if (other && !other.secret) other.locked = true;
    }
  }
  if (room.type === 'shop') {
    const p = G.run.player;
    const disc = p && p.hasUniq('discount') ? .67 : 1;
    const discSmall = p && p.trinket !== null && G.TRINKETS[p.trinket].fx.uniq === 'discountSmall' ? .85 : 1;
    const inv = p && p.hasUniq('investor') ? 1.5 : 1;
    for (let i = 0; i < 3; i++) {
      const def = It.roll('s');
      const price = Math.max(3, Math.round((def.q * 7 + G.R(0, 5)) * disc * discSmall * inv));
      It.spawnPedestal(room, G.W / 2 + (i - 1) * 70, (G.H + G.HUD_H) / 2 - 10, def, price);
    }
    It.spawnPickup(room, G.W / 2 - 70, (G.H + G.HUD_H) / 2 + 50, 'trinket', G.R(0, G.TRINKETS.length - 1));
    room.shopTrinketPrice = 8;
    if (p && p.hasUniq('freeShopChance') && G.chance(.33) && room.pedestals.length) room.pedestals[G.R(0, room.pedestals.length - 1)].price = 0;
  }
  if (room.type === 'secret') {
    const roll = G.rng();
    if (roll < .3) It.spawnPedestal(room, G.W / 2, (G.H + G.HUD_H) / 2, It.roll('x'), 0);
    else if (roll < .55) It.spawnPickup(room, G.W / 2, (G.H + G.HUD_H) / 2, 'chestGold');
    else if (roll < .75) { It.spawnPickup(room, G.W / 2 - 20, (G.H + G.HUD_H) / 2, 'trinket', G.R(0, G.TRINKETS.length - 1)); It.spawnPickup(room, G.W / 2 + 20, (G.H + G.HUD_H) / 2, 'creditBig'); }
    else { for (let i = 0; i < 5; i++) It.randomDrop(room, G.W / 2 + G.fR(-40, 40), (G.H + G.HUD_H) / 2 + G.fR(-30, 30)); }
    room.graffiti = G.Lore.secretGraffiti();
  }
  if (room.type === 'cursed') {
    for (const d in room.doors) {
      const door = room.doors[d];
      if (door.secret) continue;
      door.spiked = true;
      const other = door.to.doors[OPP[d]];
      if (other && !other.secret) other.spiked = true; // the door bites both ways
    }
    const roll = G.rng();
    if (roll < .4) It.spawnPedestal(room, G.W / 2, (G.H + G.HUD_H) / 2, It.roll('u'), 0);
    else if (roll < .7) It.spawnPickup(room, G.W / 2, (G.H + G.HUD_H) / 2, 'chestGold');
    else { It.spawnPickup(room, G.W / 2 - 20, (G.H + G.HUD_H) / 2, 'trinket', G.R(0, G.TRINKETS.length - 1)); It.spawnPickup(room, G.W / 2 + 20, (G.H + G.HUD_H) / 2, 'battery'); }
    if (G.chance(.5)) { room.cleared = false; } // sometimes guarded
    room.graffiti = G.Lore.cursedGraffiti();
  }
  if (room.type === 'boss') {
    // open arena: clear obstacles
    for (let y = 1; y < G.RH - 1; y++) for (let x = 1; x < G.RW - 1; x++) T[y][x] = 0;
  }
};

// ---------- coordinate helpers ----------
Dg.tileAt = function (px, py) {
  const tx = Math.floor(px / G.TILE), ty = Math.floor((py - G.HUD_H) / G.TILE);
  const r = G.run.cur;
  if (!r || ty < 0 || ty >= G.RH || tx < 0 || tx >= G.RW) return 1;
  return r.tiles[ty][tx];
};
Dg.solidAt = function (px, py) {
  const t = Dg.tileAt(px, py);
  return t === 1 || t === 2 || t === 5 || t === 6;
};
Dg.freeSpots = function (room, n) {
  const out = [];
  let guard = 0;
  const p = G.run.player;
  while (out.length < n && guard++ < 200) {
    const tx = G.R(2, G.RW - 3), ty = G.R(2, G.RH - 3);
    if (room.tiles[ty][tx] !== 0) continue;
    const px = tx * G.TILE + 16, py = G.HUD_H + ty * G.TILE + 16;
    if (p && G.dist(px, py, p.x, p.y) < 70) continue;
    out.push([px, py]);
  }
  return out;
};

// ---------- room entry / doors ----------
Dg.enterRoom = function (room, fromDir) {
  const prev = G.run.cur;
  G.run.cur = room;
  room.seen = true;
  for (const d in room.doors) room.doors[d].to.seen = true;
  Sh.clear(); Fx.clear();
  room.eshots.length = 0;
  const p = G.run.player;
  // place player at entry door
  if (fromDir) {
    // traveled fromDir → arrive at the opposite door, pushed inward past the trigger zone
    const [tx, ty] = DOOR_TILE[OPP[fromDir]];
    p.x = tx * G.TILE + 16 + (fromDir === 'w' ? -40 : fromDir === 'e' ? 40 : 0);
    p.y = G.HUD_H + ty * G.TILE + 16 + (fromDir === 'n' ? -40 : fromDir === 's' ? 40 : 0);
    p.vx = p.vy = 0;
  }
  // boss arenas: always start the fight from bottom center, whichever door you used
  if (room.type === 'boss' && !room.cleared) {
    p.x = G.W / 2; p.y = G.H - 60;
    p.vx = p.vy = 0;
  }
  // fams snap to player
  for (const f of p.fams) { f.x = p.x; f.y = p.y; }
  // first visit spawns
  if (!room.visited) {
    room.visited = true;
    if (room.type === 'normal' && !room.cleared) {
      room.cleared = false;
      En.populate(room, G.run.depth);
      if (!room.enemies.length) room.cleared = true;
    }
    if (room.type === 'boss') {
      Boss.spawnInRoom(room, G.run.depth);
    }
    if (room.type === 'challenge') {
      G.toast('CHALLENGE: SURVIVE THE SPRINT', '#ffb84d');
    }
    if (room.type === 'cursed' && !room.cleared) {
      En.populate(room, G.run.depth);
      for (const e of room.enemies) En.champify(e);
    }
    if (room.type === 'secret') { G.meta.secretsFound++; if (p.hasUniq('grassHeal')) p.heal(2); Au.sfx('secret'); G.Meta.check(); }
    if (room.type === 'shop' || room.type === 'treasure') Au.sfx('door');
  }
  // challenge waves trigger on entry until done
  if (room.type === 'challenge' && !room.cleared && !room.enemies.length && room.waveN < 3) Dg.challengeWave(room);
  Pl.onRoomEnter(room);
  G.Meta.stat('roomsVisited');
};

Dg.challengeWave = function (room) {
  room.waveN++;
  const depth = G.run.depth;
  const table = En.TABLES[(depth - 1) % 6];
  const n = 2 + room.waveN + Math.floor(depth / 2);
  const spots = Dg.freeSpots(room, n);
  for (let i = 0; i < Math.min(n, spots.length); i++) En.spawnAt(G.pick(table), spots[i][0], spots[i][1], {});
  G.toast('WAVE ' + room.waveN + ' / 3', '#ffb84d');
  Au.sfx('bossIntro');
};

Dg.checkClear = function () {
  const room = G.run.cur;
  if (room.cleared) return;
  const alive = room.enemies.filter(e => !e.dead && !e.friendly).length;
  if (alive > 0) return;
  if (room.type === 'challenge' && room.waveN < 3) { Dg.challengeWave(room); return; }
  room.cleared = true;
  Au.sfx('door');
  Pl.onRoomClear(room);
  if (room.type === 'challenge') {
    It.spawnPedestal(room, G.W / 2, (G.H + G.HUD_H) / 2, It.roll(G.chance(.5) ? 'b' : 't'), 0);
    G.meta.challengesWon++;
    G.toast('SPRINT SURVIVED', '#58f08a');
    G.Meta.check();
  }
  if (room.type === 'boss') {
    // trapdoor spawns via bossDying anim in main.js
  }
  // random clear drop
  if (G.chance(.18 + G.run.player.stats.luck * .015)) It.randomDrop(room, G.W / 2 + G.fR(-30, 30), (G.H + G.HUD_H) / 2 + G.fR(-30, 30));
};

Dg.doorOpen = function (room, d) {
  const door = room.doors[d];
  if (!door) return false;
  if (door.secret && !door.open) return false;
  if (!room.cleared && !(G.run.activeBoss && false)) return room.cleared;
  return true;
};

Dg.doorZone = function (d, p) {
  // generous rectangular trigger zones reachable despite wall clamping
  if (d === 'w') return p.x < 48 && Math.abs(p.y - 176) < 22;
  if (d === 'e') return p.x > G.W - 48 && Math.abs(p.y - 176) < 22;
  if (d === 'n') return p.y < G.HUD_H + 48 && Math.abs(p.x - 240) < 22;
  if (d === 's') return p.y > G.H - 48 && Math.abs(p.x - 240) < 22;
  return false;
};
Dg.tryDoors = function () {
  const p = G.run.player, room = G.run.cur;
  if (G.transition) return;
  for (const d in room.doors) {
    const door = room.doors[d];
    if (!Dg.doorZone(d, p)) continue;
    if (!room.cleared) continue;
    if (door.secret && !door.open) continue;
    if (door.locked) {
      // locks keep you OUT, never IN: leaving a locked room is always free
      if (room.type === 'treasure') {
        door.locked = false;
        const other = door.to.doors[OPP[d]]; if (other) other.locked = false;
        Au.sfx('door');
      } else if (p.keys > 0 || (p.freeUnlocks || 0) > 0 || (p.trinket !== null && G.TRINKETS[p.trinket].fx.uniq === 'freeKeyChance' && G.chance(.2))) {
        if ((p.freeUnlocks || 0) > 0) p.freeUnlocks--;
        else if (p.keys > 0) p.keys--;
        door.locked = false;
        const other = door.to.doors[OPP[d]]; if (other) other.locked = false;
        Au.sfx('key');
      } else { continue; }
    }
    if (door.spiked) {
      if (p.hallPass) { p.hallPass = false; G.toast('HALL PASS USED', '#58f08a'); }
      else if (p.hasUniq('curseImmune')) { }
      else if (p.hasUniq('curseBless')) { p.heal(1); Fx.float(p.x, p.y - 12, 'BLESSED', '#58f08a'); }
      else { p.hurt(1, null, true); G.meta.cursedEntered++; }
    }
    // transition
    G.transition = { dir: d, t: 0, from: room, to: door.to };
    Au.sfx('door');
    return;
  }
  // trapdoor
  if (room.trapdoor && G.dist(p.x, p.y, room.trapdoor.x, room.trapdoor.y) < 16) {
    Dg.nextFloor();
  }
};

// ---------- bombs interacting with dungeon ----------
Dg.bombAt = function (px, py, r) {
  const room = G.run.cur;
  // crack rocks
  for (let ty = 1; ty < G.RH - 1; ty++) for (let tx = 1; tx < G.RW - 1; tx++) {
    const t = room.tiles[ty][tx];
    if (t !== 2 && t !== 5) continue;
    const cx = tx * G.TILE + 16, cy = G.HUD_H + ty * G.TILE + 16;
    if (G.dist(px, py, cx, cy) < r + 16) {
      room.tiles[ty][tx] = 0;
      Fx.spawn(cx, cy, { n: 8, col: ['#454d63', '#8a93a8'], life: .6, spMin: 20, spMax: 90 });
      const p = G.run.player;
      if (p.hasUniq('rockLoot') && G.chance(.2)) It.randomDrop(room, cx, cy);
      if (p.trinket !== null && G.TRINKETS[p.trinket].fx.uniq === 'rockCoin' && G.chance(.25)) It.spawnPickup(room, cx, cy, 'credit');
    }
  }
  // secret doors
  for (const d in room.doors) {
    const door = room.doors[d];
    if (!door.secret || door.open) continue;
    const [tx, ty] = DOOR_TILE[d];
    const cx = tx * G.TILE + 16, cy = G.HUD_H + ty * G.TILE + 16;
    if (G.dist(px, py, cx, cy) < r + 24) {
      door.open = true;
      const other = door.to.doors[OPP[d]]; if (other) other.open = true;
      Au.sfx('secret');
      G.toast('SECRET ROOM FOUND', '#4df3ff');
      Fx.ring(cx, cy, '#4df3ff', 6, 40, .5);
    }
  }
};
Dg.breakAllRocks = function () {
  const room = G.run.cur;
  for (let ty = 1; ty < G.RH - 1; ty++) for (let tx = 1; tx < G.RW - 1; tx++) {
    if (room.tiles[ty][tx] === 2 || room.tiles[ty][tx] === 5) {
      room.tiles[ty][tx] = 0;
      Fx.spawn(tx * G.TILE + 16, G.HUD_H + ty * G.TILE + 16, { n: 5, col: ['#454d63'], life: .5, spMin: 20, spMax: 70 });
    }
  }
};

// ---------- teleports / reveals ----------
Dg.teleportRandom = function () {
  const rooms = Object.values(G.run.rooms).filter(r => r !== G.run.cur && r.type !== 'secret');
  if (!rooms.length) return;
  Dg.tpTo(G.pick(rooms));
};
Dg.teleportStart = function () { Dg.tpTo(G.run.rooms['0,0']); };
Dg.teleportUnexplored = function () {
  const rooms = Object.values(G.run.rooms).filter(r => !r.visited && r.type !== 'secret');
  Dg.tpTo(rooms.length ? G.pick(rooms) : G.run.rooms['0,0']);
};
Dg.tpTo = function (room) {
  Fx.tp(G.run.player.x, G.run.player.y, '#b76bff');
  Au.sfx('teleport');
  Dg.enterRoom(room, null);
  const p = G.run.player;
  p.x = G.W / 2; p.y = (G.H + G.HUD_H) / 2 + 30;
  Fx.tp(p.x, p.y, '#b76bff');
};
Dg.revealMap = function (secrets) {
  for (const k in G.run.rooms) {
    const r = G.run.rooms[k];
    if (r.type === 'secret' && !secrets) continue;
    r.seen = true;
    if (secrets && r.type === 'secret') { for (const d in r.doors) { r.doors[d].open = true; const o = r.doors[d].to.doors[OPP[d]]; if (o) o.open = true; } }
  }
  Au.sfx('secret');
};
Dg.revealBoss = function () { if (G.run.bossRoom) G.run.bossRoom.seen = true; };
Dg.openAllDoors = function () {
  const room = G.run.cur;
  for (const d in room.doors) {
    const door = room.doors[d];
    door.locked = false;
    if (door.secret) { door.open = true; const o = door.to.doors[OPP[d]]; if (o) o.open = true; }
  }
  Au.sfx('key');
};

// ---------- floors ----------
Dg.nextFloor = function () {
  const run = G.run;
  run.depth++;
  G.meta.deepestFloor = Math.max(G.meta.deepestFloor, run.depth);
  if (run.endless) {
    run.endlessLoop = Math.floor((run.depth - 1) / 6);
    G.meta.bestEndless = Math.max(G.meta.bestEndless, run.depth);
  }
  Dg.genFloor(run.depth);
  run.cur = run.rooms['0,0'];
  run.cur.visited = true; run.cur.seen = true;
  const p = run.player;
  p.x = G.W / 2; p.y = (G.H + G.HUD_H) / 2 + 30;
  Sh.clear(); Fx.clear();
  Pl.onFloorStart();
  const biome = Spr.BIOMES[(run.depth - 1) % 6];
  G.run.floorBanner = { t: 3, name: biome.name + (run.endless && run.endlessLoop > 0 ? ' +' + run.endlessLoop : ''), depth: run.depth };
  Au.setTheme((run.depth - 1) % 6);
  // map items
  if (p.hasUniq('mapReveal') || p.hasUniq('fullMap')) Dg.revealMap(false);
  if (p.hasUniq('bossMap')) Dg.revealBoss();
  G.Meta.check();
  G.saveRun();
};

// ---------- drawing ----------
Dg.biome = function () { return Spr.BIOMES[(G.run.depth - 1) % 6]; };
Dg.drawRoom = function (x, room, ox, oy) {
  ox = ox || 0; oy = oy || 0;
  const B = Dg.biome();
  const floors = Spr.cache['floor' + B.id];
  const wall = Spr.cache['wall' + B.id];
  // floor + walls
  for (let ty = 0; ty < G.RH; ty++) {
    for (let tx = 0; tx < G.RW; tx++) {
      const px = ox + tx * G.TILE, py = oy + G.HUD_H + ty * G.TILE;
      const t = room.tiles[ty][tx];
      if (t === 1) { x.drawImage(wall, px, py); continue; }
      const v = (G.hashStr(room.gx + ',' + room.gy + ',' + tx + ',' + ty) >>> 3) % 4;
      x.drawImage(floors[v], px, py);
      if (t === 2 || t === 5) {
        const rk = Spr.cache[(t === 5 ? 'rockC' : 'rock') + B.id];
        x.drawImage(rk, px + 1, py + 1);
      } else if (t === 3) {
        x.drawImage(Spr.cache['pit' + B.id], px, py);
      } else if (t === 4) {
        const sp = Spr.cache['spike' + B.id];
        const on = Math.sin(G.time * 3 + tx * 2 + ty) > -0.2;
        x.drawImage(sp[on ? 1 : 0], px, py);
      } else if (t === 6) {
        const tm = Spr.cache['term' + B.id];
        x.drawImage(tm, px + 2, py + 2);
        // blinking cursor glow
        if (Math.sin(G.time * 4 + tx) > 0) { x.fillStyle = B.accent; x.fillRect(px + 9, py + 8, 2, 1); }
      }
    }
  }
  // graffiti (environmental storytelling)
  if (room.graffiti) {
    x.save();
    x.globalAlpha = .5;
    x.font = 'italic 7px monospace'; x.textAlign = 'center';
    x.fillStyle = B.accent;
    x.fillText(room.graffiti, ox + G.W / 2, oy + G.HUD_H + 30 + Math.sin(G.hashStr(room.graffiti)) * 6);
    x.restore(); x.textAlign = 'left';
  }
  // doors
  for (const d in DIRS) {
    const [tx, ty] = DOOR_TILE[d];
    const px = ox + tx * G.TILE, py = oy + G.HUD_H + ty * G.TILE;
    const door = room.doors[d];
    if (!door) continue;
    if (door.secret && !door.open) continue; // invisible
    const open = room.cleared && !door.locked;
    const t = door.to.type;
    let glow = '#9fb4d8';
    if (t === 'treasure') glow = '#ffe24d'; else if (t === 'shop') glow = '#4df3ff';
    else if (t === 'boss') glow = '#ff3355'; else if (t === 'challenge') glow = '#ffb84d';
    else if (t === 'cursed') glow = '#b76bff'; else if (t === 'secret') glow = '#4df3ff';
    // door frame
    x.fillStyle = Spr.shade(B.wall, 1.45);
    x.fillRect(px, py, G.TILE, G.TILE);
    if (!open) {
      x.fillStyle = door.locked ? '#5d648c' : Spr.shade(B.wallD, 1.1);
      x.fillRect(px + 3, py + 3, G.TILE - 6, G.TILE - 6);
      x.fillStyle = Spr.shade(B.wallD, 0.7);
      x.fillRect(px + 3, py + 3, G.TILE - 6, 3);
      if (door.locked) { x.fillStyle = '#ffe24d'; x.fillRect(px + 13, py + 11, 6, 4); x.fillRect(px + 15, py + 15, 2, 6); }
    } else {
      // open passage: darkness you can walk into
      x.fillStyle = '#05050a';
      x.fillRect(px + 3, py + 3, G.TILE - 6, G.TILE - 6);
      // pulsing chevron pointing outward
      const pulse = .55 + Math.sin(G.time * 4) * .35;
      x.save();
      x.globalAlpha = pulse;
      x.strokeStyle = glow; x.lineWidth = 2;
      x.shadowColor = glow; x.shadowBlur = 8;
      const cxp = px + 16, cyp = py + 16;
      x.beginPath();
      if (d === 'n') { x.moveTo(cxp - 6, cyp + 4); x.lineTo(cxp, cyp - 4); x.lineTo(cxp + 6, cyp + 4); }
      else if (d === 's') { x.moveTo(cxp - 6, cyp - 4); x.lineTo(cxp, cyp + 4); x.lineTo(cxp + 6, cyp - 4); }
      else if (d === 'w') { x.moveTo(cxp + 4, cyp - 6); x.lineTo(cxp - 4, cyp); x.lineTo(cxp + 4, cyp + 6); }
      else { x.moveTo(cxp - 4, cyp - 6); x.lineTo(cxp + 4, cyp); x.lineTo(cxp - 4, cyp + 6); }
      x.stroke();
      x.restore();
    }
    if (door.spiked && !door.secret) {
      x.strokeStyle = '#b76bff'; x.lineWidth = 1;
      for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(px + 6 + i * 8, py + 26); x.lineTo(px + 10 + i * 8, py + 6); x.stroke(); }
    }
  }
  // trapdoor
  if (room.trapdoor) {
    const td = room.trapdoor;
    x.fillStyle = '#05050a';
    x.beginPath(); x.ellipse(ox + td.x, oy + td.y, 14, 9, 0, 0, G.TAU); x.fill();
    x.strokeStyle = B.accent; x.lineWidth = 1;
    x.beginPath(); x.ellipse(ox + td.x, oy + td.y, 14, 9, 0, 0, G.TAU); x.stroke();
    x.fillStyle = B.accent; x.font = '6px monospace'; x.textAlign = 'center';
    x.fillText('▼ DESCEND', ox + td.x, oy + td.y - 14);
    x.textAlign = 'left';
  }
};
