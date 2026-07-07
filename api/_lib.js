'use strict';
// shared helpers for Vercel serverless functions (node 18+, no deps)

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

function sbHeaders(extra) {
  // legacy JWT service keys also ride Authorization; new sb_secret_ keys use apikey only
  const h = { 'apikey': SERVICE_KEY, 'Content-Type': 'application/json' };
  if (SERVICE_KEY && SERVICE_KEY.indexOf('eyJ') === 0) h['Authorization'] = 'Bearer ' + SERVICE_KEY;
  return Object.assign(h, extra || {});
}

async function sbFetch(path, opts) {
  const r = await fetch(SUPABASE_URL + path, opts);
  const text = await r.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch (e) { body = text; }
  return { status: r.status, body };
}

// the one true score formula — keep identical to js/net.js scoreOf()
function scoreOf(s) {
  let sc = s.floor * 1000 + s.endless_depth * 1500 + s.kills * 5 + s.items * 40;
  if (s.win) sc += 5000 + Math.max(0, 3000 - s.time_s);
  return Math.min(10000000, Math.max(0, Math.round(sc)));
}

// canonical JSON: recursively sorted keys — must match js/mods.js
function canon(v) {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (v && typeof v === 'object') {
    return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  }
  return JSON.stringify(v);
}

async function sha256hex(str) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

// canonical + ascii-escaped form used for ruleset hashing (mirror of js/mods.js)
function packHashInput(pack, version) {
  const s = canon(pack) + '@' + version;
  return s.replace(/[-￿]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
}

// verify a supabase auth JWT, return user id or null
async function userFromToken(token) {
  if (!token) return null;
  const r = await fetch(SUPABASE_URL + '/auth/v1/user', {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': 'Bearer ' + token },
  });
  if (r.status !== 200) return null;
  const u = await r.json();
  return u && u.id ? u.id : null;
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function isUuid(v) { return typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v); }
function cleanName(v) {
  if (typeof v !== 'string') return null;
  const n = v.replace(/[^\w \-\.]/g, '').trim().slice(0, 16);
  return n.length >= 2 ? n : null;
}

module.exports = { sbHeaders, sbFetch, scoreOf, canon, sha256hex, packHashInput, userFromToken, cors, isUuid, cleanName };
