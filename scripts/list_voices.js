#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const qwenDataDir = process.env.LOCAL_QWEN_DATA_DIR || path.join(process.env.USERPROFILE || process.env.HOME || '.', 'tts');
const qwenVoicesPath = path.join(qwenDataDir, 'voices.json');
const kokoroProfilesPath = path.join(__dirname, '..', 'data', 'voice-profiles.json');

let qwen = [];
try {
  const j = JSON.parse(fs.readFileSync(qwenVoicesPath, 'utf8'));
  if (Array.isArray(j.voices)) qwen = j.voices.map(v => v.name).filter(Boolean);
} catch {}

let kokoro = [];
try {
  const j = JSON.parse(fs.readFileSync(kokoroProfilesPath, 'utf8'));
  kokoro = Array.from(new Set([j.default, ...Object.values(j.byLanguage || {})].filter(Boolean)));
} catch {}

console.log(JSON.stringify({ ok: true, kokoro, qwen3: qwen.sort() }, null, 2));

