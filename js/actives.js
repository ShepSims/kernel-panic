'use strict';
// ============================================================
// 100+ active items. { name, desc, charge, fx:[behavior, arg] }
// Behaviors are implemented in items.js ACTIVE_FX registry.
// ============================================================
G.ACTIVES = [];
function A(name, desc, charge, fx, q, pool) {
  G.ACTIVES.push({ id: G.ACTIVES.length, name, desc, charge, fx, q: q || 2, pool: pool || 't', kind: 'active' });
}

// ---------- room nukes ----------
A('rm -rf ./enemies', 'Delete everything in the room', 6, ['nuke', 40], 4, 'x');
A('Kill Dash Nine', 'Heavy damage to all enemies', 4, ['nuke', 18], 3);
A('Restart Services', 'Damage all enemies', 3, ['nuke', 10], 2);
A('Clear Cache', 'Light damage to all, stuns briefly', 2, ['nukeStun', 6], 2);
A('Purge Logs', 'Moderate damage to all enemies', 3, ['nuke', 13], 2);
A('Garbage Collection Pass', 'Damage all; weakest enemies deleted outright', 4, ['nukeExecute', 12], 3);
// ---------- stuns / crowd control ----------
A('Blue Screen', 'Freeze all enemies for 4s', 3, ['freeze', 4], 2);
A('Endless Loading Bar', 'Freeze all enemies for 6s', 4, ['freeze', 6], 3);
A('Mandatory Update', 'Stun all enemies for 3s', 2, ['freeze', 3], 2);
A('Alarm Fatigue', 'Fear all enemies for 5s', 3, ['fearAll', 5], 2);
A('Fire Drill', 'Fear all enemies for 8s', 4, ['fearAll', 8], 2);
A('Phishing Campaign', 'Charm up to 3 enemies to fight for you', 4, ['charmN', 3], 3);
A('Social Proof', 'Charm 1 enemy', 2, ['charmN', 1], 2);
A('Rate Limit All', 'Slow all enemies for 8s', 3, ['slowAll', 8], 2);
A('Throttle Everything', 'Slow all enemies for 12s', 4, ['slowAll', 12], 2);
A('Time Dilation Debugger', 'Slow enemies AND their shots for 5s', 4, ['bulletTime', 5], 3, 'x');
A('Breakpoint', 'Freeze the nearest enemy for 8s', 1, ['freezeOne', 8], 1);
// ---------- healing / defense ----------
A('First Aid Sprint', 'Heal 1 battery', 2, ['heal', 2], 1);
A('Health Potion.exe', 'Heal 2 batteries', 4, ['heal', 4], 2);
A('Full Restore', 'Heal to full', 6, ['healFull', 0], 3, 's');
A('Backup Battery', 'Gain 1 shield cell', 2, ['soul', 1], 1);
A('Emergency Generator', 'Gain 2 shield cells', 4, ['soul', 2], 2);
A('Bunker Mode', 'Invulnerable for 5s', 4, ['invuln', 5], 3);
A('Maintenance Window', 'Invulnerable for 3s', 3, ['invuln', 3], 2);
A('Change Freeze', 'Invulnerable 2s + knockback nova', 2, ['invulnNova', 2], 2);
// ---------- mobility ----------
A('SSH Tunnel', 'Teleport to a random room', 2, ['tpRandom', 0], 2);
A('Home Directory', 'Teleport to the starting room', 1, ['tpStart', 0], 1);
A('Wormhole Config', 'Teleport to an unexplored room', 3, ['tpUnexplored', 0], 2);
A('Blink Script', 'Short-range dash blink', 1, ['blink', 0], 1);
A('Eject Disk', 'Blink + shove all enemies away', 2, ['blinkPush', 0], 2);
// ---------- rerolls (the fun ones) ----------
A('Chaos Monkey', 'Reroll ALL your passive items', 6, ['rerollSelf', 0], 4, 'x');
A('Dependency Bump', 'Reroll item pedestals in the room', 4, ['rerollItems', 0], 3);
A('npm audit fix --force', 'Reroll pedestals... and pickups... and maybe you', 5, ['rerollChaotic', 0], 3, 'u');
A('Coin Flip Deploy', 'Reroll all pickups in the room', 2, ['rerollPickups', 0], 1);
A('Mutation Testing', 'Transform all enemies into different ones', 3, ['rerollEnemies', 0], 2);
A('A/B Test', 'Duplicate a random pickup in the room', 3, ['dupePickup', 0], 2);
A('Fork the Repo', 'Duplicate ALL pickups in the room', 6, ['dupeAll', 0], 4, 'x');
// ---------- spawns ----------
A('Print Money Bug', 'Spawn 3-5 credits', 3, ['coins', 4], 2, 's');
A('Expense It', 'Spawn 6-9 credits', 4, ['coins', 7], 2, 's');
A('Keygen', 'Spawn an access token', 3, ['key', 1], 2);
A('Logic Bomb Fabricator', 'Spawn 2 logic bombs', 3, ['bombs', 2], 2);
A('Supply Closet Raid', 'Spawn a random pickup', 1, ['drop', 1], 1);
A('Quartermaster Query', 'Spawn 3 random pickups', 3, ['drop', 3], 2);
A('Sentry Deploy', 'Place a turret that fights for 10s', 3, ['turret', 10], 3);
A('Botnet (Reclaimed)', 'Summon 4 ally bugs', 3, ['allies', 4], 2);
A('Swarm Release', 'Summon 7 ally bugs', 4, ['allies', 7], 3);
// ---------- conversions / deals ----------
A('Sell Plasma', 'Lose 1 battery, gain 12 credits', 1, ['bloodMoney', 12], 2, 'u');
A('Buy Health', 'Pay 15 credits, heal 2 batteries', 2, ['buyHealth', 15], 2, 's');
A('Crypto Cashout', 'Convert shield cells to 8 credits each', 2, ['soulSell', 8], 2, 's');
A('Overclock Sacrifice', 'Lose 1 battery: +damage permanently', 4, ['hpForDmg', 0], 3, 'd');
A('Faustian Compiler', 'Lose 1 battery: spawn an item pedestal', 6, ['hpForItem', 0], 4, 'd');
A('Debt Consolidation', 'All credits become health (3:1)', 4, ['coinsToHp', 3], 2);
// ---------- offense bursts ----------
A('Packet Storm', 'Nova of 16 shots', 2, ['nova', 16], 2);
A('Broadcast Everything', 'Nova of 24 piercing shots', 4, ['novaPierce', 24], 3);
A('Laser Grid Sweep', 'Four sweeping piercing beams', 4, ['cross', 0], 3);
A('Fumigation Protocol', 'Poison cloud around you', 3, ['poisonCloud', 0], 2);
A('Halon Dump', 'Burn wave across the room', 4, ['burnWave', 0], 3);
A('Gravity Well.js', 'Black hole pulls enemies together', 4, ['blackHole', 3], 3, 'x');
A('Force Push (Patented)', 'Massive knockback nova', 2, ['push', 0], 1);
A('Static Field', 'Lightning strikes 5 random enemies', 3, ['lightning', 5], 2);
A('Thunder Migration', 'Lightning strikes ALL enemies', 5, ['lightningAll', 0], 3);
A('Giant Packet', 'Next 3 shots are massive', 2, ['giantNext', 3], 2);
A('Uncapped Frames', '+100% fire rate this room', 3, ['tearsRoom', 1], 2);
A('Demo Mode', '+100% damage this room', 3, ['dmgRoom', 1], 2);
A('God Object', '+damage +fire rate this room', 5, ['allRoom', 0], 3, 'b');
// ---------- map / doors ----------
A('Traceroute', 'Reveal the whole map', 2, ['mapReveal', 0], 1);
A('Deep Scan', 'Reveal map including secrets', 4, ['mapSecrets', 0], 3, 'x');
A('Master Override', 'Open all doors in this room, even locked', 3, ['openDoors', 0], 2);
A('Skeleton Token', 'Unlock one locked door/chest free', 2, ['freeUnlock', 0], 2);
A('Demolition Order', 'Crack every obstacle in the room', 2, ['breakRocks', 0], 1);
A('Elevator Override', 'Descend immediately (skip the floor!)', 6, ['trapdoor', 0], 3, 'u');
// ---------- weird / gambles ----------
A('Slot Machine Script', 'Random: credits, hearts, bombs... or bugs', 1, ['gamble', 0], 1, 's');
A('Prod Roulette', 'Random powerful effect, good or bad', 3, ['roulette', 0], 2, 'u');
A('Intern\'s USB Stick', 'Nobody knows what this does', 2, ['mystery', 0], 2, 'x');
A('Copy Stack Answer', 'Copies the effect of a random active', 3, ['copycat', 0], 2);
A('Legacy Macro', 'Repeats your last active effect', 4, ['repeat', 0], 2);
A('Rubber Duck Summit', 'All familiars fire a burst', 2, ['famBurst', 0], 2);
A('Standup Timer', 'Enemies take damage every second... for 15s', 4, ['dot', 15], 3);
A('The Big Red Button', 'Huge explosion centered on you', 3, ['selfBomb', 0], 2);
A('Sprint Planning', 'See this floor\'s boss; +1 charge on all clears today', 2, ['bossPeek', 0], 1);
A('Cursed Compile', 'Reroll enemies into stronger ones; drop 2 items?! No: pickups x3', 5, ['cursedCompile', 0], 3, 'u');
A('Mirror Deploy', 'Temporary: shots also fire backwards, 20s', 2, ['mirror', 20], 2);
A('Hall Pass', 'Next cursed/challenge room entry is free', 2, ['hallPass', 0], 2);
A('Snooze Alarm', 'Enemies in room fall asleep (until hit)', 2, ['sleepAll', 0], 2);
A('Absolute Silence', 'Enemies can\'t shoot for 6s', 3, ['muteAll', 6], 2);
A('Focus Block', 'Clear own shots, next volley x5 count', 2, ['volleyX', 5], 2);
A('Pomodoro Bell', '25s of +speed +fire rate', 3, ['haste', 25], 2);
A('Just One More Query', 'Magnetize all pickups on floor to you', 3, ['magnetAll', 0], 2);
A('Delegate to AI', 'Irony. Auto-clears weakest 3 enemies', 3, ['executeWeak', 3], 2);
A('Unsubscribe All', 'Deletes all enemy projectiles', 1, ['clearBullets', 0], 1);
A('Patch Notes', 'Identify: reveals what unidentified pills/effects do', 1, ['identify', 0], 1);
A('Regex Golf', 'Piercing spiral of 32 shots', 5, ['spiral', 32], 3, 'x');
A('Committee Meeting', 'Summon 3 decoys that taunt enemies', 3, ['decoys', 3], 2);
A('Burner Laptop', 'Explodes. Throw it: big directional blast', 2, ['throwBomb', 0], 2);
A('Scapegoat Plushie', 'Absorbs the next 3 hits, 30s', 3, ['shieldHits', 3], 2);
A('Reboot Ritual', 'Full heal, lose all shield cells', 5, ['rebootHeal', 0], 3);
A('Golden Ticket Bot', 'Spawn a locked golden chest', 4, ['goldChest', 0], 3, 's');
A('Warranty Claim', 'Restore your active\'s charges after use (once)', 3, ['warranty', 0], 2);
A('YOLO Deploy', 'x3 damage this room, take x2 damage', 2, ['yolo', 0], 2, 'u');
A('Archive Extraction', 'Open all chests in room without keys', 3, ['openChests', 0], 2);
A('Load Shedding', 'Destroy all enemy spawners/turrets', 3, ['killTurrets', 0], 2);
A('Failover Drill', 'Swap your batteries and shield cells', 2, ['swapHp', 0], 2, 'u');
A('Kill Feed', 'Executes all enemies below 25% health', 2, ['executeLow', .25], 2);
A('Overtime Authorization', '+2 charges to this item after this use', 4, ['selfCharge', 2], 2);
A('Tarpit', 'Floor becomes sticky: enemies -60% speed, 8s', 3, ['tarpit', 8], 2);
A('White Noise Cannon', 'Confuse: enemies attack each other, 6s', 4, ['confuse', 6], 3, 'x');
