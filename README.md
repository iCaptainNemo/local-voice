# local-voice

Local-first voice I/O stack for OpenClaw agents.

`local-voice` combines:
- **STT** with `faster-whisper`
- **TTS** with **Kokoro** (and optional **Qwen3-TTS**)
- **Discord voice bubbles** + **Telegram voice notes**
- Persistent **per-user voice preferences**
- Consent-gated **voice cloning** flow (Qwen3)

---

## Status

This project is actively evolving from skill prototype toward plugin architecture.

Current focus:
- reliable local voice pipelines
- channel adapters (Discord/Telegram)
- backend switching + fallback
- portability and operator UX

---

## Features

- Local STT (`faster-whisper`)
- Local TTS (`kokoro-onnx`)
- Optional Qwen3 backend (`ttscli`) with fallback to Kokoro
- Discord native voice-message send path
- Telegram native voice-note send path
- Language handling (EN/ES + locale-aware fallback)
- Voice profile mapping by language
- Persistent voice/backend preferences (default + per user)
- Voice clone tooling with explicit consent requirement
- Smoke tests and preflight checks

---

## Requirements

- Node.js 18+
- Python 3.10+
- ffmpeg + ffprobe
- Python packages:
  - `faster-whisper`
  - `kokoro-onnx`
  - `soundfile`

Optional (Qwen backend):
- `ttscli`
- SoX (commonly needed on Windows)

See `references/requirements.md` and `references/config-reference.md` for full details.

---

## Quick Start

### 1) List available voices

```bash
node ./scripts/list_voices.js
```

### 2) Set user preference (optional)

```bash
node ./scripts/voice_preferences.js set --user <userId> --voice <voiceName> --backend qwen3
```

### 3) Send TTS to Discord

```bash
node ./scripts/speak.js \
  --text "Hello from local-voice" \
  --channel-kind discord \
  --channel <discordChannelId> \
  --backend kokoro
```

### 4) Send TTS to Telegram

```bash
node ./scripts/speak.js \
  --text "Hola desde local-voice" \
  --channel-kind telegram \
  --channel <telegramChatId> \
  --backend kokoro
```

### 5) Run smoke test

```bash
node ./scripts/voice_smoke_test.js
```

---

## Voice Cloning (Qwen3)

Voice cloning is supported via `clone_voice.js` and requires explicit consent.

```bash
node ./scripts/clone_voice.js \
  --input ./sample.ogg \
  --voice my-voice \
  --language en \
  --consent yes \
  --channel <discordChannelId>
```

Please only clone voices when you have clear permission.

---

## Documentation Index

- `SKILL.md` — workflow and behavior
- `EVOLUTION_PLAN.md` — roadmap/phases
- `references/config-reference.md` — env vars, args, resolution order
- `references/operator-quick-commands.md` — practical command cheatsheet
- `references/voice-cloning.md` — consent + cloning flow
- `references/bug-reporting.md` — issue pipeline design

---

## License

MIT (recommended; add `LICENSE` file if missing).
