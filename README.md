# local-voice

Local-first voice I/O stack for OpenClaw.

## What it does

- Local STT with `faster-whisper`
- Local TTS with `kokoro-onnx`
- Optional Qwen3-TTS backend with fallback to Kokoro
- Discord voice bubbles + Telegram voice notes
- Persistent per-user/default voice preferences
- Consent-gated voice cloning (Qwen3)

---

## Installation

Plugin packaging/install steps are being finalized.

Until plugin install is finalized, this repo includes developer/operator scripts to run and validate behavior directly.

See: `docs/requirements.md` and `docs/config-reference.md`

---

## Developer quick test

### List voices
```bash
node ./scripts/list_voices.js
```

### Set voice preference (optional)
```bash
node ./scripts/voice_preferences.js set --user <userId> --voice <voiceName> --backend qwen3
```

### Speak to Discord
```bash
node ./scripts/speak.js --text "Hello" --channel-kind discord --channel <discordChannelId> --backend kokoro
```

### Speak to Telegram
```bash
node ./scripts/speak.js --text "Hola" --channel-kind telegram --channel <telegramChatId> --backend kokoro
```

### Smoke test
```bash
node ./scripts/voice_smoke_test.js
```

---

## Voice cloning (Qwen3)

```bash
node ./scripts/clone_voice.js --input ./sample.ogg --voice my-voice --language en --consent yes --channel <discordChannelId>
```

Only clone voices with explicit permission.

---

## Documentation

- `docs/config-reference.md`
- `docs/operator-quick-commands.md`
- `docs/requirements.md`
- `docs/troubleshooting.md`
- `docs/test-plan.md`
- `docs/voice-cloning.md`
- `docs/bug-reporting.md`

---

## License

MIT