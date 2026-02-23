const path = require('path');

function extractTranscript(rawStdout = '') {
  const raw = String(rawStdout || '').trim();
  const lines = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const text = lines.find((l) => !l.startsWith('[lang=')) || '';
  const metaLine = lines.find((l) => l.startsWith('[lang='));
  let language = null;
  let probability = null;
  if (metaLine) {
    const m = metaLine.match(/\[lang=([^\s\]]+)\s+prob=([^\]\s]+)\]/i);
    if (m) {
      language = m[1];
      const p = Number(m[2]);
      probability = Number.isFinite(p) ? p : null;
    }
  }
  return { text, language, probability, raw };
}

function transcribeWithFasterWhisper({ inputPath, run, scriptPath, pythonCmd }) {
  const py = pythonCmd || process.env.LOCAL_STT_PYTHON || 'python';
  const script = scriptPath || path.join(__dirname, '..', '..', 'scripts', 'transcribe_faster_whisper.py');
  const result = run(py, [script, '--input', inputPath], { quiet: true });
  const parsed = extractTranscript(result.stdout || '');
  return parsed;
}

module.exports = {
  extractTranscript,
  transcribeWithFasterWhisper,
};
