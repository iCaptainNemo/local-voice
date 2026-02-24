# local-voice config reference

## Required (minimum)

- `LOCAL_TTS_PYTHON`
  - Python executable used for Kokoro synthesis.
- `LOCAL_TTS_KOKORO_MODEL`
  - Path to `kokoro-v1.0.onnx`.
- `LOCAL_TTS_KOKORO_VOICES`
  - Path to `voices-v1.0.bin`.
- `LOCAL_TTS_FFMPEG`
  - `ffmpeg` binary path (or ensure `ffmpeg` is on PATH).
- Discord bot token in OpenClaw config:
  - `channels.discord.accounts.<account>.token`
- Target channel id:
  - Pass `--channel <id>` or set `DISCORD_TARGET_DEFAULT`.

## Optional overrides

- `LOCAL_TTS_LANG`
  - Default TTS language when `--lang` is not provided.
- `LOCAL_TTS_BACKEND`
  - Default backend: `kokoro` or `qwen3`.
- `LOCAL_TTS_FALLBACK_BACKEND`
  - Optional backend fallback: `kokoro`, `qwen3`, or `none`.
- `LOCAL_QWEN_TTS_CMD`
  - Qwen CLI command path (defaults to `tts`).
- `LOCAL_SOX_DIR`
  - Directory containing `sox` binary for Qwen runtime (Windows often requires explicit path).
- `LOCAL_QWEN_VOICE`
  - Default Qwen voice name (recommended: `default` after `tts voice add ...`).
- `LOCAL_QWEN_DATA_DIR`
  - Optional override for qwen voice data dir (default: `~/tts`). Used by `sync_voices.js`.
- `OPENCLAW_CONFIG_PATH`
  - Override path to `openclaw.json`.
- `OPENCLAW_LOCALE`
  - Locale hint when language is not explicitly provided.
- `LOCAL_VOICE_CHANNEL`
  - Default outbound channel kind for `speak.js` (`discord|telegram`).
- `DISCORD_TARGET_DEFAULT`
  - Default Discord channel/DM id.
- `TELEGRAM_TARGET_DEFAULT`
  - Default Telegram chat id (or `chatId:topic:threadId`).
- `LOCAL_STT_PYTHON`
  - Python executable for STT smoke test helper.

## Runtime arguments (speak.js)

- `--text` (required)
- `--channel-kind` (`discord` or `telegram`, default `discord`)
- `--channel` (target id; defaults by channel kind env)
- `--lang` (`en-us` or `es` in v1)
- `--backend` (`kokoro` or `qwen3`)
- `--fallback-backend` (`kokoro|qwen3|none`)
- `--voice` (optional; for `kokoro` maps to kokoro voice id; for `qwen3` pass only when that voice exists)
- `--user` (optional; applies saved per-user preference)
- `--account` (default `main`)

## Language resolution order

1. `--lang`
2. `LOCAL_TTS_LANG`
3. OpenClaw TTS config hints:
   - `messages.tts.edge.lang`
   - `messages.tts.elevenlabs.languageCode`
4. `OPENCLAW_LOCALE`
5. OS locale detection
6. fallback `en-us`

## Voice resolution order

1. `--voice`
2. Per-user persistent preference (`data/voice-preferences.json`, via `--user <id>`)
3. Default persistent preference (`data/voice-preferences.json`)
4. `data/voice-profiles.json` language mapping
5. `data/voice-profiles.json` default voice
6. hard fallback `af_sarah`

## Backend resolution order

1. `--backend`
2. Per-user persistent preference (`data/voice-preferences.json`, via `--user <id>`)
3. Default persistent preference (`data/voice-preferences.json`)
4. `LOCAL_TTS_BACKEND`
5. fallback `kokoro`

## Fallback behavior on send

1. Native Discord voice bubble (`send_discord_voice.js`)
2. Regular audio attachment
3. Text fallback message

## OS notes

### Windows
- Typical env values:
  - `LOCAL_TTS_PYTHON=C:\\...\\tts-kokoro\\.venv\\Scripts\\python.exe`
  - `LOCAL_TTS_FFMPEG=C:\\...\\ffmpeg.exe`
  - `LOCAL_QWEN_TTS_CMD=C:\\...\\tts-qwen3\\.venv\\Scripts\\tts.exe`
  - `LOCAL_SOX_DIR=C:\\Users\\<you>\\AppData\\Local\\Microsoft\\WinGet\\Packages\\ChrisBagwell.SoX_Microsoft.Winget.Source_8wekyb3d8bbwe\\sox-14.4.2`
  - `LOCAL_QWEN_VOICE=default`

### macOS / Linux
- Prefer PATH-based tools:
  - `LOCAL_TTS_PYTHON=python3`
  - `LOCAL_TTS_FFMPEG=ffmpeg`
- Provide absolute model/voices paths via env vars.

## Qwen setup notes (Windows)

1. Install SoX:
   - `winget install -e --id ChrisBagwell.SoX`
2. Initialize qwen tts runtime:
   - `tts init`
3. Add a default voice profile (one-time):
   - `tts voice add <sample.wav> -t "sample transcript" -v default -l en`

## Voice listing + persistent preferences

- List available voices by backend:
  - `node ./skills/local-voice/scripts/list_voices.js`
- Set persistent user voice/backend:
  - `node ./skills/local-voice/scripts/voice_preferences.js set --user <id> --voice <voiceName> --backend qwen3`
- Set default voice/backend (applies when no user override):
  - `node ./skills/local-voice/scripts/voice_preferences.js set --voice af_sarah --backend kokoro`
- Get persistent user voice/backend:
  - `node ./skills/local-voice/scripts/voice_preferences.js get --user <id>`
- List all persisted preferences:
  - `node ./skills/local-voice/scripts/voice_preferences.js list`

## Validation commands
- Smoke test:
  - `node ./skills/local-voice/scripts/voice_smoke_test.js`
- TTS (Kokoro):
  - `node ./skills/local-voice/scripts/speak.js --text "hello" --backend kokoro --channel <id>`
- TTS (Qwen3):
  - `node ./skills/local-voice/scripts/speak.js --text "hello" --backend qwen3 --fallback-backend kokoro --channel <id>`
- STT only:
  - `python ./skills/local-voice/scripts/transcribe_faster_whisper.py --input ./sample.ogg`
