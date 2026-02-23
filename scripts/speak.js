#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { arg: runtimeArg, run: runtimeRun, exists: runtimeExists } = require('../src/services/runtime');
const { readConfig: svcReadConfig, readDiscordToken: svcReadDiscordToken, readTelegramToken: svcReadTelegramToken } = require('../src/services/config');
const { resolveLang: svcResolveLang } = require('../src/services/language');

function arg(name, dflt = undefined) {
  return runtimeArg(process.argv, name, dflt);
}

function run(cmd, args, opts = {}) {
  return runtimeRun(cmd, args, opts);
}

function exists(filePath) {
  return runtimeExists(filePath);
}

function pickPython() {
  return process.env.LOCAL_TTS_PYTHON || 'python';
}

function pickFfmpeg() {
  return process.env.LOCAL_TTS_FFMPEG || 'ffmpeg';
}

function pickQwenCmd() {
  return process.env.LOCAL_QWEN_TTS_CMD || 'tts';
}

function pickSoxDir() {
  return process.env.LOCAL_SOX_DIR || 'C:/Users/Michaelangelo/AppData/Local/Microsoft/WinGet/Packages/ChrisBagwell.SoX_Microsoft.Winget.Source_8wekyb3d8bbwe/sox-14.4.2';
}

function readConfig() {
  return svcReadConfig();
}

function readDiscordToken(account = 'main') {
  return svcReadDiscordToken(account);
}

function readTelegramToken(account = 'main') {
  return svcReadTelegramToken(account);
}

function normalizeTargetId(channelIdOrTarget) {
  const raw = String(channelIdOrTarget || '').trim();
  if (!raw) return '';
  if (raw.startsWith('channel:')) return raw.slice('channel:'.length);
  return raw;
}

function parseTelegramTarget(target) {
  const raw = normalizeTargetId(target);
  const topicMatch = raw.match(/^(.*?):topic:(\d+)$/);
  if (topicMatch) {
    return { chatId: topicMatch[1], messageThreadId: topicMatch[2] };
  }
  return { chatId: raw, messageThreadId: null };
}

async function sendTyping(channelKind, channelId, account = 'main') {
  try {
    if (channelKind === 'discord') {
      const token = readDiscordToken(account);
      const ch = normalizeTargetId(channelId);
      if (!token || !ch) return;
      await fetch(`https://discord.com/api/v10/channels/${ch}/typing`, {
        method: 'POST',
        headers: { Authorization: `Bot ${token}` }
      });
      return;
    }

    if (channelKind === 'telegram') {
      const token = readTelegramToken(account);
      const { chatId, messageThreadId } = parseTelegramTarget(channelId);
      if (!token || !chatId) return;
      const form = new URLSearchParams();
      form.set('chat_id', chatId);
      form.set('action', 'record_voice');
      if (messageThreadId) form.set('message_thread_id', messageThreadId);
      await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString()
      });
    }
  } catch {}
}

function normalizeToKokoroLang(raw) {
  if (!raw) return null;
  const v = String(raw).trim().replace('_', '-').toLowerCase();
  if (v.startsWith('es')) return 'es';
  if (v.startsWith('en')) return 'en-us';
  return null;
}

function normalizeToQwenLang(raw) {
  if (!raw) return null;
  const v = String(raw).trim().replace('_', '-').toLowerCase();
  if (v.startsWith('es')) return 'es';
  if (v.startsWith('en')) return 'en';
  return null;
}

function readOpenClawLocaleHint() {
  try {
    const cfg = readConfig();
    return cfg?.messages?.tts?.edge?.lang || cfg?.messages?.tts?.elevenlabs?.languageCode || null;
  } catch {
    return null;
  }
}

function detectOsLocale() {
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

function resolveLang(explicitLang) {
  return svcResolveLang({ explicitLang, readConfig, run });
}

function loadVoiceProfiles() {
  const p = path.join(__dirname, '..', 'references', 'voice-profiles.json');
  if (!exists(p)) return { default: 'af_sarah', byLanguage: { 'en-us': 'af_sarah', es: 'ef_dora' } };
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadVoicePrefs() {
  const p = process.env.LOCAL_VOICE_PREFS_PATH || path.join(__dirname, '..', 'references', 'voice-preferences.json');
  if (!exists(p)) return { default: { voice: null, backend: 'kokoro' }, users: {} };
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return { default: { voice: null, backend: 'kokoro' }, users: {} }; }
}

function getUserPreference(userId) {
  const prefs = loadVoicePrefs();
  if (userId && prefs.users && prefs.users[userId]) return prefs.users[userId];
  return prefs.default || {};
}

function resolveVoice(explicitVoice, lang) {
  if (explicitVoice) return explicitVoice;
  const map = loadVoiceProfiles();
  return map?.byLanguage?.[lang] || map?.default || 'af_sarah';
}

function resolveVoiceForBackend(backend, explicitVoice, lang) {
  if (backend === 'qwen3' || backend === 'qwen') {
    // Qwen voices are installation-specific; prefer explicit or configured default.
    return explicitVoice || process.env.LOCAL_QWEN_VOICE || 'default';
  }
  return resolveVoice(explicitVoice, lang);
}

function preflightCommon({ channelKind, channel, account }) {
  const issues = [];
  const target = normalizeTargetId(channel);
  if (!target) issues.push('missing target channel/chat id');

  if (channelKind === 'discord') {
    const token = readDiscordToken(account);
    if (!token) issues.push(`missing discord token for account: ${account}`);
  } else if (channelKind === 'telegram') {
    const token = readTelegramToken(account);
    if (!token) issues.push(`missing telegram bot token for account: ${account}`);
  } else {
    issues.push(`unsupported channel-kind: ${channelKind}`);
  }

  if (issues.length) throw new Error(`preflight failed:\n- ${issues.join('\n- ')}`);
}

function preflightKokoro() {
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

function preflightQwen() {
  const issues = [];
  const qwen = pickQwenCmd();
  const ffmpeg = pickFfmpeg();
  const soxDir = pickSoxDir();
  const env = { ...process.env, PATH: `${soxDir};${process.env.PATH || ''}` };
  try { run(qwen, ['--version'], { quiet: true, env }); } catch { issues.push(`qwen tts command not runnable: ${qwen}`); }
  try { run(ffmpeg, ['-version'], { quiet: true }); } catch { issues.push(`ffmpeg not runnable: ${ffmpeg}`); }
  if (!exists(path.join(soxDir, 'sox.exe'))) issues.push(`sox not found in expected dir: ${soxDir}`);
  // best-effort voice registry sync (non-fatal)
  try { run('node', [path.join(__dirname, 'sync_voices.js')], { quiet: true }); } catch {}
  if (issues.length) throw new Error(`qwen preflight failed:\n- ${issues.join('\n- ')}`);
}

async function sendRegularAudioAttachment({ channelKind, channelId, account = 'main', filePath }) {
  const file = fs.readFileSync(filePath);

  if (channelKind === 'discord') {
    const token = readDiscordToken(account);
    const ch = normalizeTargetId(channelId);

    const up = await fetch(`https://discord.com/api/v10/channels/${ch}/attachments`, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: [{ filename: path.basename(filePath), file_size: file.length, id: '0' }] })
    });
    if (!up.ok) throw new Error(`attachment upload-url failed: ${up.status}`);
    const upj = await up.json();
    const a = upj.attachments?.[0];
    if (!a) throw new Error('attachment upload-url missing payload');

    const put = await fetch(a.upload_url, { method: 'PUT', body: file });
    if (!put.ok) throw new Error(`attachment upload failed: ${put.status}`);

    const msg = await fetch(`https://discord.com/api/v10/channels/${ch}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ attachments: [{ id: '0', filename: path.basename(filePath), uploaded_filename: a.upload_filename }] })
    });
    if (!msg.ok) throw new Error(`attachment message failed: ${msg.status}`);
    return await msg.json();
  }

  if (channelKind === 'telegram') {
    const token = readTelegramToken(account);
    const { chatId, messageThreadId } = parseTelegramTarget(channelId);
    const form = new FormData();
    form.append('chat_id', chatId);
    if (messageThreadId) form.append('message_thread_id', String(messageThreadId));
    form.append('audio', new Blob([file]), path.basename(filePath));

    const res = await fetch(`https://api.telegram.org/bot${token}/sendAudio`, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`telegram sendAudio failed: ${res.status}`);
    const j = await res.json();
    if (!j.ok) throw new Error(`telegram sendAudio api error: ${JSON.stringify(j)}`);
    return j;
  }

  throw new Error(`unsupported channel-kind: ${channelKind}`);
}

async function sendTextFallback({ channelKind, channelId, account = 'main', text }) {
  if (channelKind === 'discord') {
    const token = readDiscordToken(account);
    const ch = normalizeTargetId(channelId);
    const msg = await fetch(`https://discord.com/api/v10/channels/${ch}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text })
    });
    if (!msg.ok) throw new Error(`text fallback failed: ${msg.status}`);
    return await msg.json();
  }

  if (channelKind === 'telegram') {
    const token = readTelegramToken(account);
    const { chatId, messageThreadId } = parseTelegramTarget(channelId);
    const form = new URLSearchParams();
    form.set('chat_id', chatId);
    form.set('text', text);
    if (messageThreadId) form.set('message_thread_id', String(messageThreadId));
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString()
    });
    if (!res.ok) throw new Error(`telegram text fallback failed: ${res.status}`);
    const j = await res.json();
    if (!j.ok) throw new Error(`telegram sendMessage api error: ${JSON.stringify(j)}`);
    return j;
  }

  throw new Error(`unsupported channel-kind: ${channelKind}`);
}

function synthKokoro({ text, wav, voice, lang }) {
  const python = pickPython();
  const model = process.env.LOCAL_TTS_KOKORO_MODEL || 'C:/Users/Michaelangelo/voice/tts-kokoro/kokoro-v1.0.onnx';
  const voices = process.env.LOCAL_TTS_KOKORO_VOICES || 'C:/Users/Michaelangelo/voice/tts-kokoro/voices-v1.0.bin';
  run(python, [
    path.join(__dirname, 'synthesize_kokoro.py'),
    '--text', text,
    '--out', wav,
    '--voice', voice,
    '--lang', lang,
    '--model', model,
    '--voices', voices,
  ]);
}

function synthQwen({ text, wav, voice, lang }) {
  const qwen = pickQwenCmd();
  const soxDir = pickSoxDir();
  const env = { ...process.env, PATH: `${soxDir};${process.env.PATH || ''}` };
  const qLang = normalizeToQwenLang(lang) || 'en';
  const args = ['generate', text, '--output', wav, '--language', qLang];
  if (voice) args.push('--voice', voice);
  run(qwen, args, { env });
}

async function sendPrimaryVoice({ channelKind, channelId, account = 'main', oggPath }) {
  if (channelKind === 'discord') {
    const ch = normalizeTargetId(channelId);
    run('node', [path.join(__dirname, 'send_discord_voice.js'), '--channel', ch, '--file', oggPath, '--account', account]);
    return { ok: true, mode: 'discord-voice' };
  }

  if (channelKind === 'telegram') {
    const token = readTelegramToken(account);
    const { chatId, messageThreadId } = parseTelegramTarget(channelId);
    const file = fs.readFileSync(oggPath);
    const form = new FormData();
    form.append('chat_id', chatId);
    if (messageThreadId) form.append('message_thread_id', String(messageThreadId));
    form.append('voice', new Blob([file]), path.basename(oggPath));
    const res = await fetch(`https://api.telegram.org/bot${token}/sendVoice`, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`telegram sendVoice failed: ${res.status}`);
    const j = await res.json();
    if (!j.ok) throw new Error(`telegram sendVoice api error: ${JSON.stringify(j)}`);
    return { ok: true, mode: 'telegram-voice', result: j.result };
  }

  throw new Error(`unsupported channel-kind: ${channelKind}`);
}

(async function main() {
  const text = arg('text');
  const channelKind = (arg('channel-kind', process.env.LOCAL_VOICE_CHANNEL || 'discord') || 'discord').toLowerCase();
  const defaultTarget = channelKind === 'telegram' ? (process.env.TELEGRAM_TARGET_DEFAULT || '') : (process.env.DISCORD_TARGET_DEFAULT || '1473108262026219612');
  const channel = arg('channel', defaultTarget);
  const lang = resolveLang(arg('lang'));
  const account = arg('account', 'main');
  const user = arg('user', process.env.LOCAL_VOICE_USER_ID);
  const pref = getUserPreference(user);
  const backend = (arg('backend', pref.backend || process.env.LOCAL_TTS_BACKEND || 'kokoro') || 'kokoro').toLowerCase();
  const fallbackBackend = (arg('fallback-backend', process.env.LOCAL_TTS_FALLBACK_BACKEND || 'none') || 'none').toLowerCase();

  if (!text) {
    console.error('Usage: node speak.js --text "..." [--channel-kind discord|telegram] [--channel <id>] [--voice <id>] [--lang <en-us|es>] [--backend kokoro|qwen3] [--fallback-backend kokoro|qwen3|none] [--user <id>] [--account main]');
    process.exit(1);
  }

  const outDir = path.join(process.env.USERPROFILE || process.env.HOME || '.', '.openclaw', 'workspace', '_tts-out');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const wav = path.join(outDir, `tts-${stamp}.wav`);
  const ogg = path.join(outDir, `tts-${stamp}.ogg`);

  const synthWithBackend = async (selectedBackend) => {
    const voice = resolveVoiceForBackend(selectedBackend, arg('voice') || pref.voice, lang);
    if (selectedBackend === 'kokoro') {
      preflightKokoro();
      await sendTyping(channelKind, channel, account);
      synthKokoro({ text, wav, voice, lang });
      return;
    }
    if (selectedBackend === 'qwen3' || selectedBackend === 'qwen') {
      preflightQwen();
      await sendTyping(channelKind, channel, account);
      synthQwen({ text, wav, voice, lang });
      return;
    }
    throw new Error(`unsupported backend: ${selectedBackend}`);
  };

  preflightCommon({ channelKind, channel, account });

  try {
    await synthWithBackend(backend);
  } catch (e) {
    if (fallbackBackend !== 'none' && fallbackBackend !== backend) {
      console.warn(`WARN: primary backend failed (${backend}), trying fallback (${fallbackBackend}): ${e.message}`);
      await synthWithBackend(fallbackBackend);
    } else {
      throw e;
    }
  }

  await sendTyping(channelKind, channel, account);
  run(pickFfmpeg(), ['-y', '-i', wav, '-c:a', 'libopus', '-b:a', '48k', ogg]);
  await sendTyping(channelKind, channel, account);

  try {
    await sendPrimaryVoice({ channelKind, channelId: channel, account, oggPath: ogg });
    console.log(`OK_VOICE: ${ogg}`);
    return;
  } catch (e) {
    console.warn(`WARN: native voice send failed, trying attachment fallback (${e.message})`);
  }

  try {
    const r = await sendRegularAudioAttachment({ channelKind, channelId: channel, account, filePath: ogg });
    const id = r?.id || r?.result?.message_id || 'ok';
    console.log(`OK_ATTACHMENT: ${id}`);
    return;
  } catch (e) {
    console.warn(`WARN: attachment fallback failed, trying text fallback (${e.message})`);
  }

  const t = await sendTextFallback({
    channelKind,
    channelId: channel,
    account,
    text: '[local-voice fallback] I could not send audio, but synthesis completed successfully.'
  });
  const tid = t?.id || t?.result?.message_id || 'ok';
  console.log(`OK_TEXT: ${tid}`);
})().catch((e) => {
  console.error(e?.message || String(e));
  process.exit(1);
});


