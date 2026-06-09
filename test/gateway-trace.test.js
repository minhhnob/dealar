import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildGatewayTraceModel,
  getPinnedGatewayBatchTx,
  normalizeSettlementForTrace,
} from '../src/gateway-trace.js';

test('normalizeSettlementForTrace converts Gateway settlement response into Dealar trace metadata', () => {
  const settlement = normalizeSettlementForTrace({
    id: 'settlement-123',
    status: 'completed',
    fromAddress: '0xbuyer',
    toAddress: '0xseller',
    amount: '250000',
    network: 'eip155:5042002',
    updatedAt: '2026-06-08T00:00:00.000Z',
  });

  assert.equal(settlement.id, 'settlement-123');
  assert.equal(settlement.amountUsdc, '0.25');
  assert.equal(settlement.network, 'eip155:5042002');
  assert.equal(settlement.status, 'completed');
});

test('buildGatewayTraceModel returns six Canteen-style payment lifecycle steps', () => {
  const trace = buildGatewayTraceModel({
    settlementId: 'settlement-123',
    status: 'received',
    batchTx: '0xabc',
    explorerUrl: 'https://testnet.arcscan.app/tx/0xabc',
  });

  assert.equal(trace.settlementId, 'settlement-123');
  assert.equal(trace.steps.length, 6);
  assert.deepEqual(trace.steps.map((step) => step.key), [
    'eip712_signed',
    'facilitator_settle',
    'settlement_queued',
    'relayer_batches',
    'submit_batch',
    'settlement_completed',
  ]);
  assert.equal(trace.steps[4].links.explorer, 'https://testnet.arcscan.app/tx/0xabc');
});

test('getPinnedGatewayBatchTx resolves known demo settlements', () => {
  const pinned = getPinnedGatewayBatchTx('c9933054-6b34-44bb-8c04-e7e9e1b8352c');
  assert.equal(pinned.batchTx, '0xfbad1baae7fd9b88f4e1b034a4236da02012870acbd6ae83b583e85528be396e');
  assert.equal(pinned.explorerUrl, 'https://testnet.arcscan.app/tx/0xfbad1baae7fd9b88f4e1b034a4236da02012870acbd6ae83b583e85528be396e');
});
