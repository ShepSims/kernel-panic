'use strict';
// node tests/run.js — runs each suite in its own process
const { execFileSync } = require('child_process');
const path = require('path');
let ok = true;
for (const suite of ['smoke', 'skin', 'netmods']) {
  try {
    const out = execFileSync(process.execPath, [path.join(__dirname, suite + '.js')], { encoding: 'utf8' });
    console.log('--- ' + suite + ' ---\n' + out.trim());
  } catch (e) {
    console.log('--- ' + suite + ' FAILED ---\n' + (e.stdout || '') + (e.stderr || ''));
    ok = false;
  }
}
process.exit(ok ? 0 : 1);
