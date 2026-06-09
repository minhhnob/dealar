import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createPaymentChallenge,
  listRetailers,
  searchDeals,
  verifyCoupon,
} from '../src/deal-intelligence.js';

test('searchDeals returns ranked WHOOP deal intelligence for US and EU markets', () => {
  const result = searchDeals({ query: 'WHOOP', regions: ['us', 'eu'] });

  assert.equal(result.query, 'whoop');
  assert.deepEqual(result.regions, ['us', 'eu']);
  assert.ok(result.checked_at);
  assert.ok(result.best_deals.length >= 4);
  assert.equal(result.best_deals[0].merchant, 'WHOOP Official');
  assert.ok(result.best_deals.some((deal) => deal.source_type === 'community_deal'));
  assert.ok(result.best_deals.every((deal) => deal.confidence >= 0 && deal.confidence <= 1));
  assert.match(result.recommendation, /official|slickdeals/i);
});

test('listRetailers filters beauty retailers by market and returns sorted confidence', () => {
  const result = listRetailers({ category: 'beauty', markets: ['us', 'eu'] });

  assert.equal(result.category, 'beauty');
  assert.deepEqual(result.markets, ['us', 'eu']);
  assert.ok(result.retailers.length >= 8);
  assert.ok(result.retailers.some((retailer) => retailer.name === 'Ulta Beauty'));
  assert.ok(result.retailers.some((retailer) => retailer.name === 'Lookfantastic'));
  for (let i = 1; i < result.retailers.length; i += 1) {
    assert.ok(result.retailers[i - 1].confidence >= result.retailers[i].confidence);
  }
});

test('verifyCoupon returns known coupon metadata and unknown fallback', () => {
  const known = verifyCoupon({ merchant: 'lookfantastic', code: 'WELCOME20', region: 'uk' });
  assert.equal(known.valid, true);
  assert.equal(known.discount, '20%');
  assert.match(known.conditions, /new customers/i);

  const unknown = verifyCoupon({ merchant: 'ulta', code: 'NOTREAL', region: 'us' });
  assert.equal(unknown.valid, false);
  assert.equal(unknown.confidence, 0.2);
  assert.match(unknown.message, /not in curated/i);
});

test('createPaymentChallenge produces x402-compatible payment challenge metadata', () => {
  const challenge = createPaymentChallenge({ endpoint: '/v1/deals/search', tier: 'full_report' });

  assert.equal(challenge.status, 402);
  assert.equal(challenge.currency, 'USDC');
  assert.equal(challenge.price_usdc, '0.25');
  assert.deepEqual(challenge.protocols, ['x402', 'MPP']);
  assert.ok(challenge.payment_id.startsWith('pay_'));
  assert.ok(challenge.instructions.includes('Retry'));
});
