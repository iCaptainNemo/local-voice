const fs = require('fs');

function readConfig() {
  const cfgPath = process.env.OPENCLAW_CONFIG_PATH || `${process.env.USERPROFILE}\\.openclaw\\openclaw.json`;
  return JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
}

function readDiscordToken(account = 'main') {
  const cfg = readConfig();
  return cfg?.channels?.discord?.accounts?.[account]?.token || null;
}

function readTelegramToken(account = 'main') {
  const cfg = readConfig();
  return cfg?.channels?.telegram?.accounts?.[account]?.botToken || cfg?.channels?.telegram?.botToken || process.env.TELEGRAM_BOT_TOKEN || null;
}

module.exports = { readConfig, readDiscordToken, readTelegramToken };
