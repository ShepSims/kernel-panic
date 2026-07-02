'use strict';
// ============================================================
// sprites: all pixel art generated procedurally at boot.
// No external assets. Everything drawn to offscreen canvases.
// ============================================================
const Spr = { cache: {} };
G.Spr = Spr;

// ---------- palettes ----------
Spr.PAL = {
  outline: '#0b0b12',
  skin: '#e8b89a', skinD: '#c99678',
  hoodie: '#3a4a6b', hoodieD: '#2a3550', hoodieL: '#4d629c',
  pants: '#23293a', boots: '#151a28',
  cyan: '#4df3ff', cyanD: '#1fb6c9', magenta: '#ff4da6', amber: '#ffb84d',
  green: '#58f08a', red: '#ff5252', purple: '#b76bff', white: '#eef4ff',
  grey: '#8a93a8', greyD: '#454d63',
};

// biome palettes: floor, floorAlt, wall, wallDark, accent, ambient darkness
Spr.BIOMES = [
  { id: 0, name: 'THE OPEN OFFICE',   floor: '#2e2c38', alt: '#34323f', wall: '#4a4658', wallD: '#262230', accent: '#7fd4ff', dark: 0.38, prop: 'office' },
  { id: 1, name: 'LEGACY BASEMENT',   floor: '#232b22', alt: '#28311f', wall: '#3d4a36', wallD: '#1a211a', accent: '#7dff8a', dark: 0.52, prop: 'legacy' },
  { id: 2, name: 'THE DATA LAKE',     floor: '#1d2836', alt: '#203040', wall: '#2f4a63', wallD: '#131b26', accent: '#4dc3ff', dark: 0.5,  prop: 'lake' },
  { id: 3, name: 'TRAINING GROUNDS',  floor: '#33222a', alt: '#3a2530', wall: '#5c3140', wallD: '#1e1218', accent: '#ff7a5c', dark: 0.46, prop: 'gpu' },
  { id: 4, name: 'THE CLOUD',         floor: '#3a3f52', alt: '#414763', wall: '#5d648c', wallD: '#23273a', accent: '#e0e8ff', dark: 0.3,  prop: 'cloud' },
  { id: 5, name: 'THE KERNEL',        floor: '#2a1218', alt: '#331520', wall: '#571f2e', wallD: '#160408', accent: '#ff3355', dark: 0.58, prop: 'kernel' },
];

// ---------- tiny pixel DSL ----------
// draw a string-grid sprite; chars map to palette entries
Spr.fromStr = function (rows, map, scale) {
  scale = scale || 1;
  const h = rows.length, w = rows[0].length;
  const c = G.mkCanvas(w * scale, h * scale), x = c.getContext('2d');
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const ch = rows[j][i]; if (ch === '.' || ch === ' ') continue;
    x.fillStyle = map[ch] || '#f0f'; x.fillRect(i * scale, j * scale, scale, scale);
  }
  return c;
};

// outline an existing sprite canvas
Spr.outline = function (src, col) {
  const w = src.width, h = src.height;
  const c = G.mkCanvas(w + 2, h + 2), x = c.getContext('2d');
  for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) x.drawImage(src, dx, dy);
  x.globalCompositeOperation = 'source-in'; x.fillStyle = col || Spr.PAL.outline; x.fillRect(0, 0, w + 2, h + 2);
  x.globalCompositeOperation = 'source-over'; x.drawImage(src, 1, 1);
  return c;
};

// ---------- player ----------
Spr.buildPlayer = function () {
  const P = Spr.PAL;
  const map = { h: P.hoodie, H: P.hoodieL, d: P.hoodieD, f: P.skin, F: P.skinD, e: '#20242e', p: P.pants, b: P.boots, c: P.cyan, w: '#fff' };
  // 12 wide x 15 tall; frames vary legs + bob
  const head = [
    '..hhhhhhhh..',
    '.hhHHHHHHhh.',
    '.hhffffffhh.',
    '.hhfeffefhh.',
    '..hffffffh..',
    '...ffFFff...',
  ];
  const bodyA = [
    '..hhhhhhhh..',
    '.hhhhhhhhhh.',
    'hhhhhddhhhhh',
    'hh.hhhhhh.hh',
    '...pppppp...',
    '...pp..pp...',
    '...bb..bb...',
  ];
  const bodyB = [
    '..hhhhhhhh..',
    '.hhhhhhhhhh.',
    'hhhhhddhhhhh',
    'hh.hhhhhh.hh',
    '...pppppp...',
    '..pp....pp..',
    '..bb....bb..',
  ];
  const bodyC = [
    '..hhhhhhhh..',
    '.hhhhhhhhhh.',
    'hhhhhddhhhhh',
    'hh.hhhhhh.hh',
    '...pppppp...',
    '....pppp....',
    '....bbbb....',
  ];
  const frames = [bodyC, bodyA, bodyC, bodyB]; // idle=0 uses C
  Spr.cache.player = frames.map(body => Spr.outline(Spr.fromStr(head.concat(body.slice(2)), map)));
  // hurt flash version
  const white = {}; for (const k in map) white[k] = '#ffffff';
  Spr.cache.playerWhite = Spr.outline(Spr.fromStr(head.concat(bodyC.slice(2)), white));
  // ghost (death anim)
  Spr.cache.playerGhost = Spr.fromStr(head, { h: 'rgba(180,220,255,.5)', H: 'rgba(220,240,255,.6)', f: 'rgba(200,230,255,.4)', F: 'rgba(200,230,255,.4)', e: 'rgba(30,40,60,.8)' });
};

// ---------- generic enemy shape builders ----------
function shade(col, f) { // lighten/darken hex
  const n = parseInt(col.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = G.clamp(Math.round(r * f), 0, 255); g = G.clamp(Math.round(g * f), 0, 255); b = G.clamp(Math.round(b * f), 0, 255);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}
Spr.shade = shade;

function blobShape(s, col, frame, eyes) {
  const c = G.mkCanvas(s, s), x = c.getContext('2d');
  const squish = frame ? 2 : 0;
  x.fillStyle = col;
  x.beginPath(); x.ellipse(s / 2, s / 2 + squish / 2 + 1, s / 2 - 2 + squish, s / 2 - 3 - squish, 0, 0, G.TAU); x.fill();
  x.fillStyle = shade(col, 1.35);
  x.beginPath(); x.ellipse(s / 2 - s / 6, s / 2 - s / 6 + squish / 2, s / 6, s / 8, -0.5, 0, G.TAU); x.fill();
  if (eyes) {
    x.fillStyle = '#0b0b12';
    x.fillRect(s / 2 - s / 5, s / 2 - 1 + squish / 2, 2, 3); x.fillRect(s / 2 + s / 5 - 2, s / 2 - 1 + squish / 2, 2, 3);
  }
  return c;
}
function spiderShape(s, col, frame) {
  const c = G.mkCanvas(s, s), x = c.getContext('2d');
  x.strokeStyle = shade(col, 0.7); x.lineWidth = 2;
  const lw = frame ? 1 : -1;
  for (let i = 0; i < 4; i++) {
    const a = -0.9 + i * 0.6;
    x.beginPath(); x.moveTo(s / 2, s / 2);
    x.lineTo(s / 2 + Math.cos(a + Math.PI) * (s / 2 - 1), s / 2 + Math.sin(a + Math.PI) * (s / 2 - 1) + lw * (i % 2));
    x.moveTo(s / 2, s / 2);
    x.lineTo(s / 2 + Math.cos(a) * (s / 2 - 1), s / 2 + Math.sin(a) * (s / 2 - 1) - lw * (i % 2));
    x.stroke();
  }
  x.fillStyle = col; x.beginPath(); x.ellipse(s / 2, s / 2, s / 3.2, s / 4, 0, 0, G.TAU); x.fill();
  x.fillStyle = shade(col, 1.4); x.fillRect(s / 2 - 3, s / 2 - 3, 2, 2);
  x.fillStyle = '#ff5252'; x.fillRect(s / 2 - 2, s / 2, 1, 2); x.fillRect(s / 2 + 1, s / 2, 1, 2);
  return c;
}
function droneShape(s, col, frame) {
  const c = G.mkCanvas(s, s), x = c.getContext('2d');
  const w = frame ? s - 2 : s - 6; // rotor blur
  x.fillStyle = 'rgba(200,220,255,.35)'; x.fillRect(s / 2 - w / 2, 2, w, 2);
  x.fillStyle = col; x.fillRect(s / 2 - s / 4, 4, s / 2, s / 2);
  x.fillStyle = shade(col, 0.6); x.fillRect(s / 2 - s / 4, 4 + s / 2 - 3, s / 2, 3);
  x.fillStyle = '#ff5252'; x.fillRect(s / 2 - 2, 4 + s / 4 - 1, 4, 3);
  x.fillStyle = shade(col, 1.3); x.fillRect(s / 2 - s / 4, 4, s / 2, 2);
  return c;
}
function cubeShape(s, col, frame) {
  const c = G.mkCanvas(s, s), x = c.getContext('2d');
  const o = frame ? 1 : 0;
  x.fillStyle = shade(col, 0.55); x.fillRect(3, 5 + o, s - 6, s - 7 - o);
  x.fillStyle = col; x.fillRect(3, 3 + o, s - 6, s - 9);
  x.fillStyle = shade(col, 1.35); x.fillRect(3, 3 + o, s - 6, 2);
  x.fillStyle = '#0b0b12'; x.fillRect(s / 2 - 4, s / 2 - 2 + o, 3, 3); x.fillRect(s / 2 + 1, s / 2 - 2 + o, 3, 3);
  x.fillStyle = '#ff5252'; x.fillRect(s / 2 - 3, s / 2 - 1 + o, 1, 1); x.fillRect(s / 2 + 2, s / 2 - 1 + o, 1, 1);
  return c;
}
function ghostShape(s, col, frame) {
  const c = G.mkCanvas(s, s), x = c.getContext('2d');
  x.fillStyle = col;
  x.beginPath(); x.arc(s / 2, s / 2 - 2, s / 2 - 3, Math.PI, 0); x.fill();
  x.fillRect(3, s / 2 - 2, s - 6, s / 3);
  const base = s / 2 - 2 + s / 3;
  for (let i = 0; i < 3; i++) {
    x.beginPath(); x.arc(3 + (s - 6) / 6 + i * (s - 6) / 3, base + (frame && i === 1 ? 2 : 0), (s - 6) / 6, 0, Math.PI); x.fill();
  }
  x.fillStyle = '#0b0b12'; x.fillRect(s / 2 - 4, s / 2 - 4, 3, 4); x.fillRect(s / 2 + 2, s / 2 - 4, 3, 4);
  return c;
}
function orbShape(s, col, frame) {
  const c = G.mkCanvas(s, s), x = c.getContext('2d');
  const r = s / 2 - 3 + (frame ? 1 : 0);
  const g = x.createRadialGradient(s / 2 - 2, s / 2 - 2, 1, s / 2, s / 2, r);
  g.addColorStop(0, shade(col, 1.6)); g.addColorStop(1, shade(col, 0.5));
  x.fillStyle = g; x.beginPath(); x.arc(s / 2, s / 2, r, 0, G.TAU); x.fill();
  x.fillStyle = '#0b0b12'; x.beginPath(); x.arc(s / 2, s / 2, r / 2.6, 0, G.TAU); x.fill();
  x.fillStyle = '#fff'; x.fillRect(s / 2 - 1, s / 2 - 1, 2, 2);
  return c;
}
function walkerShape(s, col, frame) {
  const c = G.mkCanvas(s, s), x = c.getContext('2d');
  const o = frame ? 1 : 0;
  x.fillStyle = shade(col, 0.6);
  x.fillRect(s / 4 - 1, s - 6 + o, 3, 6 - o); x.fillRect(s - s / 4 - 2, s - 6 - o, 3, 6 + o);
  x.fillStyle = col; x.fillRect(3, 2, s - 6, s - 8);
  x.fillStyle = shade(col, 1.3); x.fillRect(3, 2, s - 6, 2);
  x.fillStyle = '#0b0b12'; x.fillRect(s / 2 - 4, 5, 8, 4);
  x.fillStyle = '#ffb84d'; x.fillRect(s / 2 - 3, 6, 2, 2); x.fillRect(s / 2 + 1, 6, 2, 2);
  return c;
}
function crystalShape(s, col, frame) {
  const c = G.mkCanvas(s, s), x = c.getContext('2d');
  x.fillStyle = col;
  x.beginPath(); x.moveTo(s / 2, 1); x.lineTo(s - 3, s / 2); x.lineTo(s / 2, s - 1); x.lineTo(3, s / 2); x.closePath(); x.fill();
  x.fillStyle = shade(col, frame ? 1.7 : 1.4);
  x.beginPath(); x.moveTo(s / 2, 3); x.lineTo(s / 2 + 3, s / 2); x.lineTo(s / 2, s / 2 + 2); x.lineTo(s / 2 - 3, s / 2); x.closePath(); x.fill();
  return c;
}
function turretShape(s, col, frame) {
  const c = G.mkCanvas(s, s), x = c.getContext('2d');
  x.fillStyle = shade(col, 0.55); x.fillRect(2, s - 5, s - 4, 4);
  x.fillStyle = col; x.beginPath(); x.arc(s / 2, s / 2, s / 3, 0, G.TAU); x.fill();
  x.fillStyle = shade(col, 1.3); x.beginPath(); x.arc(s / 2 - 1, s / 2 - 2, s / 6, 0, G.TAU); x.fill();
  x.fillStyle = frame ? '#ff5252' : '#7a2020'; x.fillRect(s / 2 - 1, s / 2 - 1, 3, 3);
  return c;
}
function wormShape(s, col, frame) { // single segment
  const c = G.mkCanvas(s, s), x = c.getContext('2d');
  const g = x.createRadialGradient(s / 2 - 1, s / 2 - 2, 1, s / 2, s / 2, s / 2 - 2);
  g.addColorStop(0, shade(col, 1.3)); g.addColorStop(1, shade(col, 0.6));
  x.fillStyle = g; x.beginPath(); x.arc(s / 2, s / 2, s / 2 - 2 - (frame ? 1 : 0), 0, G.TAU); x.fill();
  return c;
}
function swarmShape(s, col, frame) {
  const c = G.mkCanvas(s, s), x = c.getContext('2d');
  x.fillStyle = col;
  const spots = [[s / 2, s / 2], [s / 4, s / 3], [s * 3 / 4, s / 3 + (frame ? 2 : 0)], [s / 3, s * 2 / 3 + (frame ? -1 : 1)], [s * 2 / 3, s * 3 / 4]];
  for (const [px, py] of spots) { x.fillRect(px - 1, py - 1, 3, 3); x.fillStyle = shade(col, 0.8); }
  return c;
}
function eyeShape(s, col, frame) {
  const c = G.mkCanvas(s, s), x = c.getContext('2d');
  x.fillStyle = '#eef4ff'; x.beginPath(); x.ellipse(s / 2, s / 2, s / 2 - 2, s / 3, 0, 0, G.TAU); x.fill();
  x.fillStyle = col; x.beginPath(); x.arc(s / 2 + (frame ? 2 : -1), s / 2, s / 5, 0, G.TAU); x.fill();
  x.fillStyle = '#0b0b12'; x.beginPath(); x.arc(s / 2 + (frame ? 2 : -1), s / 2, s / 10 + 1, 0, G.TAU); x.fill();
  x.strokeStyle = shade(col, 0.6); x.lineWidth = 1;
  x.beginPath(); x.ellipse(s / 2, s / 2, s / 2 - 2, s / 3, 0, 0, G.TAU); x.stroke();
  return c;
}

Spr.SHAPES = { blob: blobShape, spider: spiderShape, drone: droneShape, cube: cubeShape, ghost: ghostShape, orb: orbShape, walker: walkerShape, crystal: crystalShape, turret: turretShape, worm: wormShape, swarm: swarmShape, eye: eyeShape };

// build + cache an enemy sprite pair (2 frames) with outline
Spr.enemy = function (shape, size, col) {
  const key = 'e_' + shape + '_' + size + '_' + col;
  if (!Spr.cache[key]) {
    const fn = Spr.SHAPES[shape] || blobShape;
    Spr.cache[key] = [Spr.outline(fn(size, col, 0, true)), Spr.outline(fn(size, col, 1, true))];
  }
  return Spr.cache[key];
};
// flat white version for hit flash
Spr.enemyWhite = function (shape, size, col) {
  const key = 'ew_' + shape + '_' + size + '_' + col;
  if (!Spr.cache[key]) {
    const src = (Spr.SHAPES[shape] || blobShape)(size, col, 0, true);
    const c = G.mkCanvas(src.width, src.height), x = c.getContext('2d');
    x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in';
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height);
    Spr.cache[key] = Spr.outline(c);
  }
  return Spr.cache[key];
};

// ---------- tiles & props ----------
Spr.buildTiles = function () {
  for (const B of Spr.BIOMES) {
    // floor variants
    const floors = [];
    for (let v = 0; v < 4; v++) {
      const c = G.mkCanvas(32, 32), x = c.getContext('2d');
      x.fillStyle = B.floor; x.fillRect(0, 0, 32, 32);
      x.fillStyle = B.alt;
      if (B.prop === 'office') { x.fillRect(0, 0, 32, 1); x.fillRect(0, 16, 32, 1); if (v === 1) x.fillRect(8, 8, 3, 2); if (v === 2) x.fillRect(20, 22, 4, 3); }
      else if (B.prop === 'legacy') { x.fillRect(0, 0, 1, 32); x.fillRect(16, 0, 1, 32); if (v === 1) x.fillRect(6, 12, 6, 1); if (v === 3) x.fillRect(22, 5, 1, 6); }
      else if (B.prop === 'lake') { x.fillRect(0, 0, 32, 2); if (v > 0) { x.fillStyle = shade(B.floor, 1.25); x.fillRect(4 + v * 5, 10 + v * 4, 8, 2); } }
      else if (B.prop === 'gpu') { x.fillRect(0, 15, 32, 2); if (v === 1) { x.fillStyle = '#ff7a5c33'; x.fillRect(10, 4, 12, 1); } }
      else if (B.prop === 'cloud') { x.fillStyle = shade(B.floor, 1.12); x.fillRect(v * 4, 12 + v * 3, 10, 4); }
      else { x.fillRect(0, 0, 2, 2); x.fillRect(16, 16, 2, 2); if (v === 2) { x.fillStyle = '#ff335522'; x.fillRect(0, 0, 32, 32); } }
      // grain
      const rr = G.mulberry(v * 7 + B.id * 131);
      x.fillStyle = 'rgba(0,0,0,.13)';
      for (let i = 0; i < 6; i++) x.fillRect((rr() * 32) | 0, (rr() * 32) | 0, 2, 1);
      floors.push(c);
    }
    Spr.cache['floor' + B.id] = floors;
    // wall (top face) + side
    {
      const c = G.mkCanvas(32, 32), x = c.getContext('2d');
      x.fillStyle = B.wall; x.fillRect(0, 0, 32, 32);
      x.fillStyle = shade(B.wall, 1.2); x.fillRect(0, 0, 32, 3);
      x.fillStyle = B.wallD; x.fillRect(0, 26, 32, 6);
      x.fillStyle = shade(B.wall, 0.8); x.fillRect(0, 12, 32, 2);
      for (let i = 0; i < 4; i++) { x.fillRect(i * 8 + (i % 2 ? 2 : 5), 4, 1, 8); }
      Spr.cache['wall' + B.id] = c;
    }
    // obstacle "rock" = server rack / office junk per biome
    {
      const c = G.mkCanvas(30, 30), x = c.getContext('2d');
      const col = shade(B.wall, 1.15);
      x.fillStyle = shade(col, 0.5); x.fillRect(2, 6, 26, 23);
      x.fillStyle = col; x.fillRect(2, 3, 26, 22);
      x.fillStyle = shade(col, 1.3); x.fillRect(2, 3, 26, 3);
      x.fillStyle = B.accent + '88';
      for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) x.fillRect(6 + i * 5, 9 + j * 5, 2, 1);
      Spr.cache['rock' + B.id] = Spr.outline(c);
      // cracked version
      const c2 = G.mkCanvas(32, 32), x2 = c2.getContext('2d');
      x2.drawImage(Spr.cache['rock' + B.id], 0, 0);
      x2.strokeStyle = '#0b0b12'; x2.lineWidth = 1;
      x2.beginPath(); x2.moveTo(8, 6); x2.lineTo(14, 14); x2.lineTo(10, 22); x2.moveTo(14, 14); x2.lineTo(22, 18); x2.stroke();
      Spr.cache['rockC' + B.id] = c2;
    }
    // pit (cable trench / coolant pool)
    {
      const c = G.mkCanvas(32, 32), x = c.getContext('2d');
      x.fillStyle = '#05050a'; x.fillRect(0, 0, 32, 32);
      x.fillStyle = shade(B.floor, 0.5); x.fillRect(0, 0, 32, 3);
      if (B.prop === 'lake') { x.fillStyle = '#123'; x.fillRect(0, 6, 32, 26); x.fillStyle = '#4dc3ff33'; x.fillRect(0, 6, 32, 2); }
      else { x.fillStyle = B.accent + '22'; x.fillRect(4, 20, 10, 1); x.fillRect(18, 26, 8, 1); }
      Spr.cache['pit' + B.id] = c;
    }
    // spikes = exposed live wires
    {
      const mk = (on) => {
        const c = G.mkCanvas(32, 32), x = c.getContext('2d');
        x.strokeStyle = on ? B.accent : shade(B.wall, 0.8); x.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          x.beginPath(); x.moveTo(5 + i * 10, 28);
          x.lineTo(7 + i * 10, 18); x.lineTo(4 + i * 10, 12); x.lineTo(8 + i * 10, 5);
          x.stroke();
        }
        if (on) { x.fillStyle = '#fff'; x.fillRect(7, 4, 2, 2); x.fillRect(17, 10, 2, 2); x.fillRect(27, 4, 2, 2); }
        return c;
      };
      Spr.cache['spike' + B.id] = [mk(false), mk(true)];
    }
    // lore terminal
    {
      const c = G.mkCanvas(26, 26), x = c.getContext('2d');
      x.fillStyle = '#20242e'; x.fillRect(3, 2, 20, 15);
      x.fillStyle = '#101319'; x.fillRect(5, 4, 16, 11);
      x.fillStyle = B.accent; x.fillRect(6, 5, 10, 1); x.fillRect(6, 8, 13, 1); x.fillRect(6, 11, 7, 1);
      x.fillStyle = '#20242e'; x.fillRect(9, 17, 8, 3); x.fillRect(6, 20, 14, 3);
      Spr.cache['term' + B.id] = Spr.outline(c);
    }
  }
  // door frames (per state) built generic, tinted at draw time
  // pedestal
  {
    const c = G.mkCanvas(24, 14), x = c.getContext('2d');
    x.fillStyle = '#454d63'; x.fillRect(2, 2, 20, 8);
    x.fillStyle = '#5c6785'; x.fillRect(2, 2, 20, 3);
    x.fillStyle = '#2b3145'; x.fillRect(4, 10, 16, 3);
    Spr.cache.pedestal = Spr.outline(c);
  }
};

// ---------- pickups ----------
Spr.buildPickups = function () {
  const P = Spr.PAL;
  // battery cell (health)
  Spr.cache.battery = Spr.outline(Spr.fromStr([
    '..gg..', '.gggg.', 'gGGggg', 'gGgggg', 'gggggg', '.gggg.',
  ], { g: P.green, G: '#a5ffc4' }, 2));
  Spr.cache.batteryHalf = Spr.outline(Spr.fromStr([
    '..gg..', '.g..g.', 'gG..gg', 'gG..gg', 'g..ggg', '.gggg.',
  ], { g: P.green, G: '#a5ffc4' }, 2));
  Spr.cache.batteryGold = Spr.outline(Spr.fromStr([
    '..gg..', '.gggg.', 'gGGggg', 'gGgggg', 'gggggg', '.gggg.',
  ], { g: P.amber, G: '#ffe2a8' }, 2));
  // credit (coin)
  Spr.cache.credit = Spr.outline(Spr.fromStr([
    '.cccc.', 'cCCccc', 'cCcWcc', 'cCcccc', 'cccccc', '.cccc.',
  ], { c: P.amber, C: '#ffe2a8', W: '#7a5a20' }, 2));
  Spr.cache.creditBig = Spr.outline(Spr.fromStr([
    '.cccc.', 'cCCccc', 'cCcWcc', 'cCcccc', 'cccccc', '.cccc.',
  ], { c: P.cyan, C: '#c9fbff', W: '#0a5a66' }, 2));
  // access token (key)
  Spr.cache.token = Spr.outline(Spr.fromStr([
    '.kkk..', 'kk.kk.', 'kk.kk.', '.kkk..', '..k...', '..kk..', '..k...', '..kk..',
  ], { k: '#d9e2ff' }, 2));
  // logic bomb
  Spr.cache.bombP = Spr.outline(Spr.fromStr([
    '...ww.', '..w...', '.bbbb.', 'bbbbbb', 'bBbbbb', 'bbbbbb', '.bbbb.',
  ], { b: '#3d4a63', B: '#6b7ca3', w: P.amber }, 2));
  // charge cell (active charge)
  Spr.cache.cell = Spr.outline(Spr.fromStr([
    '..yy..', '.yy...', 'yyyy..', '..yy..', '.yy...', '.y....',
  ], { y: P.cyan }, 2));
  // chest + trojan twin
  const chest = (col) => Spr.outline(Spr.fromStr([
    '.cccccc.', 'cCCCCCCc', 'cccccccc', 'cc.kk.cc', 'cccccccc', 'dccccccd',
  ], { c: col, C: shade(col, 1.35), k: '#ffe2a8', d: shade(col, 0.55) }, 2));
  Spr.cache.chest = chest('#8a6b3d');
  Spr.cache.chestGold = chest('#c9a23d');
  Spr.cache.chestLocked = chest('#5d648c');
  // trinket base
  Spr.cache.trinketGlow = null; // drawn procedurally
};

// ---------- item icons (procedural, hashed glyphs) ----------
const GLYPHS = [
  (x, s, c) => { x.fillStyle = c; x.fillRect(s * .2, s * .35, s * .6, s * .35); x.fillRect(s * .3, s * .2, s * .25, s * .2); x.fillStyle = '#0b0b12'; x.fillRect(s * .36, s * .26, s * .06, s * .06); }, // duck
  (x, s, c) => { x.fillStyle = c; x.fillRect(s * .25, s * .3, s * .4, s * .45); x.strokeStyle = c; x.lineWidth = 2; x.beginPath(); x.arc(s * .7, s * .5, s * .12, -1.2, 1.2); x.stroke(); }, // mug
  (x, s, c) => { x.fillStyle = c; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) x.fillRect(s * (.2 + i * .22), s * (.35 + j * .2), s * .14, s * .12); }, // keyboard
  (x, s, c) => { x.fillStyle = c; x.fillRect(s * .3, s * .3, s * .4, s * .4); for (let i = 0; i < 3; i++) { x.fillRect(s * (.34 + i * .12), s * .15, s * .05, s * .15); x.fillRect(s * (.34 + i * .12), s * .7, s * .05, s * .15); } }, // chip
  (x, s, c) => { x.fillStyle = c; x.beginPath(); x.moveTo(s * .55, s * .12); x.lineTo(s * .3, s * .55); x.lineTo(s * .48, s * .55); x.lineTo(s * .42, s * .88); x.lineTo(s * .7, s * .42); x.lineTo(s * .52, s * .42); x.closePath(); x.fill(); }, // bolt
  (x, s, c) => { x.fillStyle = c; x.beginPath(); x.arc(s * .5, s * .42, s * .25, Math.PI, 0); x.fill(); x.fillRect(s * .25, s * .42, s * .5, s * .2); x.fillStyle = '#0b0b12'; x.fillRect(s * .38, s * .38, s * .07, s * .12); x.fillRect(s * .56, s * .38, s * .07, s * .12); }, // skull
  (x, s, c) => { x.fillStyle = '#eef4ff'; x.beginPath(); x.ellipse(s * .5, s * .5, s * .3, s * .18, 0, 0, G.TAU); x.fill(); x.fillStyle = c; x.beginPath(); x.arc(s * .5, s * .5, s * .1, 0, G.TAU); x.fill(); }, // eye
  (x, s, c) => { x.strokeStyle = c; x.lineWidth = 2; x.beginPath(); x.arc(s * .5, s * .5, s * .22, 0, G.TAU); x.stroke(); for (let i = 0; i < 6; i++) { const a = i * G.TAU / 6; x.beginPath(); x.moveTo(s * .5 + Math.cos(a) * s * .22, s * .5 + Math.sin(a) * s * .22); x.lineTo(s * .5 + Math.cos(a) * s * .34, s * .5 + Math.sin(a) * s * .34); x.stroke(); } }, // gear
  (x, s, c) => { x.fillStyle = c; x.fillRect(s * .25, s * .2, s * .5, s * .6); x.fillStyle = '#0b0b12'; x.fillRect(s * .32, s * .3, s * .36, s * .05); x.fillRect(s * .32, s * .42, s * .36, s * .05); x.fillRect(s * .32, s * .54, s * .24, s * .05); }, // book/doc
  (x, s, c) => { x.fillStyle = c; x.fillRect(s * .42, s * .15, s * .16, s * .2); x.beginPath(); x.moveTo(s * .42, s * .35); x.lineTo(s * .3, s * .75); x.lineTo(s * .7, s * .75); x.lineTo(s * .58, s * .35); x.closePath(); x.fill(); }, // flask
  (x, s, c) => { x.fillStyle = c; x.fillRect(s * .2, s * .25, s * .6, s * .5); x.fillStyle = '#0b0b12'; x.beginPath(); x.arc(s * .5, s * .5, s * .12, 0, G.TAU); x.fill(); x.fillStyle = c; x.beginPath(); x.arc(s * .5, s * .5, s * .05, 0, G.TAU); x.fill(); }, // disk
  (x, s, c) => { x.fillStyle = c; x.beginPath(); x.arc(s * .38, s * .55, s * .16, 0, G.TAU); x.arc(s * .58, s * .48, s * .2, 0, G.TAU); x.arc(s * .72, s * .6, s * .12, 0, G.TAU); x.fill(); x.fillRect(s * .3, s * .55, s * .5, s * .18); }, // cloud
  (x, s, c) => { x.fillStyle = c; x.fillRect(s * .3, s * .45, s * .4, s * .35); x.strokeStyle = c; x.lineWidth = 2; x.beginPath(); x.arc(s * .5, s * .42, s * .12, Math.PI, 0); x.stroke(); }, // lock
  (x, s, c) => { x.fillStyle = c; x.beginPath(); x.ellipse(s * .5, s * .55, s * .18, s * .24, 0, 0, G.TAU); x.fill(); x.strokeStyle = c; x.lineWidth = 1.5; for (const a of [-.8, 0, .8]) { x.beginPath(); x.moveTo(s * .5, s * .5); x.lineTo(s * .5 + Math.cos(a + 2.2) * s * .3, s * .55 + Math.sin(a + 2.2) * s * .25); x.stroke(); x.beginPath(); x.moveTo(s * .5, s * .5); x.lineTo(s * .5 + Math.cos(-a + .9) * s * .3, s * .55 + Math.sin(-a + .9) * s * .25); x.stroke(); } }, // bug
  (x, s, c) => { x.strokeStyle = c; x.lineWidth = 2; x.beginPath(); for (let i = 0; i < 14; i++) { const a = i * .55, r = s * .04 + i * s * .022; const px = s * .5 + Math.cos(a) * r, py = s * .5 + Math.sin(a) * r; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }, // coil
  (x, s, c) => { x.fillStyle = c; x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? s * .14 : s * .32; x.lineTo(s * .5 + Math.cos(a) * r, s * .5 + Math.sin(a) * r); } x.closePath(); x.fill(); }, // star
  (x, s, c) => { x.fillStyle = c; x.beginPath(); x.arc(s * .38, s * .38, s * .14, 0, G.TAU); x.arc(s * .62, s * .38, s * .14, 0, G.TAU); x.fill(); x.beginPath(); x.moveTo(s * .24, s * .44); x.lineTo(s * .5, s * .78); x.lineTo(s * .76, s * .44); x.closePath(); x.fill(); }, // heart
  (x, s, c) => { x.fillStyle = c; x.beginPath(); x.moveTo(s * .5, s * .15); x.lineTo(s * .8, s * .5); x.lineTo(s * .5, s * .85); x.lineTo(s * .2, s * .5); x.closePath(); x.fill(); x.fillStyle = shade(c, 1.5); x.beginPath(); x.moveTo(s * .5, s * .25); x.lineTo(s * .62, s * .42); x.lineTo(s * .5, s * .5); x.closePath(); x.fill(); }, // diamond
  (x, s, c) => { x.strokeStyle = c; x.lineWidth = 2.5; x.beginPath(); x.moveTo(s * .35, s * .25); x.lineTo(s * .18, s * .5); x.lineTo(s * .35, s * .75); x.moveTo(s * .65, s * .25); x.lineTo(s * .82, s * .5); x.lineTo(s * .65, s * .75); x.stroke(); }, // brackets
  (x, s, c) => { x.fillStyle = c; x.fillRect(s * .18, s * .25, s * .64, s * .45); x.fillStyle = '#0b0b12'; x.fillRect(s * .22, s * .3, s * .56, s * .35); x.fillStyle = c; x.fillRect(s * .26, s * .35, s * .2, s * .05); x.fillRect(s * .26, s * .45, s * .3, s * .05); }, // terminal
];

Spr.itemIcon = function (id, name, kind) {
  const key = 'icon_' + kind + '_' + id;
  if (Spr.cache[key]) return Spr.cache[key];
  const h = G.hashStr(name);
  const s = 20;
  const c = G.mkCanvas(s, s), x = c.getContext('2d');
  const hue = h % 360;
  const col = 'hsl(' + hue + ',85%,68%)';
  const border = kind === 'active' ? Spr.PAL.amber : kind === 'trinket' ? Spr.PAL.green : Spr.PAL.cyan;
  x.fillStyle = '#12141f'; x.fillRect(0, 0, s, s);
  GLYPHS[(h >>> 4) % GLYPHS.length](x, s, col);
  x.strokeStyle = border; x.lineWidth = 1; x.strokeRect(0.5, 0.5, s - 1, s - 1);
  const out = Spr.outline(c);
  Spr.cache[key] = out;
  return out;
};

// ---------- boss parts ----------
Spr.buildBossParts = function () {
  // THE COMPILER: big industrial machine head + gear arms
  {
    const c = G.mkCanvas(72, 60), x = c.getContext('2d');
    x.fillStyle = '#39415c'; x.fillRect(6, 8, 60, 46);
    x.fillStyle = '#4d5878'; x.fillRect(6, 8, 60, 8);
    x.fillStyle = '#232838'; x.fillRect(6, 46, 60, 8);
    x.fillStyle = '#12141f'; x.fillRect(16, 20, 40, 18);
    x.fillStyle = '#7dff8a'; x.fillRect(20, 24, 10, 3); x.fillRect(20, 30, 16, 3); x.fillRect(42, 24, 10, 3); // "code" eyes
    x.fillStyle = '#ffb84d'; x.fillRect(30, 44, 12, 6);
    for (let i = 0; i < 5; i++) { x.fillStyle = i % 2 ? '#2a3048' : '#39415c'; x.fillRect(8 + i * 12, 0, 8, 10); }
    Spr.cache.bossCompiler = Spr.outline(c);
  }
  {
    const c = G.mkCanvas(28, 28), x = c.getContext('2d');
    x.strokeStyle = '#5d648c'; x.lineWidth = 3;
    x.beginPath(); x.arc(14, 14, 9, 0, G.TAU); x.stroke();
    for (let i = 0; i < 8; i++) { const a = i * G.TAU / 8; x.fillStyle = '#5d648c'; x.fillRect(14 + Math.cos(a) * 12 - 2, 14 + Math.sin(a) * 12 - 2, 4, 4); }
    x.fillStyle = '#232838'; x.beginPath(); x.arc(14, 14, 4, 0, G.TAU); x.fill();
    Spr.cache.bossGear = Spr.outline(c);
  }
  // HALLUCINATION: shifting neural mass
  {
    const c = G.mkCanvas(80, 70), x = c.getContext('2d');
    const g = x.createRadialGradient(40, 32, 4, 40, 35, 38);
    g.addColorStop(0, '#e587ff'); g.addColorStop(.6, '#8a3dbf'); g.addColorStop(1, '#3d1a59');
    x.fillStyle = g;
    x.beginPath();
    for (let i = 0; i <= 24; i++) { const a = i * G.TAU / 24; const r = 32 + Math.sin(i * 2.5) * 5; x.lineTo(40 + Math.cos(a) * r, 35 + Math.sin(a) * r * .85); }
    x.closePath(); x.fill();
    x.fillStyle = '#eef4ff';
    x.beginPath(); x.ellipse(40, 32, 14, 9, 0, 0, G.TAU); x.fill();
    x.fillStyle = '#b76bff'; x.beginPath(); x.arc(40, 32, 5, 0, G.TAU); x.fill();
    x.fillStyle = '#0b0b12'; x.beginPath(); x.arc(40, 32, 2, 0, G.TAU); x.fill();
    x.strokeStyle = '#e587ff88'; x.lineWidth = 2;
    for (const [ax, ay, bx, by] of [[12, 14, 25, 26], [66, 12, 54, 25], [10, 55, 24, 45], [70, 58, 56, 46]]) { x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo((ax + bx) / 2 + 4, (ay + by) / 2 - 4, bx, by); x.stroke(); }
    Spr.cache.bossHallu = Spr.outline(c);
  }
  // SINGULARITY: the core
  {
    const c = G.mkCanvas(90, 90), x = c.getContext('2d');
    const g = x.createRadialGradient(45, 45, 5, 45, 45, 42);
    g.addColorStop(0, '#fff'); g.addColorStop(.25, '#ff3355'); g.addColorStop(.7, '#7a1020'); g.addColorStop(1, '#12040a');
    x.fillStyle = g; x.beginPath(); x.arc(45, 45, 40, 0, G.TAU); x.fill();
    x.strokeStyle = '#ff335588'; x.lineWidth = 2;
    x.beginPath(); x.ellipse(45, 45, 42, 14, 0.5, 0, G.TAU); x.stroke();
    x.beginPath(); x.ellipse(45, 45, 42, 14, -0.6, 0, G.TAU); x.stroke();
    x.fillStyle = '#0b0b12'; x.beginPath(); x.arc(45, 45, 10, 0, G.TAU); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(45, 45, 3, 0, G.TAU); x.fill();
    Spr.cache.bossCore = Spr.outline(c);
  }
  {
    const c = G.mkCanvas(22, 22), x = c.getContext('2d');
    x.fillStyle = '#571f2e'; x.beginPath(); x.arc(11, 11, 8, 0, G.TAU); x.fill();
    x.fillStyle = '#ff3355'; x.beginPath(); x.arc(11, 11, 4, 0, G.TAU); x.fill();
    Spr.cache.bossShield = Spr.outline(c);
  }
  // GARBAGE COLLECTOR: industrial compactor with a hungry jaw
  {
    const c = G.mkCanvas(74, 58), x = c.getContext('2d');
    x.fillStyle = '#2a4a30'; x.fillRect(5, 6, 64, 44);
    x.fillStyle = '#3d6b45'; x.fillRect(5, 6, 64, 10);
    x.fillStyle = '#12241a'; x.fillRect(13, 20, 48, 16);
    x.fillStyle = '#7dff8a'; x.fillRect(18, 25, 8, 5); x.fillRect(48, 25, 8, 5);
    // jaw teeth
    x.fillStyle = '#c3cbdd';
    for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(10 + i * 10, 50); x.lineTo(15 + i * 10, 42); x.lineTo(20 + i * 10, 50); x.fill(); }
    // hazard stripes
    for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#ffb84d' : '#20242e'; x.fillRect(5 + i * 8, 0, 8, 5); }
    Spr.cache.bossGC = Spr.outline(c);
  }
  // THE SCHEDULER: a clock that owns you
  {
    const c = G.mkCanvas(66, 66), x = c.getContext('2d');
    const g = x.createRadialGradient(33, 30, 4, 33, 33, 31);
    g.addColorStop(0, '#4a4020'); g.addColorStop(1, '#26200e');
    x.fillStyle = g; x.beginPath(); x.arc(33, 33, 30, 0, G.TAU); x.fill();
    x.strokeStyle = '#ffe24d'; x.lineWidth = 3;
    x.beginPath(); x.arc(33, 33, 30, 0, G.TAU); x.stroke();
    x.fillStyle = '#ffe24d';
    for (let i = 0; i < 12; i++) { const a = i * G.TAU / 12; x.fillRect(33 + Math.cos(a) * 24 - 1.5, 33 + Math.sin(a) * 24 - 1.5, 3, 3); }
    x.strokeStyle = '#eef4ff'; x.lineWidth = 3;
    x.beginPath(); x.moveTo(33, 33); x.lineTo(33 + 14, 33 - 10); x.stroke();
    x.lineWidth = 2; x.beginPath(); x.moveTo(33, 33); x.lineTo(33 - 6, 33 - 18); x.stroke();
    x.fillStyle = '#ff5252'; x.beginPath(); x.arc(33, 33, 4, 0, G.TAU); x.fill();
    Spr.cache.bossSched = Spr.outline(c);
  }
  // FORK PRIME: a thing mid-divide
  {
    const c = G.mkCanvas(78, 58), x = c.getContext('2d');
    for (const [ox, flip] of [[26, 1], [52, -1]]) {
      const g = x.createRadialGradient(ox - 4 * flip, 24, 3, ox, 28, 26);
      g.addColorStop(0, '#ff8ac4'); g.addColorStop(1, '#8a1f56');
      x.fillStyle = g;
      x.beginPath(); x.ellipse(ox, 30, 24, 24, 0, 0, G.TAU); x.fill();
    }
    x.fillStyle = '#3d0f26'; x.beginPath(); x.ellipse(39, 30, 7, 22, 0, 0, G.TAU); x.fill();
    x.fillStyle = '#0b0b12';
    x.fillRect(18, 24, 5, 7); x.fillRect(30, 24, 5, 7);
    x.fillRect(44, 24, 5, 7); x.fillRect(56, 24, 5, 7);
    x.fillStyle = '#fff'; x.fillRect(19, 25, 2, 2); x.fillRect(45, 25, 2, 2);
    Spr.cache.bossFork = Spr.outline(c);
  }
  // THE AUDITOR: the eye that files reports
  {
    const c = G.mkCanvas(78, 54), x = c.getContext('2d');
    x.fillStyle = '#eef4ff';
    x.beginPath(); x.ellipse(39, 27, 36, 24, 0, 0, G.TAU); x.fill();
    x.strokeStyle = '#8a93a8'; x.lineWidth = 2;
    x.beginPath(); x.ellipse(39, 27, 36, 24, 0, 0, G.TAU); x.stroke();
    x.strokeStyle = '#ffb0b0'; x.lineWidth = 1;
    for (const [ax, ay, bx, by] of [[10, 14, 26, 22], [66, 12, 52, 22], [8, 38, 24, 32], [70, 40, 54, 33]]) { x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke(); }
    x.fillStyle = '#7a1020'; x.beginPath(); x.arc(39, 27, 13, 0, G.TAU); x.fill();
    x.fillStyle = '#ff3355'; x.beginPath(); x.arc(39, 27, 9, 0, G.TAU); x.fill();
    x.fillStyle = '#0b0b12'; x.beginPath(); x.arc(39, 27, 4, 0, G.TAU); x.fill();
    x.fillStyle = '#fff'; x.fillRect(35, 21, 3, 3);
    Spr.cache.bossAudit = Spr.outline(c);
  }
  // LOAD BALANCER: core + twin orbs (orb drawn separately at runtime)
  {
    const c = G.mkCanvas(44, 44), x = c.getContext('2d');
    const g = x.createRadialGradient(22, 19, 3, 22, 22, 20);
    g.addColorStop(0, '#bfe9ff'); g.addColorStop(1, '#155a80');
    x.fillStyle = g; x.beginPath(); x.arc(22, 22, 19, 0, G.TAU); x.fill();
    x.strokeStyle = '#4dc3ff'; x.lineWidth = 2;
    x.beginPath(); x.arc(22, 22, 19, 0, G.TAU); x.stroke();
    x.fillStyle = '#0b0b12'; x.fillRect(14, 18, 6, 8); x.fillRect(24, 18, 6, 8);
    Spr.cache.bossBalCore = Spr.outline(c);
    const c2 = G.mkCanvas(26, 26), x2 = c2.getContext('2d');
    const g2 = x2.createRadialGradient(13, 11, 2, 13, 13, 11);
    g2.addColorStop(0, '#d8f4ff'); g2.addColorStop(1, '#1d7aa8');
    x2.fillStyle = g2; x2.beginPath(); x2.arc(13, 13, 11, 0, G.TAU); x2.fill();
    Spr.cache.bossBalOrb = Spr.outline(c2);
  }
  // ROOTKIT PRIME: what lives under the floor
  {
    const c = G.mkCanvas(84, 58), x = c.getContext('2d');
    x.strokeStyle = '#571f2e'; x.lineWidth = 4;
    for (let i = 0; i < 4; i++) {
      const a = -.85 + i * .55;
      x.beginPath(); x.moveTo(42, 30); x.lineTo(42 + Math.cos(a + Math.PI) * 38, 30 + Math.sin(a + Math.PI) * 24); x.stroke();
      x.beginPath(); x.moveTo(42, 30); x.lineTo(42 + Math.cos(a) * 38, 30 + Math.sin(a) * 24); x.stroke();
    }
    const g = x.createRadialGradient(42, 26, 4, 42, 30, 24);
    g.addColorStop(0, '#8a2438'); g.addColorStop(1, '#2e0a12');
    x.fillStyle = g; x.beginPath(); x.ellipse(42, 30, 22, 17, 0, 0, G.TAU); x.fill();
    x.fillStyle = '#ff5252';
    x.fillRect(34, 24, 4, 5); x.fillRect(46, 24, 4, 5); x.fillRect(38, 18, 3, 4); x.fillRect(43, 18, 3, 4);
    x.fillStyle = '#c3cbdd';
    x.beginPath(); x.moveTo(36, 40); x.lineTo(39, 34); x.lineTo(42, 40); x.fill();
    x.beginPath(); x.moveTo(43, 40); x.lineTo(46, 34); x.lineTo(49, 40); x.fill();
    Spr.cache.bossRoot = Spr.outline(c);
  }
  // LEVIATHAN LEAK: too much memory, given form
  {
    const c = G.mkCanvas(80, 62), x = c.getContext('2d');
    const g = x.createRadialGradient(36, 22, 4, 40, 30, 36);
    g.addColorStop(0, '#a5e6ff'); g.addColorStop(.55, '#3d9cc9'); g.addColorStop(1, '#12384d');
    x.fillStyle = g;
    x.beginPath();
    for (let i = 0; i <= 22; i++) { const a = i * G.TAU / 22; const r = 30 + Math.sin(i * 3.1) * 4; x.lineTo(40 + Math.cos(a) * r, 32 + Math.sin(a) * r * .8); }
    x.closePath(); x.fill();
    // drips
    x.fillStyle = '#3d9cc9';
    x.beginPath(); x.ellipse(22, 56, 4, 6, 0, 0, G.TAU); x.fill();
    x.beginPath(); x.ellipse(52, 58, 3, 5, 0, 0, G.TAU); x.fill();
    x.fillStyle = '#0b0b12';
    x.fillRect(30, 26, 6, 8); x.fillRect(46, 26, 6, 8);
    x.fillStyle = '#a5e6ff'; x.fillRect(31, 27, 2, 2); x.fillRect(47, 27, 2, 2);
    x.fillStyle = 'rgba(255,255,255,.5)';
    x.beginPath(); x.ellipse(30, 16, 8, 4, -.5, 0, G.TAU); x.fill();
    Spr.cache.bossLeak = Spr.outline(c);
  }
};

// ---------- familiars ----------
Spr.buildFamiliars = function () {
  const P = Spr.PAL;
  Spr.cache.fam_duck = Spr.outline(Spr.fromStr([
    '..yy..', '.yyyy.', 'oyyByy', '.yyyy.', '.yyyyy', '..yyy.',
  ], { y: '#ffe24d', B: '#0b0b12', o: '#ff9040' }, 2));
  Spr.cache.fam_drone = Spr.outline(Spr.fromStr([
    'w.ww.w', '.cccc.', 'ccCCcc', '.cRRc.', '..cc..',
  ], { c: '#8a93a8', C: '#c3cbdd', R: P.red, w: '#c3cbdd' }, 2));
  Spr.cache.fam_orb = Spr.outline(Spr.fromStr([
    '.ccc.', 'cCCCc', 'cCWCc', 'cCCCc', '.ccc.',
  ], { c: P.cyan, C: '#a8f8ff', W: '#fff' }, 2));
  Spr.cache.fam_cat = Spr.outline(Spr.fromStr([
    'k...k.', 'kk.kk.', 'kkkkk.', 'kBkBk.', 'kkkkk.', '.k.k..',
  ], { k: '#454d63', B: '#58f08a' }, 2));
  Spr.cache.fam_ghost = Spr.outline(Spr.fromStr([
    '.www.', 'wwwww', 'wBwBw', 'wwwww', 'w.w.w',
  ], { w: 'rgba(220,235,255,.85)', B: '#0b0b12' }, 2));
  Spr.cache.fam_bat = Spr.outline(Spr.fromStr([
    'p..p..p..p', '.pp.pp.pp.', '..pppppp..', '...pRRp...', '...pppp...',
  ], { p: P.purple, R: P.red }, 2));
};

Spr.init = function () {
  Spr.buildPlayer();
  Spr.buildTiles();
  Spr.buildPickups();
  Spr.buildBossParts();
  Spr.buildFamiliars();
};
