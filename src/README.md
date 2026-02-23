# src/ (plugin transition)

This directory contains extracted services from the current skill scripts.

## Extracted services (step 2 start)
- `services/runtime.js` - argument parsing + command execution helpers
- `services/config.js` - OpenClaw config + channel token readers
- `services/language.js` - language normalization + locale fallback
- `plugin/index.js` - plugin bootstrap entry scaffold

Current scripts in `scripts/` remain the production baseline during migration.
