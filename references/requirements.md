# local-voice requirements

## Runtime
- Node.js 18+
- Python 3.10+

## Python packages
- kokoro-onnx
- soundfile
- faster-whisper

## Binaries
- ffmpeg
- ffprobe

## OpenClaw/Discord
- Valid Discord bot token in `~/.openclaw/openclaw.json`
- Target channel ID available for voice bubble sends

## Environment variables (optional)
- `LOCAL_TTS_PYTHON`
- `LOCAL_TTS_KOKORO_MODEL`
- `LOCAL_TTS_KOKORO_VOICES`
- `LOCAL_TTS_FFMPEG`
- `LOCAL_TTS_LANG`
- `OPENCLAW_CONFIG_PATH`
- `DISCORD_TARGET_DEFAULT`
