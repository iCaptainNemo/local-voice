function preflightCommon({ channelKind, channel, account, normalizeTargetId, readDiscordToken, readTelegramToken }) {
  const issues = [];
  const target = normalizeTargetId(channel);
  if (!target) issues.push('missing target channel/chat id');

  if (channelKind === 'discord') {
    const token = readDiscordToken(account);
    if (!token) issues.push(`missing discord token for account: ${account}`);
  } else if (channelKind === 'telegram') {
    const token = readTelegramToken(account);
    if (!token) issues.push(`missing telegram bot token for account: ${account}`);
  } else {
    issues.push(`unsupported channel-kind: ${channelKind}`);
  }

  if (issues.length) throw new Error(`preflight failed:\n- ${issues.join('\n- ')}`);
}

module.exports = { preflightCommon };
