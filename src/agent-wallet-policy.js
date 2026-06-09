const MICRO_USDC = 1_000_000n;

export function parseUsdcAmount(value) {
  const raw = String(value ?? '0').trim();
  if (!/^\d+(\.\d{0,6})?$/.test(raw)) {
    throw new Error(`Invalid USDC amount: ${raw}`);
  }
  const [whole, fractional = ''] = raw.split('.');
  const padded = fractional.padEnd(6, '0');
  return BigInt(whole) * MICRO_USDC + BigInt(padded || '0');
}

export function formatUsdcAmount(microUsdc) {
  const value = BigInt(microUsdc);
  const whole = value / MICRO_USDC;
  const fraction = String(value % MICRO_USDC).padStart(6, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : String(whole);
}

export function createAgentWalletPolicy({
  walletLabel = 'dealar-agent',
  dailyLimitUsdc = process.env.DEALAR_AGENT_DAILY_LIMIT_USDC || '1.00',
  perRequestLimitUsdc = process.env.DEALAR_AGENT_PER_REQUEST_LIMIT_USDC || '0.25',
  allowlistedBaseUrls = (process.env.DEALAR_AGENT_ALLOWLIST || 'http://127.0.0.1:8787').split(','),
  mode = process.env.DEALAR_PAYMENT_MODE || 'demo',
} = {}) {
  return {
    walletLabel,
    mode,
    dailyLimitUsdc: String(dailyLimitUsdc),
    perRequestLimitUsdc: String(perRequestLimitUsdc),
    dailyLimitMicroUsdc: parseUsdcAmount(dailyLimitUsdc),
    perRequestLimitMicroUsdc: parseUsdcAmount(perRequestLimitUsdc),
    allowlistedBaseUrls: allowlistedBaseUrls.map((url) => String(url).trim()).filter(Boolean),
    controls: ['daily_limit', 'per_request_limit', 'recipient_allowlist', 'x402_payment_only'],
  };
}

function isAllowlisted({ requestUrl, allowlistedBaseUrls }) {
  return allowlistedBaseUrls.some((base) => requestUrl.startsWith(base));
}

export function assertAgentSpendAllowed({ policy, requestUrl, priceUsdc, spentTodayMicroUsdc = 0n }) {
  const priceMicroUsdc = parseUsdcAmount(priceUsdc);
  const spent = BigInt(spentTodayMicroUsdc);

  if (!isAllowlisted({ requestUrl, allowlistedBaseUrls: policy.allowlistedBaseUrls })) {
    return {
      allowed: false,
      reason: 'request_url_not_allowlisted',
      requestUrl,
      priceMicroUsdc,
    };
  }

  if (priceMicroUsdc > policy.perRequestLimitMicroUsdc) {
    return {
      allowed: false,
      reason: 'price_exceeds_per_request_limit',
      requestUrl,
      priceMicroUsdc,
      perRequestLimitMicroUsdc: policy.perRequestLimitMicroUsdc,
    };
  }

  if (spent + priceMicroUsdc > policy.dailyLimitMicroUsdc) {
    return {
      allowed: false,
      reason: 'price_exceeds_remaining_daily_budget',
      requestUrl,
      priceMicroUsdc,
      spentTodayMicroUsdc: spent,
      dailyLimitMicroUsdc: policy.dailyLimitMicroUsdc,
    };
  }

  return {
    allowed: true,
    reason: 'allowed',
    requestUrl,
    priceMicroUsdc,
    spentTodayMicroUsdc: spent,
    remainingAfterMicroUsdc: policy.dailyLimitMicroUsdc - spent - priceMicroUsdc,
  };
}

export function recordAgentSpend({ ledger, requestUrl, priceUsdc, status = 'paid', receipt = null, metadata = {} }) {
  const entry = {
    id: `spend_${Date.now()}_${ledger.length + 1}`,
    timestamp: new Date().toISOString(),
    requestUrl,
    priceUsdc: formatUsdcAmount(parseUsdcAmount(priceUsdc)),
    priceMicroUsdc: parseUsdcAmount(priceUsdc).toString(),
    status,
    receipt,
    metadata,
  };
  ledger.push(entry);
  return entry;
}

export function summarizeAgentWallet({ ledger, dailyLimitUsdc }) {
  const today = new Date().toISOString().slice(0, 10);
  const entries = ledger.filter((entry) => String(entry.timestamp).startsWith(today));
  const spent = entries
    .filter((entry) => entry.status === 'paid')
    .reduce((sum, entry) => sum + BigInt(entry.priceMicroUsdc), 0n);
  const limit = parseUsdcAmount(dailyLimitUsdc);
  const remaining = limit > spent ? limit - spent : 0n;

  return {
    date: today,
    spentTodayUsdc: formatUsdcAmount(spent),
    remainingTodayUsdc: formatUsdcAmount(remaining),
    dailyLimitUsdc: formatUsdcAmount(limit),
    entries,
  };
}
