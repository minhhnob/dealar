import test from 'node:test';
import assert from 'node:assert/strict';

import { executeCliAction, parseCliPayload } from '../src/cli-actions.js';

test('parseCliPayload accepts JSON string payloads', () => {
  const payload = parseCliPayload('{"action":"deal.search","params":{"query":"whoop"}}');
  assert.equal(payload.action, 'deal.search');
  assert.equal(payload.params.query, 'whoop');
});

test('parseCliPayload rejects malformed JSON with structured error', () => {
  assert.throws(() => parseCliPayload('{nope'), /Invalid JSON payload/);
});

test('executeCliAction supports deal.search with normalized params', async () => {
  const result = await executeCliAction({ action: 'deal.search', params: { query: 'whoop', regions: ['us', 'eu'] } });
  assert.equal(result.ok, true);
  assert.equal(result.result.query, 'whoop');
  assert.ok(result.result.best_deals.some((deal) => deal.merchant === 'WHOOP Official'));
});

test('executeCliAction supports retailers.list, coupon.verify, wallet.policy, and dashboard.summary', async () => {
  const retailers = await executeCliAction({ action: 'retailers.list', params: { category: 'beauty', markets: ['eu'] } });
  assert.equal(retailers.ok, true);
  assert.ok(retailers.result.retailers.every((retailer) => retailer.market === 'eu'));

  const coupon = await executeCliAction({ action: 'coupon.verify', params: { merchant: 'lookfantastic', code: 'WELCOME20', region: 'uk' } });
  assert.equal(coupon.ok, true);
  assert.equal(coupon.result.valid, true);

  const wallet = await executeCliAction({ action: 'wallet.policy', params: { apiBaseUrl: 'https://api.dealar.test', dailyLimitUsdc: '1.00' } });
  assert.equal(wallet.ok, true);
  assert.equal(wallet.result.walletLabel, 'dealar-agent');
  assert.deepEqual(wallet.result.allowlistedBaseUrls, ['https://api.dealar.test']);

  const dashboard = await executeCliAction({ action: 'dashboard.summary', params: { apiBaseUrl: 'https://api.dealar.test' } });
  assert.equal(dashboard.ok, true);
  assert.equal(dashboard.result.brand.name, 'Dealar');
  assert.ok(dashboard.result.metrics.endpoints >= 3);
});

test('executeCliAction returns structured error for unknown actions', async () => {
  const result = await executeCliAction({ action: 'unknown.action', params: {} });
  assert.equal(result.ok, false);
  assert.match(result.error, /Unknown action/);
});
