# Deploying KERNEL PANIC (Vercel + Supabase)

The game works fully offline with no setup. This adds online leaderboards, accounts, and the mod registry.

## 1. Supabase (database + auth)

1. Create a project at supabase.com.
2. SQL Editor → paste and run `supabase/schema.sql`.
3. Authentication → Providers → enable **Email** (magic link). Set your site URL under Authentication → URL Configuration (your Vercel URL).
4. Settings → API: copy the **Project URL** and **anon public** key.

## 2. Vercel (hosting + API)

1. Push this folder to a Git repo, import it in Vercel. It deploys as a static site; `api/` becomes serverless functions automatically.
2. Project → Settings → Environment Variables:
   - `SUPABASE_URL` — your project URL
   - `SUPABASE_SERVICE_KEY` — the **service_role** key (Settings → API). Server-side only; never ships to clients.
3. Redeploy.

## 3. Point the game at your backend

Edit `js/config.js`:

```js
window.KP_CONFIG = {
  SUPABASE_URL: 'https://YOURPROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'eyJ...',   // anon key — safe to ship
  API_BASE: '',                  // same-origin on Vercel; or full URL
};
```

Commit and deploy. The anon key is designed to be public; row-level security limits it to reads and constraint-checked inserts.

## How versioning works

Every score is tagged with a **ruleset**: `official-1.0.0` for vanilla, `mod-<hash>` for mods. Boards only ever compare runs under identical rules. When you release a balance change:

1. Bump `G.VERSION` in `js/net.js`.
2. Insert the new official ruleset row (one INSERT, see bottom of schema.sql).
3. Archive the previous build under `/v/1.0.0/` (copy the deployed files) so old versions stay playable — their scores keep flowing to their own frozen board.

## How mods work

- A mod is a **data-only JSON pack** (stats, multipliers, item tweaks — never code). See MODS → CREATE EXAMPLE PACK in-game, export it, edit, re-import.
- Its canonical SHA-256 hash **is** its identity: publish registers `mod-<hash16>` as a ruleset, and all scores played under it land on that board. Tampered packs hash to a different board by construction.
- Publishing goes through `/api/publish-mod`, which re-validates and re-hashes server-side.

## Anti-cheat posture (honest version)

Client game = self-reported scores. Defenses: DB CHECK constraints, API-side plausibility checks (time vs floor, kill rates), server-side score recomputation, per-device rate limiting, one submission per run UUID. Determined cheaters can still lie; casual ones can't. Seeds are stored with every score, so suspicious top runs can be challenged and replayed under the same seed.
