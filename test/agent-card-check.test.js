import test from 'node:test';
import assert from 'node:assert/strict';

import { buildAgentCard, buildProductionCheck } from '../src/agent-card.js';

test('buildAgentCard returns Loom-style Dealar identity and service metadata', () => {
  const card = buildAgentCard({ baseUrl: 'https://prodeal-api.vercel.app' });

  assert.equal(card.name, 'Dealar');
  assert.equal(card.network.name, 'Arc Testnet');
  assert.equal(card.identity.platform, 'Loom on Arc');
  assert.equal(card.services.length, 3);
  assert.ok(card.capabilities.includes('telegram-production-check'));
  assert.equal(card.links.dashboard, 'https://prodeal-api.vercel.app/dashboard');
  assert.equal(card.telegram.commands[0], 'check Dealar');
});

test('buildProductionCheck returns Telegram-friendly status summary', () => {
  const check = buildProductionCheck({ baseUrl: 'https://prodeal-api.vercel.app' });

  assert.equal(check.ok, true);
  assert.equal(check.paymentMode, 'demo');
  assert.equal(check.services, 3);
  assert.equal(check.receipts, 3);
  assert.equal(check.revenueUsdc, '0.31');
  assert.ok(check.message.includes('Dealar production OK'));
  assert.ok(check.message.includes('Services: 3'));
  assert.equal(check.links.dashboard, 'https://prodeal-api.vercel.app/dashboard');
});
