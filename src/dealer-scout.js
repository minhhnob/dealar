const SOURCES = [
  { id: 'amazon', name: 'Amazon', strengths: ['fast shipping', 'new products', 'price checks'], mode: 'demo-adapter' },
  { id: 'ebay', name: 'eBay', strengths: ['used/refurbished', 'auction pricing', 'seller-rating checks'], mode: 'demo-adapter' },
  { id: 'sephora', name: 'Sephora', strengths: ['beauty sales', 'brand-safe inventory', 'voucher checks'], mode: 'demo-adapter' },
  { id: 'slickdeals', name: 'Slickdeals', strengths: ['community validation', 'hot deal threads', 'coupon discovery'], mode: 'demo-adapter' },
];

const CATALOG = {
  'dior sauvage': [
    { source: 'amazon', retailer: 'Amazon', title: 'Dior Sauvage Eau de Parfum 3.4 oz', price: 98.5, listPrice: 112, couponCode: null, couponValue: 0, url: 'https://www.amazon.com/s?k=Dior+Sauvage', availability: 'in_stock', sellerRating: 4.5, risk: 'medium', confidence: 0.78, freshness: 'demo' },
    { source: 'ebay', retailer: 'eBay', title: 'Dior Sauvage EDP 100ml - verified seller', price: 84, listPrice: 112, couponCode: null, couponValue: 0, url: 'https://www.ebay.com/sch/i.html?_nkw=Dior+Sauvage', availability: 'limited', sellerRating: 4.7, risk: 'medium', confidence: 0.72, freshness: 'demo' },
    { source: 'sephora', retailer: 'Sephora', title: 'Dior Sauvage Eau de Parfum', price: 112, listPrice: 112, couponCode: 'BEAUTY20', couponValue: 22.4, url: 'https://www.sephora.com/search?keyword=Dior%20Sauvage', availability: 'in_stock', sellerRating: null, risk: 'low', confidence: 0.9, freshness: 'demo' },
    { source: 'slickdeals', retailer: 'Slickdeals', title: 'Dior fragrance discount thread', price: 94.99, listPrice: 112, couponCode: 'FRAGRANCE15', couponValue: 14.25, url: 'https://slickdeals.net/newsearch.php?q=Dior+Sauvage', availability: 'thread_active', sellerRating: null, risk: 'low', confidence: 0.82, freshness: 'demo' },
  ],
  'dyson airwrap': [
    { source: 'amazon', retailer: 'Amazon', title: 'Dyson Airwrap multi-styler', price: 449.99, listPrice: 599.99, couponCode: 'CLIP10', couponValue: 10, url: 'https://www.amazon.com/s?k=Dyson+Airwrap', availability: 'in_stock', sellerRating: 4.4, risk: 'medium', confidence: 0.78, freshness: 'demo' },
    { source: 'ebay', retailer: 'eBay', title: 'Dyson Airwrap refurbished/open-box', price: 349.99, listPrice: 599.99, couponCode: null, couponValue: 0, url: 'https://www.ebay.com/sch/i.html?_nkw=Dyson+Airwrap', availability: 'limited', sellerRating: 4.8, risk: 'medium', confidence: 0.74, freshness: 'demo' },
    { source: 'sephora', retailer: 'Sephora', title: 'Dyson Airwrap Complete Long', price: 599.99, listPrice: 599.99, couponCode: 'BEAUTY15', couponValue: 90, url: 'https://www.sephora.com/search?keyword=Dyson%20Airwrap', availability: 'in_stock', sellerRating: null, risk: 'low', confidence: 0.89, freshness: 'demo' },
    { source: 'slickdeals', retailer: 'Slickdeals', title: 'Dyson Airwrap sale discussion', price: 424.99, listPrice: 599.99, couponCode: 'HOTDEAL', couponValue: 0, url: 'https://slickdeals.net/newsearch.php?q=Dyson+Airwrap', availability: 'thread_active', sellerRating: null, risk: 'low', confidence: 0.84, freshness: 'demo' },
  ],
  'iphone 15 pro max': [
    { source: 'amazon', retailer: 'Amazon', title: 'Apple iPhone 15 Pro Max unlocked renewed', price: 899.99, listPrice: 1199, couponCode: 'RENEWED50', couponValue: 50, url: 'https://www.amazon.com/s?k=iPhone+15+Pro+Max', availability: 'in_stock', sellerRating: 4.6, risk: 'medium', confidence: 0.8, freshness: 'demo' },
    { source: 'ebay', retailer: 'eBay', title: 'iPhone 15 Pro Max used unlocked', price: 789.99, listPrice: 1199, couponCode: null, couponValue: 0, url: 'https://www.ebay.com/sch/i.html?_nkw=iPhone+15+Pro+Max', availability: 'limited', sellerRating: 4.9, risk: 'high', confidence: 0.68, freshness: 'demo' },
    { source: 'sephora', retailer: 'Sephora', title: 'No matching beauty product', price: 0, listPrice: 0, couponCode: null, couponValue: 0, url: 'https://www.sephora.com/search?keyword=iPhone%2015%20Pro%20Max', availability: 'not_applicable', sellerRating: null, risk: 'n/a', confidence: 0, freshness: 'demo' },
    { source: 'slickdeals', retailer: 'Slickdeals', title: 'Carrier promo thread for iPhone 15 Pro Max', price: 849.99, listPrice: 1199, couponCode: 'CARRIERPROMO', couponValue: 0, url: 'https://slickdeals.net/newsearch.php?q=iPhone+15+Pro+Max', availability: 'thread_active', sellerRating: null, risk: 'medium', confidence: 0.76, freshness: 'demo' },
  ],
  whoop: [
    { source: 'amazon', retailer: 'Amazon', title: 'WHOOP 4.0 wearable health tracker membership bundle', price: 199, listPrice: 239, couponCode: 'CLIP20', couponValue: 20, url: 'https://www.amazon.com/s?k=WHOOP+4.0', availability: 'in_stock', sellerRating: 4.4, risk: 'medium', confidence: 0.76, freshness: 'demo' },
    { source: 'ebay', retailer: 'eBay', title: 'WHOOP 4.0 band and charger pre-owned', price: 79.99, listPrice: 239, couponCode: null, couponValue: 0, url: 'https://www.ebay.com/sch/i.html?_nkw=WHOOP+4.0', availability: 'limited', sellerRating: 4.6, risk: 'high', confidence: 0.42, freshness: 'demo' },
    { source: 'sephora', retailer: 'Sephora', title: 'No matching WHOOP product', price: 0, listPrice: 0, couponCode: null, couponValue: 0, url: 'https://www.sephora.com/search?keyword=WHOOP', availability: 'not_applicable', sellerRating: null, risk: 'n/a', confidence: 0, freshness: 'demo' },
    { source: 'slickdeals', retailer: 'Slickdeals', title: 'WHOOP membership promo discussion', price: 189, listPrice: 239, couponCode: 'WHOOPDEAL', couponValue: 0, url: 'https://slickdeals.net/newsearch.php?q=WHOOP', availability: 'thread_active', sellerRating: null, risk: 'low', confidence: 0.7, freshness: 'demo' },
  ],
  'whoop 5.0': [
    { source: 'amazon', retailer: 'Amazon', title: 'WHOOP 5.0 membership bundle', price: 239, listPrice: 239, couponCode: null, couponValue: 0, url: 'https://www.amazon.com/s?k=WHOOP+5.0', availability: 'watchlist', sellerRating: 4.3, risk: 'medium', confidence: 0.62, freshness: 'demo' },
    { source: 'ebay', retailer: 'eBay', title: 'WHOOP 5.0 / MG listings watchlist', price: 219.99, listPrice: 239, couponCode: null, couponValue: 0, url: 'https://www.ebay.com/sch/i.html?_nkw=WHOOP+5.0', availability: 'watchlist', sellerRating: 4.5, risk: 'high', confidence: 0.48, freshness: 'demo' },
    { source: 'sephora', retailer: 'Sephora', title: 'No matching WHOOP 5.0 product', price: 0, listPrice: 0, couponCode: null, couponValue: 0, url: 'https://www.sephora.com/search?keyword=WHOOP%205.0', availability: 'not_applicable', sellerRating: null, risk: 'n/a', confidence: 0, freshness: 'demo' },
    { source: 'slickdeals', retailer: 'Slickdeals', title: 'WHOOP 5.0 launch / membership promo watchlist', price: 229, listPrice: 239, couponCode: 'WHOOPDEAL', couponValue: 0, url: 'https://slickdeals.net/newsearch.php?q=WHOOP+5.0', availability: 'thread_active', sellerRating: null, risk: 'low', confidence: 0.64, freshness: 'demo' },
  ],
};

const COUPONS = {
  sephora: [
    { code: 'BEAUTY20', discount: '20% off selected beauty/fragrance', confidence: 0.86, expiry: 'demo', sourceUrl: 'https://www.sephora.com/beauty/beauty-offers' },
    { code: 'BEAUTY15', discount: '15% off selected tools and beauty products', confidence: 0.8, expiry: 'demo', sourceUrl: 'https://www.sephora.com/beauty/beauty-offers' },
  ],
  amazon: [
    { code: 'CLIP10', discount: '$10 clip coupon when available', confidence: 0.68, expiry: 'demo', sourceUrl: 'https://www.amazon.com/coupons' },
    { code: 'RENEWED50', discount: '$50 renewed device promo sample', confidence: 0.62, expiry: 'demo', sourceUrl: 'https://www.amazon.com/s?k=renewed' },
    { code: 'CLIP20', discount: '$20 WHOOP clip coupon when available', confidence: 0.64, expiry: 'demo', sourceUrl: 'https://www.amazon.com/s?k=WHOOP+4.0' },
  ],
  ebay: [
    { code: 'EBAYREFURB', discount: 'Refurbished item discount sample', confidence: 0.58, expiry: 'demo', sourceUrl: 'https://www.ebay.com/deals' },
  ],
  slickdeals: [
    { code: 'HOTDEAL', discount: 'Community-posted sale/coupon thread', confidence: 0.74, expiry: 'demo', sourceUrl: 'https://slickdeals.net/' },
    { code: 'WHOOPDEAL', discount: 'WHOOP membership promo thread', confidence: 0.7, expiry: 'demo', sourceUrl: 'https://slickdeals.net/newsearch.php?q=WHOOP' },
  ],
};

const money = (n) => Number(n).toFixed(2);
const normalize = (q) => String(q || '').toLowerCase().trim();

function pickDataset(query) {
  const key = normalize(query);
  if (key.includes('dior') || key.includes('sauvage') || key.includes('sephora skincare')) return CATALOG['dior sauvage'];
  if (key.includes('dyson') || key.includes('airwrap')) return CATALOG['dyson airwrap'];
  if (key.includes('iphone') || key.includes('15 pro')) return CATALOG['iphone 15 pro max'];
  if (key.includes('whoop') && (key.includes('5.0') || key.includes('5 ') || key.includes('mg'))) return CATALOG['whoop 5.0'];
  if (key.includes('whoop')) return CATALOG.whoop;
  return [];
}

function enrichDeal(deal) {
  const effective = Math.max(0, deal.price - (deal.couponValue || 0));
  const discountPercent = deal.listPrice > 0 ? Math.round(((deal.listPrice - effective) / deal.listPrice) * 100) : 0;
  const riskPenalty = { low: 0, medium: 8, high: 20, 'n/a': 100 }[deal.risk] ?? 10;
  const retailerTrustBonus = { sephora: 10, amazon: 4, slickdeals: 2, ebay: 0 }[deal.source] ?? 0;
  const directRetailerBonus = deal.source === 'sephora' || deal.source === 'amazon' ? 6 : 0;
  const score = deal.price > 0 ? (100 - effective / 10 - riskPenalty + deal.confidence * 20 + discountPercent / 2 + retailerTrustBonus + directRetailerBonus) : -999;
  return { ...deal, price: money(deal.price), listPrice: money(deal.listPrice), effectivePrice: money(effective), discountPercent, score: Number(score.toFixed(2)) };
}

export function listDealerSources() {
  return SOURCES.map((source) => ({ ...source }));
}

export function searchDealerDeals({ query = 'Dior Sauvage', sources = ['amazon', 'ebay', 'sephora', 'slickdeals'], region = 'us' } = {}) {
  const wanted = Array.isArray(sources) ? sources : String(sources).split(',').map((s) => s.trim()).filter(Boolean);
  const results = pickDataset(query).filter((deal) => wanted.includes(deal.source)).map(enrichDeal).sort((a, b) => b.score - a.score);
  const bestDeal = results[0];
  const safer = results.find((deal) => deal.risk === 'low') || bestDeal;
  const recommendation = {
    action: bestDeal?.source === 'sephora' ? 'buy_sephora' : `consider_${bestDeal?.source || 'none'}`,
    reason: bestDeal ? `${bestDeal.retailer} has the strongest coupon-adjusted deal after risk and confidence scoring.` : 'No matching deals found.',
    safestAlternative: safer ? { source: safer.source, retailer: safer.retailer, effectivePrice: safer.effectivePrice, risk: safer.risk } : null,
  };
  const response = { query, region, sources: wanted, bestDeal, results, recommendation };
  return { ...response, telegramSummary: buildTelegramDealSummary(response) };
}

export function quoteProduct({ query = 'Dior Sauvage' } = {}) {
  const search = searchDealerDeals({ query });
  const priced = search.results.filter((deal) => Number(deal.price) > 0);
  const byPrice = [...priced].sort((a, b) => Number(a.effectivePrice) - Number(b.effectivePrice));
  const bestPrice = byPrice[0];
  const safestDeal = priced.find((deal) => deal.source === 'sephora' && deal.risk === 'low') || priced.find((deal) => deal.source === 'amazon' && deal.risk !== 'high') || priced.find((deal) => deal.risk === 'low') || bestPrice;
  const avg = priced.reduce((sum, deal) => sum + Number(deal.effectivePrice), 0) / Math.max(1, priced.length);
  return {
    product: query,
    bestPrice,
    safestDeal,
    averageMarketPrice: money(avg),
    buyAdvice: bestPrice?.source !== safestDeal?.source
      ? `For price-first buying choose ${bestPrice.retailer}; for safer warranty/retailer trust choose ${safestDeal.retailer}.`
      : `Best and safest option is ${bestPrice?.retailer || 'not available'}.`,
    comparedSources: search.sources,
  };
}

export function searchDealerCoupons({ query = '', source } = {}) {
  const selected = source ? [source] : Object.keys(COUPONS);
  const terms = normalize(query).split(/\s+/).filter((term) => term.length >= 3);
  const coupons = selected.flatMap((src) => (COUPONS[src] || []).map((coupon) => ({ source: src, ...coupon })))
    .filter((coupon) => {
      if (!query) return true;
      const haystack = `${coupon.source} ${coupon.code} ${coupon.discount}`.toLowerCase();
      return terms.some((term) => haystack.includes(term)) || normalize(query).includes(coupon.source);
    });
  const body = coupons.map((coupon) => `🎟 ${coupon.source}: ${coupon.code} — ${coupon.discount}`).join('\n') || `No verified coupons found for "${query}" in the demo catalog.`;
  return { query, source: source || 'all', coupons, telegramSummary: `🎟 Dealer coupons\n${body}` };
}

export function buildTelegramDealSummary(result) {
  const best = result.bestDeal;
  if (!best) return `⚠️ Dealer check: ${result.query}\nNo deals found.`;
  const alt = result.recommendation?.safestAlternative;
  return [
    `✅ Dealer check: ${result.query}`,
    '',
    `Best deal: ${best.retailer} — $${best.effectivePrice}`,
    `Product: ${best.title}`,
    `Coupon: ${best.couponCode || 'none'}`,
    `Discount: ${best.discountPercent}%`,
    `Risk: ${best.risk}`,
    `Confidence: ${Math.round(best.confidence * 100)}%`,
    `Link: ${best.url}`,
    '',
    alt ? `Safe option: ${alt.retailer} — $${alt.effectivePrice} (${alt.risk})` : '',
    `Recommendation: ${result.recommendation?.reason || 'Compare price and seller risk before buying.'}`,
  ].filter(Boolean).join('\n');
}
