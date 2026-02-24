#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const dataDir = process.env.LOCAL_QWEN_DATA_DIR || path.join(process.env.USERPROFILE || process.env.HOME || '.', 'tts');
const voicesPath = path.join(dataDir, 'voices.json');
const statePath = path.join(__dirname, '..', 'data', 'voices-state.json');

function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
}

function extractVoiceNames(voicesJson) {
  if (!voicesJson || typeof voicesJson !== 'object') return [];
  if (Array.isArray(voicesJson.voices)) {
    return voicesJson.voices
      .map(v => (v && typeof v.name === 'string' ? v.name : null))
      .filter(Boolean)
      .sort();
  }
  if (voicesJson.voices && typeof voicesJson.voices === 'object') {
    return Object.keys(voicesJson.voices).sort();
  }
  return [];
}

(function main() {
  if (!fs.existsSync(voicesPath)) {
    console.log(JSON.stringify({ ok: false, reason: 'voices.json not found', voicesPath }, null, 2));
    process.exit(1);
  }

  const voicesJson = readJson(voicesPath, {});
  const current = extractVoiceNames(voicesJson);

  const prevState = readJson(statePath, { voices: [] });
  const prev = Array.isArray(prevState.voices) ? prevState.voices : [];

  const added = current.filter(v => !prev.includes(v));
  const removed = prev.filter(v => !current.includes(v));

  writeJson(statePath, { updatedAt: new Date().toISOString(), voices: current, dataDir, voicesPath });

  console.log(JSON.stringify({ ok: true, dataDir, voicesPath, total: current.length, added, removed, voices: current }, null, 2));
})();

