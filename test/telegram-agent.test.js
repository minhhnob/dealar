import test from 'node:test';
import assert from 'node:assert/strict';

import { answerTelegramDealRequest, buildTelegramSetupGuide } from '../src/telegram-agent.js';

test('answerTelegramDealRequest returns help for start messages', () => {
  const answer = answerTelegramDealRequest({ text: '/start', baseUrl: 'https://dealar.example' });

  assert.equal(answer.ok, true);
  assert.equal(answer.intent, 'help');
  assert.match(answer.message, /Dealar Agent/);
  assert.match(answer.message, /săn deal Dyson Airwrap/);
});

test('answerTelegramDealRequest handles natural-language deal hunting', () => {
  const answer = answerTelegramDealRequest({ text: 'săn deal Dyson Airwrap dưới 350$' });

  assert.equal(answer.ok, true);
  assert.equal(answer.intent, 'deal');
  assert.match(answer.query, /Dyson Airwrap/i);
  assert.match(answer.message, /Dealer check/i);
  assert.ok(answer.artifacts.some((artifact) => artifact.type === 'Deal Search'));
});

test('answerTelegramDealRequest handles voucher, quote, scout, and ticket intents', () => {
  const voucher = answerTelegramDealRequest({ text: 'tìm voucher WHOOP hôm nay' });
  assert.equal(voucher.intent, 'coupon');
  assert.match(voucher.message, /Dealer coupons/);

  const quote = answerTelegramDealRequest({ text: 'check giá iPhone 15 Pro Max' });
  assert.equal(quote.intent, 'quote');
  assert.match(quote.message, /Báo giá Dealar/);

  const report = answerTelegramDealRequest({ text: '/scout Dior Sauvage' });
  assert.equal(report.intent, 'report');
  assert.match(report.message, /Scout Report/);

  const ticket = answerTelegramDealRequest({ text: '/ticket Dyson Airwrap' });
  assert.equal(ticket.intent, 'ticket');
  assert.match(ticket.message, /Arc Testnet/);
});

test('buildTelegramSetupGuide exposes webhook setup metadata', () => {
  const guide = buildTelegramSetupGuide({ baseUrl: 'https://dealar.example' });

  assert.equal(guide.webhookEndpoint, 'https://dealar.example/v1/telegram/dealar-agent');
  assert.equal(guide.network.caip2, 'eip155:5042002');
  assert.ok(guide.supportedMessages.length >= 5);
});
