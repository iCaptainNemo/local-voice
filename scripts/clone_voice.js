#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const { transcribeWithFasterWhisper } = require('../src/services/stt');

function arg(name, dflt = undefined) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : dflt;
}

function run(cmd, args, { quiet = false, env = undefined } = {}) {
  const r = spawnSync(cmd, args, { stdio: quiet ? 'pipe' : 'inherit', encoding: 'utf8', env: env || process.env });
  if (r.status !== 0) {
    const err = quiet ? (r.stderr || r.stdout || '').trim() : '';
    throw new Error(`${cmd} failed${err ? `: ${err}` : ''}`);
  }
  return r;
}

function sanitizeVoiceName(name) {
  return String(name || 'voice')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'voice';
}

function readDiscordToken(account = 'main') {
  try {
    const cfgPath = process.env.OPENCLAW_CONFIG_PATH || `${process.env.USERPROFILE}\\.openclaw\\openclaw.json`;
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    return cfg?.channels?.discord?.accounts?.[account]?.token || null;
  } catch {
    return null;
  }
}

async function discordTyping(channelId, account = 'main') {
  try {
    const token = readDiscordToken(account);
    if (!token || !channelId) return;
    await fetch(`https://discord.com/api/v10/channels/${channelId}/typing`, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}` }
    });
  } catch {}
}

async function discordMessage(channelId, account = 'main', content = '') {
  try {
    const token = readDiscordToken(account);
    if (!token || !channelId || !content) return;
    await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
  } catch {}
}

(async function main() {
  try {
    const input = arg('input');
    const voiceRaw = arg('voice');
    const language = arg('language', 'en');
    const consent = (arg('consent', 'no') || '').toLowerCase();
    const channel = arg('channel');
    const account = arg('account', 'main');

    if (!input || !voiceRaw) {
      console.error('Usage: node clone_voice.js --input <audio.wav|ogg|mp3> --voice <name> [--language en|es] --consent yes [--channel <discordChannelId>] [--account main]');
      process.exit(1);
    }

    if (consent !== 'yes') {
      console.error('Consent required: rerun with --consent yes (confirming you have rights/permission to clone this voice).');
      process.exit(2);
    }

    const ttsCmd = process.env.LOCAL_QWEN_TTS_CMD || 'tts';
    const soxDir = process.env.LOCAL_SOX_DIR || 'C:/Users/Michaelangelo/AppData/Local/Microsoft/WinGet/Packages/ChrisBagwell.SoX_Microsoft.Winget.Source_8wekyb3d8bbwe/sox-14.4.2';
        const env = { ...process.env, PATH: `${soxDir};${process.env.PATH || ''}`, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' };

    await discordTyping(channel, account);
    await discordMessage(channel, account, 'Please holdÃ¢â‚¬Â¦ transcribing your sample and creating the voice profile.');

    const stt = transcribeWithFasterWhisper({ inputPath: input, run });
    const transcript = stt.text;
    if (!transcript) throw new Error('No transcript extracted from sample audio; try a clearer 10-30s sample.');

    await discordTyping(channel, account);

    const voice = sanitizeVoiceName(voiceRaw);
    run(ttsCmd, ['voice', 'add', input, '-t', transcript, '-v', voice, '-l', language], { env });

    const result = { ok: true, voice, transcript };
    console.log(JSON.stringify(result, null, 2));
    await discordMessage(channel, account, `Ã¢Å“â€¦ Voice cloned successfully: \
\
- profile: ${voice}\
- transcript: "${transcript}"`);
  } catch (e) {
    const msg = e?.message || String(e);
    console.error(msg);
    const channel = arg('channel');
    const account = arg('account', 'main');
    await discordMessage(channel, account, `Ã¢ÂÅ’ Voice cloning failed: ${msg}`);
    process.exit(1);
  }
})();


