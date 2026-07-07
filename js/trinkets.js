'use strict';
// ============================================================
// 50+ trinkets: small held charms. One at a time (Q to drop).
// Same fx schema as passives, smaller magnitudes.
// ============================================================
G.TRINKETS = [];
function T(name, desc, fx) {
  G.TRINKETS.push({ id: G.TRINKETS.length, name, desc, fx: fx || {}, kind: 'trinket' });
}

T('Paperclip', 'Universal tool. +1 luck', { luck: 1 });
T('Chewed Pen Cap', 'Focus totem. +fire rate', { tears: .15 });
T('Sticky Tack', 'Holds things. +damage', { dmg: .4 });
T('Dead Pixel', 'It stares back. +crit chance', { critC: .07 });
T('Coffee Ring Stain', 'Ancient mark. +speed', { spd: .1 });
T('Cracked Webcam Cover', 'They saw nothing. +1 shield on floor start', { uniq: 'floorSoul' });
T('Burnt Toast Charm', 'Smells like mornings. Heal on floor start', { uniq: 'floorHealHalf' });
T('Loose USB-C Cable', 'Wiggle it. Active charges 20% faster', { uniq: 'chargeUp' });
T('Fidget Cube', 'Restless hands. +fire rate, +speed', { tears: .1, spd: .06 });
T('Expired Snack Bar', 'Emergency rations. Hurt may drop half-battery', { proc: [{ ev: 'hurt', p: .25, do: 'halfHeart' }] });
T('Mousepad Shard', 'Smooth glide. +shot speed', { shotspd: .2 });
T('CAT-5 Bracelet', 'Woven connection. +range', { rng: 40 });
T('Karma Score', 'Internet points. Kills may drop credits', { proc: [{ ev: 'kill', p: .06, do: 'coin' }] });
T('Beta Tester Badge', 'Seen some bugs. +luck, +crit', { luck: 1, critC: .04 });
T('Duct Tape Roll', 'Fixes all. Familiars +damage', { uniq: 'famPowerSmall' });
T('Thermal Pad', 'Warm heart. Burn chance +10%', { burn: .1 });
T('Mold Culture', 'It grows on you. Poison chance +10%', { poison: .1 });
T('Static Sock', 'Shocking. 8% chain on hit', { uniq: 'chainSmall' });
T('Broken Escape Key', 'No way out but through. +damage when below half health', { uniq: 'lowHpPowerSmall' });
T('Loot Table Printout', 'Meta knowledge. Better pickup drops', { uniq: 'lootUp' });
T('Conference Lanyard', 'Networking. Shop prices -15%', { uniq: 'discountSmall' });
T('Golden Screw', 'From the first server. +2 luck when at full health', { uniq: 'fullHpLuck' });
T('Backup Floppy', 'Trust issues. First hurt each floor: gain shield', { uniq: 'floorGuard' });
T('Misprinted Business Card', '"Sofware Enginer". Enemies may laugh: +fear 8%', { fear: .08 });
T('Undelivered Resignation', 'Held power. +damage, -speed', { dmg: .5, spd: -.05 });
T('Emotional Support Sticker', 'You got this. +1 shield cell max effect on pickup', { soul: 1 });
T('Prototype Fob', 'Opens something, somewhere. Secret rooms +1 chance', { uniq: 'secretUp' });
T('Binary Dice', 'd2. Chance effects slightly stronger', { uniq: 'entropySmall' });
T('Tangled Earbuds', 'Chaos charm. Wavy shots while held', { wavy: 1 });
T('Ex-Manager\'s Stress Ball', 'Squeeze. Knockback up', { knock: 1 });
T('Standing Desk Bolt', 'Foundation. +1 battery while held', { hp: 1 });
T('Warm Server Exhaust', 'Cozy. Immune to burn tiles', { uniq: 'burnImmune' });
T('Keyboard Wrist Rest', 'Comfort. +fire rate at full health', { uniq: 'fullHpTears' });
T('Novelty Big Enter Key', 'SLAM. Every 15th shot huge', { uniq: 'bigNthSmall' });
T('Miniature Server Rack', 'So cute. Rocks may drop credits when destroyed', { uniq: 'rockCoin' });
T('Punch Card Fragment', 'Half a thought. +damage, +range', { dmg: .3, rng: 25 });
T('Whistling Modem Chip', 'Screams of the old web. +shot speed, +fear 5%', { shotspd: .15, fear: .05 });
T('Glow-in-Dark Star', 'Ceiling memories. See better in dark biomes', { uniq: 'nightVision' });
T('Left Shift Keycap', 'CAPITAL power. +crit multiplier', { critX: .5 });
T('Right Ctrl (Unused)', 'Pristine. +luck', { luck: 1 });
T('Function Row Relic', 'F13-F24. Active charges +1 on boss kill', { uniq: 'bossCharge' });
T('Boss Key Screenshot', 'Looks busy. Bosses drop +1 pickup', { uniq: 'bossLoot' });
T('Blessed Thumb Drive', 'Contains one good file. Item rooms may hold 2 items', { uniq: 'doubleItemChance' });
T('Corrupted Save File', 'Danger and power. +damage, curse rooms more common', { dmg: .6, uniq: 'moreCursed' });
T('Bug Jar', 'Catch and release. Ally bugs on room clear 10%', { proc: [{ ev: 'clear', p: .1, do: 'ally' }] });
T('Cooling Fan Blade', 'Spin. Orbitals +speed', { uniq: 'orbSpeed' });
T('Magnet Toy', 'Attracts. Pickup magnet (weak)', { uniq: 'magnetSmall' });
T('Password on Sticky Note', 'hunter2. Locked doors 20% chance to open free', { uniq: 'freeKeyChance' });
T('Rubber Foot (Missing 3)', 'Wobbly but loyal. +bounce', { bounce: 1 });
T('Screen Cleaning Cloth', 'Clarity. +range, +luck', { rng: 30, luck: 1 });
T('Retro Game Cartridge', 'Blow on it. Random small stat up per floor', { uniq: 'karmaSmall' });
T('Unread Terms of Service', 'Power in ignorance. +damage, -luck', { dmg: .7, luck: -1 });
T('Do Not Disturb Sign', 'Enemies notice you later', { uniq: 'slowAggro' });
T('Company Seal (Stolen)', 'Authority. Defeated foes may join you', { charm: .08 });
T('Last Donut Guilt', 'You took it. +speed, enemies slightly angrier', { spd: .12, uniq: 'aggro' });
T('Perfect Attendance Pin', 'Never missed a standup. +all stats tiny', { dmg: .2, tears: .08, spd: .04, luck: 1 });
