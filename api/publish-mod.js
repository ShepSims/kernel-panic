'use strict';
// POST /api/publish-mod — register a data pack as a ruleset.
// The server recomputes the canonical hash: the pack IS its identity.
const { sbHeaders, sbFetch, sha256hex, packHashInput, cors, cleanName } = require('./_lib');

// data-only pack: whitelist of top-level keys and value types
const PACK_KEYS = ['meta', 'global', 'player', 'enemies', 'bosses', 'items', 'newItems', 'skin', 'actives', 'trinkets'];

function validatePack(pack) {
  if (!pack || typeof pack !== 'object' || Array.isArray(pack)) return 'pack must be an object';
  for (const k of Object.keys(pack)) if (!PACK_KEYS.includes(k)) return 'unknown key: ' + k;
  const json = JSON.stringify(pack);
  if (json.length > 60000) return 'pack too large';
  if (/function|=>|<script|javascript:/i.test(json)) return 'code is not allowed in packs';
  // numeric bounds on every leaf number
  let bad = null;
  (function walk(v) {
    if (bad) return;
    if (typeof v === 'number' && (!isFinite(v) || Math.abs(v) > 1000)) bad = 'number out of bounds';
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  })(pack);
  return bad;
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const b = req.body || {};
    const pack = b.pack;
    const err = validatePack(pack);
    if (err) return res.status(400).json({ error: err });
    const meta = pack.meta || {};
    const name = cleanName(meta.name && String(meta.name).slice(0, 40));
    const author = cleanName(meta.author);
    if (!name) return res.status(400).json({ error: 'pack.meta.name required (2-40 chars)' });
    const version = typeof b.version === 'string' ? b.version.slice(0, 16) : '1.0.0';
    // identity = hash of canonical (ascii-escaped) pack + target version
    const hash = await sha256hex(packHashInput(pack, version));
    const id = 'mod-' + hash.slice(0, 16);
    const row = {
      id, kind: 'mod', name, author,
      description: typeof meta.description === 'string' ? meta.description.slice(0, 300) : null,
      pack, version,
    };
    const ins = await sbFetch('/rest/v1/rulesets', {
      method: 'POST',
      headers: sbHeaders({ 'Prefer': 'resolution=ignore-duplicates,return=representation' }),
      body: JSON.stringify(row),
    });
    if (ins.status >= 300) return res.status(500).json({ error: 'publish failed', detail: ins.body });
    return res.status(200).json({ ok: true, ruleset_id: id });
  } catch (e) {
    return res.status(500).json({ error: 'server error' });
  }
};
