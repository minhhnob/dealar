import { listRetailers, searchDeals, verifyCoupon } from './deal-intelligence.js';
import { DEFAULT_DEALER_SOURCES, buildTelegramDealSummary, listDealerSources, quoteProduct, searchDealerCoupons, searchDealerDeals } from './dealer-scout.js';
import { buildAgentCard, buildProductionCheck } from './agent-card.js';
import { createAgentWalletPolicy } from './agent-wallet-policy.js';
import { buildDashboardModel } from './dashboard.js';
import { createDemoReceiptLedger, getPaymentReceipt, summarizePaymentLedger } from './payment-ledger.js';
import { listMarketplaceServices, summarizeMarketplaceServices } from './service-catalog.js';

export function parseCliPayload(payloadText) {
  try {
    const payload = JSON.parse(payloadText);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('payload must be an object');
    }
    if (!payload.action || typeof payload.action !== 'string') {
      throw new Error('payload.action must be a string');
    }
    return { action: payload.action, params: payload.params || {} };
  } catch (error) {
    if (error.message?.startsWith('payload.')) throw error;
    throw new Error(`Invalid JSON payload: ${error.message}`);
  }
}

export async function executeCliAction(payload) {
  const { action, params = {} } = payload || {};

  try {
    switch (action) {
      case 'deal.search':
        return { ok: true, result: searchDeals({
          query: params.query || 'whoop',
          regions: params.regions || ['us', 'eu'],
        }) };
      case 'retailers.list':
        return { ok: true, result: listRetailers({
          category: params.category || 'beauty',
          markets: params.markets || ['us', 'eu'],
        }) };
      case 'dealer.sources':
        return { ok: true, result: { sources: listDealerSources() } };
      case 'dealer.search': {
        const result = searchDealerDeals({
          query: params.query || 'Dior Sauvage',
          sources: params.sources || DEFAULT_DEALER_SOURCES,
          region: params.region || 'us',
        });
        return { ok: true, result };
      }
      case 'dealer.quote':
        return { ok: true, result: quoteProduct({ query: params.query || 'Dior Sauvage' }) };
      case 'dealer.coupons':
        return { ok: true, result: searchDealerCoupons({ query: params.query || '', source: params.source }) };
      case 'dealer.telegram': {
        const result = searchDealerDeals({ query: params.query || 'Dior Sauvage', sources: params.sources || DEFAULT_DEALER_SOURCES });
        return { ok: true, result: { message: buildTelegramDealSummary(result), search: result } };
      }
      case 'coupon.verify':
        return { ok: true, result: verifyCoupon(params) };
      case 'wallet.policy':
        return { ok: true, result: createAgentWalletPolicy({
          walletLabel: params.walletLabel || 'dealar-agent',
          dailyLimitUsdc: params.dailyLimitUsdc || process.env.DEALAR_AGENT_DAILY_LIMIT_USDC || '1.00',
          perRequestLimitUsdc: params.perRequestLimitUsdc || process.env.DEALAR_AGENT_PER_REQUEST_LIMIT_USDC || '0.25',
          allowlistedBaseUrls: params.allowlistedBaseUrls || [params.apiBaseUrl || process.env.DEALAR_API_BASE_URL || 'http://127.0.0.1:8787'],
          mode: params.mode || process.env.DEALAR_PAYMENT_MODE || 'demo',
        }) };
      case 'agent.card':
        return { ok: true, result: buildAgentCard({
          baseUrl: params.baseUrl || params.apiBaseUrl || process.env.DEALAR_API_BASE_URL || 'https://prodeal-api.vercel.app',
          paymentMode: params.paymentMode || process.env.DEALAR_PAYMENT_MODE || 'demo',
        }) };
      case 'production.check':
        return { ok: true, result: buildProductionCheck({
          baseUrl: params.baseUrl || params.apiBaseUrl || process.env.DEALAR_API_BASE_URL || 'https://prodeal-api.vercel.app',
          paymentMode: params.paymentMode || process.env.DEALAR_PAYMENT_MODE || 'demo',
        }) };
      case 'services.list': {
        const services = listMarketplaceServices();
        return { ok: true, result: { services, summary: summarizeMarketplaceServices(services) } };
      }
      case 'receipts.list': {
        const receipts = createDemoReceiptLedger();
        return { ok: true, result: { receipts, summary: summarizePaymentLedger(receipts) } };
      }
      case 'receipts.get': {
        const receipts = createDemoReceiptLedger();
        const receipt = getPaymentReceipt(receipts, params.id);
        return receipt ? { ok: true, result: { receipt } } : { ok: false, error: 'receipt_not_found' };
      }
      case 'dashboard.summary': {
        const model = buildDashboardModel({
          paymentMode: params.paymentMode || process.env.DEALAR_PAYMENT_MODE || 'demo',
          apiBaseUrl: params.apiBaseUrl || process.env.DEALAR_API_BASE_URL || 'http://127.0.0.1:8787',
        });
        return { ok: true, result: {
          brand: model.brand,
          payment: model.payment,
          wallet: model.wallet,
          metrics: model.metrics,
          endpoints: model.endpoints,
          paymentFlow: model.paymentFlow,
          gatewayTrace: model.gatewayTrace,
          agentStack: model.agentStack,
          services: model.services,
          serviceSummary: model.serviceSummary,
          ledgerSummary: model.ledgerSummary,
        } };
      }
      default:
        return { ok: false, error: `Unknown action: ${action}` };
    }
  } catch (error) {
    return { ok: false, error: error.message || String(error) };
  }
}
