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

function compactError(err) {
  const msg = String(err?.message || err || '').trim();
  if (/No such file or directory/i.test(msg) || /FileNotFoundError/i.test(msg)) {
    return 'Input audio file was not found. Re-send the clip and retry with the correct path.';
  }
  return msg.split('\n')[0];
}

(async function main() {
  try {
    const input = arg('input');
    const voiceRaw = arg('voice');
    const language = arg('language', 'en');
    const consent = (arg('consent', 'no') || '').toLowerCase();
    const channel = arg('channel');
    const account = arg('account', 'main');
    const referenceText = (arg('reference-text') || arg('reference') || '').trim();

    if (!input || !voiceRaw) {
      console.error('Usage: node clone_voice.js --input <audio.wav|ogg|mp3> --voice <name> [--language en|es] [--reference-text "..."] --consent yes [--channel <discordChannelId>] [--account main]');
      process.exit(1);
    }

    if (!fs.existsSync(input)) {
      throw new Error('Input audio file was not found. Re-send the clip and retry with the correct path.');
    }

    if (consent !== 'yes') {
      console.error('Consent required: rerun with --consent yes (confirming you have rights/permission to clone this voice).');
      process.exit(2);
    }

    const ttsCmd = process.env.LOCAL_QWEN_TTS_CMD || 'tts';
    const soxDir = process.env.LOCAL_SOX_DIR || 'C:/Users/Michaelangelo/AppData/Local/Microsoft/WinGet/Packages/ChrisBagwell.SoX_Microsoft.Winget.Source_8wekyb3d8bbwe/sox-14.4.2';
    const env = { ...process.env, PATH: `${soxDir};${process.env.PATH || ''}`, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' };

    await discordTyping(channel, account);
    await discordMessage(channel, account, 'Please hold... transcribing your sample and creating the voice profile.');

    let transcript = referenceText;
    if (!transcript) {
      const stt = transcribeWithFasterWhisper({ inputPath: input, run });
      transcript = stt.text;
    }

    if (!transcript) throw new Error('No transcript extracted from sample audio; try a clearer 10-30s sample or pass --reference-text.');

    await discordTyping(channel, account);

    const voice = sanitizeVoiceName(voiceRaw);
    run(ttsCmd, ['voice', 'add', input, '-t', transcript, '-v', voice, '-l', language], { env });

    const result = { ok: true, voice, transcript };
    console.log(JSON.stringify(result, null, 2));
    await discordMessage(channel, account, `Voice cloned successfully.\n- profile: ${voice}\n- transcript: "${transcript}"`);
  } catch (e) {
    const shortMsg = compactError(e);
    console.error(shortMsg);
    const channel = arg('channel');
    const account = arg('account', 'main');
    await discordMessage(channel, account, `Voice cloning failed: ${shortMsg}`);
    process.exit(1);
  }
})();