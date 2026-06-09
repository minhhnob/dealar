import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../src/server.js';

test('server exposes Gateway trace endpoints without requiring paid API auth', async () => {
  const app = await createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    const { port } = server.address();
    const base = `http://127.0.0.1:${port}`;

    const trace = await fetch(`${base}/v1/payments/trace/demo`);
    assert.equal(trace.status, 200);
    const traceBody = await trace.json();
    assert.equal(traceBody.settlementId, 'demo');
    assert.equal(traceBody.steps.length, 6);

    const pinned = await fetch(`${base}/v1/payments/batch-tx/c9933054-6b34-44bb-8c04-e7e9e1b8352c`);
    assert.equal(pinned.status, 200);
    const pinnedBody = await pinned.json();
    assert.match(pinnedBody.batchTx, /^0x/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
