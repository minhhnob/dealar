import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTelegramSendMessagePayload,
  buildTelegramWebhookSetup,
  extractTelegramMessage,
  handleTelegramWebhook,
} from '../src/telegram-bot-webhook.js';

test('extractTelegramMessage normalizes Telegram message updates', () => {
  const incoming = extractTelegramMessage({
    update_id: 123,
    message: {
      message_id: 9,
      text: 'săn deal Dyson Airwrap dưới 350$',
      from: { id: 42 },
      chat: { id: 99 },
    },
  });

  assert.equal(incoming.updateId, 123);
  assert.equal(incoming.messageId, 9);
  assert.equal(incoming.userId, 42);
  assert.equal(incoming.chatId, 99);
  assert.equal(incoming.text, 'săn deal Dyson Airwrap dưới 350$');
});

test('buildTelegramSendMessagePayload creates Bot API payload', () => {
  const payload = buildTelegramSendMessagePayload({ chatId: 99, text: 'hello', replyToMessageId: 9 });

  assert.equal(payload.chat_id, 99);
  assert.equal(payload.text, 'hello');
  assert.equal(payload.parse_mode, undefined);
  assert.equal(payload.reply_to_message_id, 9);
});

test('handleTelegramWebhook answers and sends message through injected fetch', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200, json: async () => ({ ok: true, result: { message_id: 10 } }) };
  };

  const result = await handleTelegramWebhook({
    token: 'test-token',
    baseUrl: 'https://dealar.example',
    fetchImpl,
    update: {
      message: {
        message_id: 9,
        text: 'check giá iPhone 15 Pro Max',
        from: { id: 42 },
        chat: { id: 99 },
      },
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.answer.intent, 'quote');
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /api\.telegram\.org\/bottest-token\/sendMessage/);
  const sent = JSON.parse(calls[0].options.body);
  assert.equal(sent.chat_id, 99);
  assert.match(sent.text, /Báo giá Dealar/);
});

test('handleTelegramWebhook acknowledges Telegram even when delivery is skipped', async () => {
  const result = await handleTelegramWebhook({
    token: '',
    update: { message: { text: '/start', chat: { id: 99 }, from: { id: 42 } } },
  });

  assert.equal(result.ok, true);
  assert.equal(result.delivery.error, 'missing_telegram_bot_token');
});

test('buildTelegramWebhookSetup exposes setup metadata without leaking token', () => {
  const setup = buildTelegramWebhookSetup({ baseUrl: 'https://dealar.example', botTokenConfigured: true, secretTokenConfigured: true });

  assert.equal(setup.webhookUrl, 'https://dealar.example/v1/telegram/webhook');
  assert.equal(setup.setWebhookPayload.url, 'https://dealar.example/v1/telegram/webhook');
  assert.deepEqual(setup.setWebhookPayload.allowed_updates, ['message', 'edited_message', 'channel_post', 'callback_query']);
  assert.ok(setup.commands.some((command) => command.command === 'deal'));
  assert.equal(setup.botTokenConfigured, true);
  assert.equal(setup.secretTokenConfigured, true);
  assert.equal(setup.network.caip2, 'eip155:5042002');
});
