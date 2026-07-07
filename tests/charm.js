'use strict';
// Charm rework: recruit-on-kill, harmless allies, friendly bullets.
const { G, step, god } = require('./stub')();
const { En, Sh } = G;
const fail = (...m) => { console.log('FAIL:', ...m); process.exit(1); };

G.startRun({ seedStr: 'CHARM' });
const p = G.run.player;
god();
G.run.cur.enemies.length = 0; G.run.cur.eshots.length = 0;

// 1. hitting (not killing) never charms
p.recalc(); p.mods.charm = 1;
let e1 = En.spawnAt('spambot', 340, 200, {}); e1.spawnProt = 0; e1.hp = e1.hpMax = 50;
En.damage(e1, 2, {});
if (e1.friendly) fail('charmed on a non-lethal hit');
console.log('non-lethal hits never charm: PASS');

// 2. killing blow recruits: alive, friendly, half hp
En.damage(e1, 999, {});
if (e1.dead) fail('recruit died');
if (!e1.friendly || !e1.charmed) fail('not recruited on kill');
if (e1.hp !== Math.max(2, Math.round(e1.hpMax * .5))) fail('recruit hp wrong:', e1.hp);
console.log('killing blow recruits at half hp: PASS');

// 3. recruited enemies cannot hurt you (contact)
p.x = e1.x; p.y = e1.y; p.iframes = 0; p.hp = 10; p.soul = 0; p.hpMax = 6;
const hpBefore = p.hp;
for (let i = 0; i < 30; i++) { p.iframes = 0; p.x = e1.x; p.y = e1.y; step(1); p.hp = Math.min(p.hp, hpBefore); if (p.dead) break; }
if (p.hp < hpBefore) fail('charmed contact damaged player');
console.log('charmed contact is harmless: PASS');

// 4. charmed worm segments are harmless
god(); G.run.cur.enemies.length = 0;
const worm = En.spawnAt('wormhead', 300, 200, {}); worm.spawnProt = 0;
En.charm(worm);
p.hp = 10; p.soul = 0; p.hpMax = 6; p.iframes = 0;
p.x = worm.segs[0].x; p.y = worm.segs[0].y;
const hp2 = p.hp;
for (let i = 0; i < 20; i++) { p.iframes = 0; p.x = worm.segs[0].x; p.y = worm.segs[0].y; step(1); }
if (p.hp < hp2) fail('charmed worm segment hurt player');
console.log('charmed worm segments harmless: PASS');

// 5. friendly bullets: charmed shooter damages foes, never you
god(); G.run.cur.enemies.length = 0; G.run.cur.eshots.length = 0;
const shooter = En.spawnAt('spambot', 200, 200, {}); shooter.spawnProt = 0;
En.charm(shooter); shooter.allyT = 999;
const foe = En.spawnAt('firewall', 300, 200, {}); foe.spawnProt = 0;
foe.def = Object.assign({}, foe.def, { shielded: false, ai: 'radial' }); foe.cd = 1e9; foe.spd = 0;
foe.hp = foe.hpMax = 500;
p.x = 250; p.y = 200; p.hp = 12; p.hpMax = 6; p.soul = 0; // standing right in the line of fire
let sawFriendlyShot = false;
const hp3 = p.hp;
for (let i = 0; i < 500; i++) {
  p.dead = false; p.hp = Math.min(p.hp, hp3); p.x = 250; p.y = 200; G.state = 'run';
  step(1);
  if (G.run.cur.eshots.some(s => s.friendly)) sawFriendlyShot = true;
}
if (!sawFriendlyShot) fail('charmed shooter never fired friendly bullets');
if (foe.hp >= foe.hpMax) fail('friendly bullets did not damage foes');
if (p.hp < hp3) fail('friendly bullets hurt the player');
console.log('friendly bullets hit foes, never you (foe hp', foe.hpMax, '->', Math.round(foe.hp) + '): PASS');

// 6. charm actives still convert instantly
god(); G.run.cur.enemies.length = 0;
const e2 = En.spawnAt('bug', 300, 220, {}); e2.spawnProt = 0;
G.It.ACTIVE_FX.charmN(1);
if (!e2.friendly) fail('charm active failed');
console.log('charm actives still work: PASS');
console.log('=== CHARM REWORK PASSED ===');
