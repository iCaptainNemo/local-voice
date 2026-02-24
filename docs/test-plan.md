# local-voice test plan

## STT tests (faster-whisper)
1. English voice note transcription
2. Spanish voice note transcription
3. Mixed-language short sample
4. Language auto-detect confidence output check

## TTS tests (Kokoro + Discord)
1. EN voice bubble send
2. ES voice bubble send
3. Voice override test
4. Long text (~45s)

## Negative tests
1. Missing model files (Kokoro)
2. Missing ffmpeg
3. Invalid Discord channel ID
4. Missing faster-whisper package

## Regression
1. Gateway restart then STT+TTS path check
2. 5 consecutive voice sends
3. 5 consecutive transcriptions

## Acceptance
- Native Discord voice bubble working.
- STT returns usable transcript with language metadata.
- Clear errors for all negative tests.
