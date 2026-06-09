import { buildLoomReferenceModel } from './loom-reference.js';
import { createDemoReceiptLedger, summarizePaymentLedger } from './payment-ledger.js';
import { listMarketplaceServices } from './service-catalog.js';
import { listDealerSources } from './dealer-scout.js';
import { buildDealerMarketplaceListing, buildPaymentProducts } from './dealer-payment-products.js';
import { buildDealerCapabilityCard } from './dealer-native-product.js';
import { buildDealarSkillManifest } from './dealar-skill-system.js';

export function buildAgentCard({
  baseUrl = process.env.DEALAR_API_BASE_URL || 'https://prodeal-api.vercel.app',
  paymentMode = process.env.DEALAR_PAYMENT_MODE || 'demo',
} = {}) {
  const normalizedBase = String(baseUrl).replace(/\/$/, '');
  const loom = buildLoomReferenceModel();
  const services = listMarketplaceServices();
  const dealerSources = listDealerSources();
  const paymentProducts = buildPaymentProducts({ baseUrl: normalizedBase });
  const marketplaceListing = buildDealerMarketplaceListing({ baseUrl: normalizedBase });
  const capabilityCard = buildDealerCapabilityCard({ baseUrl: normalizedBase });
  const skillManifest = buildDealarSkillManifest({ baseUrl: normalizedBase });

  return {
    name: 'Dealar',
    displayName: 'Dealar Deal Intelligence Agent',
    description: 'AI Deal Scout Agent for cheap prices, sales, vouchers, and product quotes; payment rails are optional protocol compatibility for paid Scout Reports.',
    version: '0.1.0',
    identity: {
      platform: 'Loom on Arc',
      status: 'ready_to_register',
      tags: ['deals', 'retail-intelligence', 'x402', 'circle-gateway', 'arc-testnet'],
      avatarURI: `${normalizedBase}/dashboard`,
      loomAgentContract: loom.contracts.agentNft,
    },
    network: {
      name: 'Arc Testnet',
      chainId: 'eip155:5042002',
      rpcUrl: loom.contracts.rpcUrl,
    },
    payment: {
      mode: paymentMode,
      rails: ['demo', 'x402', 'circle_gateway_x402'],
      currency: 'USDC',
    },
    capabilities: [
      'paid-deal-search',
      'amazon-price-check',
      'ebay-price-check',
      'sephora-sale-voucher-check',
      'slickdeals-community-validation',
      'telegram-deal-scout',
      'conduit-payment-links',
      'deep-deal-report',
      'marketplace-listing-ready',
      'retailer-intelligence',
      'coupon-verification',
      'receipt-ledger',
      'gateway-payment-trace',
      'telegram-production-check',
      'loom-agent-registration-ready',
      'circle-skills-inspired-agent-skill-system',
    ],
    services,
    capabilityCard,
    skillManifest,
    dealerScout: {
      sources: dealerSources,
      endpoints: [`${normalizedBase}/v1/dealer/search`, `${normalizedBase}/v1/dealer/quote`, `${normalizedBase}/v1/dealer/coupons`, `${normalizedBase}/v1/dealer/deep-report`],
      paymentProducts,
      marketplaceListing,
      telegramCommands: ['check deal <product>', 'check giá <product>', 'tìm voucher <store/product>', 'pay for deep deal check <product>'],
    },
    links: {
      dashboard: `${normalizedBase}/dashboard`,
      health: `${normalizedBase}/health`,
      services: `${normalizedBase}/v1/services`,
      receipts: `${normalizedBase}/v1/payments/receipts`,
      agentCard: `${normalizedBase}/v1/agent-card`,
      check: `${normalizedBase}/v1/check`,
    },
    telegram: {
      commands: ['check Dealar', 'check Dealer', 'Dealar status'],
      summaryFormat: 'Telegram-friendly production health + service + receipt summary.',
    },
    loomReadiness: loom.delearRoadmap,
  };
}

export function buildProductionCheck({
  baseUrl = process.env.DEALAR_API_BASE_URL || 'https://prodeal-api.vercel.app',
  paymentMode = process.env.DEALAR_PAYMENT_MODE || 'demo',
} = {}) {
  const normalizedBase = String(baseUrl).replace(/\/$/, '');
  const services = listMarketplaceServices();
  const receipts = createDemoReceiptLedger();
  const ledgerSummary = summarizePaymentLedger(receipts);
  const ok = services.length > 0 && receipts.length > 0;
  const message = [
    ok ? '✅ Dealar production OK' : '🚨 Dealar production needs attention',
    '',
    `Dashboard: ${normalizedBase}/dashboard`,
    `Payment mode: ${paymentMode}`,
    `Services: ${services.length}`,
    `Receipts: ${ledgerSummary.totalReceipts}`,
    `Revenue: ${ledgerSummary.totalRevenueUsdc} USDC`,
    `Rail: circle_gateway_x402`,
  ].join('\n');

  return {
    ok,
    paymentMode,
    services: services.length,
    receipts: ledgerSummary.totalReceipts,
    revenueUsdc: ledgerSummary.totalRevenueUsdc,
    rail: 'circle_gateway_x402',
    links: {
      dashboard: `${normalizedBase}/dashboard`,
      health: `${normalizedBase}/health`,
      services: `${normalizedBase}/v1/services`,
      receipts: `${normalizedBase}/v1/payments/receipts`,
    },
    message,
  };
}
