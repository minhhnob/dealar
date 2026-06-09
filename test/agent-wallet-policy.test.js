import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertAgentSpendAllowed,
  createAgentWalletPolicy,
  recordAgentSpend,
  summarizeAgentWallet,
  parseUsdcAmount,
} from '../src/agent-wallet-policy.js';

test('parseUsdcAmount converts decimal USDC strings to micro-USDC units', () => {
  assert.equal(parseUsdcAmount('0.25'), 250000n);
  assert.equal(parseUsdcAmount('1'), 1000000n);
  assert.equal(parseUsdcAmount('0.000001'), 1n);
});

test('createAgentWalletPolicy builds default Circle-style spending policy', () => {
  const policy = createAgentWalletPolicy({
    walletLabel: 'dealar-agent',
    dailyLimitUsdc: '1.00',
    perRequestLimitUsdc: '0.25',
    allowlistedBaseUrls: ['https://api.dealar.test'],
  });

  assert.equal(policy.walletLabel, 'dealar-agent');
  assert.equal(policy.dailyLimitMicroUsdc, 1000000n);
  assert.equal(policy.perRequestLimitMicroUsdc, 250000n);
  assert.deepEqual(policy.allowlistedBaseUrls, ['https://api.dealar.test']);
});

test('assertAgentSpendAllowed allows allowlisted request within limits', () => {
  const policy = createAgentWalletPolicy({ dailyLimitUsdc: '1', perRequestLimitUsdc: '0.25', allowlistedBaseUrls: ['https://api.dealar.test'] });
  const decision = assertAgentSpendAllowed({ policy, requestUrl: 'https://api.dealar.test/v1/deals/search', priceUsdc: '0.25', spentTodayMicroUsdc: 0n });

  assert.equal(decision.allowed, true);
  assert.equal(decision.priceMicroUsdc, 250000n);
});

test('assertAgentSpendAllowed blocks non-allowlisted URLs and over-budget requests', () => {
  const policy = createAgentWalletPolicy({ dailyLimitUsdc: '1', perRequestLimitUsdc: '0.25', allowlistedBaseUrls: ['https://api.dealar.test'] });

  assert.equal(assertAgentSpendAllowed({ policy, requestUrl: 'https://evil.test/v1', priceUsdc: '0.01', spentTodayMicroUsdc: 0n }).allowed, false);
  assert.equal(assertAgentSpendAllowed({ policy, requestUrl: 'https://api.dealar.test/v1', priceUsdc: '0.50', spentTodayMicroUsdc: 0n }).allowed, false);
  assert.equal(assertAgentSpendAllowed({ policy, requestUrl: 'https://api.dealar.test/v1', priceUsdc: '0.25', spentTodayMicroUsdc: 900000n }).allowed, false);
});

test('recordAgentSpend appends ledger entry and summarizeAgentWallet totals spend', () => {
  const ledger = [];
  recordAgentSpend({ ledger, requestUrl: 'https://api.dealar.test/v1/deals/search', priceUsdc: '0.25', status: 'paid', receipt: 'receipt_1' });
  recordAgentSpend({ ledger, requestUrl: 'https://api.dealar.test/v1/coupons/verify', priceUsdc: '0.01', status: 'paid', receipt: 'receipt_2' });

  const summary = summarizeAgentWallet({ ledger, dailyLimitUsdc: '1' });

  assert.equal(summary.spentTodayUsdc, '0.26');
  assert.equal(summary.remainingTodayUsdc, '0.74');
  assert.equal(summary.entries.length, 2);
});
