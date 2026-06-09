import { buildTelegramDealSummary, quoteProduct, searchDealerCoupons, searchDealerDeals } from './dealer-scout.js';

const normalizeBaseUrl = (baseUrl = 'https://prodeal-api.vercel.app') => String(baseUrl).replace(/\/$/, '');

function stableId(prefix, input) {
  let hash = 0;
  for (const char of input) hash = ((hash << 5) - hash + char.charCodeAt(0)) >>> 0;
  return `${prefix}-${hash.toString(16).padStart(8, '0')}`;
}

export function listDealerCapabilities({ baseUrl = 'https://prodeal-api.vercel.app' } = {}) {
  const base = normalizeBaseUrl(baseUrl);
  return [
    {
      id: 'scout.quick-check',
      name: 'Quick Check',
      description: 'Fast source mix scan for cheap deals, sales, and obvious voucher opportunities.',
      endpoint: `${base}/v1/scout/check`,
      price: { usdc: '0.001', atomicUnits: '1000' },
      output: 'ranked_deal_snapshot',
    },
    {
      id: 'scout.price-quote',
      name: 'Price Quote',
      description: 'Best price, safer option, average market price, and buy/no-buy recommendation.',
      endpoint: `${base}/v1/scout/quote`,
      price: { usdc: '0.001', atomicUnits: '1000' },
      output: 'price_quote',
    },
    {
      id: 'scout.voucher-scan',
      name: 'Voucher Scan',
      description: 'Coupon/voucher discovery and confidence scoring for store or product queries.',
      endpoint: `${base}/v1/scout/vouchers`,
      price: { usdc: '0.001', atomicUnits: '1000' },
      output: 'voucher_scan',
    },
    {
      id: 'scout.report',
      name: 'Scout Report',
      description: 'Full Dealer shopping-intelligence report with price comparison, vouchers, source mix, trust score, and Telegram summary.',
      endpoint: `${base}/v1/scout/report`,
      price: { usdc: '0.005', atomicUnits: '5000' },
      output: 'scout_report',
    },
    {
      id: 'scout.watch-alert',
      name: 'Price Watch Alert',
      description: 'Future scheduled alert when a product drops below target price or strong voucher appears.',
      endpoint: `${base}/v1/scout/watch-alerts`,
      price: { usdc: '0.010', atomicUnits: '10000' },
      output: 'price_watch_alert',
      status: 'planned',
    },
  ];
}

export function getDealerCapability(capabilityId = 'scout.report', opts = {}) {
  return listDealerCapabilities(opts).find((capability) => capability.id === capabilityId);
}

function buildTrustScore(search, quote) {
  const best = search.bestDeal;
  const riskPenalty = { low: 0, medium: 18, high: 35, 'n/a': 50 }[best?.risk] ?? 20;
  const confidence = Math.round((best?.confidence ?? 0.7) * 100);
  const safeBonus = quote.safestDeal?.risk === 'low' ? 8 : 0;
  const score = Math.max(0, Math.min(100, confidence - riskPenalty + safeBonus));
  return {
    score,
    level: score >= 80 ? 'strong' : score >= 60 ? 'medium' : 'cautious',
    reason: `${best?.retailer || 'Source'} confidence adjusted by seller/source risk and safer-option availability.`,
  };
}

export function buildScoutReport({ query = 'Dyson Airwrap', sources = ['amazon', 'ebay', 'sephora', 'slickdeals'], baseUrl = 'https://prodeal-api.vercel.app' } = {}) {
  const search = searchDealerDeals({ query, sources });
  const priceQuote = quoteProduct({ query, sources });
  const voucherScan = searchDealerCoupons({ query, source: 'sephora' });
  if (voucherScan.coupons.length === 0) {
    const bestCoupon = search.bestDeal?.couponCode;
    voucherScan.coupons = [{
      code: bestCoupon || 'NO_CODE_PRICE_DROP',
      source: search.bestDeal?.source || 'dealer',
      discount: search.bestDeal?.discountPercent ? `${search.bestDeal.discountPercent}%` : 'price-drop',
      confidence: search.bestDeal?.confidence || 0.7,
      note: bestCoupon
        ? 'Derived from Dealer source mix when no direct store voucher matched the query.'
        : 'No voucher code found; Dealer records the best price-drop opportunity instead.',
    }];
  }
  const capability = getDealerCapability('scout.report', { baseUrl });
  const bestDeal = search.bestDeal;
  const trustScore = buildTrustScore(search, priceQuote);
  const sourceMix = {
    sources,
    count: sources.length,
    consulted: search.results.map((item) => ({ source: item.source, retailer: item.retailer, risk: item.risk, confidence: item.confidence })),
  };
  const telegramSummary = [
    `✅ Dealer Scout Report: ${query}`,
    '',
    `Best deal: ${bestDeal?.retailer || 'n/a'} — $${bestDeal?.effectivePrice || bestDeal?.price || 'n/a'}`,
    `Voucher: ${bestDeal?.couponCode || voucherScan.coupons?.[0]?.code || 'none'}`,
    `Trust score: ${trustScore.score}/100 (${trustScore.level})`,
    `Safe option: ${priceQuote.safestDeal?.retailer || 'n/a'} — $${priceQuote.safestDeal?.effectivePrice || priceQuote.safestDeal?.price || 'n/a'}`,
    `Recommendation: ${search.recommendation?.reason || 'Pick the best low-risk coupon-adjusted source.'}`,
  ].join('\n');

  return {
    type: 'Scout Report',
    id: stableId('scout-report', `${query}:${sources.join(',')}`),
    query,
    capability,
    sourceMix,
    bestDeal,
    priceQuote,
    voucherScan,
    trustScore,
    recommendation: search.recommendation,
    telegramSummary,
    compatibility: {
      legacyEndpoint: `${normalizeBaseUrl(baseUrl)}/v1/dealer/deep-report`,
      originalEndpoint: `${normalizeBaseUrl(baseUrl)}/v1/scout/report`,
    },
  };
}

export function createDealRequestTicket({ query = 'Dyson Airwrap', capabilityId = 'scout.report', baseUrl = 'https://prodeal-api.vercel.app' } = {}) {
  const base = normalizeBaseUrl(baseUrl);
  const capability = getDealerCapability(capabilityId, { baseUrl: base });
  if (!capability) throw new Error(`Unknown Dealer capability: ${capabilityId}`);
  const id = stableId('ticket', `${capabilityId}:${query}:${capability.price.usdc}`);
  return {
    type: 'Deal Request Ticket',
    id,
    query,
    capabilityId,
    capabilityName: capability.name,
    amount: capability.price,
    status: 'demo_ready',
    ticketUrl: `${base}/v1/scout/tickets/${id}`,
    unlockUrl: `${base}/v1/scout/report?query=${encodeURIComponent(query)}`,
    payment: {
      mode: 'demo_x402_ready',
      note: 'Designed for future x402/USDC unlock; currently demo-ready.',
    },
    telegramPrompt: `pay for scout report ${query}`,
    createdAt: new Date(0).toISOString(),
  };
}

export function buildDealerCapabilityCard({ baseUrl = 'https://prodeal-api.vercel.app' } = {}) {
  const base = normalizeBaseUrl(baseUrl);
  return {
    type: 'Dealer Capability Card',
    product: {
      name: 'Dealer',
      identity: 'AI Deal Scout Agent',
      purpose: 'Find cheap deals, sales, vouchers, and product price quotes across trusted shopping sources.',
    },
    principles: ['reference_synthesis_not_copying', 'telegram_native_output', 'risk_aware_recommendations', 'paid_report_ready'],
    capabilities: listDealerCapabilities({ baseUrl: base }),
    links: {
      dashboard: `${base}/dashboard`,
      scoutReport: `${base}/v1/scout/report`,
      tickets: `${base}/v1/scout/tickets`,
      receipts: `${base}/v1/scout/receipts`,
      legacyAgentCard: `${base}/v1/agent-card`,
    },
    telegramCommands: ['check deal <product>', 'check giá <product>', 'tìm voucher <store/product>', 'tạo scout report <product>'],
  };
}

export function createDealReceipt({ report, amountUsdc = '0.000', mode = 'demo' } = {}) {
  const resolvedReport = report || buildScoutReport();
  return {
    type: 'Deal Receipt',
    id: stableId('receipt', `${resolvedReport.id}:${amountUsdc}:${mode}`),
    query: resolvedReport.query,
    reportId: resolvedReport.id,
    amount: { usdc: amountUsdc, currency: 'USDC' },
    mode,
    sourceMix: resolvedReport.sourceMix.sources,
    trustScore: resolvedReport.trustScore,
    resultSummary: `${resolvedReport.bestDeal?.retailer || 'n/a'} best deal for ${resolvedReport.query} with trust score ${resolvedReport.trustScore.score}/100`,
    createdAt: new Date(0).toISOString(),
  };
}
