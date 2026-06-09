import test from 'node:test';
import assert from 'node:assert/strict';

import { buildAgentStackQuickstartModel } from '../src/agent-stack-quickstart.js';

test('buildAgentStackQuickstartModel captures Circle Agent Stack buyer workflow essentials', () => {
  const model = buildAgentStackQuickstartModel();

  assert.match(model.thesis, /Agent Stack/);
  assert.equal(model.components.length, 5);
  assert.deepEqual(model.components.map((component) => component.name), [
    'Agent Wallets',
    'Gateway Balance',
    'Agent Marketplace',
    'Circle CLI',
    'Receipts',
  ]);
  assert.ok(model.buyerWorkflow.some((step) => step.includes('Gateway balance')));
  assert.ok(model.buyerWorkflow.some((step) => step.includes('Agent Marketplace')));
  assert.ok(model.buyerWorkflow.some((step) => step.includes('receipt')));
  assert.ok(model.implicationsForDealar.some((item) => item.includes('marketplace-style service metadata')));
});
