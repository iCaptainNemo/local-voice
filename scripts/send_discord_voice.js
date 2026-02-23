#!/usr/bin/env node
const fs = require('fs');

async function main() {
  const args = process.argv.slice(2);
  const get = (name, dflt = undefined) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : dflt;
  };

  const channelId = get('channel');
  const audioPath = get('file');
  const accountId = get('account', 'main');
  const duration = parseFloat(get('duration', '5.0'));
  const waveform = get('waveform', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==');

  if (!channelId || !audioPath) {
    throw new Error('Usage: --channel <id> --file <ogg-path> [--account main]');
  }

  const cfgPath = process.env.OPENCLAW_CONFIG_PATH || `${process.env.USERPROFILE}\\.openclaw\\openclaw.json`;
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const token = cfg?.channels?.discord?.accounts?.[accountId]?.token;
  if (!token) throw new Error(`Missing Discord token for account: ${accountId}`);

  const file = fs.readFileSync(audioPath);

  const up = await fetch(`https://discord.com/api/v10/channels/${channelId}/attachments`, {
    method: 'POST',
    headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: [{ filename: 'voice-message.ogg', file_size: file.length, id: '0' }] })
  });
  if (!up.ok) throw new Error(`attachments failed: ${up.status} ${await up.text()}`);
  const upj = await up.json();
  const a = upj.attachments?.[0];
  if (!a) throw new Error('No attachment upload URL returned');

  const put = await fetch(a.upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': 'audio/ogg' },
    body: file
  });
  if (!put.ok) throw new Error(`upload put failed: ${put.status}`);

  const payload = {
    flags: 8192,
    attachments: [{
      id: '0',
      filename: 'voice-message.ogg',
      uploaded_filename: a.upload_filename,
      duration_secs: duration,
      waveform
    }]
  };

  const msg = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const text = await msg.text();
  if (!msg.ok) throw new Error(`voice message failed: ${msg.status} ${text}`);
  const data = JSON.parse(text);
  console.log(JSON.stringify({ ok: true, messageId: data.id, channelId: data.channel_id }));
}

main().catch((e) => {
  console.error(e.message || String(e));
  process.exit(1);
});
