/**
 * local-voice plugin bootstrap entrypoint (dev scaffold)
 * TODO: wire official OpenClaw plugin hooks.
 */

function createLocalVoicePlugin() {
  return {
    name: 'local-voice',
    version: '0.1.0-dev',
    init() {
      // TODO: register handlers/tools
      return { ok: true };
    },
  };
}

module.exports = { createLocalVoicePlugin };
