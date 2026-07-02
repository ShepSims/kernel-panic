'use strict';
// ============================================================
// 210+ passive items. Each entry: name, desc, quality 1-4, fx.
// fx keys are consumed by player.recalc + shots pipeline.
// pool: t=treasure(default) s=shop b=boss d=devil(overclock) x=secret c=challenge u=cursed
// ============================================================
G.PASSIVES = [];
function P(name, desc, q, fx, pool) {
  G.PASSIVES.push({ id: G.PASSIVES.length, name, desc, q: q || 1, fx: fx || {}, pool: pool || 't', kind: 'passive' });
}

// ---------- stat packages: damage ----------
P('Mechanical Keys', 'Clack clack. +fire rate', 2, { tears: .5 });
P('Ergonomic Wrists', 'Type faster. +fire rate', 1, { tears: .3 });
P('Cold Brew', 'Jittery power. +fire rate, +speed', 2, { tears: .4, spd: .15 });
P('Triple Espresso', 'Heart racing. ++fire rate, -range', 3, { tears: .9, rng: -30 });
P('Decaf', 'Calm hands. +damage, -fire rate', 1, { dmg: 1.5, tears: -.2 });
P('Energy Sludge', 'Radioactive taurine. +damage, +speed', 2, { dmg: 1, spd: .12 });
P('Sit-Stand Desk', 'Blood flows again. +all stats a little', 2, { dmg: .5, tears: .15, spd: .08, rng: 20 });
P('Root Access', 'sudo everything. +2 damage', 3, { dmg: 2 });
P('Admin Badge', 'Doors fear you. +1 damage, +luck', 2, { dmg: 1, luck: 1 });
P('Refactor', 'Cleaner code hits harder. +40% damage', 3, { dmgX: .4 });
P('Premature Optimization', '+55% damage, -speed', 2, { dmgX: .55, spd: -.12 });
P('Code Review', 'Someone checked your work. +25% damage, +luck', 2, { dmgX: .25, luck: 1 });
P('Ship It Friday', 'Reckless power. +70% damage, -1 battery', 3, { dmgX: .7, hp: -1 }, 'd');
P('Ten X Engineer', 'The myth is real. +100% damage', 4, { dmgX: 1 }, 'b');
P('Whiteboard Marker', 'Architected violence. +1.2 damage', 2, { dmg: 1.2 });
P('Clean Architecture', '+30% damage, +range', 2, { dmgX: .3, rng: 40 });
P('Assembly Knowledge', 'Bare metal fury. +1.8 damage, -fire rate', 2, { dmg: 1.8, tears: -.15 });
P('Bit Shift', 'x << 1. +35% damage', 2, { dmgX: .35 });
P('Overclocked CPU', '+damage, +fire rate, take +50% contact damage', 3, { dmg: 1, tears: .35, uniq: 'fragile' }, 'd');
P('Water Cooling', 'Stay frosty. +damage, +range', 2, { dmg: .8, rng: 60 });
// ---------- stat packages: speed / movement ----------
P('Standing Desk Sprints', '+speed', 1, { spd: .2 });
P('Mesh Office Chair', 'Lumbar support. +speed, +1 battery', 2, { spd: .15, hp: 1 });
P('Cable Management', 'Nothing to trip on. +speed, +luck', 2, { spd: .18, luck: 1 });
P('Kernel Bypass', 'Skip the stack. ++speed', 2, { spd: .3 });
P('Async Runtime', 'Non-blocking legs. +speed, +fire rate', 3, { spd: .2, tears: .3 });
P('Hot Reload', 'Instant iteration. +speed, shots +velocity', 2, { spd: .15, shotspd: .3 });
P('Roller Sneakers', 'Office parkour. +speed, -damage', 1, { spd: .35, dmg: -.4 });
P('Deadline Adrenaline', '+speed when below 2 batteries', 2, { uniq: 'lowHpSpeed' });
// ---------- stat packages: range / shotspeed ----------
P('Fiber Line', 'Low latency. +shot speed', 1, { shotspd: .4 });
P('Long Polling', 'It just keeps going. +range', 1, { rng: 90 });
P('CDN Nodes', 'Distributed reach. +range, +shot speed', 2, { rng: 60, shotspd: .25 });
P('Telephoto Standup', 'Attend from afar. ++range', 2, { rng: 140 });
P('Localhost', 'Point blank build. -range, +1.5 damage, +fire rate', 3, { rng: -80, dmg: 1.5, tears: .3 });
P('Edge Compute', 'Damage grows with distance flown', 3, { uniq: 'edgeDmg' });
// ---------- stat packages: luck ----------
P('Lucky Commit Hash', 'All sevens. +2 luck', 2, { luck: 2 });
P('Rabbit Desk Toy', '+1 luck', 1, { luck: 1 });
P('Four-Leaf Sticker', '+1 luck, +half battery', 1, { luck: 1, heal: 1 });
P('RNG Blessed', 'The dice like you. +3 luck', 3, { luck: 3 }, 'x');
// ---------- health ----------
P('Health Insurance', 'Finally vested. +1 battery, heal', 1, { hp: 1, heal: 2 });
P('Gym Stipend', 'Actually used it. +2 batteries', 2, { hp: 2 });
P('Ergonomic Everything', '+1 battery, +speed', 2, { hp: 1, spd: .1 });
P('Company Retreat', 'Recharged. Full heal, +1 battery', 2, { hp: 1, healFull: 1 });
P('Backup Generator', '+2 shield cells', 2, { soul: 2 });
P('Uninterruptible PSU', '+3 shield cells', 3, { soul: 3 }, 's');
P('Surge Protector', '+1 shield cell, +luck', 1, { soul: 1, luck: 1 });
P('Redundant Systems', '+1 battery, +1 shield cell', 2, { hp: 1, soul: 1 });
P('Biometric Ring', 'Know thyself. Heal on floor start', 2, { uniq: 'floorHeal' });
// ---------- shot behavior: piercing / spectral ----------
P('Regex Engine', 'Matches everything. Piercing shots', 3, { pierce: 1 });
P('Greedy Matcher', 'Consumes all. Piercing, +damage, -fire rate', 3, { pierce: 1, dmg: .8, tears: -.15 });
P('Sed Script', 'Global replace. Piercing, +shot speed', 3, { pierce: 1, shotspd: .3 });
P('Ghost Process', 'Shots pass through obstacles', 2, { spectral: 1 });
P('Sudo Ghost', 'Spectral + piercing shots', 4, { spectral: 1, pierce: 1 }, 'x');
// ---------- shot behavior: homing ----------
P('Heat-Seeking Bug Report', 'It finds you. Homing shots', 3, { homing: .6 });
P('Dependency Resolver', 'Weak homing, +fire rate', 2, { homing: .3, tears: .25 });
P('Neural Targeting', 'Strong homing shots', 4, { homing: 1 }, 'b');
// ---------- shot behavior: bounce ----------
P('Rubber Keycaps', 'Boing. Shots bounce once', 2, { bounce: 1 });
P('Echo Server', 'Shots bounce twice', 3, { bounce: 2 });
P('Ping Pong Table', 'Mandatory fun. Bouncy, +shot speed', 2, { bounce: 1, shotspd: .35 });
// ---------- shot behavior: splitting ----------
P('Fork Bomb', ':(){ :|:& };: Shots fork on hit', 3, { split: 1 });
P('Recursion', 'Forks fork. Requires Fork synergy', 3, { splitDeep: 1 });
P('Binary Tree', 'Shots fork on expiry too', 3, { split: 1, uniq: 'splitExpire' });
P('Map Reduce', 'Forked shots gain +damage', 2, { uniq: 'splitPower' });
// ---------- shot behavior: explosive ----------
P('Logic Bomb Payload', '20% chance of explosive shots', 3, { explode: .2 });
P('Demolition License', '35% explosive shots, +damage', 4, { explode: .35, dmg: .5 }, 'b');
P('Unstable Build', '12% explosive, +fire rate', 2, { explode: .12, tears: .2 });
// ---------- shot behavior: chain / elemental ----------
P('Chain Lightning', 'Hits arc to a nearby enemy', 3, { chain: 1 });
P('Cascade Failure', 'Hits arc twice', 4, { chain: 2 }, 'x');
P('Memory Corruptor', '25% chance to poison', 2, { poison: .25 });
P('Toxic Codebase', '40% poison, +damage', 3, { poison: .4, dmg: .4 });
P('Thermal Paste', '25% chance to burn', 2, { burn: .25 });
P('GPU Fire', '40% burn, shots glow', 3, { burn: .4 });
P('Rate Limiter', '30% chance to slow enemies', 2, { slow: .3 });
P('Denial of Service', '50% slow, +fire rate', 3, { slow: .5, tears: .2 });
P('Scary Error Sound', '20% chance to fear enemies', 2, { fear: .2 });
P('Layoff Rumors', '35% fear, +damage', 3, { fear: .35, dmg: .4 });
P('Social Engineering', '15% chance to charm enemies', 3, { charm: .15 });
P('Impact Font', 'Massive knockback', 2, { knock: 1 });
// ---------- shot behavior: size / crit ----------
P('Bloatware', 'Huge shots, -shot speed', 2, { shotScale: .5, shotspd: -.2 });
P('Minified Build', 'Tiny fast shots, +fire rate, -damage', 2, { shotScale: -.35, tears: .4, shotspd: .3, dmg: -.3 });
P('Semicolon', 'Critical statement. +15% crit (x3)', 2, { critC: .15 });
P('Off-By-One', 'Sometimes it lands HARD. +10% crit (x4)', 2, { critC: .1, critX: 1 });
P('Segfault Shots', '+20% crit, crits stun', 3, { critC: .2, uniq: 'critStun' });
// ---------- volley patterns ----------
P('Multithreading', 'Parallel shot', 3, { countAdd: 1 });
P('Quad Core', 'Two extra parallel shots, -damage', 4, { countAdd: 2, dmgX: -.25 }, 'b');
P('Peer Review', 'Backwards shot', 1, { backShot: 1 });
P('Side Channels', 'Perpendicular shots', 2, { sideShots: 1 });
P('Broadcast Storm', '4-way volley every 6th shot', 3, { uniq: 'quadNth' });
P('Shotgun Merge', 'Wide spread of 3, -range', 3, { spreadAdd: 2, rng: -40 });
P('Spray and Pray', 'Random spread, ++fire rate, -accuracy', 2, { tears: .5, uniq: 'inaccurate' });
P('Buffer Overflow', 'Every 8th shot is massive', 3, { uniq: 'bigNth' });
P('Wavy Signal', 'Shots wave. Wider coverage', 2, { wavy: 1 });
P('Boomerang PR', 'It comes back to you', 3, { boomerang: 1 });
P('Orbital Review', 'Shots orbit you before launching', 3, { uniq: 'orbitShots' });
P('Full Duplex', 'Also fire behind, -damage', 2, { backShot: 1, dmgX: -.1 });
// ---------- familiars ----------
P('Rubber Duck', 'Explains everything. Blocks & shoots', 3, { fam: 'duck' });
P('Pair Programmer', 'Auto-aiming buddy drone', 3, { fam: 'drone' });
P('Server Cat', 'Sits on warm things, scratches enemies', 2, { fam: 'cat' });
P('Ghost of Intern Past', 'Haunts your enemies', 2, { fam: 'ghost' });
P('Debug Orb', 'Fires where you fire', 2, { fam: 'orb' });
P('Belfry Bat', 'Lives in the server room. Bites', 2, { fam: 'bat' });
P('QA Duckling', 'Small duck, big opinions', 1, { fam: 'duck2' });
P('On-Call Pager', 'Wakes a drone when you get hurt', 2, { fam: 'pagerdrone' });
P('Legacy Mainframe Spirit', 'Slow, heavy familiar. Massive shots', 3, { fam: 'mainframe' });
P('Scrum Master', 'Circles you, deflects enemy shots', 3, { fam: 'scrum' });
// ---------- orbitals ----------
P('Satellite Dish', 'Orbiting blocker', 2, { orb: { r: 26, spd: 2.4, dmg: 1, block: 1 } });
P('Junk Mail Shield', 'Two weak orbiting spam pages', 2, { orb: { r: 22, spd: 3, dmg: .7, n: 2 } });
P('Firewall Fragment', 'Hot orbiting brick, burns', 3, { orb: { r: 30, spd: 2.8, dmg: 2, burn: 1 } });
P('Cursor Swarm', 'Three orbiting cursors', 3, { orb: { r: 34, spd: 4, dmg: 1, n: 3 } });
P('Trackball', 'Heavy orbit, big damage', 3, { orb: { r: 24, spd: 1.8, dmg: 3.5 } });
// ---------- on-kill procs ----------
P('Garbage Collector', 'Kills may drop pickups', 2, { proc: [{ ev: 'kill', p: .08, do: 'drop' }] });
P('Crypto Wallet', 'Kills may drop credits', 2, { proc: [{ ev: 'kill', p: .12, do: 'coin' }] });
P('Vampire Query', 'Kills may heal you', 3, { proc: [{ ev: 'kill', p: .1, do: 'healHalf' }] }, 'd');
P('Chain Reaction', 'Kills may explode', 3, { proc: [{ ev: 'kill', p: .18, do: 'explode' }] });
P('Data Harvester', 'Kills charge your active faster', 2, { proc: [{ ev: 'kill', p: 1, do: 'charge' }] });
P('Necromancer Module', 'Kills may raise an ally bug', 3, { proc: [{ ev: 'kill', p: .12, do: 'ally' }] }, 'u');
P('Static Discharge', 'Kills may strike lightning', 3, { proc: [{ ev: 'kill', p: .15, do: 'lightning' }] });
P('Soul Cache', 'Kills may grant shield fragments', 3, { proc: [{ ev: 'kill', p: .07, do: 'soulFrag' }] }, 'u');
P('Panic Spores', 'Kills may fear nearby enemies', 2, { proc: [{ ev: 'kill', p: .2, do: 'fearNova' }] });
// ---------- on-hurt procs ----------
P('Thorned Badge Lanyard', 'Retaliation nova when hurt', 2, { proc: [{ ev: 'hurt', p: 1, do: 'nova' }] });
P('Anger Management', '+damage each time hurt (this floor)', 3, { uniq: 'rage' });
P('Incident Response', 'Brief invulnerability extension', 2, { uniq: 'longIframes' });
P('Panic Teleport', 'When hurt, may blink away', 2, { proc: [{ ev: 'hurt', p: .35, do: 'blink' }] });
P('Insurance Payout', 'Hurt may drop credits', 1, { proc: [{ ev: 'hurt', p: .5, do: 'coin' }] });
P('Rubber Casing', 'Contact damage knocks enemies back hard', 2, { uniq: 'contactKnock' });
// ---------- room-clear procs ----------
P('Sprint Velocity', 'Clearing rooms may spawn pickups', 2, { proc: [{ ev: 'clear', p: .25, do: 'drop' }] });
P('Retro Ritual', 'Clearing rooms may heal', 2, { proc: [{ ev: 'clear', p: .2, do: 'healHalf' }] });
P('Standup Skipper', 'Move faster for 5s after clearing', 2, { uniq: 'clearHaste' });
P('Continuous Integration', 'Clears charge active +1', 2, { proc: [{ ev: 'clear', p: 1, do: 'charge' }] });
// ---------- economy ----------
P('Coupon Stack', 'Shop prices -33%', 2, { uniq: 'discount' }, 's');
P('Expense Account', '+15 credits', 1, { uniq: 'coins15' }, 's');
P('Magnetized Badge', 'Pickups drift to you', 2, { uniq: 'magnet' });
P('Golden Handcuffs', '+2 luck, cannot drop trinkets', 2, { luck: 2, uniq: 'cuffed' }, 'u');
P('Angel Investor', 'Free item now, shop prices +50%', 3, { uniq: 'investor' }, 's');
P('Stock Options', 'Credits worth double at max HP', 2, { uniq: 'stockOptions' }, 's');
P('Piggy Bank Server', 'Getting hurt drops credits (kept inside you)', 2, { proc: [{ ev: 'hurt', p: 1, do: 'coin' }] }, 's');
P('Referral Bonus', 'Keys may drop from chests', 1, { uniq: 'keyChests' }, 's');
// ---------- map / info ----------
P('Network Scanner', 'Reveals map layout', 2, { uniq: 'mapReveal' });
P('Packet Sniffer', 'Sense secret rooms nearby', 3, { uniq: 'secretSense' }, 'x');
P('Admin Dashboard', 'Full map + special rooms visible', 3, { uniq: 'fullMap' }, 's');
P('Error Console', 'See enemy health bars', 1, { uniq: 'healthBars' });
// ---------- defense ----------
P('Kevlar Hoodie', 'Chance to ignore damage', 3, { uniq: 'dodge15' });
P('Load Balancer', 'Damage sometimes hits shields first', 2, { uniq: 'preferSoul' });
P('Sandbox Environment', 'Immune to your own explosions', 2, { uniq: 'bombImmune' });
P('Air-Gapped', 'Immune to cursed room damage', 2, { uniq: 'curseImmune' }, 'u');
P('Read-Only Mode', 'First hit each room is ignored', 4, { uniq: 'roomShield' }, 'b');
// ---------- weird / transformative ----------
P('Turret Protocol', 'Standing still: ++fire rate, +damage', 3, { uniq: 'turretMode' });
P('Momentum Trading', 'Damage scales with move speed', 3, { uniq: 'momentum' });
P('Technical Debt', '+2 damage now, random downgrade each floor', 3, { dmg: 2, uniq: 'debt' }, 'd');
P('Crunch Mode', '+all stats, batteries drain each floor', 4, { dmg: 1, tears: .4, spd: .2, uniq: 'crunch' }, 'd');
P('Glass Cannon Build', '+150% damage, max 1 battery', 4, { dmgX: 1.5, uniq: 'glass' }, 'd');
P('Blockchain Ledger', 'Damage scales with credits held', 3, { uniq: 'coinPower' }, 's');
P('Imposter Syndrome', 'More damage at low health', 3, { uniq: 'lowHpPower' });
P('Rubber Duck Army', 'Duck count scales with luck', 3, { uniq: 'duckArmy' }, 'x');
P('Fifty-Fifty Deploy', 'Item pedestals offer two choices', 4, { uniq: 'choice2' }, 'x');
P('Monorepo', 'All future stat ups are +25% stronger', 3, { uniq: 'monorepo' });
P('Microservices', 'Shots split into 2 weak shots always', 3, { uniq: 'micro' });
P('The Old Ways', 'Shots become slow heavy packets, +++damage', 4, { uniq: 'oldWays' }, 'x');
P('Pica Display', 'Everything is bigger. Shots +size, +knockback', 2, { shotScale: .35, knock: 1 });
P('Dark Mode', 'Standing still fades you from enemy senses', 3, { uniq: 'stealth' });
P('Mute Notifications', 'Enemies react slower to you', 2, { uniq: 'slowAggro' });
P('Autoscaler', 'Fire rate ramps while firing', 3, { uniq: 'rampFire' });
P('Race Condition', 'Shots randomly doubled or skipped', 2, { uniq: 'racy' });
P('Feature Flag', 'Each room: random +damage or +fire rate', 2, { uniq: 'featureFlag' });
P('Undefined Behavior', 'Shots gain random effects', 3, { uniq: 'ub' }, 'u');
P('Legacy Support', 'Reduced damage falloff, +range', 2, { rng: 70, uniq: 'noFalloff' });
P('Kernel Module', '+1 damage per boss killed this run', 3, { uniq: 'bossPower' }, 'b');
P('Merge Conflict', 'Contact damage aura around you', 3, { uniq: 'aura' });
P('Infinite Loop', 'Shots circle the room edge', 3, { uniq: 'edgeLoop' }, 'x');
P('Stack Trace', 'Dead enemies mark others: +damage taken', 3, { uniq: 'markKill' });
P('Hotfix', 'Heal 1 when entering boss room', 2, { uniq: 'bossHeal' });
P('Zero Day', 'First shot in each room deals x4', 3, { uniq: 'firstShot' }, 'x');
P('Silicon Soul', 'Batteries become shield cells forever', 3, { uniq: 'soulConvert' }, 'u');
// ---------- more stat mixes (variety fill, all real) ----------
P('Two Monitors', '+fire rate, +range', 2, { tears: .25, rng: 40 });
P('Three Monitors', '++fire rate, +range, -speed', 3, { tears: .45, rng: 40, spd: -.08 });
P('Vertical Monitor', 'For reading logs. +range, +luck', 1, { rng: 60, luck: 1 });
P('Noise Cancelling', 'Focus. +damage, +fire rate', 3, { dmg: .7, tears: .25 });
P('Lo-fi Beats', 'Chill focus. +fire rate, +luck', 2, { tears: .3, luck: 1 });
P('White Noise App', '+damage, +shield cell', 2, { dmg: .6, soul: 1 });
P('Tiling Window Manager', 'Everything in its place. +damage, +speed', 2, { dmg: .6, spd: .12 });
P('Modal Editor', 'hjkl forever. +speed, +fire rate', 3, { spd: .18, tears: .3 });
P('Custom Keymap', '+fire rate, -nothing. Nice', 2, { tears: .35 });
P('Split Keyboard', 'Weird but fast. +fire rate, +luck', 2, { tears: .3, luck: 1 });
P('Artisan Keycaps', 'Beautiful. +luck, +damage', 2, { luck: 2, dmg: .4 });
P('RGB Everything', 'Gamer power. +damage, +speed, glows', 2, { dmg: .5, spd: .1, uniq: 'rgbGlow' });
P('Fingerless Gloves', 'Hacker chic. +fire rate, +crit', 2, { tears: .2, critC: .08 });
P('Blue Light Filter', 'Sleep better. +1 battery, +luck', 2, { hp: 1, luck: 1 });
P('Eye Drops', 'See clearly. +range, +shot speed', 1, { rng: 50, shotspd: .2 });
P('Posture Corrector', '+1 battery, +range', 2, { hp: 1, rng: 40 });
P('Wrist Brace', 'Push through. +damage, +fire rate, -speed', 2, { dmg: .5, tears: .2, spd: -.06 });
P('Compression Socks', 'Circulation. +speed, +1 battery', 2, { spd: .15, hp: 1 });
P('Microdose Monday', 'Everything sparkles. +luck, +fire rate, wavy shots', 3, { luck: 2, tears: .2, wavy: 1 }, 'u');
P('Nicotine Patch', 'Steady. +damage, +shot speed', 2, { dmg: .7, shotspd: .2 });
P('Sugar Free', 'No crash. +speed, +range', 1, { spd: .12, rng: 40 });
P('Meal Replacement', 'Efficient. +1 battery, +fire rate', 2, { hp: 1, tears: .2 });
P('Vending Machine Key', 'Infinite snacks. +2 batteries, -speed', 2, { hp: 2, spd: -.08 }, 's');
P('Cafeteria Legend', 'Free food. Heal 3, +1 battery', 2, { hp: 1, heal: 3 });
P('Kombucha Culture', 'Alive. +poison chance, +1 battery', 2, { poison: .2, hp: 1 });
P('Hot Sauce Stash', 'Burn chance, +damage', 2, { burn: .2, dmg: .4 });
P('Peppermint Tea', 'Soothing. Heal 2, +luck', 1, { heal: 2, luck: 1 });
P('Sleeping Bag Under Desk', 'Rest = power. +2 batteries', 2, { hp: 2 });
P('Foam Roller', 'Release. +speed, +fire rate', 2, { spd: .12, tears: .2 });
P('Personal Hotspot', 'Own network. +shot speed, +range', 2, { shotspd: .3, rng: 50 });
P('Mechanical Numpad', 'Data entry demon. +fire rate, +crit', 2, { tears: .25, critC: .06 });
P('USB Hub of Holding', 'Everything connects. +luck, +range', 2, { luck: 1, rng: 60 });
P('Thunderbolt Dock', 'Full power. +damage, +shot speed', 2, { dmg: .8, shotspd: .25 });
P('Retro CRT', 'Warm glow. +damage, shots +size', 2, { dmg: .5, shotScale: .2 });
P('Dot Matrix Printer', 'Rat-tat-tat. +fire rate, +knockback', 2, { tears: .3, knock: 1 });
P('Label Maker', 'Organized. +luck, +1 shield cell', 2, { luck: 1, soul: 1 });
P('Laminated Runbook', 'Prepared. +range, +1 shield cell', 2, { rng: 50, soul: 1 });
P('Emergency Contacts', 'Someone cares. +1 battery, +1 shield', 2, { hp: 1, soul: 1 });
P('Encrypted Drive', 'Secrets kept. +luck, +damage', 2, { luck: 1, dmg: .5 });
P('Punch Card Relic', 'Ancient power. +2 damage, -fire rate, -speed', 3, { dmg: 2, tears: -.2, spd: -.08 }, 'x');
P('Floppy Disk Collection', '1.44MB of soul. +luck, +1 shield cell', 2, { luck: 2, soul: 1 }, 'x');
P('Soldering Iron', 'Hardware hacker. +burn chance, +fire rate', 2, { burn: .25, tears: .15 });
P('Multimeter', 'Measure twice. +crit, +luck', 2, { critC: .1, luck: 1 });
P('Oscilloscope', 'See the wave. Wavy shots, +damage', 2, { wavy: 1, dmg: .5 });
P('Faraday Cage', 'Shielded. +2 shield cells, -range', 2, { soul: 2, rng: -30 });
P('Heat Sink Hat', 'Cool head. +fire rate, immune to burn floors', 2, { tears: .25, uniq: 'burnImmune' });
P('Antistatic Wristband', 'Grounded. +1 shield, +shot speed', 1, { soul: 1, shotspd: .2 });
P('Spare RAM Sticks', 'More memory. +range, +fire rate', 2, { rng: 40, tears: .2 });
P('Overflow Pages', 'Swap space. +1 battery, +range', 2, { hp: 1, rng: 40 });
P('Kernel Headers', 'Deep knowledge. +damage, +crit', 3, { dmg: .8, critC: .1 });
P('Container Image', 'Works on every machine. +all small', 3, { dmg: .4, tears: .15, spd: .08, rng: 20, luck: 1 });
P('Orchestrator', 'Familiars +50% damage', 2, { uniq: 'famPower' });
P('Mentorship Program', 'Familiars fire faster', 2, { uniq: 'famRate' });
P('Head of Remote', 'Familiars roam and hunt', 3, { uniq: 'famHunt' });
P('Load Testing Rig', 'Shots +size, +knockback, -shot speed', 2, { shotScale: .3, knock: 1, shotspd: -.15 });
P('Golden Master', 'Every 12th shot: golden, x3 damage, drops credit on kill', 3, { uniq: 'goldNth' }, 's');
P('Terminal Velocity', 'Shots accelerate over distance', 2, { uniq: 'accelShots' });
P('Slow Query', 'Shots decelerate but grow, +damage far', 2, { uniq: 'growShots' });
P('Regex Lookahead', 'Shots phase through the first enemy', 2, { uniq: 'skipFirst' });
P('Blame Annotations', 'Enemies that hurt you take +50% damage', 2, { uniq: 'blame' });
P('Post-Mortem Culture', 'On death: revive once with 1 battery (consumed)', 4, { uniq: 'revive' }, 'x');
P('Disaster Recovery', 'On fatal hit: 50% chance to survive with half battery', 3, { uniq: 'drPlan' }, 'b');
P('The Manifesto', 'All curses become blessings: cursed rooms heal', 3, { uniq: 'curseBless' }, 'u');
P('Screen Reader', 'Perfect awareness. Enemy shots slightly slower', 3, { uniq: 'slowBullets' });
P('Frame Limiter', 'Enemy projectiles -20% speed', 2, { uniq: 'slowBullets' });
P('Git Bisect', 'Every hit reveals weakness: +2% damage stacking per room', 2, { uniq: 'bisect' });
P('Rollback Plan', 'Hurt in a room? Exit restores half of it', 2, { uniq: 'rollback' });
P('Bug Bounty', 'Champions drop guaranteed pickups', 2, { uniq: 'champLoot' });
P('Conference Talk', 'Fear aura when below 2 batteries', 2, { uniq: 'fearAura' });
P('Legacy Password File', 'Opens one locked thing per floor, free', 2, { uniq: 'freeKey' }, 's');
P('Datacenter Map', 'Boss location always visible', 1, { uniq: 'bossMap' });
P('Prod Access at 2AM', '+damage in dark biomes', 2, { uniq: 'darkPower' }, 'u');
P('Sticky Notes', 'Mark enemies on hit: they take +10% damage', 2, { uniq: 'stickyMark' });
P('Break Room Couch', 'Regenerate charge slowly over time', 3, { uniq: 'trickleCharge' });
P('Rubber Band Ball', 'Years of meetings. Shots bounce, +luck', 2, { bounce: 1, luck: 1 });
P('Certificate Authority', 'Trusted. Shop items 1 free per floor... sometimes', 3, { uniq: 'freeShopChance' }, 's');
P('Self-Signed Cert', 'Trust yourself. +damage, enemies distrust: +fear', 2, { dmg: .6, fear: .15 });
P('Quantum Branch', 'Shots may duplicate mid-flight', 3, { uniq: 'quantum' }, 'x');
P('Entropy Pool', 'All chance effects +25% likely', 3, { uniq: 'entropyUp' }, 'x');
P('Deterministic Seed', 'Chance effects trigger on fixed rhythm', 2, { uniq: 'rhythm' });
P('Silent Failure', 'Killing blows echo: 30% nova on kill', 3, { proc: [{ ev: 'kill', p: .3, do: 'miniNova' }] });
P('Alert Fatigue', 'Immune to fear/slow effects on you', 1, { uniq: 'statusImmune' });
P('Async Await', 'Shots pause mid-flight then surge', 2, { uniq: 'pauseShots' });
P('Garbage Day', 'Destroying obstacles may drop pickups', 2, { uniq: 'rockLoot' });
P('X-Ray Vision Sticker', 'See through obstacles: shots ignore rocks', 2, { spectral: 1 });
P('Long Weekend', 'Heal 2 + charge active on boss kill', 2, { uniq: 'bossReward' });
P('Focus Room Booking', '+damage when no enemies within 100px', 2, { uniq: 'sniper' });
P('Standup Comedian', 'Charm chance, +luck', 2, { charm: .1, luck: 1 });
P('Free Swag Tee', '+1 shield cell', 1, { soul: 1 });
P('Anime Figurine', 'Believe. +damage, +luck', 2, { dmg: .5, luck: 1 });
P('Succulent Collection', 'Alive-ish. +1 battery, +poison chance', 2, { hp: 1, poison: .15 });
P('Zen Garden Tray', 'Rake it out. +luck, heal 1', 1, { luck: 1, heal: 1 });
P('Bonsai Ficus', 'Patience. +range, +1 battery', 2, { rng: 50, hp: 1 });
P('Framed Error Message', 'Never forget. +crit, +damage', 2, { critC: .08, dmg: .4 });
P('First Dollar Earned', 'Framed. +luck, credits attract', 2, { luck: 1, uniq: 'magnet' }, 's');
P('Yubikey Necklace', '2FA soul. +1 shield, +luck', 2, { soul: 1, luck: 1 });
P('The Red Stapler', 'You will burn the building. +burn, +damage', 3, { burn: .3, dmg: .6 }, 'x');
P('Exit Interview Notes', 'Bitter wisdom. +2 damage, -1 battery', 3, { dmg: 2, hp: -1 }, 'u');
P('Non-Compete Shredder', 'Freedom. +speed, +damage', 3, { spd: .2, dmg: .6 });
P('Severance Package', '+25 credits, +1 battery', 2, { hp: 1, uniq: 'coins25' }, 's');
P('Founder Mode', 'Delusional power. +damage scales with floor', 3, { uniq: 'floorPower' }, 'b');
P('Sabbatical Photos', 'Peace remembered. Full heal, +2 shield', 3, { healFull: 1, soul: 2 });
P('Open Source Karma', 'Strangers help. Random small buff per floor', 2, { uniq: 'karma' });
P('Digital Minimalism', 'Fewer items = more damage from this one', 3, { uniq: 'minimal' }, 'x');
P('Hoarder Drive', 'More items = tiny damage each', 2, { uniq: 'hoard' });
P('Everything Is Fine', 'Burn floors heal you instead', 2, { uniq: 'fineDog' }, 'u');
P('Touch Grass Reminder', 'Heal 1 whenever you find a secret room', 2, { uniq: 'grassHeal' }, 'x');
// ---------- THE CASCADE: items built to chain into each other ----------
P('Satellite Protocol', 'Missed shots enter orbit around you', 4, { uniq: 'bulletOrbit' }, 'x');
P('Laser Firmware', 'Your orbitals fire lasers', 4, { uniq: 'orbLasers' }, 'b');
P('Cryo Optics', 'Lasers freeze. Shots slow a little too', 3, { uniq: 'laserFreeze', slow: .1 });
P('Shatter Doctrine', 'Frozen enemies explode on death', 3, { uniq: 'freezeExplode', slow: .1 });
P('Nest Payload', 'Friendly explosions hatch allied spiders', 3, { uniq: 'explodeSpiders' });
P('Swarm License', 'Your spiders fire YOUR shots, synergies included', 3, { uniq: 'spiderTears' });
P('Event Horizon Rounds', 'Shots may collapse into black holes', 4, { uniq: 'tearBlackHole' }, 'x');
P('Accretion Engine', 'Black holes devour orbitals... and forge moons', 4, { uniq: 'bhAccrete' }, 'x');
P('Leaky Coolant', 'Kills spill flammable oil. Bring a spark', 2, { uniq: 'oilTrails' });
