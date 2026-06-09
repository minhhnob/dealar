import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../src/server.js';

test('server exposes Dealer-native scout routes for corrected product target', async () => {
  const app = await createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const capabilities = await fetch(`${baseUrl}/v1/scout/capabilities`).then((res) => res.json());
    assert.equal(capabilities.card.type, 'Dealer Capability Card');
    assert.ok(capabilities.card.capabilities.some((item) => item.id === 'scout.report'));

    const skills = await fetch(`${baseUrl}/v1/scout/skills`).then((res) => res.json());
    assert.equal(skills.manifest.name, 'Dealar Skill System');
    assert.ok(skills.manifest.skills.some((item) => item.id === 'dealar.payment.policy'));
    assert.match(skills.telegramSummary, /Deal Request Ticket/);

    const telegramHealth = await fetch(`${baseUrl}/v1/telegram/dealar-agent/health`).then((res) => res.json());
    assert.equal(telegramHealth.ok, true);
    assert.equal(telegramHealth.setup.network.caip2, 'eip155:5042002');

    const telegramAnswer = await fetch(`${baseUrl}/v1/telegram/dealar-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'săn deal Dyson Airwrap dưới 350$' }),
    }).then((res) => res.json());
    assert.equal(telegramAnswer.ok, true);
    assert.match(telegramAnswer.message, /Dealer check/);

    const webhookSetup = await fetch(`${baseUrl}/v1/telegram/webhook/setup`).then((res) => res.json());
    assert.equal(webhookSetup.ok, true);
    assert.equal(webhookSetup.setup.webhookUrl, `${baseUrl}/v1/telegram/webhook`);
    assert.equal(webhookSetup.setup.network.caip2, 'eip155:5042002');

    const webhookMissingToken = await fetch(`${baseUrl}/v1/telegram/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: { message_id: 7, text: '/start', chat: { id: 99 }, from: { id: 42 } } }),
    }).then((res) => {
      assert.equal(res.status, 200);
      return res.json();
    });
    assert.equal(webhookMissingToken.ok, true);
    assert.equal(webhookMissingToken.delivery.error, 'missing_telegram_bot_token');

    const report = await fetch(`${baseUrl}/v1/scout/report?query=Dyson%20Airwrap`).then((res) => res.json());
    assert.equal(report.type, 'Scout Report');
    assert.equal(report.query, 'Dyson Airwrap');
    assert.ok(report.telegramSummary.includes('Dealer Scout Report'));

    const ticket = await fetch(`${baseUrl}/v1/scout/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Sephora skincare', capabilityId: 'scout.report' }),
    }).then((res) => {
      assert.equal(res.status, 201);
      return res.json();
    });
    assert.equal(ticket.ticket.type, 'Deal Request Ticket');
    assert.equal(ticket.ticket.capabilityId, 'scout.report');

    const receipt = await fetch(`${baseUrl}/v1/scout/receipts?query=Dior%20Sauvage`).then((res) => res.json());
    assert.equal(receipt.receipt.type, 'Deal Receipt');
    assert.equal(receipt.receipt.query, 'Dior Sauvage');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
