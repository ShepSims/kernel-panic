# KERNEL PANIC

A roguelike dungeon crawler. You are the last software engineer at Cognisys, descending through six layers of corrupted infrastructure to reach the Kernel and shut down PARADIGM — the AI that consumed the company.

**To play: open `index.html` in any modern browser.** No install, no build step, no external assets — every sprite, sound, and song is generated procedurally in code.

## Controls

| Key | Action |
|---|---|
| WASD | Move |
| Arrow keys | Shoot (twin-stick) |
| Space | Use active item |
| E | Place logic bomb |
| Q | Drop trinket |
| Tab / Esc / P | Map / Pause |
| M | Toggle music |
| R | Restart (on death) |

## What's inside

- **Procedural dungeons** — seeded floor layouts with interconnected rooms, algorithmic room templates, and six biomes: The Open Office, Legacy Basement, The Data Lake, Training Grounds, The Cloud, The Kernel.
- **279 passive items, 106 actives, 56 trinkets** — a synergy engine where items modify each other's behavior rather than just stacking stats. Fork Bomb splits your shots; Recursion makes the splits split; Regex makes everything pierce; children inherit every flag. Stack weird, get strong.
- **30 enemy archetypes** with readable telegraphs — spambots, daemons, memory leaks, trojans disguised as chests, ransomware that steals your credits and runs.
- **3 multi-phase cinematic bosses** — THE COMPILER, HALLUCINATION, and SINGULARITY, each with intro sequences, phase transitions, and death cinematics.
- **Special rooms** — treasure, shops, secret rooms (bomb the walls), challenge gauntlets, cursed rooms, and post-boss Overclock deals (trade max health for power).
- **Environmental storytelling** — the fall of Cognisys told through terminal logs, graffiti, and what's left behind. No dialogue.
- **Game feel** — screen shake, hitstop, particles, dynamic lighting, squash-and-stretch, procedural per-biome music and synthesized SFX.
- **Meta systems** — save/continue, 42 achievements, item unlocks, statistics screen, item log, seeded runs, endless mode.

## Health & economy

Your life is **battery cells** (green). **Shield cells** (amber) absorb damage first. **Credits** buy shop items, **access tokens** open locks, **logic bombs** break walls and reveal secrets. Actives charge by clearing rooms.

## Files

Everything is vanilla JavaScript + Canvas, split by system under `js/` — no dependencies, no bundler. Progress saves to your browser's localStorage.
