'use strict';
// ============================================================
// input: WASD move, arrows shoot, space active, e bomb, etc.
// ============================================================
G.keys = {};
G.keysHit = {};   // pressed this frame

const KEYMAP = {
  'KeyW': 'up', 'KeyA': 'left', 'KeyS': 'down', 'KeyD': 'right',
  'ArrowUp': 'shootUp', 'ArrowDown': 'shootDown', 'ArrowLeft': 'shootLeft', 'ArrowRight': 'shootRight',
  'Space': 'active', 'KeyE': 'bomb', 'KeyQ': 'dropTrinket',
  'Enter': 'confirm', 'Escape': 'pause', 'Tab': 'map',
  'KeyM': 'mute', 'KeyR': 'restart', 'KeyP': 'pause',
  'KeyN': 'name', 'KeyL': 'link', 'KeyO': 'signout',
};

window.addEventListener('keydown', e => {
  const k = KEYMAP[e.code];
  if (e.code === 'Tab' || e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
  if (G.state === 'textentry') { G.textKey(e); return; }
  if (k) { if (!G.keys[k]) G.keysHit[k] = true; G.keys[k] = true; }
});
window.addEventListener('keyup', e => {
  const k = KEYMAP[e.code];
  if (k) G.keys[k] = false;
});
window.addEventListener('blur', () => { for (const k in G.keys) G.keys[k] = false; });

G.hit = k => !!G.keysHit[k];
G.held = k => !!G.keys[k];
G.clearHits = () => { G.keysHit = {}; };

// move vector from WASD
G.moveVec = function () {
  let x = 0, y = 0;
  if (G.keys.left) x -= 1; if (G.keys.right) x += 1;
  if (G.keys.up) y -= 1; if (G.keys.down) y += 1;
  if (x && y) { x *= 0.7071; y *= 0.7071; }
  return [x, y];
};
// shoot dir from arrows: returns angle or null
G.shootDir = function () {
  let x = 0, y = 0;
  if (G.keys.shootLeft) x -= 1; if (G.keys.shootRight) x += 1;
  if (G.keys.shootUp) y -= 1; if (G.keys.shootDown) y += 1;
  if (!x && !y) return null;
  return Math.atan2(y, x);
};
