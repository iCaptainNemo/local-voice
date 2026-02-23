# local-voice bug reporting design (plugin-ready)

## Goal
Provide a safe, low-friction flow to report **non-OS-specific** bugs to a public GitHub repo with dedupe, voting, and optional automation hooks.

## Scope
- In scope:
  - Cross-platform logic bugs
  - Model/backend integration bugs (Kokoro/Qwen/fallback logic)
  - Channel-agnostic behavior bugs
- Out of scope:
  - Host-only issues (driver quirks, PATH-specific local setup)
  - Secrets/token/account support requests

## Preconditions
- `gh` CLI installed
- User is authenticated (`gh auth status`)
- Target repo configured and allowlisted
- User approval required before external posting (default)

## UX flow

1. User asks to report issue (or agent suggests it).
2. Agent builds sanitized draft:
   - title
   - summary
   - repro steps
   - expected vs actual
   - environment fingerprint (safe subset)
   - logs (redacted)
3. Agent searches existing issues first.
4. If likely duplicate:
   - show top matches
   - user chooses: upvote/comment or create new
5. If new:
   - show final preview
   - require explicit confirmation
   - post via `gh issue create`

## Dedupe strategy

- Search by:
  - error signature
  - backend (`kokoro|qwen3`)
  - channel (`discord|telegram|...`)
  - keywords from stack trace
- Matching policy:
  - exact signature match => suggest existing issue first
  - fuzzy semantic match => present top 3 candidates with confidence

## Safety and privacy

Always redact:
- API keys / tokens / cookies
- absolute local paths when not needed
- user identifiers unless user opts in
- full raw logs by default (use excerpts)

Require approval before:
- creating issue
- posting comments
- reacting/upvoting

## Issue template schema

```yaml
title: "[local-voice] <short bug title>"
labels:
  - bug
  - local-voice
  - backend:<kokoro|qwen3>
  - channel:<discord|other>
body:
  summary: <1-3 lines>
  impact: <who/what breaks>
  repro_steps:
    - step 1
    - step 2
  expected: <text>
  actual: <text>
  logs_excerpt: |
    <sanitized>
  environment:
    openclaw_version: <...>
    plugin_or_skill_version: <...>
    os_family: <windows|macos|linux>
    backend: <...>
    ffmpeg: <version>
    sox: <version or n/a>
```

## Commands (proposed)

- `local-voice report --repo owner/repo --dry-run`
- `local-voice report --repo owner/repo --confirm`
- `local-voice report --repo owner/repo --dedupe-only`

## Auto-fix pipeline hook (future)

When issue is created/linked:
1. enqueue triage task
2. attempt reproduction in isolated run
3. if fixed, create PR and link back to issue
4. optionally notify user in-chat

## MVP implementation order

1. Add `report_issue.js` with dry-run preview only
2. Add dedupe search + top match presentation
3. Add create/comment/react actions behind explicit confirmation
4. Add sanitization utility with tests
5. Add optional auto-fix hook integration
