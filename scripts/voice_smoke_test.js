#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'pipe', encoding: 'utf8' });
  return { ok: r.status === 0, code: r.status, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}

const scriptDir = __dirname;
const speak = path.join(scriptDir, 'speak.js');
const stt = path.join(scriptDir, 'transcribe_faster_whisper.py');
const sample = process.argv[2] || path.join(process.env.USERPROFILE || process.env.HOME || '.', '.openclaw', 'workspace', '_tts-out', 'tts-20260223045759.ogg');

const tts = run('node', [speak, '--text', 'Local voice smoke test.', '--lang', 'en-us']);
const py = process.env.LOCAL_STT_PYTHON || 'python';
const sttRun = run(py, [stt, '--input', sample]);

console.log(JSON.stringify({
  ok: tts.ok && sttRun.ok,
  tts,
  stt: sttRun
}, null, 2));

process.exit(tts.ok && sttRun.ok ? 0 : 1);
