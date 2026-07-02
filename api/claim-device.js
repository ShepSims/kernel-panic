'use strict';
// POST /api/claim-device — link an authed account to a device's anonymous scores.
const { sbHeaders, sbFetch, userFromToken, cors, isUuid } = require('./_lib');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const b = req.body || {};
    if (!isUuid(b.device_id)) return res.status(400).json({ error: 'bad device_id' });
    const auth = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const user_id = await userFromToken(auth);
    if (!user_id) return res.status(401).json({ error: 'sign in first' });
    const upd = await sbFetch(
      '/rest/v1/scores?device_id=eq.' + b.device_id + '&user_id=is.null',
      { method: 'PATCH', headers: sbHeaders({ 'Prefer': 'return=minimal' }), body: JSON.stringify({ user_id }) }
    );
    if (upd.status >= 300) return res.status(500).json({ error: 'claim failed' });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'server error' });
  }
};
