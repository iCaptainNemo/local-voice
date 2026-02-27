const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { run, exists } = require('../services/runtime');
const { readConfig, readDiscordToken, readTelegramToken } = require('../services/config');
const { resolveLang } = require('../services/language');
const { getUserPreference, resolveVoiceForBackend } = require('../services/voice');
const { preflightKokoro, preflightQwen, synthKokoro, synthQwen, encodeToOgg } = require('../services/providers');
const { normalizeTargetId, sendTyping, sendPrimaryVoice } = require('../services/channels');
const { preflightCommon } = require('../services/preflight');
const { transcribeWithFasterWhisper } = require('../services/stt');
const { initDataFiles } = require('../services/data-init');
const { handleVoiceMessage } = require('./handlers/voiceMessage');

function createLocalVoicePlugin(api) {
  initDataFiles();

  api.registerHook('message:voice', async (ctx) => {
    return handleVoiceMessage({ run, ...ctx });
  });

  api.registerTool({
    name: 'local_voice_speak',
    description: 'Synthesize text to speech and deliver it as a voice message to a Discord or Telegram channel.',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to synthesize and speak.',
        },
        channelKind: {
          type: 'string',
          enum: ['discord', 'telegram'],
          description: 'Channel platform.',
        },
        channelId: {
          type: 'string',
          description: 'Target channel ID (or Telegram chat ID, optionally prefixed with "channel:").',
        },
        account: {
          type: 'string',
          description: 'Account name from openclaw.json (defaults to "main").',
        },
        voice: {
          type: 'string',
          description: 'Explicit voice name override (e.g. "af_sarah"). Omit to use language/preference default.',
        },
        lang: {
          type: 'string',
          description: 'Explicit language code override (e.g. "en-us", "es"). Omit to auto-detect.',
        },
        backend: {
          type: 'string',
          enum: ['kokoro', 'qwen'],
          description: 'TTS backend to use. Defaults to user preference or "kokoro".',
        },
      },
      required: ['text', 'channelKind', 'channelId'],
    },
    execute: async (_id, params) => {
      const {
        text,
        channelKind,
        channelId,
        account = 'main',
        voice: explicitVoice,
        lang: explicitLang,
        backend: explicitBackend,
      } = params;

      try {
        preflightCommon({ channelKind, channel: channelId, account, normalizeTargetId, readDiscordToken, readTelegramToken });

        const lang = resolveLang({ explicitLang, readConfig, run });
        const backend = explicitBackend || getUserPreference(null, { exists }).backend || 'kokoro';
        const voice = resolveVoiceForBackend(backend, explicitVoice, lang, { exists });

        if (backend === 'qwen' || backend === 'qwen3') {
          preflightQwen({ run, exists });
        } else {
          preflightKokoro({ run, exists });
        }

        const uid = crypto.randomBytes(6).toString('hex');
        const wav = path.join(os.tmpdir(), `lv-${uid}.wav`);
        const ogg = path.join(os.tmpdir(), `lv-${uid}.ogg`);

        try {
          sendTyping({ channelKind, channelId, account, readDiscordToken, readTelegramToken }).catch(() => {});

          if (backend === 'qwen' || backend === 'qwen3') {
            synthQwen({ text, wav, voice, lang, run });
          } else {
            synthKokoro({ text, wav, voice, lang, run });
          }

          encodeToOgg({ wav, ogg, run });

          const result = await sendPrimaryVoice({ channelKind, channelId, account, oggPath: ogg, readDiscordToken, readTelegramToken, run });

          return {
            content: [{
              type: 'text',
              text: `Voice message delivered via ${result.mode}. Backend: ${backend}, voice: ${voice}, lang: ${lang}.`,
            }],
          };
        } finally {
          try { if (fs.existsSync(wav)) fs.unlinkSync(wav); } catch {}
          try { if (fs.existsSync(ogg)) fs.unlinkSync(ogg); } catch {}
        }
      } catch (err) {
        return {
          content: [{
            type: 'text',
            text: `local_voice_speak failed: ${err.message}`,
          }],
        };
      }
    },
  });

  api.registerTool({
    name: 'local_voice_transcribe',
    description: 'Transcribe an audio file to text using local speech-to-text (faster-whisper).',
    parameters: {
      type: 'object',
      properties: {
        mediaPath: {
          type: 'string',
          description: 'Absolute path to the audio file to transcribe.',
        },
        pythonCmd: {
          type: 'string',
          description: 'Python command override. Defaults to LOCAL_STT_PYTHON env var or "python".',
        },
      },
      required: ['mediaPath'],
    },
    execute: async (_id, params) => {
      const { mediaPath, pythonCmd } = params;

      try {
        const result = transcribeWithFasterWhisper({ inputPath: mediaPath, run, pythonCmd });
        const parts = [`Transcript: ${result.text || '(empty)'}`];
        if (result.language) {
          const pct = result.probability != null ? ` (${(result.probability * 100).toFixed(0)}%)` : '';
          parts.push(`Language: ${result.language}${pct}`);
        }
        return {
          content: [{
            type: 'text',
            text: parts.join('\n'),
          }],
        };
      } catch (err) {
        return {
          content: [{
            type: 'text',
            text: `local_voice_transcribe failed: ${err.message}`,
          }],
        };
      }
    },
  });
}

module.exports = createLocalVoicePlugin;
