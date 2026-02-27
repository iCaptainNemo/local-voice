---
name: local-voice
description: Local speech I/O workflow for OpenClaw. Use when the user wants local speech-to-text (faster-whisper), local text-to-speech (Kokoro), Discord-native voice-message bubbles, language auto-selection, and portable cross-platform voice tooling.
---

# Local Voice

## Overview
Use this skill for a unified local voice stack: inbound STT with faster-whisper and outbound TTS with Kokoro/Qwen3, including Discord and Telegram voice-note delivery.

## Capabilities

1. **STT (Speech-to-Text)**
   - `scripts/transcribe_faster_whisper.py`
   - Language auto-detect by default, optional forced language

2. **TTS (Text-to-Speech)**
   - `scripts/synthesize_kokoro.py`
   - `scripts/speak.js` orchestrator (cross-platform, with preflight + fallback)
   - `scripts/send_discord_voice.js` native Discord voice-bubble send

3. **Validation**
   - `scripts/voice_smoke_test.js` one-command STT+TTS validation
   - `scripts/sync_voices.js` detect newly added qwen voice profiles
   - `scripts/list_voices.js` list available kokoro/qwen voices

4. **Persistent voice preferences**
   - `scripts/voice_preferences.js` store per-user/default voice + backend selections
   - selections persist in `data/voice-preferences.json` (not chat context)

## Default workflow policy

- If inbound input is voice/audio: prefer **voice reply** (Discord native voice bubble).
- Use STT detected language as the default TTS language (`es`/`en-us`).
- If detection confidence is weak, fall back to language precedence rules.
- If native voice send fails, fall back to regular audio attachment, then text as final fallback.
- Emit Discord typing indicator while processing long STT/TTS steps (best effort).

## Language resolution (TTS)

Order:
1. `--lang`
2. `LOCAL_TTS_LANG`
3. OpenClaw TTS hints (`messages.tts.edge.lang`, `messages.tts.elevenlabs.languageCode`)
4. `OPENCLAW_LOCALE`
5. OS locale detection
6. fallback `en-us`

Mapped (v1):
- English -> `en-us`
- Spanish -> `es`

## Quick run

### TTS (Discord voice bubble)
```bash
node ./skills/local-voice/scripts/speak.js --text "Hello from local voice" --channel-kind discord --channel 1473108262026219612
```

### TTS (Telegram voice note)
```bash
node ./skills/local-voice/scripts/speak.js --text "Hola desde local voice" --channel-kind telegram --channel <telegram_chat_id>
```

### STT (transcription)
```bash
python ./skills/local-voice/scripts/transcribe_faster_whisper.py --input ./sample.ogg
```

## Voice profile mapping

- Configure default voices in `data/voice-profiles.json`.
- `speak.js` maps language -> voice automatically unless `--voice` is passed.

## Smoke test

```bash
node ./skills/local-voice/scripts/voice_smoke_test.js
```

## Voice cloning support (Qwen3)

- See `docs/voice-cloning.md` for the consent-first flow.
- Use `scripts/clone_voice.js` to create a reusable qwen voice profile from a sample.
- Require explicit permission confirmation before cloning any voice.

## Notes

- Keep this skill unpublished until portability hardening is complete.
- Prefer env-var paths instead of hardcoded absolute paths.
- For day-to-day ops, use `docs/operator-quick-commands.md`.
- Use `docs/requirements.md`, `docs/config-reference.md`, `docs/troubleshooting.md`, `docs/test-plan.md`, and `docs/voice-cloning.md` during setup and validation.
