import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTelegramDealSummary,
  listDealerSources,
  quoteProduct,
  searchDealerDeals,
  searchDealerCoupons,
} from '../src/dealer-scout.js';

test('listDealerSources exposes only Amazon, eBay, and Slickdeals adapters', () => {
  assert.deepEqual(listDealerSources().map((source) => source.id), ['amazon', 'ebay', 'slickdeals']);
});

test('searchDealerDeals ranks coupon-adjusted low-risk deals across supported sources', () => {
  const result = searchDealerDeals({ query: 'Dior Sauvage' });

  assert.equal(result.query, 'Dior Sauvage');
  assert.deepEqual(result.sources, ['amazon', 'ebay', 'slickdeals']);
  assert.equal(result.results.length, 3);
  assert.notEqual(result.bestDeal.source, 'sephora');
  assert.ok(['ebay', 'slickdeals', 'amazon'].includes(result.bestDeal.source));
  assert.ok(result.recommendation.reason.includes('coupon-adjusted'));
});

test('searchDealerDeals uses WHOOP data for WHOOP queries instead of unsupported retailer demo fallback', () => {
  const result = searchDealerDeals({ query: 'giá whoop bên nào rẻ', sources: ['amazon', 'ebay', 'slickdeals'] });

  assert.notEqual(result.bestDeal.source, 'sephora');
  assert.match(result.bestDeal.title, /WHOOP/i);
  assert.doesNotMatch(result.bestDeal.title, /Dior|Sauvage|Parfum/i);
  assert.doesNotMatch(result.bestDeal.url, /sephora|Dior%20Sauvage/i);
  assert.ok(result.telegramSummary.includes('WHOOP'));
});

test('searchDealerCoupons returns WHOOP voucher intelligence for WHOOP coupon queries', () => {
  const coupons = searchDealerCoupons({ query: 'mã giảm giá whoop hôm nay' });

  assert.ok(coupons.coupons.length > 0);
  assert.ok(coupons.coupons.every((coupon) => /whoop|amazon|slickdeals/i.test(`${coupon.source} ${coupon.code} ${coupon.discount}`)));
  assert.doesNotMatch(coupons.telegramSummary, /No demo coupons found/);
});

test('searchDealerDeals respects WHOOP version-specific queries', () => {
  const result = searchDealerDeals({ query: 'whoop 5.0', sources: ['amazon', 'ebay', 'slickdeals'] });

  assert.match(result.bestDeal.title, /WHOOP (5\.0|MG)/i);
  assert.doesNotMatch(result.bestDeal.title, /WHOOP 4\.0/i);
  assert.doesNotMatch(result.bestDeal.url, /WHOOP\+4\.0/i);
  assert.ok(result.telegramSummary.includes('WHOOP'));
});

test('quoteProduct returns market quote with best, safe, and risk-aware options', () => {
  const quote = quoteProduct({ query: 'Dyson Airwrap' });

  assert.equal(quote.product, 'Dyson Airwrap');
  assert.equal(quote.bestPrice.source, 'ebay');
  assert.equal(quote.safestDeal.source, 'amazon');
  assert.equal(quote.averageMarketPrice, '404.99');
  assert.ok(quote.buyAdvice.includes('price-first'));
});

test('searchDealerCoupons checks only Amazon, eBay, and Slickdeals voucher sources by default', () => {
  const coupons = searchDealerCoupons({ query: 'whoop' });

  assert.deepEqual([...new Set(coupons.coupons.map((coupon) => coupon.source))].sort(), ['amazon', 'slickdeals']);
  assert.ok(coupons.telegramSummary.includes('WHOOP'));
});

test('buildTelegramDealSummary formats concise Telegram-ready deal result', () => {
  const result = searchDealerDeals({ query: 'iPhone 15 Pro Max' });
  const message = buildTelegramDealSummary(result);

  assert.ok(message.includes('✅ Dealer check'));
  assert.ok(message.includes('Best deal'));
  assert.ok(message.includes('Amazon'));
  assert.ok(message.includes('Recommendation'));
});
