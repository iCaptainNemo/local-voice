const { spawnSync } = require('child_process');
const fs = require('fs');

function arg(argv, name, dflt = undefined) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : dflt;
}

function run(cmd, args, { quiet = false, env = undefined } = {}) {
  const r = spawnSync(cmd, args, { stdio: quiet ? 'pipe' : 'inherit', encoding: 'utf8', env: env || process.env });
  if (r.status !== 0) throw new Error(`${cmd} failed${quiet && r.stderr ? `: ${r.stderr}` : ''}`);
  return r;
}

function exists(filePath) {
  try { return fs.existsSync(filePath); } catch { return false; }
}

module.exports = { arg, run, exists };
