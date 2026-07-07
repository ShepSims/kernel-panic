'use strict';
// Net + mods: formula/hash parity with the server, submission flow, mod application.
const lib = require('../api/_lib.js');
const calls = [];
const mockFetch = async (url, opts) => {
  calls.push({ url, opts });
  let body = '[]';
  if (url.includes('/rest/v1/scores?')) body = JSON.stringify([{ name: 'RIVAL', score: 9999, floor: 6, time_s: 900, win: true, endless_depth: 0, kills: 300, device_id: 'other' }]);
  if (url.includes('/api/submit-score')) body = JSON.stringify({ ok: true });
  if (url.includes('/api/publish-mod')) body = JSON.stringify({ ok: true, ruleset_id: 'mod-x' });
  return { status: 200, text: async () => body, json: async () => JSON.parse(body) };
};
const { G, step, god } = require('./stub')({
  config: { SUPABASE_URL: 'https://t.local', SUPABASE_ANON_KEY: 'anon', API_BASE: 'https://api.local' },
  fetch: mockFetch,
});
const { Mods, Net, It, En } = G;
const fail = (...m) => { console.log('FAIL:', ...m); process.exit(1); };
const tick = () => new Promise(r => setTimeout(r, 0));

(async () => {
  if (!Net.enabled) fail('net not enabled');
  // formula + canon + hash parity
  for (const s of [{ floor: 1, kills: 0, items: 0, time_s: 60, win: false, endless_depth: 0 }, { floor: 6, kills: 500, items: 20, time_s: 1800, win: true, endless_depth: 0 }]) {
    if (Net.scoreOf(s) !== lib.scoreOf(s)) fail('formula parity');
  }
  const pk = G.FASTBREAK_PACK;
  if (Mods.canon(pk) !== lib.canon(pk)) fail('canon parity');
  if (Mods.hashPack(pk) !== await lib.sha256hex(lib.packHashInput(pk, G.VERSION))) fail('sha parity (with ™ chars)');
  const plain = Mods.examplePack();
  if (Mods.hashPack(plain) !== await lib.sha256hex(lib.packHashInput(plain, G.VERSION))) fail('sha parity (ascii)');
  console.log('formula/canon/sha parity OK');

  // stat mod application + restore
  const base = En.DEFS.gnat.hp;
  const statPack = Mods.examplePack();
  Mods.install(statPack); Mods.setActive(statPack);
  G.startRun({ seedStr: 'M' });
  if (En.mk('gnat', 0, 0).hp !== Math.max(1, Math.round(base * 1.2 * 2))) fail('mod multiplier');
  Mods.setActive(null);
  G.startRun({ seedStr: 'V' });
  if (En.mk('gnat', 0, 0).hp !== base) fail('restore');
  console.log('stat pack apply + restore OK');

  // death -> name -> submission
  G.meta.playerName = null;
  const p = G.run.player;
  G.run.cur.shieldUsed = true;
  for (let i = 0; i < 200 && !p.dead; i++) { p.iframes = 0; p.soul = 0; p.hp = 1; p.hurt(99, null, true); }
  if (!p.dead) fail('no death');
  if (!Net.pendingSubmit) fail('no pending submit');
  Net.submitPendingWithName('TESTER');
  await tick(); await tick();
  const sub = calls.find(c => c.url.includes('/api/submit-score'));
  if (!sub) fail('no submission');
  const payload = JSON.parse(sub.opts.body);
  if (payload.name !== 'TESTER' || payload.score !== lib.scoreOf(payload) || payload.mode !== 'normal') fail('bad payload', payload);
  console.log('submission flow OK (score', payload.score + ')');
  console.log('=== NET + MODS PASSED ===');
  process.exit(0);
})().catch(e => { console.log('ASYNC FAIL:', e.stack.split('\n').slice(0, 4).join(' | ')); process.exit(1); });
