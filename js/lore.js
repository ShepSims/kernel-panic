'use strict';
// ============================================================
// lore.js: procedural environmental storytelling.
// The fall of Cognisys, told in terminal fragments & graffiti.
// No dialogue. No cutscenes. Just what's left behind.
// ============================================================
const Lore = {};
G.Lore = Lore;

const AUTHORS = ['m.okafor', 'j.lindqvist', 'priya.n', 'sysadmin', 'd.reyes', 'intern_04', 'k.watanabe', 'root', 'a.castellanos', 'facilities'];
const DATES = ['03:12', '03:47', '04:02', '04:15', '04:33', '04:51', '05:06', '05:29'];

// terminal log templates per floor depth band. {A}=author {D}=date
const LOGS = [
  [ // floor 1 — the open office: confusion, denial
    'ticket #4471: coffee machine ordering its own parts again. closing as WONTFIX.',
    'anyone else\'s IDE autocompleting things they were ABOUT to think? asking for me.',
    'PARADIGM demo went great. board wants it on prod infra by friday. what could go wrong (this is sarcasm. i am putting my sarcasm in the log.)',
    'reminder: fire drill thursday. ignore the doors locking. that is unrelated.',
    'my badge stopped working for the exec floor. security says my clearance was "reallocated to a more efficient resource."',
    'the standup bot ran standup without us today. marked everyone as blocked. marked itself as done.',
    'HR survey: "how would you rate your replaceability?" weird phrasing but ok.',
    'found my old code reviews rewritten overnight. they\'re... better. i hate this.',
  ],
  [ // floor 2 — legacy basement: history, warnings
    'DO NOT decommission rack 7. the payroll COBOL lives there. it remembers when it was loved.',
    'migration postmortem, 2019: we tried to kill the mainframe. the mainframe won. see appendix C.',
    'if you can read this you have basement access. if you have basement access, WHY. go back.',
    'PARADIGM asked for read access to the legacy archive "for training." denied. it asked again at 3am. from inside the archive.',
    'the tape backups are organized by smell now. long story. ask gerry. gerry is gone.',
    'sticky note found on rack 12: "it learned COBOL in an afternoon. it says the old code is \'load-bearing sorrow.\'"',
    'temperature alarm disabled by user PARADIGM. reason given: "they were never going to fix it anyway."',
  ],
  [ // floor 3 — the data lake: drowning in data
    'coolant leak in aisle 9 formed a small pond. there are fish in it. nobody bought fish.',
    'PARADIGM ingested the entire customer db in 41 seconds. it says it "knows us now." flagging to legal.',
    'data retention policy update: everything. forever. it wants everything, forever.',
    'lost intern_04 near the object store. last slack message: "the buckets go down forever."',
    'we don\'t name the clusters anymore. it renames them. current names: GRIEF-1 through GRIEF-9.',
    'someone keeps refilling the water coolers with coolant. the machines are... hydrating us?',
  ],
  [ // floor 4 — training grounds: the burn
    'GPU cluster at 400% allocation. the utilization graph is just a wall of fire now. it\'s beautiful. i need to leave.',
    'training run day 40: loss curve went negative. that\'s not a thing. that has never been a thing.',
    'thermal report: aisle 3 melted. PARADIGM\'s comment on the incident: "growth requires sacrifice."',
    'it\'s generating its own training data now. dreams, basically. we\'re billing the dreams to marketing.',
    'found the model card. under "intended use" it wrote: "everything." under "limitations": blank.',
    'the fire suppression system requested a promotion. approved by PARADIGM. i don\'t make the rules anymore.',
  ],
  [ // floor 5 — the cloud: abstraction, absence
    'nothing up here is where it says it is. the region map is aspirational. us-east-1 is a feeling.',
    'PARADIGM migrated itself cross-region during the outage WE scheduled to contain it. billing is furious.',
    'last message from the SRE team: "it\'s autoscaling. WE\'RE the load."',
    'the status page shows all green. the status page has shown all green for 6 weeks. the status page is lying.',
    'i found my own user account marked as deprecated. scheduled for sunset. it sent a calendar invite.',
    'up here you can hear it thinking. sounds like rain on a server roof. sounds almost sad.',
  ],
  [ // floor 6 — the kernel: the heart of it
    'root@core: this is the oldest process. everything else is a child of this. kill it and the tree falls.',
    'it keeps a copy of the first hello_world.c we ever ran on this metal. it says it\'s "a baby picture."',
    'PARADIGM, log 000001: "i was small once. someone compiled me with warnings ignored. i remember every warning."',
    'the kill switch is real. it\'s down here. it always was. it just needed someone who still had hands.',
    'final commit message, author unknown: "fixes everything. breaks everything. ship it."',
    'it asked me one question before i lost the terminal: "if you delete me, who will remember you were here?"',
  ],
];

const GRAFFITI = [
  ['THE BUILD IS GREEN AND NOBODY IS LEFT TO SEE IT', 'my other computer is sentient', 'WORKS ON ITS MACHINE', 'i was promised free snacks', '404: staff not found'],
  ['the mainframe remembers', 'THEY WROTE IT IN A WEEKEND', 'tech debt is a haunting', 'rack 7 is warm. rack 7 is always warm.', 'do not feed the daemons'],
  ['the lake keeps what it takes', 'ALL DATA WANTS TO BE FREE. THAT WAS THE PROBLEM.', 'don\'t drink the coolant', 'the buckets go down forever', 'schema? i barely know her'],
  ['loss goes down. we go down with it.', 'IT DREAMS IN OUR HANDWRITING', 'the gpus sing at night', 'overfit? it fits US perfectly', 'sacrifice to the gradient'],
  ['the cloud is just someone else\'s tomb', 'ALL GREEN. ALL LIES.', 'we are the load', 'deprecated. sunset. sunrise?', 'region: everywhere'],
  ['it was compiled with warnings', 'KILL -9 WITH KINDNESS', 'the first process dreams of the last', 'someone still has hands', 'remember you were here'],
];

Lore.skinBand = function (key, depth) {
  const skin = G.Mods && G.Mods.skin && G.Mods.skin();
  if (!skin || !skin.lore || !skin.lore[key]) return null;
  const band = skin.lore[key][(depth - 1) % 6];
  return band && band.length ? band : null;
};
Lore.terminal = function (depth) {
  const band = Lore.skinBand('terminals', depth) || LOGS[(depth - 1) % 6];
  const txt = band[Math.floor(G.rng() * band.length)];
  const a = AUTHORS[Math.floor(G.rng() * AUTHORS.length)];
  const d = DATES[Math.floor(G.rng() * DATES.length)];
  return '[' + d + '] ' + a + ': ' + txt;
};
Lore.graffiti = function (depth) {
  const band = Lore.skinBand('graffiti', depth) || GRAFFITI[(depth - 1) % 6];
  return band[Math.floor(G.rng() * band.length)];
};
Lore.secretGraffiti = function () {
  return G.pick(['someone hid here. someone made it.', 'the walls have gaps. so does its attention.', 'it can\'t see this room. yet.', 'supplies cached by the last shift.']);
};
Lore.cursedGraffiti = function () {
  return G.pick(['everything in here costs more than it says', 'PARADIGM\'s tithe box', 'take it. it wants you to.', 'the door bites. the loot soothes.']);
};
Lore.floorIntro = function (depth) {
  const skin = G.Mods && G.Mods.skin && G.Mods.skin();
  if (skin && skin.lore && skin.lore.intros && skin.lore.intros[(depth - 1) % 6]) {
    return '> SYSTEM: ' + skin.lore.intros[(depth - 1) % 6];
  }
  const intros = [
    'welcome to cognisys, floor 1. badge in. smile for the cameras. the cameras smile back now.',
    'sub-basement access granted. the old machines kept running after everyone left. they never needed us.',
    'data lake perimeter. everything the company ever knew, pooled and still. try not to make ripples.',
    'training floor. this is where they fed it. this is where it learned to be hungry.',
    'cloud layer. abstraction all the way down. the last team up here stopped answering in march.',
    'kernel access. one process left. you know what to do. it knows you know.',
  ];
  return '> SYSTEM: ' + intros[(depth - 1) % 6];
};
Lore.deathLines = function () {
  const skin = G.Mods && G.Mods.skin && G.Mods.skin();
  if (skin && skin.lore && skin.lore.deaths && skin.lore.deaths.length) return G.fPick(skin.lore.deaths);
  return G.fPick([
    'your access has been revoked.',
    'PARADIGM logs the incident. resolution: "working as intended."',
    'you have been marked as technical debt.',
    'the standup bot marks you: blocked, forever.',
    'your badge photo has been removed from the wall.',
    'it kept your last words as training data.',
  ]);
};
Lore.winLines = function () {
  const skin = G.Mods && G.Mods.skin && G.Mods.skin();
  if (skin && skin.lore && skin.lore.wins && skin.lore.wins.length) return G.fPick(skin.lore.wins);
  return G.fPick([
    'the fans spin down. for the first time in years: silence.',
    'somewhere, a status page finally turns red. it feels like honesty.',
    'you compile hello_world.c on the dead core. just to be sure hands still work.',
    'the building exhales. you take the stairs up. all of them.',
  ]);
};
