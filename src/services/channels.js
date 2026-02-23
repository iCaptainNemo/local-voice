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

module.exports = { normalizeTargetId, parseTelegramTarget, sendTyping, sendPrimaryVoice };
