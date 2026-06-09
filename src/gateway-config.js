const DEFAULT_GATEWAY_API = 'https://gateway-api-testnet.circle.com';
const DEFAULT_GATEWAY_NETWORK = 'eip155:5042002'; // Arc Testnet
const DEFAULT_GATEWAY_CHAIN = 'arcTestnet';
const PLACEHOLDER_ADDRESSES = new Set([
  '0xYOUR_RECEIVING_WALLET',
  '0xYourEvmAddress',
  '0x0000000000000000000000000000000000000000',
]);

export function requireGatewaySellerAddress(value) {
  if (!value || PLACEHOLDER_ADDRESSES.has(value)) {
    throw new Error('DEALAR_EVM_ADDRESS must be set to the EVM seller wallet address that receives Circle Gateway x402 USDC payments.');
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error('DEALAR_EVM_ADDRESS must be a valid 20-byte EVM address.');
  }
  return value;
}

export function getGatewayEnvironment(env = process.env) {
  const mode = String(env.DEALAR_PAYMENT_MODE || 'demo').toLowerCase();
  const enabled = ['gateway', 'circle-gateway', 'circle_gateway'].includes(mode);
  if (!enabled) {
    return { enabled: false, mode };
  }

  return {
    enabled: true,
    mode,
    sellerAddress: requireGatewaySellerAddress(env.DEALAR_EVM_ADDRESS),
    facilitatorUrl: env.DEALAR_GATEWAY_API || env.GATEWAY_API || DEFAULT_GATEWAY_API,
    network: env.DEALAR_GATEWAY_NETWORK || DEFAULT_GATEWAY_NETWORK,
    chain: env.DEALAR_GATEWAY_CHAIN || DEFAULT_GATEWAY_CHAIN,
  };
}

export function buildGatewayRoutePrices() {
  return {
    '/v1/deals/search': '$0.25',
    '/v1/retailers': '$0.05',
    '/v1/coupons/verify': '$0.01',
  };
}
