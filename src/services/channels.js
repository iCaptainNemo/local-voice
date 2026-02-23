const fs = require('fs');
const path = require('path');

function normalizeTargetId(channelIdOrTarget) {
  const raw = String(channelIdOrTarget || '').trim();
  if (!raw) return '';
  if (raw.startsWith('channel:')) return raw.slice('channel:'.length);
  return raw;
}

function parseTelegramTarget(target) {
  const raw = normalizeTargetId(target);
  const topicMatch = raw.match(/^(.*?):topic:(\d+)$/);
  if (topicMatch) {
    return { chatId: topicMatch[1], messageThreadId: topicMatch[2] };
  }
  return { chatId: raw, messageThreadId: null };
}

async function sendTyping({ channelKind, channelId, account='main', readDiscordToken, readTelegramToken }) {
  try {
    if (channelKind === 'discord') {
      const token = readDiscordToken(account);
      const ch = normalizeTargetId(channelId);
      if (!token || !ch) return;
      await fetch(`https://discord.com/api/v10/channels/${ch}/typing`, { method:'POST', headers:{ Authorization:`Bot ${token}` } });
      return;
    }
    if (channelKind === 'telegram') {
      const token = readTelegramToken(account);
      const { chatId, messageThreadId } = parseTelegramTarget(channelId);
      if (!token || !chatId) return;
      const form = new URLSearchParams();
      form.set('chat_id', chatId);
      form.set('action', 'record_voice');
      if (messageThreadId) form.set('message_thread_id', messageThreadId);
      await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
        method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded' }, body:form.toString()
      });
    }
  } catch {}
}

async function sendPrimaryVoice({ channelKind, channelId, account='main', oggPath, readDiscordToken, readTelegramToken, run }) {
  if (channelKind === 'discord') {
    const ch = normalizeTargetId(channelId);
    run('node', [path.join(__dirname, '..', '..', 'scripts', 'send_discord_voice.js'), '--channel', ch, '--file', oggPath, '--account', account]);
    return { ok:true, mode:'discord-voice' };
  }
  if (channelKind === 'telegram') {
    const token = readTelegramToken(account);
    const { chatId, messageThreadId } = parseTelegramTarget(channelId);
    const file = fs.readFileSync(oggPath);
    const form = new FormData();
    form.append('chat_id', chatId);
    if (messageThreadId) form.append('message_thread_id', String(messageThreadId));
    form.append('voice', new Blob([file]), path.basename(oggPath));
    const res = await fetch(`https://api.telegram.org/bot${token}/sendVoice`, { method:'POST', body:form });
    if (!res.ok) throw new Error(`telegram sendVoice failed: ${res.status}`);
    const j = await res.json();
    if (!j.ok) throw new Error(`telegram sendVoice api error: ${JSON.stringify(j)}`);
    return { ok:true, mode:'telegram-voice', result:j.result };
  }
  throw new Error(`unsupported channel-kind: ${channelKind}`);
}

module.exports = { normalizeTargetId, parseTelegramTarget, sendTyping, sendPrimaryVoice, sendRegularAudioAttachment, sendTextFallback };

async function sendRegularAudioAttachment({ channelKind, channelId, account='main', filePath, readDiscordToken, readTelegramToken }) {
  const file = fs.readFileSync(filePath);

  if (channelKind === 'discord') {
    const token = readDiscordToken(account);
    const ch = normalizeTargetId(channelId);

    const up = await fetch(`https://discord.com/api/v10/channels/${ch}/attachments`, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: [{ filename: path.basename(filePath), file_size: file.length, id: '0' }] })
    });
    if (!up.ok) throw new Error(`attachment upload-url failed: ${up.status}`);
    const upj = await up.json();
    const a = upj.attachments?.[0];
    if (!a) throw new Error('attachment upload-url missing payload');

    const put = await fetch(a.upload_url, { method: 'PUT', body: file });
    if (!put.ok) throw new Error(`attachment upload failed: ${put.status}`);

    const msg = await fetch(`https://discord.com/api/v10/channels/${ch}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ attachments: [{ id: '0', filename: path.basename(filePath), uploaded_filename: a.upload_filename }] })
    });
    if (!msg.ok) throw new Error(`attachment message failed: ${msg.status}`);
    return await msg.json();
  }

  if (channelKind === 'telegram') {
    const token = readTelegramToken(account);
    const { chatId, messageThreadId } = parseTelegramTarget(channelId);
    const form = new FormData();
    form.append('chat_id', chatId);
    if (messageThreadId) form.append('message_thread_id', String(messageThreadId));
    form.append('audio', new Blob([file]), path.basename(filePath));

    const res = await fetch(`https://api.telegram.org/bot${token}/sendAudio`, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`telegram sendAudio failed: ${res.status}`);
    const j = await res.json();
    if (!j.ok) throw new Error(`telegram sendAudio api error: ${JSON.stringify(j)}`);
    return j;
  }

  throw new Error(`unsupported channel-kind: ${channelKind}`);
}

async function sendTextFallback({ channelKind, channelId, account='main', text, readDiscordToken, readTelegramToken }) {
  if (channelKind === 'discord') {
    const token = readDiscordToken(account);
    const ch = normalizeTargetId(channelId);
    const msg = await fetch(`https://discord.com/api/v10/channels/${ch}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text })
    });
    if (!msg.ok) throw new Error(`text fallback failed: ${msg.status}`);
    return await msg.json();
  }

  if (channelKind === 'telegram') {
    const token = readTelegramToken(account);
    const { chatId, messageThreadId } = parseTelegramTarget(channelId);
    const form = new URLSearchParams();
    form.set('chat_id', chatId);
    form.set('text', text);
    if (messageThreadId) form.set('message_thread_id', String(messageThreadId));
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString()
    });
    if (!res.ok) throw new Error(`telegram text fallback failed: ${res.status}`);
    const j = await res.json();
    if (!j.ok) throw new Error(`telegram sendMessage api error: ${JSON.stringify(j)}`);
    return j;
  }

  throw new Error(`unsupported channel-kind: ${channelKind}`);
}

