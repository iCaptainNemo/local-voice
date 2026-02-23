# local-voice operator quick commands

## 1) List available voices

```bash
node ./skills/local-voice/scripts/list_voices.js
```

## 2) Set persistent voice/backend for a user

```bash
node ./skills/local-voice/scripts/voice_preferences.js set --user <discordUserId> --voice <voiceName> --backend qwen3
```

## 3) Set default voice/backend (fallback when no user override)

```bash
node ./skills/local-voice/scripts/voice_preferences.js set --voice af_sarah --backend kokoro
```

## 4) Check saved preferences

```bash
node ./skills/local-voice/scripts/voice_preferences.js get --user <discordUserId>
node ./skills/local-voice/scripts/voice_preferences.js list
```

## 5) Speak a message

### Discord + Kokoro
```bash
node ./skills/local-voice/scripts/speak.js --text "Hello" --channel-kind discord --backend kokoro --channel <discordChannelId> --user <discordUserId>
```

### Discord + Qwen3 (with fallback)
```bash
node ./skills/local-voice/scripts/speak.js --text "Hello" --channel-kind discord --backend qwen3 --fallback-backend kokoro --channel <discordChannelId> --user <discordUserId>
```

### Telegram voice note
```bash
node ./skills/local-voice/scripts/speak.js --text "Hola" --channel-kind telegram --backend kokoro --channel <telegramChatId>
```

## 6) Clone a voice (consent required)

```bash
node ./skills/local-voice/scripts/clone_voice.js --input ./sample.ogg --voice my-voice --language en --consent yes --channel <channelId>
```

## 7) Sync dropped/imported qwen voices

```bash
node ./skills/local-voice/scripts/sync_voices.js
```

## 8) Run full smoke test

```bash
node ./skills/local-voice/scripts/voice_smoke_test.js
```

## Notes

- Qwen on Windows may require:
  - `LOCAL_QWEN_TTS_CMD`
  - `LOCAL_SOX_DIR`
  - `LOCAL_QWEN_VOICE`
- Persistent preferences are stored in:
  - `./skills/local-voice/references/voice-preferences.json`
