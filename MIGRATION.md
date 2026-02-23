# Migration: Skill -> Plugin

Current repo contains a working skill implementation (`SKILL.md`, `scripts/`, `references/`).

Plugin migration strategy:
1. Preserve skill as reference baseline.
2. Build plugin runtime under `plugin/` + `src/`.
3. Move reusable logic into shared modules in `src/`.
4. Keep wrappers in `scripts/` for local operator workflows.
5. Validate parity with smoke tests before promoting plugin as default.

No existing files are removed during bootstrap.
