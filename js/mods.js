'use strict';
// ============================================================
// mods.js: data-only content packs.
// A pack is JSON — stats, multipliers, item tweaks. NEVER code.
// Its canonical hash IS its leaderboard identity (ruleset).
// ============================================================
const Mods = { active: null, local: [] };
G.Mods = Mods;

/* Pack format (all keys optional):
{
  "meta":    { "name": "...", "author": "...", "description": "..." },
  "global":  { "enemyHp": 1.0, "enemySpd": 1.0, "enemyDmg": 1.0, "bossHp": 1.0,
               "playerDmg": 1.0, "playerTears": 1.0, "playerSpd": 1.0, "playerHp": 0,
               "dropRate": 1.0 },
  "enemies": { "gnat": { "hp": 2, "spd": 1.2, "dmg": 1 }, ... },        // multipliers (dmg = flat halves)
  "bosses":  { "compiler": { "hp": 1.5, "dmg": 1 }, ... },              // hp mult, dmg flat
  "items":   { "Coffee": { "remove": true } | { "dmg": 2, "tears": .5, ... }, ... }, // fx overrides by name
  "newItems":[ { "name": "...", "desc": "...", "q": 2, "fx": { ...numeric/flag fx... } }, ... ]
}
*/

// fx keys a pack may set on items — the safe, code-free subset
Mods.FX_WHITELIST = ['dmg', 'dmgX', 'tears', 'spd', 'rng', 'shotspd', 'luck', 'hp', 'soul', 'heal',
  'pierce', 'spectral', 'homing', 'bounce', 'split', 'splitDeep', 'explode', 'chain', 'poison',
  'slow', 'burn', 'fear', 'charm', 'knock', 'shotScale', 'critC', 'critX', 'countAdd', 'spreadAdd',
  'backShot', 'sideShots', 'wavy', 'boomerang'];

// ---------- canonical hash (mirror of api/_lib.js) ----------
Mods.canon = function (v) {
  if (Array.isArray(v)) return '[' + v.map(Mods.canon).join(',') + ']';
  if (v && typeof v === 'object')
    return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + Mods.canon(v[k])).join(',') + '}';
  return JSON.stringify(v);
};
// compact pure-JS sha256 (works on file:// where crypto.subtle may not)
Mods.sha256 = function (ascii) {
  function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
  const mathPow = Math.pow, maxWord = mathPow(2, 32);
  let result = '', words = [], asciiBitLength = ascii.length * 8;
  let hash = Mods._h = Mods._h || [], k = Mods._k = Mods._k || [], primeCounter = k.length;
  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
      hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  ascii += '\x80';
  while (ascii.length % 64 - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    if (j >> 8) return null; // ascii only — packs are JSON.stringify'd, non-ascii escaped first
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = ((asciiBitLength / maxWord) | 0);
  words[words.length] = (asciiBitLength);
  const h = hash.slice(0, 8);
  for (let j = 0; j < words.length;) {
    const w = words.slice(j, j += 16), oldHash = h.slice(0, 8);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = h[0], e = h[4];
      const temp1 = h[7]
        + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25))
        + ((e & h[5]) ^ ((~e) & h[6]))
        + k[i]
        + (w[i] = (i < 16) ? w[i] : (
          w[i - 16]
          + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3))
          + w[i - 7]
          + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))
        ) | 0);
      const temp2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & h[1]) ^ (a & h[2]) ^ (h[1] & h[2]));
      h.unshift((temp1 + temp2) | 0); h.pop();
      h[4] = (h[4] + temp1) | 0;
    }
    for (let i = 0; i < 8; i++) h[i] = (h[i] + oldHash[i]) | 0;
  }
  for (let i = 0; i < 8; i++) for (let j2 = 3; j2 + 1; j2--) {
    const b = (h[i] >> (j2 * 8)) & 255;
    result += ((b < 16) ? 0 : '') + b.toString(16);
  }
  return result;
};
// non-ascii safe: escape to \uXXXX first
Mods.hashPack = function (pack) {
  const canonStr = Mods.canon(pack) + '@' + G.VERSION;
  const ascii = canonStr.replace(/[-￿]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
  return Mods.sha256(ascii);
};
Mods.rulesetIdOf = function (pack) {
  if (!pack) return 'official-' + G.VERSION;
  return 'mod-' + Mods.hashPack(pack).slice(0, 16);
};

// ---------- validation (mirror of api/publish-mod.js) ----------
Mods.validate = function (pack) {
  if (!pack || typeof pack !== 'object' || Array.isArray(pack)) return 'pack must be an object';
  const KEYS = ['meta', 'global', 'player', 'enemies', 'bosses', 'items', 'newItems', 'skin', 'actives', 'trinkets'];
  for (const k of Object.keys(pack)) if (!KEYS.includes(k)) return 'unknown key: ' + k;
  const json = JSON.stringify(pack);
  if (json.length > 60000) return 'pack too large';
  if (/function|=>|<script|javascript:/i.test(json)) return 'code is not allowed in packs';
  let bad = null;
  (function walk(v) {
    if (bad) return;
    if (typeof v === 'number' && (!isFinite(v) || Math.abs(v) > 1000)) bad = 'number out of bounds';
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  })(pack);
  if (bad) return bad;
  if (pack.newItems && (!Array.isArray(pack.newItems) || pack.newItems.length > 50)) return 'newItems: max 50';
  // skin: strings only, bounded
  if (pack.skin) {
    const s = pack.skin;
    if (typeof s !== 'object' || Array.isArray(s)) return 'skin must be an object';
    let badStr = null;
    (function walkS(v) {
      if (badStr) return;
      if (typeof v === 'string' && v.length > 400) badStr = 'skin string too long';
      else if (Array.isArray(v)) v.forEach(walkS);
      else if (v && typeof v === 'object') Object.values(v).forEach(walkS);
    })(s);
    if (badStr) return badStr;
    if (s.playerColors) for (const k in s.playerColors) {
      if (!/^#[0-9a-fA-F]{3,8}$/.test(String(s.playerColors[k]))) return 'skin.playerColors: hex colors only';
    }
  }
  return null;
};

// ---------- pristine snapshots & application ----------
Mods.snapshot = function () {
  if (Mods._pristine) return;
  Mods._pristine = {
    passiveCount: G.PASSIVES.length,
    fx: G.PASSIVES.map(it => JSON.parse(JSON.stringify(it.fx))),
    pNames: G.PASSIVES.map(it => [it.name, it.desc]),
    aNames: G.ACTIVES.map(it => [it.name, it.desc]),
    tNames: G.TRINKETS.map(it => [it.name, it.desc]),
    pal: JSON.parse(JSON.stringify({ hoodie: Spr.PAL.hoodie, hoodieL: Spr.PAL.hoodieL, hoodieD: Spr.PAL.hoodieD })),
  };
  for (const it of G.PASSIVES) it.baseName = it.name;
  for (const it of G.ACTIVES) it.baseName = it.name;
};
Mods.restore = function () {
  if (!Mods._pristine) return;
  G.PASSIVES.length = Mods._pristine.passiveCount; // drop custom items
  for (let i = 0; i < G.PASSIVES.length; i++) {
    G.PASSIVES[i].fx = JSON.parse(JSON.stringify(Mods._pristine.fx[i]));
    G.PASSIVES[i].name = Mods._pristine.pNames[i][0];
    G.PASSIVES[i].desc = Mods._pristine.pNames[i][1];
    delete G.PASSIVES[i].modRemoved;
  }
  for (let i = 0; i < G.ACTIVES.length; i++) { G.ACTIVES[i].name = Mods._pristine.aNames[i][0]; G.ACTIVES[i].desc = Mods._pristine.aNames[i][1]; delete G.ACTIVES[i].modRemoved; }
  for (let i = 0; i < G.TRINKETS.length; i++) { G.TRINKETS[i].name = Mods._pristine.tNames[i][0]; G.TRINKETS[i].desc = Mods._pristine.tNames[i][1]; }
  Object.assign(Spr.PAL, Mods._pristine.pal);
  Mods.skinData = null;
  if (Spr.cache.player) Spr.buildPlayer();
};
Mods.str = (v, max) => typeof v === 'string' ? v.slice(0, max) : null;
Mods.cleanFx = function (fx) {
  const out = {};
  for (const k of Mods.FX_WHITELIST) if (typeof fx[k] === 'number' && isFinite(fx[k])) out[k] = G.clamp(fx[k], -20, 20);
  return out;
};
// apply the active pack — call at run start; restores pristine first
Mods.applyActive = function () {
  Mods.snapshot();
  Mods.restore();
  const pack = Mods.active;
  const fxNorm = { g: { enemyHp: 1, enemySpd: 1, enemyDmg: 0, bossHp: 1, playerDmg: 1, playerTears: 1, playerSpd: 1, playerHp: 0, dropRate: 1 }, enemies: {}, bosses: {} };
  if (!pack) { G.run && (G.run.packFx = fxNorm); return fxNorm; }
  const g = pack.global || {};
  const num = (v, d, lo, hi) => typeof v === 'number' && isFinite(v) ? G.clamp(v, lo, hi) : d;
  fxNorm.g.enemyHp = num(g.enemyHp, 1, .1, 20); fxNorm.g.enemySpd = num(g.enemySpd, 1, .2, 4);
  fxNorm.g.enemyDmg = num(g.enemyDmg, 0, -1, 3) | 0; fxNorm.g.bossHp = num(g.bossHp, 1, .1, 20);
  fxNorm.g.playerDmg = num(g.playerDmg, 1, .1, 20); fxNorm.g.playerTears = num(g.playerTears, 1, .2, 6);
  fxNorm.g.playerSpd = num(g.playerSpd, 1, .3, 4); fxNorm.g.playerHp = num(g.playerHp, 0, -2, 9) | 0;
  fxNorm.g.dropRate = num(g.dropRate, 1, 0, 10);
  for (const t in (pack.enemies || {})) {
    if (!G.En.DEFS[t]) continue;
    const o = pack.enemies[t];
    fxNorm.enemies[t] = { hp: num(o.hp, 1, .1, 20), spd: num(o.spd, 1, .2, 4), dmg: o.dmg !== undefined ? G.clamp(o.dmg | 0, 0, 4) : null };
  }
  for (const b in (pack.bosses || {})) {
    if (!G.Boss.KINDS[b]) continue;
    const o = pack.bosses[b];
    fxNorm.bosses[b] = { hp: num(o.hp, 1, .1, 20), dmg: o.dmg !== undefined ? G.clamp(o.dmg | 0, 0, 4) : null };
  }
  // item overrides / removals / reskins (matched by original name)
  for (const name in (pack.items || {})) {
    const it = G.PASSIVES.find(i => (i.baseName || i.name) === name);
    if (!it) continue;
    const o = pack.items[name];
    if (o && o.remove) { it.modRemoved = true; continue; }
    Object.assign(it.fx, Mods.cleanFx(o || {}));
    if (o && o.name) it.name = Mods.str(o.name, 34) || it.name;
    if (o && o.desc) it.desc = Mods.str(o.desc, 64) || it.desc;
  }
  // active/trinket reskins (name/desc only — behavior is untouchable)
  for (const name in (pack.actives || {})) {
    const it = G.ACTIVES.find(i => (i.baseName || i.name) === name);
    if (!it) continue;
    const o = pack.actives[name] || {};
    if (o.name) it.name = Mods.str(o.name, 34) || it.name;
    if (o.desc) it.desc = Mods.str(o.desc, 64) || it.desc;
  }
  for (const name in (pack.trinkets || {})) {
    const it = G.TRINKETS.find(i => i.name === name);
    if (!it) continue;
    const o = pack.trinkets[name] || {};
    if (o.name) it.name = Mods.str(o.name, 34) || it.name;
    if (o.desc) it.desc = Mods.str(o.desc, 64) || it.desc;
  }
  // ---------- skin: pure cosmetics ----------
  Mods.skinData = null;
  if (pack.skin) {
    const s = pack.skin;
    const skin = {
      title: Array.isArray(s.title) ? s.title.slice(0, 2).map(v => Mods.str(v, 12) || '') : null,
      tagline: Mods.str(s.tagline, 60),
      biomes: Array.isArray(s.biomes) ? s.biomes.slice(0, 6).map(v => Mods.str(v, 26) || '') : null,
      bosses: {},
      strings: {},
      lore: null,
      playerColors: null,
    };
    for (const k in (s.bosses || {})) {
      if (!G.Boss.KINDS[k]) continue;
      skin.bosses[k] = { name: Mods.str(s.bosses[k].name, 26), sub: Mods.str(s.bosses[k].sub, 40) };
    }
    for (const k of ['deathTitle', 'winTitle', 'winSub', 'currency']) skin.strings[k] = Mods.str((s.strings || {})[k], 40);
    if (s.lore && typeof s.lore === 'object') {
      const arr = (v, n, len) => Array.isArray(v) ? v.slice(0, n).map(x => Mods.str(x, len)).filter(Boolean) : null;
      skin.lore = {
        terminals: Array.isArray(s.lore.terminals) ? s.lore.terminals.slice(0, 6).map(band => arr(band, 10, 160) || []) : null,
        graffiti: Array.isArray(s.lore.graffiti) ? s.lore.graffiti.slice(0, 6).map(band => arr(band, 8, 80) || []) : null,
        intros: arr(s.lore.intros, 6, 160),
        deaths: arr(s.lore.deaths, 10, 100),
        wins: arr(s.lore.wins, 10, 100),
      };
    }
    if (s.playerColors) {
      skin.playerColors = {};
      for (const k of ['hoodie', 'hoodieL', 'hoodieD']) {
        const c = s.playerColors[k];
        if (typeof c === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(c)) skin.playerColors[k] = c;
      }
      Object.assign(Spr.PAL, skin.playerColors);
      if (Spr.cache.player) Spr.buildPlayer();
    }
    Mods.skinData = skin;
  }
  // new data-only items
  for (const ni of (pack.newItems || [])) {
    if (!ni || typeof ni.name !== 'string') continue;
    G.PASSIVES.push({
      id: G.PASSIVES.length,
      name: String(ni.name).slice(0, 32),
      desc: String(ni.desc || 'community item').slice(0, 60),
      q: G.clamp((ni.q | 0) || 2, 1, 4),
      fx: Mods.cleanFx(ni.fx || {}),
      pool: 't', kind: 'passive', custom: true,
    });
  }
  if (G.run) G.run.packFx = fxNorm;
  return fxNorm;
};

// ---------- local pack storage ----------
Mods.loadLocal = function () {
  try { Mods.local = JSON.parse(localStorage.getItem('kp_mods') || '[]'); } catch (e) { Mods.local = []; }
  const activeId = localStorage.getItem('kp_mod_active');
  if (activeId && activeId !== 'official') {
    const found = Mods.local.find(m => Mods.rulesetIdOf(m) === activeId);
    Mods.active = found || null;
  }
};
Mods.saveLocal = function () {
  try {
    localStorage.setItem('kp_mods', JSON.stringify(Mods.local.slice(0, 30)));
    localStorage.setItem('kp_mod_active', Mods.active ? Mods.rulesetIdOf(Mods.active) : 'official');
  } catch (e) { }
};
Mods.install = function (pack) {
  const err = Mods.validate(pack);
  if (err) return err;
  const id = Mods.rulesetIdOf(pack);
  if (!Mods.local.some(m => Mods.rulesetIdOf(m) === id)) Mods.local.push(pack);
  Mods.saveLocal();
  return null;
};
Mods.setActive = function (pack) { Mods.active = pack; Mods.saveLocal(); Mods.applyActive(); };

// ---------- import / export via files ----------
Mods.importFile = function (cb) {
  if (typeof document === 'undefined') return;
  let inp = document.getElementById('kp-mod-file');
  if (!inp) {
    inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json';
    inp.id = 'kp-mod-file'; inp.style.display = 'none';
    document.body.appendChild(inp);
  }
  inp.onchange = () => {
    const f = inp.files && inp.files[0];
    if (!f) return cb('no file');
    const rd = new FileReader();
    rd.onload = () => {
      try { cb(null, JSON.parse(rd.result)); }
      catch (e) { cb('not valid JSON'); }
    };
    rd.readAsText(f);
    inp.value = '';
  };
  inp.click();
};
Mods.exportActive = function () {
  if (!Mods.active || typeof document === 'undefined') return;
  const blob = new Blob([JSON.stringify(Mods.active, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = ((Mods.active.meta && Mods.active.meta.name) || 'mod').replace(/\W+/g, '-').toLowerCase() + '.kpmod.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
};

// a starter pack players can export, edit, re-import
Mods.examplePack = function () {
  return {
    meta: { name: 'My First Mod', author: G.meta.playerName || 'anon', description: 'Faster, deadlier, richer.' },
    global: { enemyHp: 1.2, playerTears: 1.3, dropRate: 1.5 },
    enemies: { gnat: { hp: 2, spd: 1.4 } },
    bosses: { compiler: { hp: 1.3 } },
    items: { 'Decaf': { remove: true }, 'Coffee': { spd: 0.5 } },
    newItems: [{ name: 'Mystery Energy Drink', desc: '+everything, somehow', q: 3, fx: { dmg: 1, tears: .3, spd: .15, luck: 1 } }],
  };
};

// active skin accessor (null when vanilla)
Mods.skin = function () { return Mods.skinData || null; };
Mods.skinStr = function (key, fallback) {
  const s = Mods.skinData;
  return (s && s.strings && s.strings[key]) || fallback;
};

// built-in packs shipped with the game
Mods.builtins = function () {
  return (typeof G.FASTBREAK_PACK !== 'undefined' && G.FASTBREAK_PACK) ? [G.FASTBREAK_PACK] : [];
};

Mods.init = function () {
  Mods.snapshot();
  Mods.loadLocal();
  // re-resolve built-in active pack after reload
  const activeId = localStorage.getItem('kp_mod_active');
  if (activeId && activeId !== 'official' && !Mods.active) {
    const b = Mods.builtins().find(m => Mods.rulesetIdOf(m) === activeId);
    if (b) Mods.active = b;
  }
  // apply cosmetics immediately so the title screen reflects the skin
  Mods.applyActive();
};
