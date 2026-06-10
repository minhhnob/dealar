import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../src/server.js';

test('server exposes Conduit-style Dealer paid product routes', async () => {
  const app = await createApp();
  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const products = await fetch(`${baseUrl}/v1/dealer/payment-products`).then((res) => res.json());
    assert.equal(products.products.length, 4);
    assert.equal(products.products.at(-1).id, 'dealer.deep-deal-report');

    const deepReport = await fetch(`${baseUrl}/v1/dealer/deep-report?query=Dyson%20Airwrap`).then((res) => res.json());
    assert.equal(deepReport.query, 'Dyson Airwrap');
    assert.equal(deepReport.product.id, 'dealer.deep-deal-report');
    assert.ok(deepReport.summary.includes('Dealer deep report'));

    const paymentLink = await fetch(`${baseUrl}/v1/dealer/payment-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'WHOOP 5.0', productId: 'dealer.deep-deal-report' }),
    }).then((res) => {
      assert.equal(res.status, 201);
      return res.json();
    });
    assert.equal(paymentLink.link.amount.usdc, '0.005');
    assert.ok(paymentLink.link.payUrl.includes('/pay/dealer-'));

    const links = await fetch(`${baseUrl}/v1/dealer/payment-links`).then((res) => res.json());
    assert.ok(links.links.some((link) => link.id === paymentLink.link.id));

    const listing = await fetch(`${baseUrl}/v1/dealer/marketplace-listing`).then((res) => res.json());
    assert.equal(listing.listing.endpoint, `${baseUrl}/v1/dealer/deep-report`);
    assert.equal(listing.listing.price, '0.005');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
