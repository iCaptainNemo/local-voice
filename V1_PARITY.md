# V1_PARITY.md

Goal: Preserve behavior from pre-plugin migration while modularizing internals.

## Checklist

- [x] Discord voice send works
- [ ] Telegram live send test (pending account for live verification)
- [x] Kokoro backend works
- [x] Qwen3 backend path works when voice exists
- [x] Qwen3 fallback to Kokoro works
- [x] Persistent voice preferences work
- [x] Voice cloning flow works
- [x] Smoke checks pass after refactor

## Latest verification run

Date: 2026-02-24

1. Discord + Kokoro
- Result: PASS
- Message ID: 1475649042246664414

2. Discord + Qwen3 + fallback
- Result: PASS (fallback executed)
- Qwen attempted, failed with missing voice `default` in current runtime profile set, then Kokoro fallback succeeded.
- Message ID: 1475649068129714398

3. Service healthcheck
- Result: PASS
- Command: `node src/services/healthcheck.js`

## Notes

- Qwen voice availability can differ after restarts/profile resets; fallback behavior is therefore important and currently functioning.
- Telegram path is implemented and needs live channel/account verification before checking final parity box.
