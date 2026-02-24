/**
 * local-voice plugin entry scaffold.
 * NOTE: Hook wiring is intentionally deferred while v1 parity migration finishes.
 */

function createLocalVoicePlugin() {
  return {
    id: 'local-voice',
    init() {
      return { ok: true, status: 'loaded-scaffold' };
    },
  };
}

module.exports = createLocalVoicePlugin;
module.exports.createLocalVoicePlugin = createLocalVoicePlugin;