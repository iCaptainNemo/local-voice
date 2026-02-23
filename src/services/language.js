const os = require('os');

function normalizeToKokoroLang(raw) {
  if (!raw) return null;
  const v = String(raw).trim().replace('_', '-').toLowerCase();
  if (v.startsWith('es')) return 'es';
  if (v.startsWith('en')) return 'en-us';
  return null;
}

function readOpenClawLocaleHint(readConfig) {
  try {
    const cfg = readConfig();
    return cfg?.messages?.tts?.edge?.lang || cfg?.messages?.tts?.elevenlabs?.languageCode || null;
  } catch {
    return null;
  }
}

function detectOsLocale(run) {
  try {
    if (process.platform === 'win32') {
      const r = run('powershell', ['-NoProfile', '-Command', '[System.Globalization.CultureInfo]::CurrentUICulture.Name'], { quiet: true });
      if (r.stdout?.trim()) return r.stdout.trim();
    }
    if (process.platform === 'darwin') {
      const r = run('defaults', ['read', '-g', 'AppleLocale'], { quiet: true });
      if (r.stdout?.trim()) return r.stdout.trim();
    }
    return process.env.LC_ALL || process.env.LANG || Intl.DateTimeFormat().resolvedOptions().locale || os.locale?.() || null;
  } catch {
    return process.env.LC_ALL || process.env.LANG || null;
  }
}

function resolveLang({ explicitLang, readConfig, run }) {
  const candidates = [
    explicitLang,
    process.env.LOCAL_TTS_LANG,
    readOpenClawLocaleHint(readConfig),
    process.env.OPENCLAW_LOCALE,
    detectOsLocale(run),
    'en-us',
  ];
  for (const c of candidates) {
    const n = normalizeToKokoroLang(c);
    if (n) return n;
  }
  return 'en-us';
}

module.exports = { normalizeToKokoroLang, resolveLang };
