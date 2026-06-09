import crypto from 'node:crypto';

const nowIso = () => new Date().toISOString();

const normalizeList = (values, fallback) => {
  if (!values) return fallback;
  const list = Array.isArray(values) ? values : String(values).split(',');
  const cleaned = list.map((value) => String(value).trim().toLowerCase()).filter(Boolean);
  return cleaned.length ? [...new Set(cleaned)] : fallback;
};

const DEALS = [
  {
    query_terms: ['whoop', 'whoop 5.0', 'whoop membership'],
    merchant: 'WHOOP Official',
    region: 'us',
    source_type: 'official_store',
    deal_type: 'membership promos and seasonal sale bundles',
    url: 'https://shop.whoop.com/',
    price_note: 'Best first check for Black Friday, Cyber Monday, New Year fitness promos, and annual membership discounts.',
    confidence: 0.94,
  },
  {
    query_terms: ['whoop', 'whoop 5.0', 'whoop membership'],
    merchant: 'Slickdeals',
    region: 'us',
    source_type: 'community_deal',
    deal_type: 'community-voted deal threads',
    url: 'https://slickdeals.net/newsearch.php?q=whoop',
    price_note: 'Strongest US channel for limited-time WHOOP membership and cardholder offers.',
    confidence: 0.88,
  },
  {
    query_terms: ['whoop', 'whoop 5.0', 'whoop membership'],
    merchant: 'RetailMeNot',
    region: 'us',
    source_type: 'coupon_site',
    deal_type: 'promo code lookup',
    url: 'https://www.retailmenot.com/view/whoop.com',
    price_note: 'Useful for last-mile coupon checks before checkout.',
    confidence: 0.72,
  },
  {
    query_terms: ['whoop', 'whoop 5.0', 'whoop membership'],
    merchant: 'Student Beans',
    region: 'us',
    source_type: 'eligibility_discount',
    deal_type: 'student discount',
    url: 'https://www.studentbeans.com/student-discount/us/whoop',
    price_note: 'Worth checking when buyer has student verification.',
    confidence: 0.7,
  },
  {
    query_terms: ['whoop', 'whoop 5.0', 'whoop membership'],
    merchant: 'HotUKDeals',
    region: 'eu',
    source_type: 'community_deal',
    deal_type: 'UK/EU community deal threads',
    url: 'https://www.hotukdeals.com/search?q=whoop',
    price_note: 'Best EU/UK community signal for WHOOP sale chatter.',
    confidence: 0.82,
  },
  {
    query_terms: ['whoop', 'whoop 5.0', 'whoop membership'],
    merchant: 'Dealabs',
    region: 'eu',
    source_type: 'community_deal',
    deal_type: 'France/EU deal threads',
    url: 'https://www.dealabs.com/search?q=whoop',
    price_note: 'Good secondary EU channel for localized WHOOP offers.',
    confidence: 0.76,
  },
];

const RETAILERS = [
  { name: 'Sephora US', market: 'us', category: 'beauty', url: 'https://www.sephora.com/', strengths: ['luxury beauty', 'brand depth'], confidence: 0.94 },
  { name: 'Ulta Beauty', market: 'us', category: 'beauty', url: 'https://www.ulta.com/', strengths: ['promos', 'rewards', 'beauty deals'], confidence: 0.93 },
  { name: 'Dermstore', market: 'us', category: 'beauty', url: 'https://www.dermstore.com/', strengths: ['skincare', 'sunscreen', 'clinical brands'], confidence: 0.89 },
  { name: 'Stylevana US', market: 'us', category: 'beauty', url: 'https://www.stylevana.com/en_US/', strengths: ['k-beauty', 'j-beauty', 'lower prices'], confidence: 0.84 },
  { name: 'Nordstrom Beauty', market: 'us', category: 'beauty', url: 'https://www.nordstrom.com/browse/beauty', strengths: ['premium beauty', 'department-store promos'], confidence: 0.82 },
  { name: 'Lookfantastic', market: 'eu', category: 'beauty', url: 'https://www.lookfantastic.com/', strengths: ['UK/EU beauty', 'coupon codes'], confidence: 0.92 },
  { name: 'Cult Beauty', market: 'eu', category: 'beauty', url: 'https://www.cultbeauty.com/', strengths: ['curated beauty', 'premium brands'], confidence: 0.9 },
  { name: 'Beauty Bay', market: 'eu', category: 'beauty', url: 'https://www.beautybay.com/', strengths: ['makeup', 'trend brands'], confidence: 0.86 },
  { name: 'Space NK', market: 'eu', category: 'beauty', url: 'https://www.spacenk.com/uk/home', strengths: ['luxury skincare', 'premium beauty'], confidence: 0.84 },
  { name: 'Allbeauty', market: 'eu', category: 'beauty', url: 'https://www.allbeauty.com/', strengths: ['fragrance', 'discount beauty'], confidence: 0.83 },
  { name: 'Notino', market: 'eu', category: 'beauty', url: 'https://www.notino.co.uk/', strengths: ['fragrance', 'EU cosmetics'], confidence: 0.82 },
];

const COUPONS = [
  {
    merchant: 'lookfantastic',
    code: 'welcome20',
    region: 'uk',
    valid: true,
    discount: '20%',
    conditions: 'New customers only; exclusions may apply.',
    confidence: 0.78,
  },
  {
    merchant: 'cultbeauty',
    code: 'welcome15',
    region: 'uk',
    valid: true,
    discount: '15%',
    conditions: 'Common welcome-code pattern; verify exclusions at checkout.',
    confidence: 0.68,
  },
  {
    merchant: 'stylevana',
    code: 'inf10',
    region: 'us',
    valid: true,
    discount: '10%',
    conditions: 'Influencer-code style discount; verify current validity at checkout.',
    confidence: 0.64,
  },
];

export function searchDeals({ query, regions } = {}) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  const normalizedRegions = normalizeList(regions, ['us', 'eu']);
  const matches = DEALS.filter((deal) => (
    normalizedRegions.includes(deal.region)
    && deal.query_terms.some((term) => normalizedQuery.includes(term) || term.includes(normalizedQuery))
  )).sort((a, b) => b.confidence - a.confidence);

  return {
    query: normalizedQuery,
    regions: normalizedRegions,
    checked_at: nowIso(),
    best_deals: matches,
    recommendation: matches.length
      ? 'Check official store first, then validate against Slickdeals/HotUKDeals-style community sources and coupon sites before checkout.'
      : 'No curated match yet. Add product intelligence to the ProDeal database or run a live search connector.',
    confidence: matches[0]?.confidence ?? 0.25,
  };
}

export function listRetailers({ category = 'beauty', markets } = {}) {
  const normalizedCategory = String(category).trim().toLowerCase();
  const normalizedMarkets = normalizeList(markets, ['us', 'eu']);
  const retailers = RETAILERS.filter((retailer) => (
    retailer.category === normalizedCategory && normalizedMarkets.includes(retailer.market)
  )).sort((a, b) => b.confidence - a.confidence);

  return {
    category: normalizedCategory,
    markets: normalizedMarkets,
    checked_at: nowIso(),
    retailers,
  };
}

export function verifyCoupon({ merchant, code, region } = {}) {
  const normalizedMerchant = String(merchant || '').trim().toLowerCase();
  const normalizedCode = String(code || '').trim().toLowerCase();
  const normalizedRegion = String(region || '').trim().toLowerCase();
  const match = COUPONS.find((coupon) => (
    coupon.merchant === normalizedMerchant
    && coupon.code === normalizedCode
    && (!normalizedRegion || coupon.region === normalizedRegion)
  ));

  if (match) {
    return {
      merchant: normalizedMerchant,
      code: String(code).trim().toUpperCase(),
      region: match.region,
      checked_at: nowIso(),
      ...match,
    };
  }

  return {
    merchant: normalizedMerchant,
    code: String(code || '').trim().toUpperCase(),
    region: normalizedRegion,
    checked_at: nowIso(),
    valid: false,
    discount: null,
    conditions: null,
    confidence: 0.2,
    message: 'Coupon is not in curated database. Use live checkout verification before recommending it.',
  };
}

export function createPaymentChallenge({ endpoint, tier = 'basic' } = {}) {
  const prices = {
    coupon_verify: '0.01',
    basic: '0.05',
    full_report: '0.25',
    data_pack: '5.00',
  };
  const price = prices[tier] ?? prices.basic;
  const paymentId = `pay_${crypto.createHash('sha256').update(`${endpoint}:${tier}:${Date.now()}`).digest('hex').slice(0, 16)}`;

  return {
    status: 402,
    payment_id: paymentId,
    endpoint: endpoint || '/v1/deals/search',
    tier,
    price_usdc: price,
    currency: 'USDC',
    protocols: ['x402', 'MPP'],
    networks: ['base-sepolia', 'arc-testnet'],
    expires_in_seconds: 300,
    instructions: 'Retry the same request with an x402 or MPP payment proof header after paying the quoted USDC amount.',
  };
}
