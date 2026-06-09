import express from 'express';

import { buildAgentCard, buildProductionCheck } from './agent-card.js';
import {
  createPaymentChallenge,
  listRetailers,
  searchDeals,
  verifyCoupon,
} from './deal-intelligence.js';
import { listDealerSources, quoteProduct, searchDealerCoupons, searchDealerDeals } from './dealer-scout.js';
import { buildConduitReferenceModel, buildDealerConduitIntegrationPlan } from './conduit-reference.js';
import {
  buildDealerMarketplaceListing,
  buildDeepDealReport,
  buildPaymentProducts,
  createDealerPaymentLink,
  listDealerPaymentLinks,
} from './dealer-payment-products.js';
import {
  buildDealerCapabilityCard,
  buildScoutReport,
  createDealReceipt,
  createDealRequestTicket,
} from './dealer-native-product.js';
import { buildDealarLogoSvg } from './dealar-brand.js';
import { renderDashboardHtml } from './dashboard.js';
import { buildGatewayRoutePrices, getGatewayEnvironment } from './gateway-config.js';
import { buildGatewayTraceModel, fetchGatewaySettlement, resolveGatewayBatchTx } from './gateway-trace.js';
import { createDemoReceiptLedger, getPaymentReceipt, summarizePaymentLedger } from './payment-ledger.js';
import { listMarketplaceServices, summarizeMarketplaceServices } from './service-catalog.js';
import { buildX402RouteConfig, getX402Environment } from './x402-config.js';

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';

const parseListParam = (value, fallback) => {
  if (!value) return fallback;
  const list = String(value).split(',').map((item) => item.trim()).filter(Boolean);
  return list.length ? list : fallback;
};

const isDemoPaid = (req) => Boolean(req.headers['x-dealar-paid'] || req.headers['x-payment-proof']);

async function maybeCreatePaymentMiddleware() {
  const mode = String(process.env.DEALAR_PAYMENT_MODE || 'demo').toLowerCase();

  if (['gateway', 'circle-gateway', 'circle_gateway'].includes(mode)) {
    const config = getGatewayEnvironment();
    const { createGatewayMiddleware } = await import('@circle-fin/x402-batching/server');
    const gateway = createGatewayMiddleware({
      sellerAddress: config.sellerAddress,
      facilitatorUrl: config.facilitatorUrl,
      networks: [config.network],
    });
    const prices = buildGatewayRoutePrices();
    return (req, res, next) => {
      if (req.path === '/v1/deals/search') return gateway.require(prices['/v1/deals/search'])(req, res, next);
      if (req.path === '/v1/retailers') return gateway.require(prices['/v1/retailers'])(req, res, next);
      if (req.path === '/v1/coupons/verify') return gateway.require(prices['/v1/coupons/verify'])(req, res, next);
      return next();
    };
  }

  let config;
  try {
    config = getX402Environment();
  } catch (error) {
    if (mode === 'x402') {
      throw error;
    }
    return null;
  }

  if (!config.enabled) return null;

  const [{ paymentMiddleware, x402ResourceServer }, { HTTPFacilitatorClient }, { ExactEvmScheme }] = await Promise.all([
    import('@x402/express'),
    import('@x402/core/server'),
    import('@x402/evm/exact/server'),
  ]);

  const facilitatorClient = new HTTPFacilitatorClient({ url: config.facilitatorUrl });
  const resourceServer = new x402ResourceServer(facilitatorClient).register(config.network, new ExactEvmScheme());
  return paymentMiddleware(buildX402RouteConfig(config), resourceServer);
}

export async function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ ok: true, service: 'dealar-api', payment_mode: process.env.DEALAR_PAYMENT_MODE || 'demo' });
  });

  app.get('/', (req, res) => {
    res.redirect('/dashboard');
  });

  app.get('/dashboard', (req, res) => {
    res.type('html').send(renderDashboardHtml());
  });

  app.get('/dealar-logo.svg', (req, res) => {
    res.type('image/svg+xml').send(buildDealarLogoSvg({ size: 512 }));
  });

  const receiptLedger = createDemoReceiptLedger();

  app.get('/v1/agent-card', (req, res) => {
    res.json(buildAgentCard({
      baseUrl: process.env.DEALAR_API_BASE_URL || `${req.protocol}://${req.get('host')}`,
    }));
  });

  app.get('/v1/check', (req, res) => {
    res.json(buildProductionCheck({
      baseUrl: process.env.DEALAR_API_BASE_URL || `${req.protocol}://${req.get('host')}`,
    }));
  });

  app.get('/v1/services', (req, res) => {
    const services = listMarketplaceServices();
    res.json({ services, summary: summarizeMarketplaceServices(services) });
  });

  app.get('/v1/dealer/sources', (req, res) => {
    res.json({ sources: listDealerSources() });
  });

  app.get('/v1/scout/capabilities', (req, res) => {
    const baseUrl = process.env.DEALAR_API_BASE_URL || `${req.protocol}://${req.get('host')}`;
    res.json({ card: buildDealerCapabilityCard({ baseUrl }) });
  });

  app.get('/v1/scout/report', (req, res) => {
    const baseUrl = process.env.DEALAR_API_BASE_URL || `${req.protocol}://${req.get('host')}`;
    res.json(buildScoutReport({
      query: req.query.query || 'Dyson Airwrap',
      sources: req.query.sources ? String(req.query.sources).split(',') : undefined,
      baseUrl,
    }));
  });

  app.post('/v1/scout/tickets', (req, res) => {
    const baseUrl = process.env.DEALAR_API_BASE_URL || `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ ticket: createDealRequestTicket({
      query: req.body?.query || 'Dyson Airwrap',
      capabilityId: req.body?.capabilityId || 'scout.report',
      baseUrl,
    }) });
  });

  app.get('/v1/scout/receipts', (req, res) => {
    const baseUrl = process.env.DEALAR_API_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const report = buildScoutReport({ query: req.query.query || 'Dyson Airwrap', baseUrl });
    res.json({ receipt: createDealReceipt({ report, amountUsdc: req.query.amount || '0.005', mode: process.env.DEALAR_PAYMENT_MODE || 'demo' }) });
  });

  app.get('/v1/dealer/conduit', (req, res) => {
    res.json({ reference: buildConduitReferenceModel(), plan: buildDealerConduitIntegrationPlan() });
  });

  app.get('/v1/dealer/payment-products', (req, res) => {
    const baseUrl = process.env.DEALAR_API_BASE_URL || `${req.protocol}://${req.get('host')}`;
    res.json({ products: buildPaymentProducts({ baseUrl }) });
  });

  app.get('/v1/dealer/deep-report', (req, res) => {
    const baseUrl = process.env.DEALAR_API_BASE_URL || `${req.protocol}://${req.get('host')}`;
    res.json(buildDeepDealReport({
      query: req.query.query || 'Dyson Airwrap',
      sources: req.query.sources ? String(req.query.sources).split(',') : undefined,
      baseUrl,
    }));
  });

  app.get('/v1/dealer/payment-links', (req, res) => {
    const baseUrl = process.env.DEALAR_API_BASE_URL || `${req.protocol}://${req.get('host')}`;
    res.json({ links: listDealerPaymentLinks({ baseUrl }) });
  });

  app.post('/v1/dealer/payment-links', (req, res) => {
    const baseUrl = process.env.DEALAR_API_BASE_URL || `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ link: createDealerPaymentLink({
      query: req.body?.query || 'Dyson Airwrap',
      productId: req.body?.productId || 'dealer.deep-deal-report',
      baseUrl,
    }) });
  });

  app.get('/v1/dealer/marketplace-listing', (req, res) => {
    const baseUrl = process.env.DEALAR_API_BASE_URL || `${req.protocol}://${req.get('host')}`;
    res.json({ listing: buildDealerMarketplaceListing({
      baseUrl,
      creatorAddress: req.query.creatorAddress || process.env.DEALAR_CREATOR_ADDRESS || '0x0000000000000000000000000000000000000000',
    }) });
  });

  app.get('/v1/dealer/search', (req, res) => {
    res.json(searchDealerDeals({
      query: req.query.query || 'Dior Sauvage',
      sources: parseListParam(req.query.sources, ['amazon', 'ebay', 'sephora', 'slickdeals']),
      region: req.query.region || 'us',
    }));
  });

  app.get('/v1/dealer/quote', (req, res) => {
    res.json(quoteProduct({ query: req.query.query || 'Dior Sauvage' }));
  });

  app.get('/v1/dealer/coupons', (req, res) => {
    res.json(searchDealerCoupons({ query: req.query.query || '', source: req.query.source }));
  });

  app.get('/v1/payments/challenge', (req, res) => {
    res.status(402).json(createPaymentChallenge({
      endpoint: req.query.endpoint || '/v1/deals/search',
      tier: req.query.tier || 'basic',
    }));
  });

  app.get('/v1/payments/trace/:id', (req, res) => {
    const pinned = resolveGatewayBatchTx(req.params.id);
    Promise.resolve(pinned).then((batch) => {
      res.json(buildGatewayTraceModel({
        settlementId: req.params.id,
        status: batch.status || 'demo',
        batchTx: batch.batchTx,
        explorerUrl: batch.explorerUrl,
      }));
    });
  });

  app.get('/v1/payments/settlements/:id', async (req, res) => {
    const result = await fetchGatewaySettlement(req.params.id);
    res.status(result.statusCode).json(result);
  });

  app.get('/v1/payments/batch-tx/:id', async (req, res) => {
    res.json(await resolveGatewayBatchTx(req.params.id));
  });

  app.get('/v1/payments/receipts', (req, res) => {
    res.json({ receipts: receiptLedger, summary: summarizePaymentLedger(receiptLedger) });
  });

  app.get('/v1/payments/receipts/:id', (req, res) => {
    const receipt = getPaymentReceipt(receiptLedger, req.params.id);
    if (!receipt) return res.status(404).json({ error: 'receipt_not_found' });
    return res.json({ receipt });
  });

  const x402Middleware = await maybeCreatePaymentMiddleware();
  if (x402Middleware) {
    app.use(x402Middleware);
  } else {
    app.use((req, res, next) => {
      const protectedPath = ['/v1/deals/search', '/v1/retailers', '/v1/coupons/verify'].includes(req.path);
      if (protectedPath && !isDemoPaid(req)) {
        return res.status(402).json(createPaymentChallenge({ endpoint: req.path, tier: req.query.tier || 'basic' }));
      }
      return next();
    });
  }

  app.get('/v1/deals/search', (req, res) => {
    res.json(searchDeals({
      query: req.query.query || '',
      regions: parseListParam(req.query.regions, ['us', 'eu']),
    }));
  });

  app.get('/v1/retailers', (req, res) => {
    res.json(listRetailers({
      category: req.query.category || 'beauty',
      markets: parseListParam(req.query.markets, ['us', 'eu']),
    }));
  });

  app.post('/v1/coupons/verify', (req, res) => {
    res.json(verifyCoupon(req.body || {}));
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'not_found', message: `No route for ${req.method} ${req.path}` });
  });

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createApp()
    .then((app) => {
      app.listen(PORT, HOST, () => {
        console.log(`Dealar API listening on http://${HOST}:${PORT}`);
        console.log(`Payment mode: ${process.env.DEALAR_PAYMENT_MODE || 'demo'}`);
      });
    })
    .catch((error) => {
      console.error(`Failed to start Dealar API: ${error.message}`);
      process.exit(1);
    });
}
