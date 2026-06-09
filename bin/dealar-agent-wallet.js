#!/usr/bin/env node
import { buildDealSearchUrl, createPaidFetch, requestJsonWithPayment } from '../src/buyer-client.js';
import {
  assertAgentSpendAllowed,
  createAgentWalletPolicy,
  recordAgentSpend,
  summarizeAgentWallet,
} from '../src/agent-wallet-policy.js';

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (arg.startsWith('--')) {
    const key = arg.slice(2);
    const next = process.argv[i + 1];
    if (next && !next.startsWith('--')) {
      args.set(key, next);
      i += 1;
    } else {
      args.set(key, 'true');
    }
  }
}

const baseUrl = args.get('base-url') || process.env.DEALAR_API_BASE_URL || 'http://127.0.0.1:8787';
const query = args.get('query') || 'whoop';
const regions = (args.get('regions') || 'us,eu').split(',').map((item) => item.trim()).filter(Boolean);
const mode = args.get('mode') || process.env.DEALAR_PAYMENT_MODE || 'demo';
const priceUsdc = args.get('price') || process.env.DEALAR_AGENT_REQUEST_PRICE_USDC || '0.25';

const requestUrl = buildDealSearchUrl(baseUrl, { query, regions });
const policy = createAgentWalletPolicy({
  walletLabel: args.get('wallet-label') || 'dealar-agent',
  dailyLimitUsdc: args.get('daily-limit') || process.env.DEALAR_AGENT_DAILY_LIMIT_USDC || '1.00',
  perRequestLimitUsdc: args.get('per-request-limit') || process.env.DEALAR_AGENT_PER_REQUEST_LIMIT_USDC || '0.25',
  allowlistedBaseUrls: (args.get('allowlist') || process.env.DEALAR_AGENT_ALLOWLIST || baseUrl).split(','),
  mode,
});

const ledger = [];
const decision = assertAgentSpendAllowed({
  policy,
  requestUrl,
  priceUsdc,
  spentTodayMicroUsdc: 0n,
});

if (!decision.allowed) {
  console.log(JSON.stringify({
    wallet: { label: policy.walletLabel, mode: policy.mode, controls: policy.controls },
    policy: {
      dailyLimitUsdc: policy.dailyLimitUsdc,
      perRequestLimitUsdc: policy.perRequestLimitUsdc,
      allowlistedBaseUrls: policy.allowlistedBaseUrls,
    },
    decision,
  }, (_key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
  process.exitCode = 2;
} else {
  const paidFetch = await createPaidFetch({ mode });
  const response = await requestJsonWithPayment(requestUrl, { paidFetch });
  const entry = response.ok
    ? recordAgentSpend({ ledger, requestUrl, priceUsdc, status: 'paid', receipt: response.paymentResponse, metadata: { query, regions } })
    : recordAgentSpend({ ledger, requestUrl, priceUsdc, status: 'failed', receipt: response.paymentResponse, metadata: { query, regions, status: response.status } });

  console.log(JSON.stringify({
    wallet: { label: policy.walletLabel, mode: policy.mode, controls: policy.controls },
    policy: {
      dailyLimitUsdc: policy.dailyLimitUsdc,
      perRequestLimitUsdc: policy.perRequestLimitUsdc,
      allowlistedBaseUrls: policy.allowlistedBaseUrls,
    },
    decision,
    spendEntry: entry,
    walletSummary: summarizeAgentWallet({ ledger, dailyLimitUsdc: policy.dailyLimitUsdc }),
    response,
  }, (_key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

  if (!response.ok) process.exitCode = 1;
}
