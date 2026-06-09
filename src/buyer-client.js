const PLACEHOLDER_PRIVATE_KEYS = new Set(['0xYOUR_PRIVATE_KEY', '0xYourPrivateKey']);

export function buildDealSearchUrl(baseUrl, { query = 'whoop', regions = ['us', 'eu'] } = {}) {
  const url = new URL('/v1/deals/search', baseUrl);
  url.searchParams.set('query', query);
  url.searchParams.set('regions', Array.isArray(regions) ? regions.join(',') : String(regions));
  return url.toString();
}

export function isPaymentRequired(response) {
  return Number(response?.status) === 402;
}

export function requireBuyerPrivateKey(privateKey) {
  const value = String(privateKey || '').trim();
  if (!value || PLACEHOLDER_PRIVATE_KEYS.has(value)) {
    throw new Error('DEALAR_BUYER_EVM_PRIVATE_KEY must be set to the buyer wallet private key for x402 paid requests.');
  }
  return value;
}

export async function createPaidFetch({
  mode = process.env.DEALAR_PAYMENT_MODE || 'demo',
  privateKey = process.env.DEALAR_BUYER_EVM_PRIVATE_KEY || process.env.PRIVATE_KEY || process.env.EVM_PRIVATE_KEY,
  chain = process.env.DEALAR_GATEWAY_CHAIN || 'arcTestnet',
  fetchImpl = fetch,
} = {}) {
  const normalizedMode = String(mode).toLowerCase();
  if (normalizedMode === 'gateway' || normalizedMode === 'circle-gateway' || normalizedMode === 'circle_gateway') {
    const { GatewayClient } = await import('@circle-fin/x402-batching/client');
    const client = new GatewayClient({ chain, privateKey: requireBuyerPrivateKey(privateKey) });
    return async (url) => {
      const { status, data, headers } = await client.pay(url);
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          'content-type': 'application/json',
          ...(headers?.get?.('payment-response') ? { 'payment-response': headers.get('payment-response') } : {}),
        },
      });
    };
  }

  if (normalizedMode !== 'x402') {
    return async (url, options = {}) => {
      const headers = { ...(options.headers || {}), 'x-dealar-paid': 'demo' };
      return fetchImpl(url, { ...options, headers });
    };
  }

  const [{ x402Client, wrapFetchWithPayment }, { registerExactEvmScheme }, { privateKeyToAccount }] = await Promise.all([
    import('@x402/fetch'),
    import('@x402/evm/exact/client'),
    import('viem/accounts'),
  ]);

  const client = new x402Client();
  registerExactEvmScheme(client, { signer: privateKeyToAccount(requireBuyerPrivateKey(privateKey)) });
  return wrapFetchWithPayment(fetchImpl, client);
}

export async function requestJsonWithPayment(url, { paidFetch, method = 'GET', headers = {}, body } = {}) {
  const response = await paidFetch(url, { method, headers, body });
  const text = await response.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  return {
    status: response.status,
    ok: response.ok,
    paymentRequired: isPaymentRequired(response),
    paymentResponse: response.headers.get('payment-response') || response.headers.get('PAYMENT-RESPONSE'),
    body: parsed,
  };
}
