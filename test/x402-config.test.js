import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildX402RouteConfig,
  getX402Environment,
  priceTierToUsd,
  requireReceiverAddress,
} from '../src/x402-config.js';

test('priceTierToUsd maps Dealar endpoint tiers to dollar prices', () => {
  assert.equal(priceTierToUsd('coupon_verify'), '$0.01');
  assert.equal(priceTierToUsd('basic'), '$0.05');
  assert.equal(priceTierToUsd('full_report'), '$0.25');
  assert.equal(priceTierToUsd('unknown'), '$0.05');
});

test('requireReceiverAddress rejects missing placeholder receiver addresses', () => {
  assert.throws(() => requireReceiverAddress(''), /DEALAR_EVM_ADDRESS/);
  assert.throws(() => requireReceiverAddress('0xYourEvmAddress'), /DEALAR_EVM_ADDRESS/);
  assert.equal(
    requireReceiverAddress('0x1111111111111111111111111111111111111111'),
    '0x1111111111111111111111111111111111111111',
  );
});

test('getX402Environment defaults to Base Sepolia facilitator settings', () => {
  const env = getX402Environment({ DEALAR_EVM_ADDRESS: '0x1111111111111111111111111111111111111111' });

  assert.equal(env.enabled, true);
  assert.equal(env.network, 'eip155:84532');
  assert.equal(env.facilitatorUrl, 'https://x402.org/facilitator');
  assert.equal(env.payTo, '0x1111111111111111111111111111111111111111');
});

test('buildX402RouteConfig returns x402 exact payment requirements for paid endpoints', () => {
  const config = buildX402RouteConfig({
    payTo: '0x1111111111111111111111111111111111111111',
    network: 'eip155:84532',
  });

  assert.equal(config['GET /v1/deals/search'].accepts.scheme, 'exact');
  assert.equal(config['GET /v1/deals/search'].accepts.price, '$0.25');
  assert.equal(config['GET /v1/deals/search'].accepts.network, 'eip155:84532');
  assert.equal(config['GET /v1/deals/search'].accepts.payTo, '0x1111111111111111111111111111111111111111');
  assert.equal(config['POST /v1/coupons/verify'].accepts.price, '$0.01');
  assert.match(config['GET /v1/retailers'].description, /retailer/i);
});
