# local-tts troubleshooting

## `spawn ffmpeg ENOENT`
- Cause: gateway/runtime cannot find ffmpeg on PATH.
- Fix: set explicit `LOCAL_TTS_FFMPEG` path or install ffmpeg and restart gateway/session.

## Discord send returns 400 with empty body
- Usually malformed voice payload metadata.
- Re-run with known-good waveform and valid OGG/Opus file.

## Bot can send files but not voice bubble
- Check that native voice path is used (flags 8192 flow), not regular attachment path.
- Validate no text payload is included in the same voice-message request.

## DM/channel targeting issues
- Use numeric channel ID directly for deterministic routing.

## Kokoro synth fails
- Verify model and voices files exist and are readable.
- Verify Python env has `kokoro_onnx` installed.
