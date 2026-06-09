import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getMarketplaceService,
  listMarketplaceServices,
  summarizeMarketplaceServices,
} from '../src/service-catalog.js';

test('listMarketplaceServices exposes Dealar paid endpoints as marketplace-ready services', () => {
  const services = listMarketplaceServices();

  assert.equal(services.length, 3);
  assert.deepEqual(services.map((service) => service.id), [
    'dealar.deals.search',
    'dealar.retailers.list',
    'dealar.coupons.verify',
  ]);

  const dealSearch = services[0];
  assert.equal(dealSearch.endpoint.method, 'GET');
  assert.equal(dealSearch.endpoint.path, '/v1/deals/search');
  assert.equal(dealSearch.price.usdc, '0.25');
  assert.equal(dealSearch.paymentRail, 'circle_gateway_x402');
  assert.ok(dealSearch.inputSchema.properties.query);
  assert.ok(dealSearch.outputSummary.includes('deal intelligence'));
});

test('getMarketplaceService finds service by id or endpoint path', () => {
  assert.equal(getMarketplaceService('dealar.coupons.verify').endpoint.path, '/v1/coupons/verify');
  assert.equal(getMarketplaceService('/v1/retailers').id, 'dealar.retailers.list');
  assert.equal(getMarketplaceService('missing'), null);
});

test('summarizeMarketplaceServices returns marketplace categories and total price floor', () => {
  const summary = summarizeMarketplaceServices();

  assert.equal(summary.totalServices, 3);
  assert.deepEqual(summary.categories.sort(), ['coupon-verification', 'deal-intelligence', 'retail-intelligence']);
  assert.equal(summary.minPriceUsdc, '0.01');
  assert.equal(summary.maxPriceUsdc, '0.25');
});
