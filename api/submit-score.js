'use strict';
// POST /api/submit-score — validated score submission (service role).
// Rate-limits per device, recomputes score server-side, one row per run_id.
const { sbHeaders, sbFetch, scoreOf, userFromToken, cors, isUuid, cleanName } = require('./_lib');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const b = req.body || {};
    // ---- shape & sanity ----
    if (!isUuid(b.run_id) || !isUuid(b.device_id)) return res.status(400).json({ error: 'bad ids' });
    const name = cleanName(b.name);
    if (!name) return res.status(400).json({ error: 'bad name' });
    const mode = ['normal', 'endless'].includes(b.mode) ? b.mode : null;
    if (!mode) return res.status(400).json({ error: 'bad mode' });
    const num = (v, lo, hi) => (typeof v === 'number' && isFinite(v) && v >= lo && v <= hi) ? Math.round(v) : null;
    const floor = num(b.floor, 1, 99), kills = num(b.kills, 0, 100000),
      items = num(b.items, 0, 500), time_s = num(b.time_s, 5, 86400),
      endless_depth = num(b.endless_depth, 0, 99);
    if ([floor, kills, items, time_s, endless_depth].some(v => v === null)) return res.status(400).json({ error: 'bad numbers' });
    const win = !!b.win;
    // ---- plausibility ----
    if (time_s < floor * 10) return res.status(400).json({ error: 'implausible time' });
    if (kills > time_s * 6) return res.status(400).json({ error: 'implausible kills' });
    if (win && floor < 6) return res.status(400).json({ error: 'implausible win' });
    if (endless_depth > 0 && mode !== 'endless') return res.status(400).json({ error: 'endless mismatch' });
    // ---- ruleset must exist ----
    const ruleset_id = typeof b.ruleset_id === 'string' ? b.ruleset_id.slice(0, 64) : '';
    const rs = await sbFetch('/rest/v1/rulesets?id=eq.' + encodeURIComponent(ruleset_id) + '&select=id', { headers: sbHeaders() });
    if (!Array.isArray(rs.body) || !rs.body.length) return res.status(400).json({ error: 'unknown ruleset' });
    // ---- rate limit: 1 submission / 20s / device ----
    const since = new Date(Date.now() - 20000).toISOString();
    const recent = await sbFetch('/rest/v1/scores?device_id=eq.' + b.device_id + '&created_at=gt.' + since + '&select=id&limit=1', { headers: sbHeaders() });
    if (Array.isArray(recent.body) && recent.body.length) return res.status(429).json({ error: 'slow down' });
    // ---- optional account ----
    const auth = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const user_id = await userFromToken(auth);
    // ---- server-side score: the client's opinion is not consulted ----
    const row = {
      run_id: b.run_id, ruleset_id, device_id: b.device_id, user_id,
      name, mode, floor, kills, items, time_s, win, endless_depth,
      seed: typeof b.seed === 'string' ? b.seed.slice(0, 16) : null,
      score: scoreOf({ floor, kills, items, time_s, win, endless_depth }),
    };
    const ins = await sbFetch('/rest/v1/scores', {
      method: 'POST',
      headers: sbHeaders({ 'Prefer': 'return=representation' }),
      body: JSON.stringify(row),
    });
    if (ins.status === 409) return res.status(409).json({ error: 'already submitted' });
    if (ins.status >= 300) return res.status(500).json({ error: 'insert failed', detail: ins.body });
    return res.status(200).json({ ok: true, score: row.score });
  } catch (e) {
    return res.status(500).json({ error: 'server error' });
  }
};
