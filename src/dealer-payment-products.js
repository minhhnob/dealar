import { quoteProduct, searchDealerCoupons, searchDealerDeals } from './dealer-scout.js';
import { buildConduitReferenceModel } from './conduit-reference.js';

const normalizeBaseUrl = (baseUrl = 'https://prodeal-api.vercel.app') => String(baseUrl).replace(/\/$/, '');
const paymentLinks = [];

function stableId(input) {
  let hash = 0;
  for (const char of input) hash = ((hash << 5) - hash + char.charCodeAt(0)) >>> 0;
  return `dealer-${hash.toString(16).padStart(8, '0')}`;
}

export function buildPaymentProducts({ baseUrl = 'https://prodeal-api.vercel.app' } = {}) {
  const normalizedBase = normalizeBaseUrl(baseUrl);
  const conduit = buildConduitReferenceModel();

  return [
    {
      id: 'dealer.quick-deal-check',
      name: 'Quick Deal Check',
      description: 'Amazon/eBay/Slickdeals comparison with coupon-adjusted best deal.',
      endpoint: `${normalizedBase}/v1/dealer/search`,
      method: 'GET',
      price: { usdc: '0.001', atomicUnits: '1000' },
      payment: { mode: 'conduit_x402_ready', rail: 'x402', facilitator: conduit.facilitator.url, network: conduit.network.caip2 },
    },
    {
      id: 'dealer.product-quote',
      name: 'Product Quote',
      description: 'Best price, safer option, average market price, and risk-aware buy advice.',
      endpoint: `${normalizedBase}/v1/dealer/quote`,
      method: 'GET',
      price: { usdc: '0.001', atomicUnits: '1000' },
      payment: { mode: 'conduit_x402_ready', rail: 'x402', facilitator: conduit.facilitator.url, network: conduit.network.caip2 },
    },
    {
      id: 'dealer.voucher-check',
      name: 'Voucher Check',
      description: 'Coupon/voucher intelligence for store or product queries.',
      endpoint: `${normalizedBase}/v1/dealer/coupons`,
      method: 'GET',
      price: { usdc: '0.001', atomicUnits: '1000' },
      payment: { mode: 'conduit_x402_ready', rail: 'x402', facilitator: conduit.facilitator.url, network: conduit.network.caip2 },
    },
    {
      id: 'dealer.deep-deal-report',
      name: 'Deep Deal Report',
      description: 'Paid Telegram-ready report with deal ranking, quote, vouchers, risk notes, and recommendation.',
      endpoint: `${normalizedBase}/v1/dealer/deep-report`,
      method: 'GET',
      price: { usdc: '0.005', atomicUnits: '5000' },
      payment: { mode: 'conduit_x402_ready', rail: 'x402', facilitator: conduit.facilitator.url, network: conduit.network.caip2 },
    },
  ];
}

export function getPaymentProduct(productId, opts = {}) {
  return buildPaymentProducts(opts).find((product) => product.id === productId);
}

export function buildDeepDealReport({ query = 'Dyson Airwrap', sources, baseUrl = 'https://prodeal-api.vercel.app' } = {}) {
  const product = getPaymentProduct('dealer.deep-deal-report', { baseUrl });
  const search = searchDealerDeals({ query, sources });
  const quote = quoteProduct({ query, sources });
  const coupons = searchDealerCoupons({ query, source: 'slickdeals' });
  const best = search.bestDeal;
  const coupon = best?.couponCode || coupons.coupons?.[0]?.code || 'n/a';

  const summary = [
    `✅ Dealer deep report: ${query}`,
    '',
    `Best deal: ${best?.retailer || 'n/a'} — $${best?.effectivePrice || best?.price || 'n/a'}`,
    `Coupon: ${coupon}`,
    `Safe option: ${quote.safestDeal?.retailer || 'n/a'} — $${quote.safestDeal?.effectivePrice || quote.safestDeal?.price || 'n/a'}`,
    `Average market price: $${quote.averageMarketPrice}`,
    `Recommendation: ${search.recommendation?.reason || 'Choose the lowest low-risk source.'}`,
  ].join('\n');

  return {
    query,
    product,
    price: product.price,
    payment: {
      required: false,
      mode: 'demo_conduit_ready',
      note: 'Demo returns report directly; live mode will require Conduit/x402 payment before unlock.',
    },
    search,
    quote,
    coupons,
    summary,
  };
}

export function createDealerPaymentLink({ query = 'Dyson Airwrap', productId = 'dealer.deep-deal-report', baseUrl = 'https://prodeal-api.vercel.app' } = {}) {
  const normalizedBase = normalizeBaseUrl(baseUrl);
  const product = getPaymentProduct(productId, { baseUrl: normalizedBase });
  if (!product) throw new Error(`Unknown payment product: ${productId}`);

  const id = stableId(`${productId}:${query}:${product.price.usdc}`);
  const link = {
    id,
    productId,
    title: `${product.name}: ${query}`,
    description: product.description,
    query,
    amount: product.price,
    status: 'demo_unpaid',
    paymentMode: 'demo_conduit_ready',
    payUrl: `${normalizedBase}/pay/${id}`,
    unlockUrl: `${normalizedBase}/v1/dealer/deep-report?query=${encodeURIComponent(query)}`,
    createdAt: new Date(0).toISOString(),
    expiresAt: null,
  };

  const index = paymentLinks.findIndex((item) => item.id === id);
  if (index >= 0) paymentLinks[index] = link;
  else paymentLinks.push(link);
  return link;
}

export function listDealerPaymentLinks({ baseUrl = 'https://prodeal-api.vercel.app' } = {}) {
  if (paymentLinks.length === 0) createDealerPaymentLink({ query: 'Dyson Airwrap', baseUrl });
  return [...paymentLinks];
}

export function buildDealerMarketplaceListing({ baseUrl = 'https://prodeal-api.vercel.app', creatorAddress = '0x0000000000000000000000000000000000000000' } = {}) {
  const normalizedBase = normalizeBaseUrl(baseUrl);
  const product = getPaymentProduct('dealer.deep-deal-report', { baseUrl: normalizedBase });

  return {
    name: 'Dealer Deep Deal Report',
    description: 'AI deal scout for Amazon, eBay, and Slickdeals with coupon-adjusted pricing, risk scoring, and Telegram-ready recommendations.',
    price: product.price.usdc,
    endpoint: product.endpoint,
    category: 'shopping-intelligence',
    creatorAddress,
    creatorUsername: 'dealer-agent',
    status: 'ready_to_submit',
    tryItUrl: `${normalizedBase}/v1/dealer/deep-report?query=Dyson%20Airwrap`,
    docsUrl: `${normalizedBase}/dashboard`,
  };
}
