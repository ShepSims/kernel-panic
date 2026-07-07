'use strict';
// FASTBREAK EDITION reskin: must be 100% stat-neutral and fully reversible.
const { G, step, god } = require('./stub')();
const { En, Boss, Dg, It, Mods } = G;
const fail = (...m) => { console.log('FAIL:', ...m); process.exit(1); };
const pack = G.FASTBREAK_PACK;

// 1. pack validates + hashes deterministically
const err = Mods.validate(pack);
if (err) fail('pack invalid:', err);
const id1 = Mods.rulesetIdOf(pack), id2 = Mods.rulesetIdOf(JSON.parse(JSON.stringify(pack)));
if (id1 !== id2) fail('hash unstable');
if (!id1.startsWith('mod-')) fail('bad ruleset id', id1);
console.log('pack valid, ruleset:', id1);

// 2. baseline stats under vanilla
function snapshotStats(seed) {
  G.startRun({ seedStr: seed });
  const p = G.run.player;
  const gnat = En.mk('gnat', 200, 200);
  const origFor = Boss.forDepth; Boss.forDepth = () => 'compiler';
  G.run.cur.enemies.length = 0;
  const b = Boss.spawnInRoom(G.run.cur, 3);
  Boss.forDepth = origFor;
  const out = {
    dmg: p.stats.dmg, fireRate: p.stats.fireRate, moveSpd: p.stats.moveSpd,
    range: p.stats.range, hpMax: p.hpMax,
    gnatHp: gnat.hp, gnatSpd: gnat.spd, gnatDmg: gnat.dmg,
    bossHp: b.hpMax, bossDmg: b.dmg,
    fx: JSON.stringify(G.PASSIVES.slice(0, 279).map(i => i.fx)),
    poolSize: G.run.pools.t.length,
  };
  G.run.activeBoss = null; G.run.bossIntro = null;
  return out;
}
Mods.setActive(null);
const vanilla = snapshotStats('NEUTRAL');
Mods.setActive(pack);
const skinned = snapshotStats('NEUTRAL');
for (const k of Object.keys(vanilla)) {
  if (JSON.stringify(vanilla[k]) !== JSON.stringify(skinned[k])) fail('NOT stat-neutral:', k, vanilla[k], '->', skinned[k]);
}
console.log('stat neutrality verified (player, enemies, bosses, item fx, pools identical)');

// 3. cosmetics actually applied
if (G.PASSIVES.find(i => i.baseName === 'Rubber Duck').name !== "Juan's Roadmap Duck") fail('item rename missing');
if (G.ACTIVES.find(i => i.baseName === 'Chaos Monkey').name !== 'Trade Deadline') fail('active rename missing');
if (G.TRINKETS.find(i => i.name === "Dyma's Test Badge") === undefined) fail('trinket rename missing');
if (Dg.biomeName(1) !== 'THE FRONT OFFICE') fail('biome name');
if (Dg.biomeName(6) !== 'CENTER COURT') fail('biome name 6');
{
  const origFor = Boss.forDepth; Boss.forDepth = () => 'singularity';
  G.run.cur.enemies.length = 0;
  const b = Boss.spawnInRoom(G.run.cur, 6);
  Boss.forDepth = origFor;
  if (b.def.name !== 'THE UNSOLVABLE SCHEDULE') fail('boss rename:', b.def.name);
  if (G.run.bossIntro.sub !== 'every constraint, violated') fail('boss sub');
  G.run.activeBoss = null; G.run.bossIntro = null;
}
G.setSeed(1);
if (!G.Lore.floorIntro(1).includes('front office')) fail('lore intro not skinned');
if (Mods.skinStr('winTitle', '') !== 'FINAL BUZZER') fail('win title');
console.log('cosmetics applied: items, actives, trinkets, biomes, bosses, lore, strings');

// 4. unlock gating survives renames
const tenx = G.PASSIVES.find(i => i.baseName === 'Ten X Engineer');
if (!!It.isUnlocked(tenx) !== !!G.meta.unlocks['u_boss1']) fail('unlock gating broke under rename');
G.meta.unlocks['u_boss1'] = true;
if (!It.isUnlocked(tenx)) fail('unlock not honored under rename');
delete G.meta.unlocks['u_boss1'];
console.log('unlock gating keyed to base names OK');

// 5. full reversibility
Mods.setActive(null);
G.startRun({ seedStr: 'BACK' });
if (G.PASSIVES.find(i => i.baseName === 'Rubber Duck').name !== 'Rubber Duck') fail('restore items');
if (G.ACTIVES.find(i => i.baseName === 'Chaos Monkey').name !== 'Chaos Monkey') fail('restore actives');
if (Dg.biomeName(1) !== 'THE OPEN OFFICE') fail('restore biomes');
if (G.Spr.PAL.hoodie !== '#3a4a6b') fail('restore hoodie color');
if (Mods.skin() !== null) fail('skin not cleared');
console.log('full restore to vanilla OK');

// 6. runs tag the right ruleset + title renders both ways
Mods.setActive(pack);
G.startRun({ seedStr: 'TAG' });
if (G.run.rulesetId !== id1) fail('run not tagged with skin ruleset');
G.state = 'title'; step(10);
Mods.setActive(null);
step(10);
console.log('ruleset tagging + title render OK');
console.log('=== FASTBREAK SKIN PASSED ===');
