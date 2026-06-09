import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../src/server.js';

async function withServer(fn) {
  const previousMode = process.env.DEALAR_PAYMENT_MODE;
  process.env.DEALAR_PAYMENT_MODE = 'demo';
  const app = await createApp();
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (previousMode === undefined) delete process.env.DEALAR_PAYMENT_MODE;
    else process.env.DEALAR_PAYMENT_MODE = previousMode;
  }
}

test('server returns 402 for protected unpaid deal endpoint and unlocks with demo payment header', async () => {
  await withServer(async (baseUrl) => {
    const unpaid = await fetch(`${baseUrl}/v1/deals/search?query=whoop&regions=us,eu`);
    assert.equal(unpaid.status, 402);
    const challenge = await unpaid.json();
    assert.equal(challenge.currency, 'USDC');
    assert.deepEqual(challenge.protocols, ['x402', 'MPP']);

    const paid = await fetch(`${baseUrl}/v1/deals/search?query=whoop&regions=us,eu`, {
      headers: { 'x-dealar-paid': 'demo' },
    });
    assert.equal(paid.status, 200);
    const body = await paid.json();
    assert.equal(body.query, 'whoop');
    assert.ok(body.best_deals.some((deal) => deal.merchant === 'WHOOP Official'));
  });
});
