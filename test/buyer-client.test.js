import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDealSearchUrl,
  createPaidFetch,
  isPaymentRequired,
  requestJsonWithPayment,
  requireBuyerPrivateKey,
} from '../src/buyer-client.js';

test('buildDealSearchUrl creates encoded Dealar deal intelligence URL', () => {
  const url = buildDealSearchUrl('https://api.dealar.test', {
    query: 'whoop 5.0',
    regions: ['us', 'eu'],
  });

  assert.equal(url, 'https://api.dealar.test/v1/deals/search?query=whoop+5.0&regions=us%2Ceu');
});

test('isPaymentRequired detects HTTP 402 responses', () => {
  assert.equal(isPaymentRequired({ status: 402 }), true);
  assert.equal(isPaymentRequired({ status: 200 }), false);
});

test('requireBuyerPrivateKey validates missing and placeholder private keys', () => {
  assert.throws(() => requireBuyerPrivateKey(''), /DEALAR_BUYER_EVM_PRIVATE_KEY/);
  assert.throws(() => requireBuyerPrivateKey('0xYOUR_PRIVATE_KEY'), /DEALAR_BUYER_EVM_PRIVATE_KEY/);
  assert.equal(requireBuyerPrivateKey('0x' + '1'.repeat(64)), '0x' + '1'.repeat(64));
});

test('createPaidFetch uses demo payment header in demo mode', async () => {
  const calls = [];
  const fakeFetch = async (url, options = {}) => {
    calls.push({ url, options });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  };

  const paidFetch = await createPaidFetch({ mode: 'demo', fetchImpl: fakeFetch });
  const response = await paidFetch('https://api.dealar.test/v1/deals/search');

  assert.equal(response.status, 200);
  assert.equal(calls[0].options.headers['x-dealar-paid'], 'demo');
});

test('requestJsonWithPayment returns parsed JSON and payment metadata', async () => {
  const paidFetch = async () => new Response(JSON.stringify({ answer: 42 }), {
    status: 200,
    headers: { 'payment-response': 'receipt_123', 'content-type': 'application/json' },
  });

  const result = await requestJsonWithPayment('https://api.dealar.test/v1/deals/search', { paidFetch });

  assert.deepEqual(result.body, { answer: 42 });
  assert.equal(result.status, 200);
  assert.equal(result.paymentResponse, 'receipt_123');
});
