import test from 'node:test';
import assert from 'node:assert/strict';

import { buildLoomReferenceModel, LOOM_CONTRACTS } from '../src/loom-reference.js';

test('buildLoomReferenceModel captures Loom primitives useful for Dealar completion', () => {
  const model = buildLoomReferenceModel();

  assert.equal(model.contracts.rpcUrl, 'https://rpc.testnet.arc.network');
  assert.equal(model.contracts.agentNft, LOOM_CONTRACTS.agentNft);
  assert.ok(model.primitives.some((item) => item.name === 'Agent Identity NFT'));
  assert.ok(model.primitives.some((item) => item.name === 'Marketplace Listings'));
  assert.ok(model.primitives.some((item) => item.name === 'x402 Payments'));
  assert.ok(model.readApis.includes('GET /marketplace/listings'));
  assert.ok(model.writeActions.includes('registerAgent(name,tags,avatarURI)'));
  assert.ok(model.delearRoadmap.some((item) => item.includes('/v1/agent-card')));
  assert.ok(model.delearRoadmap.some((item) => item.includes('/v1/check')));
});
