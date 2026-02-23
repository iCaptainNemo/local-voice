const path = require('path');

function pickPython() { return process.env.LOCAL_TTS_PYTHON || 'python'; }
function pickQwenCmd() { return process.env.LOCAL_QWEN_TTS_CMD || 'tts'; }
function pickSoxDir() { return process.env.LOCAL_SOX_DIR || 'C:/Users/Michaelangelo/AppData/Local/Microsoft/WinGet/Packages/ChrisBagwell.SoX_Microsoft.Winget.Source_8wekyb3d8bbwe/sox-14.4.2'; }
function pickFfmpeg() { return process.env.LOCAL_TTS_FFMPEG || 'ffmpeg'; }

function normalizeToQwenLang(raw) {
  if (!raw) return null;
  const v = String(raw).trim().replace('_', '-').toLowerCase();
  if (v.startsWith('es')) return 'es';
  if (v.startsWith('en')) return 'en';
  return null;
}

function preflightKokoro({ run, exists }) {
  const issues = [];
  const python = pickPython();
  const model = process.env.LOCAL_TTS_KOKORO_MODEL || 'C:/Users/Michaelangelo/voice/tts-kokoro/kokoro-v1.0.onnx';
  const voices = process.env.LOCAL_TTS_KOKORO_VOICES || 'C:/Users/Michaelangelo/voice/tts-kokoro/voices-v1.0.bin';
  const ffmpeg = pickFfmpeg();
  try { run(python, ['--version'], { quiet: true }); } catch { issues.push(`python not runnable: ${python}`); }
  try { run(ffmpeg, ['-version'], { quiet: true }); } catch { issues.push(`ffmpeg not runnable: ${ffmpeg}`); }
  if (!exists(model)) issues.push(`missing kokoro model: ${model}`);
  if (!exists(voices)) issues.push(`missing kokoro voices: ${voices}`);
  if (issues.length) throw new Error(`kokoro preflight failed:\n- ${issues.join('\n- ')}`);
}

function preflightQwen({ run, exists }) {
  const issues = [];
  const qwen = pickQwenCmd();
  const ffmpeg = pickFfmpeg();
  const soxDir = pickSoxDir();
  const env = { ...process.env, PATH: `${soxDir};${process.env.PATH || ''}` };
  try { run(qwen, ['--version'], { quiet: true, env }); } catch { issues.push(`qwen tts command not runnable: ${qwen}`); }
  try { run(ffmpeg, ['-version'], { quiet: true }); } catch { issues.push(`ffmpeg not runnable: ${ffmpeg}`); }
  if (!exists(path.join(soxDir, 'sox.exe'))) issues.push(`sox not found in expected dir: ${soxDir}`);
  if (issues.length) throw new Error(`qwen preflight failed:\n- ${issues.join('\n- ')}`);
}

function synthKokoro({ text, wav, voice, lang, run }) {
  const python = pickPython();
  const model = process.env.LOCAL_TTS_KOKORO_MODEL || 'C:/Users/Michaelangelo/voice/tts-kokoro/kokoro-v1.0.onnx';
  const voices = process.env.LOCAL_TTS_KOKORO_VOICES || 'C:/Users/Michaelangelo/voice/tts-kokoro/voices-v1.0.bin';
  run(python, [
    path.join(__dirname, '..', '..', 'scripts', 'synthesize_kokoro.py'),
    '--text', text,
    '--out', wav,
    '--voice', voice,
    '--lang', lang,
    '--model', model,
    '--voices', voices,
  ]);
}

function synthQwen({ text, wav, voice, lang, run }) {
  const qwen = pickQwenCmd();
  const soxDir = pickSoxDir();
  const env = { ...process.env, PATH: `${soxDir};${process.env.PATH || ''}` };
  const qLang = normalizeToQwenLang(lang) || 'en';
  const args = ['generate', text, '--output', wav, '--language', qLang];
  if (voice) args.push('--voice', voice);
  run(qwen, args, { env });
}

function encodeToOgg({ wav, ogg, run }) {
  run(pickFfmpeg(), ['-y', '-i', wav, '-c:a', 'libopus', '-b:a', '48k', ogg]);
}

module.exports = {
  pickFfmpeg,
  preflightKokoro,
  preflightQwen,
  synthKokoro,
  synthQwen,
  encodeToOgg,
};
