import { answerTelegramDealRequest } from './telegram-agent.js';

const TELEGRAM_API_BASE = 'https://api.telegram.org';

function getBotToken(env = process.env) {
  return env.DEALAR_TELEGRAM_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN || '';
}

export function extractTelegramMessage(update = {}) {
  const message = update.message || update.edited_message || update.channel_post || update.callback_query?.message || null;
  const callbackText = update.callback_query?.data;
  return {
    chatId: message?.chat?.id,
    userId: message?.from?.id || update.callback_query?.from?.id || 'telegram-user',
    text: callbackText || message?.text || message?.caption || '',
    messageId: message?.message_id,
    updateId: update.update_id,
  };
}

export function buildTelegramSendMessagePayload({ chatId, text, replyToMessageId } = {}) {
  return {
    chat_id: chatId,
    text,
    disable_web_page_preview: false,
    ...(replyToMessageId ? { reply_to_message_id: replyToMessageId } : {}),
  };
}

export async function sendTelegramMessage({ token, chatId, text, replyToMessageId, fetchImpl = fetch } = {}) {
  if (!token) return { ok: false, skipped: true, error: 'missing_telegram_bot_token' };
  if (!chatId) return { ok: false, skipped: true, error: 'missing_chat_id' };

  const response = await fetchImpl(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildTelegramSendMessagePayload({ chatId, text, replyToMessageId })),
  });
  const body = await response.json().catch(() => ({}));
  return { ok: response.ok && body.ok !== false, status: response.status, body };
}

export async function handleTelegramWebhook({ update = {}, baseUrl = 'https://prodeal-api.vercel.app', token = getBotToken(), fetchImpl = fetch } = {}) {
  const incoming = extractTelegramMessage(update);
  if (!incoming.chatId) {
    return { ok: true, ignored: true, reason: 'no_chat_id', incoming };
  }

  const answer = answerTelegramDealRequest({
    text: incoming.text || '/help',
    baseUrl,
    userId: incoming.userId,
  });

  const delivery = await sendTelegramMessage({
    token,
    chatId: incoming.chatId,
    text: answer.message,
    replyToMessageId: incoming.messageId,
    fetchImpl,
  });

  return { ok: true, incoming, answer, delivery };
}

export function buildTelegramWebhookSetup({ baseUrl = 'https://prodeal-api.vercel.app', secretTokenConfigured = false, botTokenConfigured = Boolean(getBotToken()) } = {}) {
  return {
    name: 'Dealar Telegram Bot Webhook',
    webhookUrl: `${baseUrl}/v1/telegram/webhook`,
    setWebhookUrl: `${TELEGRAM_API_BASE}/bot<TELEGRAM_BOT_TOKEN>/setWebhook`,
    requiredEnv: ['DEALAR_TELEGRAM_BOT_TOKEN'],
    optionalEnv: ['DEALAR_TELEGRAM_WEBHOOK_SECRET'],
    botTokenConfigured,
    secretTokenConfigured,
    supportedMessages: [
      'săn deal Dyson Airwrap dưới 350$',
      'check giá iPhone 15 Pro Max',
      'tìm voucher Sephora skincare',
      '/scout Dior Sauvage',
      '/ticket Dyson Airwrap',
    ],
    network: { name: 'Arc Testnet', caip2: 'eip155:5042002' },
  };
}
