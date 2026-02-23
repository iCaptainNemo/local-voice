const { transcribeWithFasterWhisper } = require('../../services/stt');

/**
 * Plugin handler scaffold for inbound voice messages.
 * TODO: wire to OpenClaw plugin event API.
 */
async function handleVoiceMessage(ctx) {
  const { mediaPath, run, onTyping } = ctx || {};
  if (!mediaPath || !run) {
    throw new Error('handleVoiceMessage missing required ctx.mediaPath/run');
  }

  // TODO: move to repeating typing timer while transcribing.
  if (typeof onTyping === 'function') {
    await onTyping();
  }

  const stt = transcribeWithFasterWhisper({ inputPath: mediaPath, run });

  return {
    transcript: stt.text,
    language: stt.language,
    languageProbability: stt.probability,
  };
}

module.exports = { handleVoiceMessage };
