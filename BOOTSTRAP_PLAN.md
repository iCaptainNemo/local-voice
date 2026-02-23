# Plugin Bootstrap Plan (dev)

## Phase 1
- Create plugin scaffold (`plugin/`, `src/`, `docs/`)
- Add manifest/config skeleton
- Keep existing skill files intact

## Phase 2
- Extract shared services from `scripts/` into plugin service modules
- Wire backend selection (kokoro/qwen3 + fallback)
- Add channel adapters (discord/telegram)

## Phase 3
- Inbound voice handler + STT typing/progress presence
- Persistent preferences integration
- Clone flow + consent guard

## Phase 4
- Smoke tests + operator docs + migration notes
- PR review on `dev` then merge to `main`
