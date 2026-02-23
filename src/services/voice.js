const fs = require('fs');
const path = require('path');

function loadVoiceProfiles({ exists }) {
  const p = path.join(__dirname, '..', '..', 'references', 'voice-profiles.json');
  if (!exists(p)) return { default: 'af_sarah', byLanguage: { 'en-us': 'af_sarah', es: 'ef_dora' } };
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadVoicePrefs({ exists }) {
  const p = process.env.LOCAL_VOICE_PREFS_PATH || path.join(__dirname, '..', '..', 'references', 'voice-preferences.json');
  if (!exists(p)) return { default: { voice: null, backend: 'kokoro' }, users: {} };
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return { default: { voice: null, backend: 'kokoro' }, users: {} }; }
}

function getUserPreference(userId, deps) {
  const prefs = loadVoicePrefs(deps);
  if (userId && prefs.users && prefs.users[userId]) return prefs.users[userId];
  return prefs.default || {};
}

function resolveVoice(explicitVoice, lang, deps) {
  if (explicitVoice) return explicitVoice;
  const map = loadVoiceProfiles(deps);
  return map?.byLanguage?.[lang] || map?.default || 'af_sarah';
}

function resolveVoiceForBackend(backend, explicitVoice, lang, deps) {
  if (backend === 'qwen3' || backend === 'qwen') {
    return explicitVoice || process.env.LOCAL_QWEN_VOICE || 'default';
  }
  return resolveVoice(explicitVoice, lang, deps);
}

module.exports = {
  loadVoiceProfiles,
  loadVoicePrefs,
  getUserPreference,
  resolveVoice,
  resolveVoiceForBackend,
};
