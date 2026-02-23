#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const prefsPath = process.env.LOCAL_VOICE_PREFS_PATH || path.join(__dirname, '..', 'references', 'voice-preferences.json');

function readPrefs() {
  try { return JSON.parse(fs.readFileSync(prefsPath, 'utf8')); }
  catch { return { default: { voice: null, backend: 'kokoro' }, users: {} }; }
}
function writePrefs(p) { fs.writeFileSync(prefsPath, JSON.stringify(p, null, 2), 'utf8'); }
function arg(name, dflt = undefined) { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : dflt; }

const cmd = process.argv[2];
const user = arg('user');
const voice = arg('voice');
const backend = arg('backend');

const prefs = readPrefs();
prefs.users = prefs.users || {};

if (cmd === 'get') {
  const out = user ? (prefs.users[user] || null) : prefs.default;
  console.log(JSON.stringify({ ok: true, user: user || null, preference: out }, null, 2));
  process.exit(0);
}

if (cmd === 'set') {
  if (!voice && !backend) {
    console.error('set requires --voice and/or --backend');
    process.exit(1);
  }
  if (user) {
    const cur = prefs.users[user] || {};
    prefs.users[user] = { ...cur, ...(voice ? { voice } : {}), ...(backend ? { backend } : {}) };
  } else {
    prefs.default = { ...prefs.default, ...(voice ? { voice } : {}), ...(backend ? { backend } : {}) };
  }
  writePrefs(prefs);
  console.log(JSON.stringify({ ok: true, user: user || null }, null, 2));
  process.exit(0);
}

if (cmd === 'list') {
  console.log(JSON.stringify({ ok: true, path: prefsPath, preferences: prefs }, null, 2));
  process.exit(0);
}

console.error('Usage: voice_preferences.js <get|set|list> [--user <id>] [--voice <name>] [--backend <kokoro|qwen3>]');
process.exit(1);
