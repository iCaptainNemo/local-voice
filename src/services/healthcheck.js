#!/usr/bin/env node
const path = require('path');
const { run, exists } = require('./runtime');
const { readConfig, readDiscordToken, readTelegramToken } = require('./config');
const { resolveLang } = require('./language');
const { normalizeTargetId, parseTelegramTarget } = require('./channels');
const { preflightKokoro, preflightQwen } = require('./providers');
const { getUserPreference, resolveVoiceForBackend } = require('./voice');
const { extractTranscript } = require('./stt');
const { preflightCommon } = require('./preflight');

function check(name, fn) {
  try {
    const detail = fn();
    return { name, ok: true, detail };
  } catch (e) {
    return { name, ok: false, error: e?.message || String(e) };
  }
}

const results = [];
results.push(check('runtime.exists', () => exists(process.cwd())));
results.push(check('runtime.run-node-version', () => run('node', ['--version'], { quiet: true }).stdout.trim()));
results.push(check('config.readConfig', () => !!readConfig()));
results.push(check('config.readDiscordToken', () => !!readDiscordToken('main')));
results.push(check('config.readTelegramToken', () => !!readTelegramToken('main') || 'not-configured-ok'));
results.push(check('language.resolveLang', () => resolveLang({ explicitLang: 'en-US', readConfig, run })));
results.push(check('channels.normalizeTargetId', () => normalizeTargetId('channel:123')));
results.push(check('channels.parseTelegramTarget', () => JSON.stringify(parseTelegramTarget('123:topic:7'))));
results.push(check('preflight.common.discord', () => preflightCommon({ channelKind:'discord', channel:'1473108262026219612', account:'main', normalizeTargetId, readDiscordToken, readTelegramToken }) || 'ok'));
results.push(check('voice.getUserPreference', () => JSON.stringify(getUserPreference('456029801812066306', { exists }))));
results.push(check('voice.resolveVoiceForBackend', () => resolveVoiceForBackend('kokoro', null, 'en-us', { exists })));
results.push(check('stt.extractTranscript', () => JSON.stringify(extractTranscript('hello world\n[lang=en prob=0.91]'))));
results.push(check('providers.preflightKokoro', () => preflightKokoro({ run, exists }) || 'ok'));
results.push(check('providers.preflightQwen', () => {
  try { return preflightQwen({ run, exists }) || 'ok'; }
  catch (e) { return `warn:${e.message}`; }
}));

const ok = results.every(r => r.ok);
console.log(JSON.stringify({ ok, results }, null, 2));
process.exit(ok ? 0 : 1);
