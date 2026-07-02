'use strict';
// ============================================================
// net.js: leaderboards, identity, optional accounts.
// Degrades gracefully: no config -> offline, no errors.
// ============================================================
const Net = { session: null, queue: [], lastResult: null, boards: {}, busy: false };
G.Net = Net;

const CFG = window.KP_CONFIG || {};
Net.enabled = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && typeof fetch === 'function');
Net.api = CFG.API_BASE !== null && CFG.API_BASE !== undefined ? CFG.API_BASE : null;

G.VERSION = '1.0.0';
Net.officialRuleset = 'official-' + G.VERSION;

// ---------- identity ----------
Net.deviceId = function () {
  if (!G.meta.deviceId) {
    G.meta.deviceId = ('' + 1e7 + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ (typeof crypto !== 'undefined' && crypto.getRandomValues ? crypto.getRandomValues(new Uint8Array(1))[0] : Math.random() * 256) & 15 >> c / 4).toString(16));
    G.saveMeta();
  }
  return G.meta.deviceId;
};
Net.uuid = function () {
  let d = Date.now();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (d + Math.random() * 16) % 16 | 0; d = Math.floor(d / 16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
};

// ---------- the one true score formula (mirror of api/_lib.js) ----------
Net.scoreOf = function (s) {
  let sc = s.floor * 1000 + s.endless_depth * 1500 + s.kills * 5 + s.items * 40;
  if (s.win) sc += 5000 + Math.max(0, 3000 - s.time_s);
  return Math.min(10000000, Math.max(0, Math.round(sc)));
};

// ---------- supabase REST helpers ----------
Net.rest = async function (path, opts) {
  opts = opts || {};
  // new-style keys (sb_publishable_...) go in apikey only; legacy JWT keys also
  // ride Authorization. A signed-in user's JWT always wins.
  const auth = Net.session ? { 'Authorization': 'Bearer ' + Net.session.access_token }
    : (CFG.SUPABASE_ANON_KEY && CFG.SUPABASE_ANON_KEY.indexOf('eyJ') === 0 ? { 'Authorization': 'Bearer ' + CFG.SUPABASE_ANON_KEY } : {});
  opts.headers = Object.assign({
    'apikey': CFG.SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  }, auth, opts.headers || {});
  const r = await fetch(CFG.SUPABASE_URL + path, opts);
  const text = await r.text();
  let body = null; try { body = text ? JSON.parse(text) : null; } catch (e) { body = text; }
  return { status: r.status, body };
};

// ---------- auth-lite: magic link, no SDK ----------
Net.loadSession = function () {
  try { Net.session = JSON.parse(localStorage.getItem('kp_session')); } catch (e) { }
  // returning from a magic link? token arrives in the URL hash
  if (typeof location !== 'undefined' && location.hash && location.hash.includes('access_token')) {
    const h = new URLSearchParams(location.hash.slice(1));
    if (h.get('access_token')) {
      Net.session = {
        access_token: h.get('access_token'), refresh_token: h.get('refresh_token'),
        expires_at: Date.now() + (parseInt(h.get('expires_in') || '3600', 10) * 1000),
      };
      try { localStorage.setItem('kp_session', JSON.stringify(Net.session)); } catch (e) { }
      try { history.replaceState(null, '', location.pathname); } catch (e) { }
      G.toast('ACCOUNT LINKED', '#58f08a');
      Net.claimDevice();
    }
  }
};
Net.freshToken = async function () {
  if (!Net.session) return null;
  if (Date.now() < (Net.session.expires_at || 0) - 60000) return Net.session.access_token;
  try {
    const r = await fetch(CFG.SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', headers: { 'apikey': CFG.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: Net.session.refresh_token }),
    });
    if (r.status !== 200) { Net.session = null; return null; }
    const b = await r.json();
    Net.session = { access_token: b.access_token, refresh_token: b.refresh_token, expires_at: Date.now() + b.expires_in * 1000 };
    localStorage.setItem('kp_session', JSON.stringify(Net.session));
    return Net.session.access_token;
  } catch (e) { return null; }
};
Net.signIn = async function (email) {
  if (!Net.enabled) return false;
  try {
    const r = await fetch(CFG.SUPABASE_URL + '/auth/v1/magiclink', {
      method: 'POST', headers: { 'apikey': CFG.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, options: { email_redirect_to: (typeof location !== 'undefined' ? location.origin + location.pathname : '') } }),
    });
    return r.status < 300;
  } catch (e) { return false; }
};
Net.signOut = function () { Net.session = null; try { localStorage.removeItem('kp_session'); } catch (e) { } };
Net.claimDevice = async function () {
  if (Net.api === null || !Net.session) return;
  const tok = await Net.freshToken(); if (!tok) return;
  try {
    await fetch(Net.api + '/api/claim-device', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tok },
      body: JSON.stringify({ device_id: Net.deviceId() }),
    });
  } catch (e) { }
};

// ---------- score submission ----------
Net.buildPayload = function () {
  const run = G.run, p = run.player;
  const s = {
    run_id: run.runId,
    ruleset_id: run.rulesetId || Net.officialRuleset,
    device_id: Net.deviceId(),
    name: G.meta.playerName || 'ANON',
    mode: run.endless ? 'endless' : run.seeded ? 'seeded' : 'normal',
    floor: G.clamp(run.depth, 1, 99),
    kills: G.clamp(run.stats.kills || 0, 0, 100000),
    items: G.clamp(p.items.length, 0, 500),
    time_s: G.clamp(Math.round(run.time), 5, 86400),
    win: !!run.won,
    endless_depth: run.endless ? G.clamp(run.depth, 0, 99) : 0,
    seed: run.seedStr,
    version: G.VERSION,
  };
  s.score = Net.scoreOf(s);
  return s;
};
Net.submitRun = function () {
  if (!G.run || G.run.submitted) return;
  G.run.submitted = true;
  const payload = Net.buildPayload();
  G.lastRunPayload = payload; // shown on death/win screens
  if (!Net.enabled) return;
  if (!G.meta.playerName) { Net.pendingSubmit = payload; return; } // ask for a name first
  Net.send(payload);
};
Net.send = async function (payload) {
  try {
    let ok = false;
    if (Net.api !== null) {
      const tok = await Net.freshToken();
      const r = await fetch(Net.api + '/api/submit-score', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, tok ? { 'Authorization': 'Bearer ' + tok } : {}),
        body: JSON.stringify(payload),
      });
      ok = r.status < 300;
    } else {
      // degraded mode: direct insert under RLS constraints
      const row = Object.assign({}, payload); delete row.version;
      const r = await Net.rest('/rest/v1/scores', { method: 'POST', body: JSON.stringify(row) });
      ok = r.status < 300;
    }
    Net.lastResult = ok ? 'SCORE SUBMITTED' : 'SUBMIT FAILED';
    if (ok) { G.toast('SCORE SUBMITTED · ' + payload.score, '#58f08a'); Net.boards = {}; }
  } catch (e) { Net.lastResult = 'OFFLINE — SCORE NOT SENT'; }
};
Net.submitPendingWithName = function (name) {
  G.meta.playerName = name; G.saveMeta();
  if (Net.pendingSubmit) { Net.pendingSubmit.name = name; Net.send(Net.pendingSubmit); Net.pendingSubmit = null; }
};

// ---------- leaderboards ----------
Net.BOARDS = [
  { id: 'total', label: 'TOTAL SCORE', q: 'order=score.desc', fmt: r => r.score },
  { id: 'floor', label: 'DEEPEST FLOOR', q: 'order=floor.desc,time_s.asc', fmt: r => 'B' + r.floor },
  { id: 'fastwin', label: 'FASTEST WIN', q: 'win=eq.true&order=time_s.asc', fmt: r => G.UI.fmtTime(r.time_s) },
  { id: 'endless', label: 'ENDLESS', q: 'endless_depth=gt.0&order=endless_depth.desc', fmt: r => 'B' + r.endless_depth },
];
Net.fetchBoard = async function (boardId, rulesetId) {
  if (!Net.enabled) return { error: 'OFFLINE' };
  const key = boardId + ':' + rulesetId;
  if (Net.boards[key] && Date.now() - Net.boards[key].t < 60000) return Net.boards[key];
  const B = Net.BOARDS.find(b => b.id === boardId);
  try {
    const r = await Net.rest('/rest/v1/scores?ruleset_id=eq.' + encodeURIComponent(rulesetId) +
      '&' + B.q + '&limit=20&select=name,score,floor,time_s,win,endless_depth,kills,device_id,created_at');
    const out = { t: Date.now(), rows: Array.isArray(r.body) ? r.body : [], error: r.status >= 300 ? 'FETCH FAILED' : null };
    Net.boards[key] = out;
    return out;
  } catch (e) { return { error: 'OFFLINE' }; }
};

// ---------- published mods ----------
Net.fetchMods = async function () {
  if (!Net.enabled) return { error: 'OFFLINE', rows: [] };
  try {
    const r = await Net.rest('/rest/v1/rulesets?kind=eq.mod&order=created_at.desc&limit=25&select=id,name,author,description,pack,version');
    return { rows: Array.isArray(r.body) ? r.body : [], error: r.status >= 300 ? 'FETCH FAILED' : null };
  } catch (e) { return { error: 'OFFLINE', rows: [] }; }
};
Net.publishMod = async function (pack) {
  if (!Net.enabled || Net.api === null) return { error: 'PUBLISHING NEEDS THE API' };
  try {
    const r = await fetch(Net.api + '/api/publish-mod', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pack, version: G.VERSION }),
    });
    const b = await r.json();
    return r.status < 300 ? { ok: true, ruleset_id: b.ruleset_id } : { error: b.error || 'PUBLISH FAILED' };
  } catch (e) { return { error: 'OFFLINE' }; }
};

Net.init = function () { if (Net.enabled) Net.loadSession(); };
