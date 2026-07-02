'use strict';
// ============================================================
// ui.js: HUD, minimap, animated menus, stats & achievements
// ============================================================
const UI = { sel: 0, scroll: 0, logScroll: 0 };
G.UI = UI;

// ---------- HUD ----------
UI.drawHUD = function (x) {
  const p = G.run.player;
  // bar bg
  x.fillStyle = 'rgba(5,5,10,.82)';
  x.fillRect(0, 0, G.W, G.HUD_H);
  x.fillStyle = 'rgba(77,243,255,.12)';
  x.fillRect(0, G.HUD_H - 1, G.W, 1);
  // batteries
  for (let i = 0; i < p.hpMax; i++) {
    const bx = 6 + i * 11, by = 4;
    const lvl = G.clamp(p.hp - i * 2, 0, 2);
    x.fillStyle = '#20242e'; x.fillRect(bx, by, 9, 12);
    x.fillStyle = '#0b0b12'; x.fillRect(bx + 1, by + 1, 7, 10);
    if (lvl > 0) {
      const pulse = p.hp <= 2 ? .6 + Math.sin(G.time * 8) * .4 : 1;
      x.globalAlpha = pulse;
      x.fillStyle = '#58f08a';
      x.fillRect(bx + 2, by + 2 + (lvl === 1 ? 4 : 0), 5, lvl === 1 ? 4 : 8);
      x.globalAlpha = 1;
    }
    x.fillStyle = '#20242e'; x.fillRect(bx + 3, by - 2, 3, 2);
  }
  // soul shields
  const soulCells = Math.ceil(p.soul / 2);
  for (let i = 0; i < soulCells; i++) {
    const bx = 6 + (p.hpMax + i) * 11, by = 4;
    x.fillStyle = '#3a3520'; x.fillRect(bx, by, 9, 12);
    x.fillStyle = '#ffb84d'; x.fillRect(bx + 2, by + 2, 5, (p.soul - i * 2) === 1 ? 4 : 8);
  }
  // currencies
  x.font = '8px monospace';
  const cur = [
    ['¢', p.coins, '#ffb84d'],
    ['⚿', p.keys, '#d9e2ff'],
    ['●', p.bombs, '#8a93a8'],
  ];
  let cx = 8;
  for (const [ic, n, col] of cur) {
    x.fillStyle = col; x.fillText(ic, cx, 28);
    x.fillStyle = '#eef4ff'; x.fillText(String(n).padStart(2, '0'), cx + 10, 28);
    cx += 36;
  }
  // active item
  if (p.active) {
    const ax = 150, ay = 3;
    x.fillStyle = '#12141f'; x.fillRect(ax, ay, 26, 26);
    x.strokeStyle = p.active.charge >= p.active.max ? '#ffb84d' : '#454d63';
    if (p.active.charge >= p.active.max && Math.sin(G.time * 6) > 0) x.strokeStyle = '#ffe24d';
    x.lineWidth = 1; x.strokeRect(ax + .5, ay + .5, 25, 25);
    const ic = Spr.itemIcon(p.active.def.id, p.active.def.name, 'active');
    x.drawImage(ic, ax + 2, ay + 2);
    // charge pips
    const f = p.active.charge / p.active.max;
    x.fillStyle = '#0b0b12'; x.fillRect(ax + 27, ay, 4, 26);
    x.fillStyle = f >= 1 ? '#ffe24d' : '#ffb84d';
    x.fillRect(ax + 28, ay + 26 - 25 * G.clamp(f, 0, 1), 2, 25 * G.clamp(f, 0, 1));
    x.fillStyle = '#8a93a8'; x.font = '6px monospace';
    x.fillText('SPC', ax + 4, ay + 34);
  }
  // trinket
  if (p.trinket !== null) {
    const tx = 190, ty = 3;
    const ic = Spr.itemIcon(p.trinket, G.TRINKETS[p.trinket].name, 'trinket');
    x.drawImage(ic, tx, ty);
  }
  // floor label
  x.font = '7px monospace'; x.textAlign = 'center';
  x.fillStyle = Dg.biome().accent;
  x.fillText('B' + G.run.depth + ' · ' + Dg.biome().name, G.W / 2 + 40, 12);
  if (G.run.seeded) { x.fillStyle = '#8a93a8'; x.fillText('SEED ' + G.run.seedStr, G.W / 2 + 40, 22); }
  if (G.run.endless) { x.fillStyle = '#ff4da6'; x.fillText('ENDLESS', G.W / 2 + 40, 22); }
  x.textAlign = 'left';
  UI.drawMinimap(x);
  Boss.drawBar(x);
  // stat readout (bottom-left, tiny)
  x.font = '6px monospace'; x.fillStyle = 'rgba(200,220,255,.4)';
  x.fillText('DMG ' + p.stats.dmg.toFixed(1) + '  ROF ' + p.stats.fireRate.toFixed(1) + '  SPD ' + (p.stats.moveSpd / 108).toFixed(2) + '  LCK ' + p.stats.luck, 6, G.H - 4);
};

// ---------- minimap ----------
UI.drawMinimap = function (x) {
  const run = G.run;
  const cw = 9, ch = 7;
  const mx = G.W - 70, my = 4;
  x.fillStyle = 'rgba(5,5,10,.7)';
  x.fillRect(mx - 26, my - 2, 92, 60);
  const cur = run.cur;
  const p = run.player;
  for (const k in run.rooms) {
    const r = run.rooms[k];
    if (!r.seen) continue;
    if (r.type === 'secret' && !r.visited && !(p.hasUniq('secretSense') || p.hasUniq('fullMap'))) {
      let anyOpen = false;
      for (const d in r.doors) if (r.doors[d].open) anyOpen = true;
      if (!anyOpen) continue;
    }
    const rx = mx + 30 + (r.gx - cur.gx) * (cw + 1);
    const ry = my + 26 + (r.gy - cur.gy) * (ch + 1);
    if (rx < mx - 24 || rx > mx + 60 || ry < my - 2 || ry > my + 50) continue;
    x.fillStyle = r === cur ? '#4df3ff' : r.visited ? '#454d63' : '#20242e';
    if (r === cur && Math.sin(G.time * 5) > 0) x.fillStyle = '#8ef8ff';
    x.fillRect(rx, ry, cw, ch);
    // icon
    let ic = null, col = '#eef4ff';
    if (r.type === 'boss') { ic = '×'; col = '#ff3355'; }
    else if (r.type === 'treasure') { ic = '!'; col = '#ffe24d'; }
    else if (r.type === 'shop') { ic = '$'; col = '#4df3ff'; }
    else if (r.type === 'secret') { ic = '?'; col = '#b76bff'; }
    else if (r.type === 'challenge') { ic = '⚔'; col = '#ffb84d'; }
    else if (r.type === 'cursed') { ic = '☠'; col = '#b76bff'; }
    if (ic) {
      x.font = '6px monospace'; x.textAlign = 'center';
      x.fillStyle = col; x.fillText(ic, rx + cw / 2, ry + ch - 1);
      x.textAlign = 'left';
    }
  }
};

// ---------- shared menu chrome ----------
UI.frame = function (x, title) {
  x.fillStyle = '#05050a'; x.fillRect(0, 0, G.W, G.H);
  // animated grid bg
  x.strokeStyle = 'rgba(77,243,255,.05)'; x.lineWidth = 1;
  const off = (G.time * 8) % 24;
  for (let gx = -24 + off; gx < G.W; gx += 24) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, G.H); x.stroke(); }
  for (let gy = -24 + off; gy < G.H; gy += 24) { x.beginPath(); x.moveTo(0, gy); x.lineTo(G.W, gy); x.stroke(); }
  if (title) {
    x.font = 'bold 14px monospace'; x.textAlign = 'center';
    x.fillStyle = '#4df3ff'; x.fillText(title, G.W / 2, 30);
    x.fillStyle = 'rgba(77,243,255,.3)'; x.fillRect(G.W / 2 - 80, 36, 160, 1);
    x.textAlign = 'left';
  }
};
UI.menuNav = function (n) {
  if (G.hit('up') || G.hit('shootUp')) { UI.sel = (UI.sel - 1 + n) % n; Au.sfx('ui'); }
  if (G.hit('down') || G.hit('shootDown')) { UI.sel = (UI.sel + 1) % n; Au.sfx('ui'); }
};
UI.drawMenu = function (x, items, y0, dy) {
  x.textAlign = 'center'; x.font = '9px monospace';
  items.forEach((it, i) => {
    const sel = i === UI.sel;
    const yy = y0 + i * (dy || 16);
    if (sel) {
      x.fillStyle = 'rgba(77,243,255,.12)';
      x.fillRect(G.W / 2 - 90, yy - 9, 180, 13);
      x.fillStyle = '#4df3ff';
      x.fillText('▶ ' + it + ' ◀', G.W / 2, yy + Math.sin(G.time * 6) * .8);
    } else {
      x.fillStyle = '#8a93a8';
      x.fillText(it, G.W / 2, yy);
    }
  });
  x.textAlign = 'left';
};

// ---------- title ----------
UI.title = function (x, dt) {
  UI.frame(x, null);
  // glitchy logo
  x.textAlign = 'center';
  const gl = Math.sin(G.time * 17) > .92 ? G.fR(-2, 2) : 0;
  x.font = 'bold 30px monospace';
  x.fillStyle = '#ff3355'; x.fillText('KERNEL', G.W / 2 + gl + 1, 74);
  x.fillStyle = '#4df3ff'; x.fillText('KERNEL', G.W / 2 + gl - 1, 72);
  x.fillStyle = '#eef4ff'; x.fillText('KERNEL', G.W / 2 + gl, 73);
  x.fillStyle = '#ff3355'; x.fillText('PANIC', G.W / 2 - gl + 1, 102);
  x.fillStyle = '#4df3ff'; x.fillText('PANIC', G.W / 2 - gl - 1, 100);
  x.fillStyle = '#eef4ff'; x.fillText('PANIC', G.W / 2 - gl, 101);
  x.font = '8px monospace'; x.fillStyle = '#8a93a8';
  x.fillText('the last engineer descends', G.W / 2, 118);
  x.textAlign = 'left';
  const hasRun = !!G.loadRunSave();
  const items = (hasRun ? ['CONTINUE RUN'] : []).concat(
    ['NEW RUN', 'SEEDED RUN', 'ENDLESS MODE', 'LEADERBOARDS', 'MODS', 'STATISTICS', 'ACHIEVEMENTS', 'ITEM LOG', 'HELP']);
  UI.menuNav(items.length);
  UI.drawMenu(x, items, 138, 13);
  // active mod badge
  if (G.Mods.active) {
    x.font = '7px monospace'; x.textAlign = 'center';
    x.fillStyle = '#ff4da6';
    x.fillText('MOD ACTIVE: ' + ((G.Mods.active.meta && G.Mods.active.meta.name) || 'unnamed'), G.W / 2, 130);
    x.textAlign = 'left';
  }
  x.font = '7px monospace'; x.textAlign = 'center';
  x.fillStyle = 'rgba(138,147,168,.6)';
  x.fillText('WASD move · ARROWS shoot · SPACE active · E bomb · TAB map · M mute', G.W / 2, G.H - 10);
  x.textAlign = 'left';
  if (G.hit('confirm') || G.hit('active')) {
    Au.init(); Au.sfx('ui');
    const pick = items[UI.sel];
    UI.sel = 0;
    if (pick === 'CONTINUE RUN') G.startRun({ continueData: G.loadRunSave() });
    else if (pick === 'NEW RUN') G.startRun({});
    else if (pick === 'SEEDED RUN') { G.state = 'seedentry'; G.seedBuf = ''; }
    else if (pick === 'ENDLESS MODE') G.startRun({ endless: true });
    else if (pick === 'LEADERBOARDS') { G.state = 'leader'; UI.leaderCache = null; }
    else if (pick === 'MODS') { G.state = 'mods'; UI.sel = 0; }
    else if (pick === 'STATISTICS') G.state = 'stats';
    else if (pick === 'ACHIEVEMENTS') { G.state = 'ach'; UI.scroll = 0; }
    else if (pick === 'ITEM LOG') { G.state = 'itemlog'; UI.logScroll = 0; }
    else if (pick === 'HELP') G.state = 'help';
  }
};

// ---------- seed entry ----------
G.seedKey = function (e) {
  if (e.key === 'Enter') {
    const s = G.seedBuf.trim() || String((Math.random() * 1e9) | 0);
    G.startRun({ seedStr: s.toUpperCase(), seeded: true });
    return;
  }
  if (e.key === 'Escape') { G.state = 'title'; return; }
  if (e.key === 'Backspace') { G.seedBuf = G.seedBuf.slice(0, -1); return; }
  if (/^[a-zA-Z0-9\-]$/.test(e.key) && G.seedBuf.length < 12) G.seedBuf += e.key.toUpperCase();
};
UI.seedentry = function (x) {
  UI.frame(x, 'SEEDED RUN');
  x.textAlign = 'center';
  x.font = '8px monospace'; x.fillStyle = '#8a93a8';
  x.fillText('same seed = same dungeon, same items, same fate', G.W / 2, 70);
  x.fillText('type a seed and press ENTER · ESC to go back', G.W / 2, 84);
  x.font = 'bold 16px monospace';
  x.fillStyle = '#12141f'; x.fillRect(G.W / 2 - 90, 110, 180, 26);
  x.strokeStyle = '#4df3ff'; x.strokeRect(G.W / 2 - 90.5, 110.5, 181, 26);
  x.fillStyle = '#eef4ff';
  const cursor = Math.sin(G.time * 6) > 0 ? '_' : ' ';
  x.fillText((G.seedBuf || '') + cursor, G.W / 2, 128);
  if (G.meta.lastSeed) {
    x.font = '7px monospace'; x.fillStyle = '#454d63';
    x.fillText('last run seed: ' + G.meta.lastSeed, G.W / 2, 160);
  }
  x.textAlign = 'left';
};

// ---------- pause ----------
UI.pause = function (x) {
  // dim over game
  x.fillStyle = 'rgba(5,5,10,.85)'; x.fillRect(0, 0, G.W, G.H);
  x.textAlign = 'center';
  x.font = 'bold 14px monospace'; x.fillStyle = '#4df3ff';
  x.fillText('— PAUSED —', G.W / 2, 40);
  x.textAlign = 'left';
  const p = G.run.player;
  // item inventory
  x.font = '7px monospace';
  x.fillStyle = '#8a93a8'; x.fillText('LOADOUT (' + p.items.length + ' items)', 20, 60);
  let ix = 20, iy = 66;
  for (const it of p.items.slice(-42)) {
    const ic = Spr.itemIcon(it.id, it.name, it.kind);
    x.drawImage(ic, ix, iy, 14, 14);
    ix += 16;
    if (ix > 200) { ix = 20; iy += 16; }
  }
  // stats column
  const st = p.stats;
  const lines = [
    ['DAMAGE', st.dmg.toFixed(2)], ['FIRE RATE', st.fireRate.toFixed(2)],
    ['SHOT SPEED', st.shotspd.toFixed(0)], ['RANGE', st.range.toFixed(0)],
    ['MOVE SPEED', st.moveSpd.toFixed(0)], ['LUCK', st.luck],
    ['SEED', G.run.seedStr], ['FLOOR', G.run.depth],
    ['TIME', UI.fmtTime(G.run.time)], ['KILLS', G.run.stats.kills || 0],
  ];
  x.textAlign = 'left';
  lines.forEach(([k, v], i) => {
    x.fillStyle = '#454d63'; x.fillText(k, 250, 60 + i * 11);
    x.fillStyle = '#eef4ff'; x.fillText(String(v), 330, 60 + i * 11);
  });
  const opts = ['RESUME', (G.meta.settings.music ? 'MUSIC: ON' : 'MUSIC: OFF'), (G.meta.settings.sfx ? 'SFX: ON' : 'SFX: OFF'), (G.meta.settings.screenshake ? 'SHAKE: ON' : 'SHAKE: OFF'), 'QUIT TO TITLE'];
  UI.menuNav(opts.length);
  UI.drawMenu(x, opts, 200, 14);
  if (G.hit('confirm') || G.hit('active')) {
    Au.sfx('ui');
    if (UI.sel === 0) G.state = 'run';
    else if (UI.sel === 1) { G.meta.settings.music = !G.meta.settings.music; G.saveMeta(); }
    else if (UI.sel === 2) { G.meta.settings.sfx = !G.meta.settings.sfx; G.saveMeta(); }
    else if (UI.sel === 3) { G.meta.settings.screenshake = !G.meta.settings.screenshake; G.saveMeta(); }
    else { G.saveRun(); G.state = 'title'; UI.sel = 0; Au.setTheme(7); }
  }
  if (G.hit('pause')) G.state = 'run';
};

// ---------- death ----------
UI.dead = function (x, dt) {
  const d = G.deathInfo;
  x.fillStyle = 'rgba(5,5,10,' + G.clamp(G.stateT, 0, .92) + ')';
  x.fillRect(0, 0, G.W, G.H);
  if (G.stateT < .8) return;
  x.textAlign = 'center';
  x.font = 'bold 20px monospace';
  x.fillStyle = '#ff3355'; x.fillText('CONNECTION TERMINATED', G.W / 2, 70);
  x.font = 'italic 8px monospace'; x.fillStyle = '#8a93a8';
  x.fillText(d.line, G.W / 2, 92);
  x.font = '8px monospace'; x.fillStyle = '#eef4ff';
  const rows = [
    'floor reached: B' + d.floor,
    'bugs closed: ' + d.kills,
    'items collected: ' + d.items,
    'time: ' + UI.fmtTime(d.time),
    'seed: ' + d.seed,
  ];
  if (G.lastRunPayload) {
    let line = 'score: ' + G.lastRunPayload.score;
    if (G.Net.enabled && G.Net.pendingSubmit) line += '  ·  [N] SET NAME & SUBMIT';
    else if (G.Net.lastResult) line += '  ·  ' + G.Net.lastResult;
    rows.push(line);
  }
  rows.forEach((r, i) => x.fillText(r, G.W / 2, 120 + i * 13));
  if (G.hit('name') && G.Net.pendingSubmit) G.openTextEntry({ title: 'PLAYER NAME', hint: '2-16 characters — shown on the leaderboard', max: 16, cb: v => G.Net.submitPendingWithName(v.slice(0, 16)) });
  x.fillStyle = Math.sin(G.time * 4) > 0 ? '#4df3ff' : '#8a93a8';
  x.fillText('[R] RETRY   ·   [S] RETRY SAME SEED   ·   [ENTER] TITLE', G.W / 2, 220);
  x.textAlign = 'left';
  if (G.hit('restart')) G.startRun({});
  else if (G.hit('down')) G.startRun({ seedStr: d.seed, seeded: true });
  else if (G.hit('confirm')) { G.state = 'title'; UI.sel = 0; Au.setTheme(7); }
};

// ---------- win ----------
UI.win = function (x, dt) {
  x.fillStyle = 'rgba(5,5,10,' + G.clamp(G.stateT * .5, 0, .94) + ')';
  x.fillRect(0, 0, G.W, G.H);
  if (G.stateT < 1) return;
  const w = G.winInfo;
  x.textAlign = 'center';
  x.font = 'bold 22px monospace';
  const hue = (G.time * 40) % 360;
  x.fillStyle = 'hsl(' + hue + ',70%,70%)';
  x.fillText('SHUTDOWN COMPLETE', G.W / 2, 66);
  x.font = 'italic 8px monospace'; x.fillStyle = '#8a93a8';
  x.fillText(w.line, G.W / 2, 90);
  x.font = '8px monospace'; x.fillStyle = '#eef4ff';
  const rows = ['PARADIGM decommissioned', 'kills: ' + w.kills + ' · items: ' + w.items + ' · time: ' + UI.fmtTime(w.time), 'seed: ' + w.seed];
  if (G.lastRunPayload) {
    let line = 'score: ' + G.lastRunPayload.score;
    if (G.Net.enabled && G.Net.pendingSubmit) line += '  ·  [N] SET NAME & SUBMIT';
    else if (G.Net.lastResult) line += '  ·  ' + G.Net.lastResult;
    rows.push(line);
  }
  rows.forEach((r, i) => x.fillText(r, G.W / 2, 116 + i * 13));
  if (G.hit('name') && G.Net.pendingSubmit) G.openTextEntry({ title: 'PLAYER NAME', hint: '2-16 characters — shown on the leaderboard', max: 16, cb: v => G.Net.submitPendingWithName(v.slice(0, 16)) });
  x.fillStyle = Math.sin(G.time * 4) > 0 ? '#4df3ff' : '#8a93a8';
  x.fillText('[E] KEEP DESCENDING (ENDLESS)  ·  [R] NEW RUN  ·  [ENTER] TITLE', G.W / 2, 210);
  x.textAlign = 'left';
  if (G.hit('restart')) G.startRun({});
  else if (G.hit('confirm')) { G.state = 'title'; UI.sel = 0; Au.setTheme(7); }
  else if (G.hit('bomb')) { // E = endless continue
    G.run.endless = true;
    G.run.cur.trapdoor = { x: G.W / 2, y: (G.H + G.HUD_H) / 2 };
    G.state = 'run';
    G.toast('THE STAIRS KEEP GOING DOWN', '#ff4da6');
    Au.setTheme((G.run.depth) % 6);
  }
};

// ---------- stats ----------
UI.stats = function (x) {
  UI.frame(x, 'STATISTICS');
  const m = G.meta;
  const rows = [
    ['runs started', m.runs], ['victories', m.wins], ['deaths', m.deaths],
    ['win rate', m.runs ? Math.round(m.wins / m.runs * 100) + '%' : '—'],
    ['enemies killed', m.kills], ['bosses defeated', m.bossKills],
    ['rooms cleared', m.roomsCleared], ['secrets found', m.secretsFound],
    ['items collected', m.itemsCollected], ['credits collected', m.coinsCollected],
    ['overclock deals', m.dealsTaken], ['cursed rooms entered', m.cursedEntered],
    ['challenges won', m.challengesWon], ['damage taken', m.damageTaken],
    ['deepest floor', 'B' + m.deepestFloor], ['best endless', m.bestEndless ? 'B' + m.bestEndless : '—'],
    ['total time', UI.fmtTime(m.totalTime)],
    ['achievements', Object.keys(m.achievements).length + ' / ' + Meta.ACH.length],
    ['items discovered', Object.keys(m.seenItems).length + ' / ' + (G.PASSIVES.length + G.ACTIVES.length + G.TRINKETS.length)],
  ];
  x.font = '8px monospace';
  rows.forEach(([k, v], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const bx = 30 + col * 220, by = 58 + row * 16;
    x.fillStyle = '#454d63'; x.fillText(String(k).toUpperCase(), bx, by);
    x.fillStyle = '#4df3ff'; x.fillText(String(v), bx + 130, by);
  });
  UI.backHint(x);
};

// ---------- achievements ----------
UI.ach = function (x) {
  UI.frame(x, 'ACHIEVEMENTS  ' + Object.keys(G.meta.achievements).length + '/' + Meta.ACH.length);
  const perPage = 11;
  if (G.hit('down') || G.hit('shootDown')) UI.scroll = Math.min(Meta.ACH.length - perPage, UI.scroll + 1);
  if (G.hit('up') || G.hit('shootUp')) UI.scroll = Math.max(0, UI.scroll - 1);
  x.font = '8px monospace';
  for (let i = 0; i < perPage; i++) {
    const a = Meta.ACH[UI.scroll + i];
    if (!a) break;
    const done = !!G.meta.achievements[a.id];
    const y = 56 + i * 21;
    x.fillStyle = done ? 'rgba(88,240,138,.08)' : 'rgba(70,77,99,.08)';
    x.fillRect(24, y - 8, G.W - 48, 18);
    x.fillStyle = done ? '#58f08a' : '#454d63';
    x.fillText(done ? '⚑' : '·', 32, y + 3);
    x.fillStyle = done ? '#eef4ff' : '#8a93a8';
    x.fillText(a.name, 46, y);
    x.fillStyle = '#454d63';
    x.font = '7px monospace'; x.fillText(a.desc, 46, y + 8); x.font = '8px monospace';
    const ul = Meta.UNLOCKS[a.id];
    if (ul) { x.fillStyle = done ? '#ffe24d' : '#3a3520'; x.fillText('★', G.W - 40, y + 3); }
  }
  UI.backHint(x, 'scroll W/S');
};

// ---------- item log ----------
UI.itemlog = function (x) {
  const all = [];
  for (const it of G.PASSIVES) all.push(['p' + it.id, it, 'passive']);
  for (const it of G.ACTIVES) all.push(['a' + it.id, it, 'active']);
  for (const it of G.TRINKETS) all.push(['t' + it.id, it, 'trinket']);
  const seen = all.filter(([k]) => G.meta.seenItems[k]);
  UI.frame(x, 'ITEM LOG  ' + seen.length + '/' + all.length);
  const perPage = 12;
  if (G.hit('down') || G.hit('shootDown')) UI.logScroll = Math.min(Math.max(0, seen.length - perPage), UI.logScroll + 1);
  if (G.hit('up') || G.hit('shootUp')) UI.logScroll = Math.max(0, UI.logScroll - 1);
  x.font = '8px monospace';
  if (!seen.length) {
    x.textAlign = 'center'; x.fillStyle = '#454d63';
    x.fillText('nothing catalogued yet. go find things.', G.W / 2, 120);
    x.textAlign = 'left';
  }
  for (let i = 0; i < perPage; i++) {
    const entry = seen[UI.logScroll + i];
    if (!entry) break;
    const [k, it, kind] = entry;
    const y = 52 + i * 19;
    const ic = Spr.itemIcon(it.id, it.name, kind);
    x.drawImage(ic, 26, y - 8, 15, 15);
    x.fillStyle = kind === 'active' ? '#ffb84d' : kind === 'trinket' ? '#58f08a' : '#4df3ff';
    x.fillText(it.name, 48, y);
    x.fillStyle = '#454d63'; x.font = '7px monospace';
    x.fillText(it.desc.slice(0, 52), 48, y + 8); x.font = '8px monospace';
  }
  UI.backHint(x, 'scroll W/S');
};

// ---------- help ----------
UI.help = function (x) {
  UI.frame(x, 'FIELD MANUAL');
  const rows = [
    ['WASD', 'move'],
    ['ARROW KEYS', 'shoot (twin-stick)'],
    ['SPACE', 'use active item (charges by clearing rooms)'],
    ['E', 'place logic bomb (opens cracked walls & secrets)'],
    ['Q', 'drop trinket'],
    ['ESC / P', 'pause'],
    ['M', 'toggle music'],
    ['', ''],
    ['BATTERIES', 'your life. green = health, amber = shields'],
    ['! DOOR', 'treasure · $ shop · × boss · ⚔ challenge · ☠ cursed'],
    ['SECRETS', 'bomb suspicious walls between rooms'],
    ['OVERCLOCK', 'after bosses: trade max health for power'],
    ['SYNERGIES', 'items multiply each other. stack weird. get strong.'],
  ];
  x.font = '8px monospace';
  rows.forEach(([k, v], i) => {
    const y = 58 + i * 13;
    x.fillStyle = '#4df3ff'; x.fillText(k, 50, y);
    x.fillStyle = '#8a93a8'; x.fillText(v, 150, y);
  });
  UI.backHint(x);
};

UI.backHint = function (x, extra) {
  x.font = '7px monospace'; x.textAlign = 'center';
  x.fillStyle = Math.sin(G.time * 4) > 0 ? '#4df3ff' : '#454d63';
  x.fillText('[ESC / ENTER] back' + (extra ? ' · ' + extra : ''), G.W / 2, G.H - 10);
  x.textAlign = 'left';
  if (G.hit('pause') || G.hit('confirm')) { G.state = 'title'; UI.sel = 0; Au.sfx('uiBack'); }
};

// ---------- generic text entry ----------
G.openTextEntry = function (o) {
  G.textEntry = Object.assign({ value: '', max: 24 }, o);
  G.teReturn = G.state;
  G.state = 'textentry';
};
G.textKey = function (e) {
  const t = G.textEntry;
  if (!t) { G.state = 'title'; return; }
  if (e.key === 'Enter') {
    const v = t.value.trim();
    G.state = G.teReturn; G.textEntry = null;
    if (v) t.cb(v);
    return;
  }
  if (e.key === 'Escape') { G.state = G.teReturn; G.textEntry = null; return; }
  if (e.key === 'Backspace') { t.value = t.value.slice(0, -1); return; }
  if (e.key.length === 1 && t.value.length < t.max && (t.filter || /[\w \-\.]/).test(e.key)) t.value += e.key;
};
UI.textentry = function (x) {
  const t = G.textEntry;
  if (!t) { G.state = 'title'; return; }
  UI.frame(x, t.title || 'INPUT');
  x.textAlign = 'center';
  x.font = '8px monospace'; x.fillStyle = '#8a93a8';
  x.fillText(t.hint || 'type, then press ENTER · ESC to cancel', G.W / 2, 84);
  x.font = 'bold 14px monospace';
  x.fillStyle = '#12141f'; x.fillRect(G.W / 2 - 110, 110, 220, 26);
  x.strokeStyle = '#4df3ff'; x.strokeRect(G.W / 2 - 110.5, 110.5, 221, 26);
  x.fillStyle = '#eef4ff';
  x.fillText(t.value + (Math.sin(G.time * 6) > 0 ? '_' : ' '), G.W / 2, 128);
  x.textAlign = 'left';
};

// ---------- leaderboards ----------
UI.leaderTab = 0; UI.leaderCache = null; UI.leaderBusy = false;
UI.leader = function (x) {
  UI.frame(x, 'LEADERBOARDS');
  const Net = G.Net, Mods = G.Mods;
  const rsId = Mods.rulesetIdOf(Mods.active);
  // tabs
  if (G.hit('shootLeft') || G.hit('left')) { UI.leaderTab = (UI.leaderTab + Net.BOARDS.length - 1) % Net.BOARDS.length; UI.leaderCache = null; Au.sfx('ui'); }
  if (G.hit('shootRight') || G.hit('right')) { UI.leaderTab = (UI.leaderTab + 1) % Net.BOARDS.length; UI.leaderCache = null; Au.sfx('ui'); }
  const B = Net.BOARDS[UI.leaderTab];
  x.textAlign = 'center'; x.font = '8px monospace';
  x.fillStyle = '#4df3ff'; x.fillText('◄  ' + B.label + '  ►', G.W / 2, 48);
  x.fillStyle = '#454d63';
  x.fillText(Net.BOARDS.map((b, i) => i === UI.leaderTab ? '●' : '○').join(' '), G.W / 2, 38);
  x.font = '7px monospace'; x.fillStyle = G.Mods.active ? '#ff4da6' : '#8a93a8';
  x.fillText('RULESET: ' + (Mods.active ? ((Mods.active.meta && Mods.active.meta.name) || 'mod') + ' · ' + rsId : 'OFFICIAL ' + G.VERSION), G.W / 2, 60);
  if (!Net.enabled) {
    x.fillStyle = '#ff5252'; x.font = '9px monospace';
    x.fillText('OFFLINE', G.W / 2, 130);
    x.fillStyle = '#8a93a8'; x.font = '7px monospace';
    x.fillText('deploy with js/config.js filled in to enable online boards', G.W / 2, 145);
    x.fillText('(see js/config.example.js + README-DEPLOY.md)', G.W / 2, 156);
  } else {
    if (!UI.leaderCache && !UI.leaderBusy) {
      UI.leaderBusy = true;
      Net.fetchBoard(B.id, rsId).then(d => { UI.leaderCache = d; UI.leaderBusy = false; });
    }
    if (UI.leaderBusy || !UI.leaderCache) {
      x.fillStyle = '#454d63'; x.fillText('querying the mainframe' + '.'.repeat(1 + (Math.floor(G.time * 2) % 3)), G.W / 2, 130);
    } else if (UI.leaderCache.error) {
      x.fillStyle = '#ff5252'; x.fillText(UI.leaderCache.error, G.W / 2, 130);
    } else if (!UI.leaderCache.rows.length) {
      x.fillStyle = '#454d63'; x.fillText('no scores yet — be the first', G.W / 2, 130);
    } else {
      x.textAlign = 'left'; x.font = '8px monospace';
      const mine = Net.deviceId();
      UI.leaderCache.rows.slice(0, 14).forEach((r, i) => {
        const y = 76 + i * 14;
        const own = r.device_id === mine;
        if (own) { x.fillStyle = 'rgba(77,243,255,.1)'; x.fillRect(60, y - 8, G.W - 120, 12); }
        x.fillStyle = i === 0 ? '#ffe24d' : i < 3 ? '#c3cbdd' : '#8a93a8';
        x.fillText(String(i + 1).padStart(2), 66, y);
        x.fillStyle = own ? '#4df3ff' : '#eef4ff';
        x.fillText(r.name, 88, y);
        x.fillStyle = '#58f08a';
        x.fillText(String(B.fmt(r)), 240, y);
        x.fillStyle = '#454d63';
        x.fillText('B' + r.floor + ' · ' + r.kills + ' kills' + (r.win ? ' · WIN' : ''), 300, y);
      });
    }
  }
  x.textAlign = 'center'; x.font = '7px monospace';
  const acct = Net.session ? 'ACCOUNT LINKED · [O] SIGN OUT' : '[L] LINK ACCOUNT (email)';
  x.fillStyle = '#8a93a8';
  x.fillText('PLAYER: ' + (G.meta.playerName || '(unset)') + ' · [N] CHANGE  ·  ' + acct, G.W / 2, G.H - 22);
  x.fillStyle = Math.sin(G.time * 4) > 0 ? '#4df3ff' : '#454d63';
  x.fillText('◄ ► switch board · [ESC] back', G.W / 2, G.H - 10);
  x.textAlign = 'left';
  if (G.hit('name')) G.openTextEntry({ title: 'PLAYER NAME', hint: '2-16 characters', max: 16, cb: v => { G.meta.playerName = v.slice(0, 16); G.saveMeta(); UI.leaderCache = null; } });
  if (G.hit('link') && Net.enabled && !Net.session) G.openTextEntry({
    title: 'LINK ACCOUNT', hint: 'your email — we send a magic sign-in link', max: 60, filter: /[\w@\.\-\+]/,
    cb: v => { Net.signIn(v).then(ok => G.toast(ok ? 'CHECK YOUR EMAIL' : 'COULD NOT SEND LINK', ok ? '#58f08a' : '#ff5252')); },
  });
  if (G.hit('signout') && Net.session) { Net.signOut(); G.toast('SIGNED OUT', '#8a93a8'); }
  if (G.hit('pause')) { G.state = 'title'; UI.sel = 0; Au.sfx('uiBack'); }
};

// ---------- mods ----------
UI.mods = function (x) {
  UI.frame(x, 'MODS — DATA PACKS');
  const Mods = G.Mods, Net = G.Net;
  const entries = [{ label: 'OFFICIAL (VANILLA)', pack: null }]
    .concat(Mods.local.map(m => ({ label: ((m.meta && m.meta.name) || 'unnamed pack'), pack: m, real: true })))
    .concat([
      { act: 'import', label: '+ IMPORT PACK FILE' },
      { act: 'example', label: '+ CREATE EXAMPLE PACK' },
      { act: 'browse', label: '≡ BROWSE PUBLISHED' },
      { act: 'export', label: '↓ EXPORT ACTIVE PACK' },
      { act: 'publish', label: '↑ PUBLISH ACTIVE PACK' },
    ]);
  UI.menuNav(entries.length);
  const activeId = Mods.rulesetIdOf(Mods.active);
  x.font = '8px monospace';
  entries.forEach((en, i) => {
    const y = 56 + i * 16;
    const sel = i === UI.sel;
    if (sel) { x.fillStyle = 'rgba(77,243,255,.1)'; x.fillRect(40, y - 9, G.W - 80, 14); }
    const isActive = (en.pack !== undefined && !en.act) && Mods.rulesetIdOf(en.pack) === activeId;
    x.fillStyle = en.act ? '#ffb84d' : sel ? '#4df3ff' : '#8a93a8';
    x.fillText(en.label, 50, y);
    if (isActive) { x.fillStyle = '#58f08a'; x.fillText('● ACTIVE', G.W - 120, y); }
    if (en.pack && !en.act) { x.fillStyle = '#454d63'; x.font = '6px monospace'; x.fillText(Mods.rulesetIdOf(en.pack), 200, y); x.font = '8px monospace'; }
  });
  x.textAlign = 'center'; x.font = '7px monospace'; x.fillStyle = '#8a93a8';
  x.fillText('packs are data-only (JSON) — never code. scores go to the pack\'s own board.', G.W / 2, G.H - 32);
  x.fillText('changes apply on your NEXT run', G.W / 2, G.H - 22);
  x.fillStyle = Math.sin(G.time * 4) > 0 ? '#4df3ff' : '#454d63';
  x.fillText('[ENTER] select · [ESC] back', G.W / 2, G.H - 10);
  x.textAlign = 'left';
  if (G.hit('confirm') || G.hit('active')) {
    const en = entries[UI.sel];
    Au.sfx('ui');
    if (!en.act) { Mods.setActive(en.pack); G.toast('RULESET: ' + (en.pack ? en.label : 'OFFICIAL'), '#4df3ff'); }
    else if (en.act === 'import') Mods.importFile((err, pack) => {
      if (err) return G.toast('IMPORT FAILED: ' + err, '#ff5252');
      const e2 = Mods.install(pack);
      if (e2) return G.toast('BAD PACK: ' + e2, '#ff5252');
      Mods.setActive(pack);
      G.toast('PACK INSTALLED & ACTIVE', '#58f08a');
    });
    else if (en.act === 'example') { const p = Mods.examplePack(); Mods.install(p); Mods.setActive(p); G.toast('EXAMPLE PACK CREATED — EXPORT & EDIT IT', '#58f08a'); }
    else if (en.act === 'export') { if (Mods.active) { Mods.exportActive(); G.toast('PACK DOWNLOADED', '#58f08a'); } else G.toast('OFFICIAL ISN\'T EXPORTABLE — SELECT A MOD', '#ff5252'); }
    else if (en.act === 'browse') { G.state = 'modbrowse'; UI.browseData = null; UI.sel = 0; }
    else if (en.act === 'publish') {
      if (!Mods.active) G.toast('SELECT A MOD FIRST', '#ff5252');
      else Net.publishMod(Mods.active).then(r => G.toast(r.ok ? 'PUBLISHED: ' + r.ruleset_id : r.error, r.ok ? '#58f08a' : '#ff5252'));
    }
  }
  if (G.hit('pause')) { G.state = 'title'; UI.sel = 0; Au.sfx('uiBack'); }
};

UI.modbrowse = function (x) {
  UI.frame(x, 'PUBLISHED MODS');
  const Mods = G.Mods, Net = G.Net;
  if (!Net.enabled) {
    x.textAlign = 'center'; x.fillStyle = '#ff5252'; x.font = '9px monospace';
    x.fillText('OFFLINE — no mod registry configured', G.W / 2, 130); x.textAlign = 'left';
  } else {
    if (!UI.browseData && !UI.browseBusy) { UI.browseBusy = true; Net.fetchMods().then(d => { UI.browseData = d; UI.browseBusy = false; }); }
    if (!UI.browseData) {
      x.textAlign = 'center'; x.fillStyle = '#454d63'; x.font = '8px monospace';
      x.fillText('fetching' + '.'.repeat(1 + (Math.floor(G.time * 2) % 3)), G.W / 2, 130); x.textAlign = 'left';
    } else {
      const rows = UI.browseData.rows || [];
      if (!rows.length) { x.textAlign = 'center'; x.fillStyle = '#454d63'; x.font = '8px monospace'; x.fillText('nothing published yet', G.W / 2, 130); x.textAlign = 'left'; }
      UI.menuNav(Math.max(1, rows.length));
      x.font = '8px monospace';
      rows.slice(0, 11).forEach((r, i) => {
        const y = 56 + i * 20;
        if (i === UI.sel) { x.fillStyle = 'rgba(77,243,255,.1)'; x.fillRect(30, y - 9, G.W - 60, 18); }
        x.fillStyle = i === UI.sel ? '#4df3ff' : '#eef4ff'; x.fillText(r.name, 40, y);
        x.fillStyle = '#8a93a8'; x.fillText(r.author ? 'by ' + r.author : '', 200, y);
        x.fillStyle = '#454d63'; x.font = '6px monospace';
        x.fillText((r.description || '').slice(0, 70), 40, y + 8);
        x.fillText(r.id, 300, y); x.font = '8px monospace';
      });
      if (G.hit('confirm') || G.hit('active')) {
        const r = rows[UI.sel];
        if (r && r.pack) {
          const err = Mods.install(r.pack);
          if (err) G.toast('BAD PACK: ' + err, '#ff5252');
          else { Mods.setActive(r.pack); G.toast('INSTALLED & ACTIVE: ' + r.name, '#58f08a'); }
        }
      }
    }
  }
  x.textAlign = 'center'; x.font = '7px monospace';
  x.fillStyle = Math.sin(G.time * 4) > 0 ? '#4df3ff' : '#454d63';
  x.fillText('[ENTER] install & activate · [ESC] back', G.W / 2, G.H - 10);
  x.textAlign = 'left';
  if (G.hit('pause')) { G.state = 'mods'; UI.sel = 0; Au.sfx('uiBack'); }
};

UI.fmtTime = function (t) {
  t = Math.floor(t || 0);
  const m = Math.floor(t / 60), s = t % 60;
  return m + ':' + String(s).padStart(2, '0');
};

// ---------- toasts & floor banner ----------
UI.drawToasts = function (x) {
  let y = G.H - 40;
  for (let i = G.msg.length - 1; i >= 0; i--) {
    const t = G.msg[i];
    x.globalAlpha = G.clamp(t.t, 0, 1);
    x.font = '8px monospace'; x.textAlign = 'center';
    x.fillStyle = '#05050a'; x.fillText(t.txt, G.W / 2 + 1, y + 1);
    x.fillStyle = t.col; x.fillText(t.txt, G.W / 2, y);
    y -= 12;
  }
  x.globalAlpha = 1; x.textAlign = 'left';
};
UI.updateToasts = function (dt) {
  for (let i = G.msg.length - 1; i >= 0; i--) {
    G.msg[i].t -= dt;
    if (G.msg[i].t <= 0) G.msg.splice(i, 1);
  }
};
