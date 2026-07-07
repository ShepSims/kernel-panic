'use strict';
// Shared headless harness: browser stubs + game bundle loader.
// Strict drawImage (throws on invalid images) to mimic real canvas.
const fs = require('fs');
const path = require('path');

function mkCtx() {
  const noop = () => { };
  return new Proxy({}, {
    get(t, k) {
      if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => ({ addColorStop: noop });
      if (k === 'measureText') return () => ({ width: 10 });
      if (k === 'drawImage') return (img) => { if (!img || typeof img !== 'object') throw new TypeError('drawImage: invalid image (' + img + ')'); };
      if (typeof k === 'string') return t[k] !== undefined ? t[k] : noop;
      return noop;
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}
function mkCanvas(w, h) { return { width: w || 300, height: h || 150, style: {}, getContext: () => mkCtx(), addEventListener: () => { } }; }

module.exports = function boot(opts) {
  opts = opts || {};
  const storage = {};
  global.localStorage = {
    getItem: k => storage[k] !== undefined ? storage[k] : null,
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: k => { delete storage[k]; },
  };
  global.window = global;
  global.document = { getElementById: () => mkCanvas(480, 320), createElement: () => mkCanvas() };
  global.requestAnimationFrame = fn => { global.__raf = fn; return 1; };
  global.setInterval = () => 0;
  global.addEventListener = () => { };
  if (opts.config) global.KP_CONFIG = opts.config;
  if (opts.fetch) global.fetch = opts.fetch;

  const files = ['core', 'input', 'sprites', 'audio', 'particles', 'lore', 'passives', 'actives', 'trinkets',
    'items', 'shots', 'enemies', 'bosses', 'dungeon', 'player', 'meta'];
  if (!opts.config) files.push('config');
  files.push('net', 'skin-fastbreak', 'mods', 'ui', 'main');
  let bundle = '';
  const root = path.join(__dirname, '..');
  for (const f of files) bundle += fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8').replace(/'use strict';/g, '') + '\n';
  eval(bundle);

  let t = 0;
  const step = n => { for (let i = 0; i < n; i++) { t += 16; global.__raf(t); } };
  const god = () => {
    const p = G.run.player;
    p.dead = false; p.hp = 99; p.hpMax = 12; p.soul = 999; p.iframes = 0;
    G.state = 'run'; G.run.bossDying = null;
  };
  return { G, step, god };
};
