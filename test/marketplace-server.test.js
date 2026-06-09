import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../src/server.js';

test('server exposes marketplace services and payment receipt ledger endpoints', async () => {
  const app = await createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    const { port } = server.address();
    const base = `http://127.0.0.1:${port}`;

    const services = await fetch(`${base}/v1/services`);
    assert.equal(services.status, 200);
    const servicesBody = await services.json();
    assert.equal(servicesBody.services.length, 3);
    assert.equal(servicesBody.summary.totalServices, 3);

    const receipts = await fetch(`${base}/v1/payments/receipts`);
    assert.equal(receipts.status, 200);
    const receiptsBody = await receipts.json();
    assert.equal(receiptsBody.receipts.length, 3);
    assert.equal(receiptsBody.summary.totalRevenueUsdc, '0.31');

    const receipt = await fetch(`${base}/v1/payments/receipts/${receiptsBody.receipts[0].id}`);
    assert.equal(receipt.status, 200);
    const receiptBody = await receipt.json();
    assert.equal(receiptBody.receipt.id, receiptsBody.receipts[0].id);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
