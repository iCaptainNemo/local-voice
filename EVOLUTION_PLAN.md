# local-voice — Evolution Plan

Status: Working proof of concept (workspace-dev), not yet production-portable.
Owner: Mike + Deep Thought
Last updated: 2026-02-22

## 1) Current state (what already works)

- Unified skill scaffold exists at `skills/local-voice/`
- STT works via `faster-whisper` (`transcribe_faster_whisper.py`)
- TTS works via Kokoro (`synthesize_kokoro.py`)
- Optional Qwen3 backend path wired via `--backend qwen3`
- Backend fallback path wired via `--fallback-backend`
- Discord native voice-bubble send works via raw API flow (`send_discord_voice.js`)
- Telegram voice-note send path wired in `speak.js` (`--channel-kind telegram`)
- Cross-platform orchestrator exists (`speak.js`)
- Language routing implemented (arg/env/OpenClaw hint/OS locale/fallback)
- Voice tests validated in EN + ES
- Typing indicator support added in TTS flow (Discord + Telegram best effort)

---

## 2) Known gaps

1. **Not fully out-of-box**
   - Requires manual dependency/model setup
   - Requires Discord bot/token/channel setup
2. **Hardcoded defaults still present**
   - Some path defaults still machine-specific
3. **No single command bootstrap**
   - Missing installer that verifies + configures all deps
4. **No formal runtime hook for auto voice-in -> voice-out**
   - Workflow policy is documented, but not globally enforced by platform config
5. **No packaging gate/tests yet**
   - Need validation script and regression suite for reproducibility
6. **Qwen setup complexity on Windows**
   - Needs SoX + Qwen init + voice profile provisioning

---

## 3) Target architecture

### Phase A — Harden skill (short-term)
- Keep as skill while behavior stabilizes
- Remove machine-specific assumptions
- Add robust preflight checks and actionable errors
- Add smoke test command for STT+TTS in one run

### Phase B — Make portable distribution (mid-term)
- Add setup script(s):
  - `scripts/bootstrap.ps1` (Windows)
  - `scripts/bootstrap.sh` (Linux/macOS)
- Add model downloader helper
- Add env template (`.env.example` style reference)
- Add deterministic dependency check output

### Phase C — Graduate to plugin (long-term)
- Convert skill logic into plugin surface
- Provide install-time validation and friendly diagnostics
- Expose settings via plugin config (voice, language, fallback mode)
- Add streaming voice session architecture:
  - Phase C1: half-duplex push-to-talk loop (local STT + local TTS)
  - Phase C2: realtime turn preemption/barge-in handling
  - Phase C3: full-duplex local streaming (continuous listen/speak with interruption control)
- Keep skill as operator/developer companion docs

---

## 4) Immediate next tasks

1. [x] Build `scripts/voice_smoke_test.js`
   - Runs one TTS send and one STT transcription check
   - Outputs PASS/FAIL with reasons
2. [x] Add preflight in `speak.js`
   - Verify python/node/ffmpeg/model files before processing
3. [x] Implement fallback chain in orchestrator
   - Native voice bubble -> audio attachment -> text fallback
4. [x] Add per-language voice map
   - `en-us -> af_sarah` (default)
   - `es -> ef_dora`
5. [x] Add config reference doc
   - Map which env vars/config keys are required vs optional
6. [x] Add backend switch + fallback (`kokoro|qwen3`)
   - Include runtime flags and env defaults
7. [x] Stabilize Qwen on Windows
   - SoX installed, Qwen init done, `default` voice profile created
8. [x] Add consent-gated voice cloning flow
   - `scripts/clone_voice.js`
   - `references/voice-cloning.md`
9. [x] Add voice listing + persistent per-user voice/backend preferences
   - `scripts/list_voices.js`
   - `scripts/voice_preferences.js`
   - persisted in `references/voice-preferences.json`

---

## 5) Definition of done (for “shareable skill v1”)

- Fresh machine setup documented and reproducible
- EN/ES voice-in -> voice-out validated
- No hardcoded user-specific paths required
- One-command smoke test passes
- Failure modes are explicit and recoverable

---

## 6) Stretch goals

- Auto-select voice by detected speaker/language profile
- Optional qwen3-tts backend path for voice cloning
- Latency optimization and chunked/streamed playback
- Optional telemetry log (local only) for quality tuning
- Public repo issue reporting pipeline with dedupe + safe redaction (`references/bug-reporting.md`)

---

## 7) Notes for future sessions

- Keep development in workspace until v1 is stable.
- Do **not** publish yet.
- Once stable: copy to global skills and/or package.
- Treat Discord native voice-bubble path as canonical for UX parity.
