const fs = require('fs');
const path = require('path');

function ensureFile(filePath, obj) {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf8');
    return true;
  }
  return false;
}

function initDataFiles(baseDir) {
  const root = baseDir || path.join(__dirname, '..', '..', 'data');
  const created = [];

  const prefs = path.join(root, 'voice-preferences.json');
  if (ensureFile(prefs, { default: { voice: null, backend: 'kokoro' }, users: {} })) created.push(prefs);

  const profiles = path.join(root, 'voice-profiles.json');
  if (ensureFile(profiles, { default: 'af_sarah', byLanguage: { 'en-us': 'af_sarah', es: 'ef_dora' } })) created.push(profiles);

  const voicesState = path.join(root, 'voices-state.json');
  if (ensureFile(voicesState, { updatedAt: null, voices: [] })) created.push(voicesState);

  return { root, created };
}

module.exports = { initDataFiles };
