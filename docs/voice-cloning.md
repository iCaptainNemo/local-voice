# Voice cloning flow (Qwen3 backend)

## Safety + consent rule (required)

Only clone a voice when the requesting user explicitly confirms they own the voice or have permission.

Required confirmation phrase (or equivalent):
- "I confirm I have permission to clone this voice."

For automation, require `--consent yes` when running clone tooling.

## Sample requirements

- Duration: **10-30 seconds** (20s ideal)
- One speaker only
- Quiet background, minimal echo
- Natural speaking pace
- Supported audio: wav/ogg/mp3

## Operator/user flow

1. User says: **"clone this voice"**
2. Agent asks for:
   - voice sample (10-30s)
   - consent confirmation
   - desired voice profile name
3. Agent runs clone script:

```bash
node ./skills/local-voice/scripts/clone_voice.js \
  --input ./sample.wav \
  --voice mike-main \
  --language en \
  --consent yes \
  --channel <discord-channel-id>
```

During cloning, the script sends Discord typing and a "Please holdâ€¦" progress message (best effort).

4. Agent confirms profile creation and how to use:

```bash
node ./skills/local-voice/scripts/speak.js --text "hello" --backend qwen3 --voice mike-main
```

## Notes

- Voice profiles are stored by `ttscli` on host (not workspace-only), typically under the user data dir.
- If transcription quality is poor, ask user to resend a cleaner sample.
- If user asks whether cloning is possible, provide this flow and consent requirement.

### Optional: provide exact reference text

If you already have the exact quote/transcript, pass it directly (recommended):

```bash
node ./scripts/clone_voice.js --input ./sample.ogg --voice my-voice --language en --reference-text "Your exact quote here" --consent yes --channel <discordChannelId>
```