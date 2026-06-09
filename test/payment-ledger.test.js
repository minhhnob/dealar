import test from 'node:test';
import assert from 'node:assert/strict';

import {
  appendPaymentReceipt,
  createDemoReceiptLedger,
  createPaymentReceipt,
  getPaymentReceipt,
  listPaymentReceipts,
  summarizePaymentLedger,
} from '../src/payment-ledger.js';

test('createPaymentReceipt shapes marketplace payment receipt metadata', () => {
  const receipt = createPaymentReceipt({
    serviceId: 'dealar.deals.search',
    endpoint: '/v1/deals/search',
    amountUsdc: '0.25',
    buyer: '0xbuyer',
    seller: '0xseller',
    paymentRail: 'circle_gateway_x402',
    settlementId: 'settlement-123',
    resultSummary: 'WHOOP report unlocked',
    timestamp: '2026-06-08T00:00:00.000Z',
  });

  assert.match(receipt.id, /^rcpt_/);
  assert.equal(receipt.amount.microUsdc, '250000');
  assert.equal(receipt.amount.usdc, '0.25');
  assert.equal(receipt.serviceId, 'dealar.deals.search');
  assert.equal(receipt.settlementId, 'settlement-123');
  assert.equal(receipt.status, 'paid');
});

test('append/list/get/summarize receipt ledger works in memory', () => {
  const ledger = [];
  const first = appendPaymentReceipt(ledger, createPaymentReceipt({
    serviceId: 'dealar.deals.search',
    endpoint: '/v1/deals/search',
    amountUsdc: '0.25',
    resultSummary: 'WHOOP report unlocked',
  }));
  const second = appendPaymentReceipt(ledger, createPaymentReceipt({
    serviceId: 'dealar.coupons.verify',
    endpoint: '/v1/coupons/verify',
    amountUsdc: '0.01',
    resultSummary: 'WELCOME20 valid',
  }));

  assert.equal(listPaymentReceipts(ledger).length, 2);
  assert.equal(getPaymentReceipt(ledger, second.id).serviceId, 'dealar.coupons.verify');
  assert.equal(getPaymentReceipt(ledger, 'missing'), null);
  assert.deepEqual(summarizePaymentLedger(ledger), {
    totalReceipts: 2,
    totalRevenueUsdc: '0.26',
    byRail: { circle_gateway_x402: 2 },
    latestReceiptId: second.id,
  });
  assert.equal(first.status, 'paid');
});

test('createDemoReceiptLedger returns Dealar demo receipts with settlement metadata', () => {
  const ledger = createDemoReceiptLedger();
  assert.equal(ledger.length, 3);
  assert.ok(ledger.every((receipt) => receipt.settlementId));
  assert.equal(summarizePaymentLedger(ledger).totalRevenueUsdc, '0.31');
});
