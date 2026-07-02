'use strict';
// ============================================================
// meta.js: saves, achievements, unlocks, statistics, run save
// ============================================================
const Meta = {};
G.Meta = Meta;

// ---------- achievements ----------
// check: function returning bool given meta m and run r
Meta.ACH = [
  { id: 'first_blood', name: 'First Bug Closed', desc: 'Kill your first enemy', chk: m => m.kills >= 1 },
  { id: 'hundred', name: 'Backlog Groomed', desc: 'Kill 100 enemies', chk: m => m.kills >= 100 },
  { id: 'thousand', name: 'Inbox Zero', desc: 'Kill 1,000 enemies', chk: m => m.kills >= 1000 },
  { id: 'fivek', name: 'Force of Nature', desc: 'Kill 5,000 enemies', chk: m => m.kills >= 5000 },
  { id: 'boss1', name: 'It Compiled', desc: 'Defeat your first boss', chk: m => m.bossKills >= 1 },
  { id: 'boss10', name: 'Release Manager', desc: 'Defeat 10 bosses', chk: m => m.bossKills >= 10 },
  { id: 'boss25', name: 'Sprint Goal: Violence', desc: 'Defeat 25 bosses', chk: m => m.bossKills >= 25 },
  { id: 'floor3', name: 'Middle Management', desc: 'Reach floor 3', chk: m => m.deepestFloor >= 3 },
  { id: 'floor5', name: 'Cloud Native', desc: 'Reach floor 5', chk: m => m.deepestFloor >= 5 },
  { id: 'win1', name: 'kill -9', desc: 'Shut down PARADIGM', chk: m => m.wins >= 1 },
  { id: 'win5', name: 'Serial Decommissioner', desc: 'Win 5 runs', chk: m => m.wins >= 5 },
  { id: 'win10', name: 'The Old Guard', desc: 'Win 10 runs', chk: m => m.wins >= 10 },
  { id: 'die1', name: 'Post-Mortem Scheduled', desc: 'Die for the first time', chk: m => m.deaths >= 1 },
  { id: 'die25', name: 'Blameless Culture', desc: 'Die 25 times', chk: m => m.deaths >= 25 },
  { id: 'items10', name: 'Kitted Out', desc: 'Collect 10 items total', chk: m => m.itemsCollected >= 10 },
  { id: 'items100', name: 'Dependency Hell', desc: 'Collect 100 items total', chk: m => m.itemsCollected >= 100 },
  { id: 'items8run', name: 'Full Stack', desc: 'Hold 8+ items in one run', chk: (m, r) => r && r.player && r.player.items.length >= 8 },
  { id: 'items15run', name: 'Monolith', desc: 'Hold 15+ items in one run', chk: (m, r) => r && r.player && r.player.items.length >= 15 },
  { id: 'rich', name: 'Series A', desc: 'Hold 50 credits at once', chk: (m, r) => r && r.player && r.player.coins >= 50 },
  { id: 'richer', name: 'Unicorn', desc: 'Hold 99 credits at once', chk: (m, r) => r && r.player && r.player.coins >= 99 },
  { id: 'secret1', name: 'Reading the Source', desc: 'Find a secret room', chk: m => m.secretsFound >= 1 },
  { id: 'secret10', name: 'Off the Org Chart', desc: 'Find 10 secret rooms', chk: m => m.secretsFound >= 10 },
  { id: 'deal1', name: 'Overclocked', desc: 'Take an overclock deal', chk: m => m.dealsTaken >= 1 },
  { id: 'deal5', name: 'Faustian Regular', desc: 'Take 5 overclock deals', chk: m => m.dealsTaken >= 5 },
  { id: 'cursed5', name: 'Risk Appetite', desc: 'Enter 5 cursed rooms', chk: m => m.cursedEntered >= 5 },
  { id: 'chal1', name: 'Sprint Survivor', desc: 'Clear a challenge room', chk: m => m.challengesWon >= 1 },
  { id: 'chal10', name: 'Velocity Demon', desc: 'Clear 10 challenge rooms', chk: m => m.challengesWon >= 10 },
  { id: 'rooms100', name: 'Facilities Tour', desc: 'Clear 100 rooms', chk: m => m.roomsCleared >= 100 },
  { id: 'rooms500', name: 'Knows Every Corner', desc: 'Clear 500 rooms', chk: m => m.roomsCleared >= 500 },
  { id: 'coins200', name: 'Expense Report', desc: 'Collect 200 credits total', chk: m => m.coinsCollected >= 200 },
  { id: 'nohit_boss', name: 'Clean Deploy', desc: 'Kill a boss without taking damage', chk: (m, r) => !!(r && r.flags && r.flags.cleanBoss) },
  { id: 'speed_floor', name: 'Hotfix Speedrun', desc: 'Clear floor 1 in under 90 seconds', chk: (m, r) => !!(r && r.flags && r.flags.fastFloor) },
  { id: 'endless6', name: 'Overtime', desc: 'Reach floor 7+ in endless', chk: m => m.bestEndless >= 7 },
  { id: 'endless12', name: 'Who Needs Sleep', desc: 'Reach floor 12+ in endless', chk: m => m.bestEndless >= 12 },
  { id: 'glass', name: 'Living Dangerously', desc: 'Win with 1 max battery', chk: (m, r) => !!(r && r.flags && r.flags.glassWin) },
  { id: 'pacifist_shop', name: 'Loyal Customer', desc: 'Buy 3 items from one shop', chk: (m, r) => !!(r && r.flags && r.flags.shopSpree) },
  { id: 'synergy4', name: 'It All Connects', desc: 'Have 4+ shot-modifier items at once', chk: (m, r) => { if (!r || !r.player) return false; const mm = r.player.mods; return [mm.pierce, mm.homing, mm.split, mm.bounce, mm.explode, mm.chain, mm.wavy, mm.boomerang].filter(v => v > 0).length >= 4; } },
  { id: 'duckfan', name: 'Quack Overflow', desc: 'Have 3+ familiars at once', chk: (m, r) => r && r.player && r.player.fams.length >= 3 },
  { id: 'trinket10', name: 'Pocket Archaeologist', desc: 'See 10 different trinkets', chk: m => Object.keys(m.seenItems).filter(k => k[0] === 't').length >= 10 },
  { id: 'log50', name: 'Cataloguer', desc: 'See 50 different items', chk: m => Object.keys(m.seenItems).length >= 50 },
  { id: 'log150', name: 'Completionist Arc', desc: 'See 150 different items', chk: m => Object.keys(m.seenItems).length >= 150 },
];

// unlocks: achievement id -> unlock id; items gated by unlock ids
Meta.UNLOCKS = {
  boss1: { id: 'u_boss1', label: 'New items: boss pool expands' },
  win1: { id: 'u_win1', label: 'New items: the deep cuts' },
  secret10: { id: 'u_secret10', label: 'New secret-pool items' },
  deal5: { id: 'u_deal5', label: 'New overclock items' },
  chal10: { id: 'u_chal10', label: 'New challenge rewards' },
  endless6: { id: 'u_endless', label: 'Endless elite items' },
};
// gate a slice of the pools behind unlocks (name-keyed)
G.UNLOCK_ITEMS = {
  'passive:Ten X Engineer': 'u_boss1',
  'passive:Neural Targeting': 'u_boss1',
  'passive:Quad Core': 'u_boss1',
  'passive:Read-Only Mode': 'u_win1',
  'passive:Sudo Ghost': 'u_win1',
  'passive:Cascade Failure': 'u_secret10',
  'passive:The Old Ways': 'u_win1',
  'passive:Fifty-Fifty Deploy': 'u_secret10',
  'active:Chaos Monkey': 'u_win1',
  'active:Fork the Repo': 'u_secret10',
  'passive:Glass Cannon Build': 'u_deal5',
  'passive:Crunch Mode': 'u_deal5',
  'active:rm -rf ./enemies': 'u_chal10',
  'passive:Post-Mortem Culture': 'u_endless',
};

Meta.check = function () {
  if (!G.meta) return;
  let newly = [];
  for (const a of Meta.ACH) {
    if (G.meta.achievements[a.id]) continue;
    let ok = false;
    try { ok = a.chk(G.meta, G.run); } catch (e) { }
    if (ok) {
      G.meta.achievements[a.id] = true;
      newly.push(a);
      const ul = Meta.UNLOCKS[a.id];
      if (ul && !G.meta.unlocks[ul.id]) {
        G.meta.unlocks[ul.id] = true;
        G.toast('UNLOCKED: ' + ul.label, '#ffe24d');
      }
    }
  }
  for (const a of newly) {
    G.toast('⚑ ACHIEVEMENT: ' + a.name, '#58f08a');
    Au.sfx('levelup');
  }
  if (newly.length) G.saveMeta();
};

Meta.stat = function (k, n) { G.meta[k] = (G.meta[k] || 0) + (n === undefined ? 1 : n); };

Meta.onDeath = function () {
  G.meta.deaths++; G.meta.runs++;
  G.meta.totalTime += G.run.time;
  Meta.check();
  G.saveMeta();
  G.clearRunSave();
  setTimeout(() => { }, 0);
  G.deathInfo = {
    line: G.Lore.deathLines(),
    floor: G.run.depth, kills: G.run.stats.kills || 0,
    items: G.run.player.items.length, time: G.run.time,
    seed: G.run.seedStr,
  };
  G.Net.submitRun();
  G.stateT = 0;
  G.state = 'dead';
  Au.stopMusic();
};

Meta.onWin = function () {
  G.meta.wins++; G.meta.runs++;
  G.meta.totalTime += G.run.time;
  G.run.won = true;
  G.Net.submitRun();
  G.run.flags = G.run.flags || {};
  if (G.run.player.hpMax === 1) G.run.flags.glassWin = true;
  Meta.check();
  G.saveMeta();
  G.clearRunSave();
  G.winInfo = {
    line: G.Lore.winLines(),
    kills: G.run.stats.kills || 0, items: G.run.player.items.length,
    time: G.run.time, seed: G.run.seedStr,
  };
  G.stateT = 0;
  G.state = 'win';
  Au.setTheme(7);
};

// ---------- run save (continue) ----------
G.RUN_KEY = 'kernelpanic_run_v1';
G.saveRun = function () {
  if (!G.run) return;
  try {
    const p = G.run.player;
    const data = {
      seed: G.run.seed, seedStr: G.run.seedStr, depth: G.run.depth,
      endless: G.run.endless, time: G.run.time,
      rulesetId: G.run.rulesetId, runId: G.run.runId,
      stats: G.run.stats, bossesKilled: G.run.bossesKilled || 0,
      player: {
        hpMax: p.hpMax, hp: p.hp, soul: p.soul, coins: p.coins, bombs: p.bombs, keys: p.keys,
        items: p.items.map(i => i.id), trinket: p.trinket,
        active: p.active ? { id: p.active.def.id, charge: p.active.charge } : null,
        permDmg: p.permDmg,
      },
    };
    localStorage.setItem(G.RUN_KEY, JSON.stringify(data));
  } catch (e) { }
};
G.clearRunSave = function () { try { localStorage.removeItem(G.RUN_KEY); } catch (e) { } };
G.loadRunSave = function () {
  try { return JSON.parse(localStorage.getItem(G.RUN_KEY)); } catch (e) { return null; }
};
