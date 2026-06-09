export function buildConduitReferenceModel() {
  return {
    source: {
      homepage: 'https://conduit-pay.vercel.app/',
      docs: 'https://conduit-pay.vercel.app/docs',
      developers: 'https://conduit-pay.vercel.app/developers',
    },
    product: {
      name: 'Conduit',
      thesis: 'USDC payment links and x402 payment infrastructure on Arc Network, powered by Circle.',
      version: 'v0.1.0',
    },
    network: {
      name: 'Arc Testnet',
      chainId: 5042002,
      caip2: 'eip155:5042002',
      usdc: '0x3600000000000000000000000000000000000000',
      usdcDecimals: 6,
      rpcUrl: 'https://rpc.testnet.arc.network',
      explorer: 'https://testnet.arcscan.app',
      faucet: 'https://faucet.circle.com',
    },
    facilitator: {
      url: 'https://conduitpay.xyz/api/x402',
      package: '@ace_won/x402',
      packageVersion: 'v1.0.2',
      fee: '0.5%',
    },
    primitives: [
      {
        name: 'Payment Links',
        dealerMapping: 'Shareable checkout URLs for one-off paid deep deal checks or voucher verification reports.',
      },
      {
        name: 'Stealth Mode',
        dealerMapping: 'Optional privacy framing for user-funded deal requests where payer wallet identity should not be exposed in demos.',
      },
      {
        name: 'Escrow',
        dealerMapping: 'Future high-value concierge purchase flow: hold USDC until buyer confirms product/deal receipt.',
      },
      {
        name: 'AI Dispute Agent',
        dealerMapping: 'Future order/deal dispute helper that summarizes evidence but keeps release/refund deterministic and user-approved.',
      },
      {
        name: 'x402 Facilitator',
        dealerMapping: 'Use Arc x402 facilitator flow for per-request Dealer API monetization.',
      },
      {
        name: 'Marketplace',
        dealerMapping: 'List Dealer paid endpoints so agents can discover and pay automatically per request.',
      },
    ],
    developerEndpoints: [
      'GET /api/x402',
      'POST /api/x402/verify',
      'POST /api/x402/settle',
      'GET /api/x402/payments',
      'GET /api/arc-stats',
    ],
    x402Flow: [
      'Client hits API without payment header',
      'Server returns 402 Payment Required with payment details',
      'Client signs EIP-3009 USDC authorization on Arc',
      'Facilitator verifies payload, amount, recipient, nonce, and balance',
      'Handler serves the paid resource',
      'Facilitator settles USDC transfer asynchronously on Arc',
    ],
  };
}

export function buildDealerConduitIntegrationPlan() {
  return {
    objective: 'Make Dealer feel like a Conduit-style paid AI deal scout: shareable checks, Arc/x402 payment readiness, and marketplace-ready paid APIs.',
    paymentProducts: [
      {
        name: 'Quick Deal Check',
        endpoint: '/v1/dealer/search',
        priceUsdc: '0.001',
        description: 'Amazon/eBay/Sephora/Slickdeals comparison with coupon-adjusted best deal.',
      },
      {
        name: 'Product Quote',
        endpoint: '/v1/dealer/quote',
        priceUsdc: '0.001',
        description: 'Best price, safer option, average market price, and risk-aware buy advice.',
      },
      {
        name: 'Voucher Check',
        endpoint: '/v1/dealer/coupons',
        priceUsdc: '0.001',
        description: 'Coupon/voucher intelligence for store or product queries.',
      },
      {
        name: 'Deep Deal Report',
        endpoint: '/v1/dealer/deep-report',
        priceUsdc: '0.005',
        description: 'Future live-source scan, marketplace history, coupon validation, and Telegram-ready report.',
      },
    ],
    dashboardSections: [
      'Conduit-style Payment Links',
      'Arc x402 Readiness',
      'Dealer Paid API Products',
      'Telegram Pay-to-Check Preview',
    ],
    telegramCommands: [
      'check deal <product>',
      'check giá <product>',
      'tìm voucher <store/product>',
      'pay for deep deal check',
    ],
    nextSteps: [
      'Add @ace_won/x402 or compatible Conduit facilitator mode for Arc Testnet payments.',
      'Generate shareable payment/checkout links for deep deal checks.',
      'Add a paid deep-report route gated by x402 at 0.005 USDC.',
      'Add receipt entries with facilitator verification and settle tx hash.',
      'Submit Dealer endpoints to a Conduit-style x402 marketplace once live payment mode is configured.',
    ],
  };
}
