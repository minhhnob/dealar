const DEFAULT_NETWORK = 'eip155:5042002'; // Arc Testnet
const DEFAULT_FACILITATOR_URL = 'https://conduitpay.xyz/api/x402';
const PLACEHOLDER_ADDRESSES = new Set(['0xYourEvmAddress', '0x0000000000000000000000000000000000000000']);

export function priceTierToUsd(tier) {
  const prices = {
    coupon_verify: '$0.01',
    basic: '$0.05',
    full_report: '$0.25',
    data_pack: '$5.00',
  };
  return prices[tier] ?? prices.basic;
}

export function requireReceiverAddress(address) {
  const value = String(address || '').trim();
  if (!value || PLACEHOLDER_ADDRESSES.has(value)) {
    throw new Error('DEALAR_EVM_ADDRESS must be set to the EVM wallet address that receives x402 USDC payments.');
  }
  return value;
}

export function getX402Environment(env = process.env) {
  const mode = String(env.DEALAR_PAYMENT_MODE || 'x402').toLowerCase();
  return {
    enabled: mode === 'x402',
    mode,
    facilitatorUrl: env.X402_FACILITATOR_URL || DEFAULT_FACILITATOR_URL,
    network: env.X402_NETWORK || DEFAULT_NETWORK,
    payTo: requireReceiverAddress(env.DEALAR_EVM_ADDRESS),
  };
}

export function buildX402RouteConfig({ payTo, network }) {
  return {
    'GET /v1/deals/search': {
      accepts: {
        scheme: 'exact',
        price: priceTierToUsd('full_report'),
        network,
        payTo,
      },
      description: 'Verified WHOOP and retail deal intelligence for AI agents',
      mimeType: 'application/json',
    },
    'GET /v1/retailers': {
      accepts: {
        scheme: 'exact',
        price: priceTierToUsd('basic'),
        network,
        payTo,
      },
      description: 'Curated US/EU beauty retailer intelligence database',
      mimeType: 'application/json',
    },
    'POST /v1/coupons/verify': {
      accepts: {
        scheme: 'exact',
        price: priceTierToUsd('coupon_verify'),
        network,
        payTo,
      },
      description: 'Coupon validity and checkout-condition intelligence',
      mimeType: 'application/json',
    },
  };
}
