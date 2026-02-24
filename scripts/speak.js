#!/usr/bin/env node
const path = require('path');
const fs = require('fs');

const { arg: runtimeArg, run: runtimeRun, exists: runtimeExists } = require('../src/services/runtime');
const { readConfig: svcReadConfig, readDiscordToken: svcReadDiscordToken, readTelegramToken: svcReadTelegramToken } = require('../src/services/config');
const { resolveLang: svcResolveLang } = require('../src/services/language');
const {
  normalizeTargetId: chNormalizeTargetId,
  sendTyping: chSendTyping,
  sendPrimaryVoice: chSendPrimaryVoice,
  sendRegularAudioAttachment: chSendRegularAudioAttachment,
  sendTextFallback: chSendTextFallback,
} = require('../src/services/channels');
const {
  preflightKokoro: pPreflightKokoro,
  preflightQwen: pPreflightQwen,
  synthKokoro: pSynthKokoro,
  synthQwen: pSynthQwen,
  encodeToOgg: pEncodeToOgg,
} = require('../src/services/providers');
const {
  getUserPreference: vGetUserPreference,
  resolveVoiceForBackend: vResolveVoiceForBackend,
} = require('../src/services/voice');
const { preflightCommon: pfCommon } = require('../src/services/preflight');

function arg(name, dflt = undefined) {
  return runtimeArg(process.argv, name, dflt);
}

function run(cmd, args, opts = {}) {
  return runtimeRun(cmd, args, opts);
}

function exists(filePath) {
  return runtimeExists(filePath);
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
  return chNormalizeTargetId(channelIdOrTarget);
}

function resolveLang(explicitLang) {
  return svcResolveLang({ explicitLang, readConfig, run });
}

function getUserPreference(userId) {
  return vGetUserPreference(userId, { exists });
}

function resolveVoiceForBackend(backend, explicitVoice, lang) {
  return vResolveVoiceForBackend(backend, explicitVoice, lang, { exists });
}

async function sendTyping(channelKind, channelId, account = 'main') {
  return chSendTyping({ channelKind, channelId, account, readDiscordToken, readTelegramToken });
}

function preflightCommon({ channelKind, channel, account }) {
  return pfCommon({ channelKind, channel, account, normalizeTargetId, readDiscordToken, readTelegramToken });
}

function preflightKokoro() {
  return pPreflightKokoro({ run, exists });
}

function preflightQwen() {
  // best-effort voice registry sync before qwen checks
  try { run('node', [path.join(__dirname, 'sync_voices.js')], { quiet: true }); } catch {}
  return pPreflightQwen({ run, exists });
}

function synthKokoro({ text, wav, voice, lang }) {
  return pSynthKokoro({ text, wav, voice, lang, run });
}

function synthQwen({ text, wav, voice, lang }) {
  return pSynthQwen({ text, wav, voice, lang, run });
}

async function sendPrimaryVoice({ channelKind, channelId, account = 'main', oggPath }) {
  return chSendPrimaryVoice({ channelKind, channelId, account, oggPath, readDiscordToken, readTelegramToken, run });
}

async function sendRegularAudioAttachment({ channelKind, channelId, account = 'main', filePath }) {
  return chSendRegularAudioAttachment({ channelKind, channelId, account, filePath, readDiscordToken, readTelegramToken });
}

async function sendTextFallback({ channelKind, channelId, account = 'main', text }) {
  return chSendTextFallback({ channelKind, channelId, account, text, readDiscordToken, readTelegramToken });
}

(async function main() {
  const text = arg('text');
  const channelKind = (arg('channel-kind', process.env.LOCAL_VOICE_CHANNEL || 'discord') || 'discord').toLowerCase();
  const defaultTarget = channelKind === 'telegram'
    ? (process.env.TELEGRAM_TARGET_DEFAULT || '')
    : (process.env.DISCORD_TARGET_DEFAULT || '1473108262026219612');
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
    const preferred = arg('voice') || (((selectedBackend === 'qwen3' || selectedBackend === 'qwen') && pref.voice) ? pref.voice : undefined);
    const voice = resolveVoiceForBackend(selectedBackend, preferred, lang);

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
  pEncodeToOgg({ wav, ogg, run });
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