const SERVICES = [
  {
    id: 'dealar.deals.search',
    name: 'Deal Search Intelligence',
    category: 'deal-intelligence',
    description: 'Search retail deal sources and return ranked savings intelligence for agents.',
    endpoint: { method: 'GET', path: '/v1/deals/search' },
    price: { usdc: '0.25', microUsdc: '250000' },
    paymentRail: 'circle_gateway_x402',
    supportedNetworks: ['eip155:5042002', 'eip155:84532'],
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Product, brand, or merchant search query.' },
        regions: { type: 'string', description: 'Comma-separated market codes such as us,eu.' },
      },
      required: ['query'],
    },
    outputSummary: 'Ranked deal intelligence with merchant, region, confidence, source, and price note.',
    receiptFields: ['serviceId', 'endpoint', 'amount', 'paymentRail', 'settlementId', 'buyer', 'seller', 'timestamp', 'resultSummary'],
  },
  {
    id: 'dealar.retailers.list',
    name: 'Retailer Intelligence Directory',
    category: 'retail-intelligence',
    description: 'List relevant retailers by category and market for deal-scouting agents.',
    endpoint: { method: 'GET', path: '/v1/retailers' },
    price: { usdc: '0.05', microUsdc: '50000' },
    paymentRail: 'circle_gateway_x402',
    supportedNetworks: ['eip155:5042002', 'eip155:84532'],
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Retail category filter.' },
        markets: { type: 'string', description: 'Comma-separated market codes.' },
      },
    },
    outputSummary: 'Retailer list with market, strengths, confidence, and category metadata.',
    receiptFields: ['serviceId', 'endpoint', 'amount', 'paymentRail', 'settlementId', 'buyer', 'seller', 'timestamp', 'resultSummary'],
  },
  {
    id: 'dealar.coupons.verify',
    name: 'Coupon Verification',
    category: 'coupon-verification',
    description: 'Verify coupon validity and discount metadata for agent checkout flows.',
    endpoint: { method: 'POST', path: '/v1/coupons/verify' },
    price: { usdc: '0.01', microUsdc: '10000' },
    paymentRail: 'circle_gateway_x402',
    supportedNetworks: ['eip155:5042002', 'eip155:84532'],
    inputSchema: {
      type: 'object',
      properties: {
        merchant: { type: 'string' },
        code: { type: 'string' },
        region: { type: 'string' },
      },
      required: ['merchant', 'code'],
    },
    outputSummary: 'Coupon validity, discount value, expiry, and source confidence.',
    receiptFields: ['serviceId', 'endpoint', 'amount', 'paymentRail', 'settlementId', 'buyer', 'seller', 'timestamp', 'resultSummary'],
  },
];

export function listMarketplaceServices() {
  return SERVICES.map((service) => ({ ...service, endpoint: { ...service.endpoint }, price: { ...service.price } }));
}

export function getMarketplaceService(idOrPath) {
  return listMarketplaceServices().find((service) => service.id === idOrPath || service.endpoint.path === idOrPath) || null;
}

export function summarizeMarketplaceServices(services = listMarketplaceServices()) {
  const prices = services.map((service) => Number(service.price.usdc));
  return {
    totalServices: services.length,
    categories: Array.from(new Set(services.map((service) => service.category))),
    paymentRails: Array.from(new Set(services.map((service) => service.paymentRail))),
    minPriceUsdc: Math.min(...prices).toFixed(2),
    maxPriceUsdc: Math.max(...prices).toFixed(2),
  };
}
