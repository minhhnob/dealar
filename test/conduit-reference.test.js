import test from 'node:test';
import assert from 'node:assert/strict';

import { buildConduitReferenceModel, buildDealerConduitIntegrationPlan } from '../src/conduit-reference.js';

test('buildConduitReferenceModel captures Conduit x402 and Arc payment primitives', () => {
  const model = buildConduitReferenceModel();

  assert.equal(model.source.homepage, 'https://conduit-pay.vercel.app/');
  assert.equal(model.facilitator.url, 'https://conduitpay.xyz/api/x402');
  assert.equal(model.network.chainId, 5042002);
  assert.equal(model.network.caip2, 'eip155:5042002');
  assert.equal(model.network.usdc, '0x3600000000000000000000000000000000000000');
  assert.ok(model.primitives.some((primitive) => primitive.name === 'Payment Links'));
  assert.ok(model.primitives.some((primitive) => primitive.name === 'Stealth Mode'));
  assert.ok(model.primitives.some((primitive) => primitive.name === 'x402 Facilitator'));
  assert.ok(model.developerEndpoints.includes('POST /api/x402/verify'));
  assert.ok(model.developerEndpoints.includes('POST /api/x402/settle'));
});

test('buildDealerConduitIntegrationPlan maps Conduit patterns into Dealer product work', () => {
  const plan = buildDealerConduitIntegrationPlan();

  assert.ok(plan.paymentProducts.some((item) => item.endpoint === '/v1/dealer/search'));
  assert.ok(plan.paymentProducts.some((item) => item.priceUsdc === '0.001'));
  assert.ok(plan.dashboardSections.includes('Conduit-style Payment Links'));
  assert.ok(plan.telegramCommands.includes('pay for deep deal check'));
  assert.ok(plan.nextSteps.some((step) => step.includes('@ace_won/x402')));
});
