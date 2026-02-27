/**
 * local-voice plugin entry point.
 * NOTE: Hook wiring is intentionally deferred while v1 parity migration finishes.
 *
 * When ready, wire handlers here using the OpenClaw plugin api:
 *   api.registerHook('message:voice', require('./handlers/voiceMessage').handleVoiceMessage);
 *   api.registerTool({ name: 'local_voice_speak', description: '...', execute: async () => {} });
 */

function createLocalVoicePlugin(api) { // eslint-disable-line no-unused-vars
  // TODO: register hooks and tools once v1 parity migration is complete
}

module.exports = createLocalVoicePlugin;
