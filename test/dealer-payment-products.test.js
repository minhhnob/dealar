import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDeepDealReport,
  buildDealerMarketplaceListing,
  buildPaymentProducts,
  createDealerPaymentLink,
  listDealerPaymentLinks,
} from '../src/dealer-payment-products.js';

test('buildPaymentProducts exposes Conduit-style paid Dealer APIs', () => {
  const products = buildPaymentProducts({ baseUrl: 'https://prodeal-api.vercel.app' });

  assert.equal(products.length, 4);
  assert.deepEqual(products.map((product) => product.id), [
    'dealer.quick-deal-check',
    'dealer.product-quote',
    'dealer.voucher-check',
    'dealer.deep-deal-report',
  ]);
  assert.equal(products[0].endpoint, 'https://prodeal-api.vercel.app/v1/dealer/search');
  assert.equal(products[0].price.usdc, '0.001');
  assert.equal(products[3].endpoint, 'https://prodeal-api.vercel.app/v1/dealer/deep-report');
  assert.equal(products[3].price.usdc, '0.005');
  assert.equal(products[3].payment.mode, 'conduit_x402_ready');
});

test('buildDeepDealReport returns Telegram-ready paid report metadata', () => {
  const report = buildDeepDealReport({ query: 'Dyson Airwrap', baseUrl: 'https://prodeal-api.vercel.app' });

  assert.equal(report.query, 'Dyson Airwrap');
  assert.equal(report.product.id, 'dealer.deep-deal-report');
  assert.equal(report.price.usdc, '0.005');
  assert.ok(report.search.bestDeal);
  assert.ok(report.quote.bestPrice);
  assert.ok(report.summary.includes('Dealer deep report'));
  assert.ok(report.summary.includes('Dyson Airwrap'));
  assert.ok(report.payment.required === false);
  assert.equal(report.payment.mode, 'demo_conduit_ready');
});

test('createDealerPaymentLink creates deterministic Conduit-style payment link record', () => {
  const link = createDealerPaymentLink({
    query: 'WHOOP 5.0',
    productId: 'dealer.deep-deal-report',
    baseUrl: 'https://prodeal-api.vercel.app',
  });
  const links = listDealerPaymentLinks({ baseUrl: 'https://prodeal-api.vercel.app' });

  assert.equal(link.productId, 'dealer.deep-deal-report');
  assert.equal(link.amount.usdc, '0.005');
  assert.equal(link.status, 'demo_unpaid');
  assert.ok(link.payUrl.startsWith('https://prodeal-api.vercel.app/pay/dealer-'));
  assert.ok(link.unlockUrl.includes('/v1/dealer/deep-report?query=WHOOP%205.0'));
  assert.ok(links.some((item) => item.id === link.id));
});

test('buildDealerMarketplaceListing returns Conduit marketplace submission payload', () => {
  const listing = buildDealerMarketplaceListing({
    baseUrl: 'https://prodeal-api.vercel.app',
    creatorAddress: '0x0000000000000000000000000000000000000001',
  });

  assert.equal(listing.name, 'Dealer Deep Deal Report');
  assert.equal(listing.price, '0.005');
  assert.equal(listing.endpoint, 'https://prodeal-api.vercel.app/v1/dealer/deep-report');
  assert.equal(listing.category, 'shopping-intelligence');
  assert.equal(listing.creatorAddress, '0x0000000000000000000000000000000000000001');
  assert.equal(listing.status, 'ready_to_submit');
  assert.ok(listing.docsUrl.includes('/dashboard'));
});
