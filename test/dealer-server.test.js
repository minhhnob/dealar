import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../src/server.js';

test('server exposes Dealer Deal Scout routes for Telegram/API checks', async () => {
  const app = await createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    const { port } = server.address();
    const base = `http://127.0.0.1:${port}`;

    const search = await fetch(`${base}/v1/dealer/search?query=Dior%20Sauvage&sources=amazon,ebay,sephora,slickdeals`);
    assert.equal(search.status, 200);
    const searchBody = await search.json();
    assert.equal(searchBody.bestDeal.source, 'sephora');
    assert.ok(searchBody.telegramSummary.includes('Dealer check'));

    const quote = await fetch(`${base}/v1/dealer/quote?query=Dyson%20Airwrap`);
    assert.equal(quote.status, 200);
    const quoteBody = await quote.json();
    assert.equal(quoteBody.bestPrice.source, 'ebay');

    const coupons = await fetch(`${base}/v1/dealer/coupons?query=sephora%20skincare&source=sephora`);
    assert.equal(coupons.status, 200);
    const couponsBody = await coupons.json();
    assert.ok(couponsBody.coupons.some((coupon) => coupon.code === 'BEAUTY20'));

    const sources = await fetch(`${base}/v1/dealer/sources`);
    assert.equal(sources.status, 200);
    const sourcesBody = await sources.json();
    assert.deepEqual(sourcesBody.sources.map((source) => source.id), ['amazon', 'ebay', 'sephora', 'slickdeals']);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
