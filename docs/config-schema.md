# Plugin Config Skeleton

```json
{
  "provider": {
    "primary": "kokoro",
    "fallback": "qwen3"
  },
  "channels": {
    "discord": { "enabled": true },
    "telegram": { "enabled": true }
  },
  "typing": {
    "sttPresence": true,
    "refreshSeconds": 3
  }
}
```

TODO: map to final OpenClaw plugin schema.
