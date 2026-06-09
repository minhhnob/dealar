import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTelegramDealSummary,
  listDealerSources,
  quoteProduct,
  searchDealerDeals,
  searchDealerCoupons,
} from '../src/dealer-scout.js';

test('listDealerSources exposes Amazon, eBay, Sephora, and Slickdeals adapters', () => {
  assert.deepEqual(listDealerSources().map((source) => source.id), ['amazon', 'ebay', 'sephora', 'slickdeals']);
});

test('searchDealerDeals ranks coupon-adjusted low-risk deals across supported sources', () => {
  const result = searchDealerDeals({ query: 'Dior Sauvage', sources: ['amazon', 'ebay', 'sephora', 'slickdeals'] });

  assert.equal(result.query, 'Dior Sauvage');
  assert.equal(result.sources.length, 4);
  assert.equal(result.results.length, 4);
  assert.equal(result.bestDeal.source, 'sephora');
  assert.equal(result.bestDeal.couponCode, 'BEAUTY20');
  assert.equal(result.bestDeal.effectivePrice, '89.60');
  assert.equal(result.recommendation.action, 'buy_sephora');
  assert.ok(result.recommendation.reason.includes('coupon-adjusted'));
});

test('quoteProduct returns market quote with best, safe, and risk-aware options', () => {
  const quote = quoteProduct({ query: 'Dyson Airwrap' });

  assert.equal(quote.product, 'Dyson Airwrap');
  assert.equal(quote.bestPrice.source, 'ebay');
  assert.equal(quote.safestDeal.source, 'sephora');
  assert.equal(quote.averageMarketPrice, '431.24');
  assert.ok(quote.buyAdvice.includes('price-first'));
});

test('searchDealerCoupons filters voucher intelligence by source and query', () => {
  const coupons = searchDealerCoupons({ query: 'sephora skincare', source: 'sephora' });

  assert.equal(coupons.source, 'sephora');
  assert.ok(coupons.coupons.some((coupon) => coupon.code === 'BEAUTY20'));
  assert.ok(coupons.telegramSummary.includes('BEAUTY20'));
});

test('buildTelegramDealSummary formats concise Telegram-ready deal result', () => {
  const result = searchDealerDeals({ query: 'iPhone 15 Pro Max' });
  const message = buildTelegramDealSummary(result);

  assert.ok(message.includes('✅ Dealer check'));
  assert.ok(message.includes('Best deal'));
  assert.ok(message.includes('Amazon'));
  assert.ok(message.includes('Recommendation'));
});
