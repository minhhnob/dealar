import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDealerCapabilityCard,
  buildScoutReport,
  createDealRequestTicket,
  createDealReceipt,
  listDealerCapabilities,
} from '../src/dealer-native-product.js';

test('listDealerCapabilities defines original Dealer capabilities, not reference-project product names', () => {
  const capabilities = listDealerCapabilities({ baseUrl: 'https://prodeal-api.vercel.app' });

  assert.deepEqual(capabilities.map((item) => item.id), [
    'scout.quick-check',
    'scout.price-quote',
    'scout.voucher-scan',
    'scout.report',
    'scout.watch-alert',
  ]);
  assert.ok(capabilities.every((item) => item.endpoint.startsWith('https://prodeal-api.vercel.app/v1/scout/')));
  assert.ok(capabilities.every((item) => !item.name.toLowerCase().includes('conduit')));
  assert.equal(capabilities.find((item) => item.id === 'scout.report').price.usdc, '0.005');
});

test('buildScoutReport returns Dealer-native report language and deal intelligence', () => {
  const report = buildScoutReport({ query: 'Dyson Airwrap', baseUrl: 'https://prodeal-api.vercel.app' });

  assert.equal(report.type, 'Scout Report');
  assert.equal(report.query, 'Dyson Airwrap');
  assert.ok(report.bestDeal);
  assert.ok(report.priceQuote.bestPrice);
  assert.ok(report.voucherScan.coupons.length > 0);
  assert.ok(report.telegramSummary.includes('Dealer Scout Report'));
  assert.ok(report.trustScore.score >= 0 && report.trustScore.score <= 100);
  assert.deepEqual(report.sourceMix.sources, ['amazon', 'ebay', 'slickdeals']);
});

test('createDealRequestTicket builds shareable Dealer request object for Telegram flow', () => {
  const ticket = createDealRequestTicket({
    query: 'WHOOP 5.0',
    capabilityId: 'scout.report',
    baseUrl: 'https://prodeal-api.vercel.app',
  });

  assert.equal(ticket.type, 'Deal Request Ticket');
  assert.equal(ticket.query, 'WHOOP 5.0');
  assert.equal(ticket.capabilityId, 'scout.report');
  assert.equal(ticket.amount.usdc, '0.005');
  assert.ok(ticket.ticketUrl.startsWith('https://prodeal-api.vercel.app/v1/scout/tickets/'));
  assert.ok(ticket.unlockUrl.includes('/v1/scout/report?query=WHOOP%205.0'));
  assert.equal(ticket.status, 'demo_ready');
});

test('buildDealerCapabilityCard returns machine-readable original Dealer discovery metadata', () => {
  const card = buildDealerCapabilityCard({ baseUrl: 'https://prodeal-api.vercel.app' });

  assert.equal(card.type, 'Dealer Capability Card');
  assert.equal(card.product.identity, 'AI Deal Scout Agent');
  assert.ok(card.capabilities.some((item) => item.id === 'scout.voucher-scan'));
  assert.ok(card.links.scoutReport.endsWith('/v1/scout/report'));
  assert.ok(card.principles.includes('reference_synthesis_not_copying'));
});

test('createDealReceipt records a Dealer-native scouting result', () => {
  const report = buildScoutReport({ query: 'Dior Sauvage' });
  const receipt = createDealReceipt({ report, amountUsdc: '0.005', mode: 'demo' });

  assert.equal(receipt.type, 'Deal Receipt');
  assert.equal(receipt.query, 'Dior Sauvage');
  assert.equal(receipt.amount.usdc, '0.005');
  assert.equal(receipt.mode, 'demo');
  assert.ok(receipt.resultSummary.includes(report.bestDeal.retailer));
});
