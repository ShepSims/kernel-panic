'use strict';
// Core smoke suite: boot, run, combat, doors, generation fuzz, all bosses.
const { G, step, god } = require('./stub')();
const { En, Boss, Dg, It, Sh } = G;
const fail = (...m) => { console.log('FAIL:', ...m); process.exit(1); };

// boot + title
step(30);
if (G.state !== 'title') fail('not on title');
console.log('boot + title OK —', G.PASSIVES.length, 'passives,', G.ACTIVES.length, 'actives,', G.TRINKETS.length, 'trinkets,', Object.keys(En.DEFS).length, 'enemies');

// run + combat
G.startRun({ seedStr: 'SMOKE' });
G.keys.right = true; G.keys.shootLeft = true; step(90); G.keys.right = false; G.keys.shootLeft = false;
god();
G.run.cur.enemies.length = 0;
for (const type in En.DEFS) En.spawnAt(type, 240, 200, {});
G.keys.shootDown = true; for (let i = 0; i < 300; i++) { god(); step(1); } G.keys.shootDown = false;
console.log('combat sim OK, kills:', G.run.stats.kills || 0);

// door walking round trip
G.startRun({ seedStr: 'DOORTEST' });
const OPP = { n: 's', s: 'n', w: 'e', e: 'w' };
const zonePos = d => d === 'w' ? [42, 176] : d === 'e' ? [G.W - 42, 176] : d === 'n' ? [240, G.HUD_H + 42] : [240, G.H - 42];
{
  const s0 = G.run.cur, p = G.run.player;
  const d = Object.keys(s0.doors).find(k => !s0.doors[k].secret);
  const dest = s0.doors[d].to;
  p.keys = 9;
  [p.x, p.y] = zonePos(d); step(90);
  if (G.run.cur !== dest) fail('door walk did not arrive');
  for (const e of G.run.cur.enemies) e.dead = true;
  step(30); god();
  [p.x, p.y] = zonePos(OPP[d]); step(90);
  if (G.run.cur !== s0) fail('could not walk back');
  console.log('door round trip OK');
}

// generation fuzz
for (let i = 0; i < 40; i++) {
  G.startRun({ seedStr: 'FUZZ' + i });
  const rs = Object.values(G.run.rooms);
  if (!rs.some(r => r.type === 'boss') || !rs.some(r => r.type === 'treasure')) fail('fuzz seed missing specials', i);
  step(4);
}
console.log('40-seed generation fuzz OK');

// all 10 bosses, all phases
const kinds = ['compiler', 'hallucination', 'singularity', 'gc', 'scheduler', 'forkprime', 'auditor', 'balancer', 'rootkitprime', 'leviathan'];
const orig = Boss.forDepth;
for (const kind of kinds) {
  god(); G.run.cur.enemies.length = 0; G.run.cur.eshots.length = 0; G.run.activeBoss = null;
  Boss.forDepth = () => kind;
  const b = Boss.spawnInRoom(G.run.cur, 4);
  G.run.bossIntro = null; b.spawnProt = 0;
  for (const ph of [1, .5, .2]) { b.hp = b.hpMax * ph; for (let i = 0; i < 120; i++) { god(); step(1); } }
  for (const s of (b.shields || [])) s.dead = true;
  b.spawnProt = 0; if (b.state === 'burrowed') { b.state = 'surfaced'; b.surfT = 2; }
  En.damage(b, 1e9, {});
  step(140);
  if (!b.dead) fail('boss unkillable:', kind);
  G.run.activeBoss = null; G.run.bossDying = null;
}
Boss.forDepth = orig;
console.log('all 10 bosses fought + killed OK');

// death flow
G.startRun({ seedStr: 'DIE' });
const p = G.run.player;
G.run.cur.shieldUsed = true; p.soul = 0; p.hp = 1;
for (let i = 0; i < 200 && !p.dead; i++) { p.iframes = 0; p.soul = 0; p.hurt(99, null, true); }
if (!p.dead) fail('unkillable player');
step(30);
if (G.state !== 'dead') fail('death state=', G.state);
console.log('death flow OK');

// menus render
for (const st of ['stats', 'ach', 'itemlog', 'help', 'leader', 'mods', 'modbrowse', 'title']) { G.state = st; G.UI.sel = 0; step(8); }
console.log('menu screens OK');
console.log('=== SMOKE PASSED ===');
