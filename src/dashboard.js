import { listRetailers, searchDeals } from './deal-intelligence.js';
import { createAgentWalletPolicy, formatUsdcAmount } from './agent-wallet-policy.js';
import { buildGatewayTraceModel } from './gateway-trace.js';
import { buildAgentStackQuickstartModel } from './agent-stack-quickstart.js';
import { createDemoReceiptLedger, summarizePaymentLedger } from './payment-ledger.js';
import { listMarketplaceServices, summarizeMarketplaceServices } from './service-catalog.js';
import { buildTelegramDealSummary, listDealerSources, quoteProduct, searchDealerDeals } from './dealer-scout.js';
import { buildConduitReferenceModel, buildDealerConduitIntegrationPlan } from './conduit-reference.js';
import { buildDealerMarketplaceListing, buildPaymentProducts, createDealerPaymentLink } from './dealer-payment-products.js';
import { buildDealerCapabilityCard, buildScoutReport, createDealRequestTicket } from './dealer-native-product.js';
import { buildDealarBrandSystem } from './dealar-brand.js';
import { buildDealarSkillManifest } from './dealar-skill-system.js';

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

export function buildDashboardModel({
  paymentMode = process.env.DEALAR_PAYMENT_MODE || 'demo',
  apiBaseUrl = process.env.DEALAR_API_BASE_URL || 'http://127.0.0.1:8787',
} = {}) {
  const brandSystem = buildDealarBrandSystem();
  const skillManifest = buildDealarSkillManifest({ baseUrl: apiBaseUrl });
  const whoop = searchDeals({ query: 'whoop', regions: ['us', 'eu'] });
  const retailers = listRetailers({ category: 'beauty', markets: ['us', 'eu'] });
  const gatewayTrace = buildGatewayTraceModel({
    settlementId: 'c9933054-6b34-44bb-8c04-e7e9e1b8352c',
    status: 'completed',
    batchTx: '0xfbad1baae7fd9b88f4e1b034a4236da02012870acbd6ae83b583e85528be396e',
    explorerUrl: 'https://testnet.arcscan.app/tx/0xfbad1baae7fd9b88f4e1b034a4236da02012870acbd6ae83b583e85528be396e',
  });
  const agentStack = buildAgentStackQuickstartModel();
  const services = listMarketplaceServices();
  const serviceSummary = summarizeMarketplaceServices(services);
  const receiptLedger = createDemoReceiptLedger();
  const ledgerSummary = summarizePaymentLedger(receiptLedger);
  const dealerSearch = searchDealerDeals({ query: 'Dior Sauvage', sources: ['amazon', 'ebay', 'sephora', 'slickdeals'] });
  const dealerQuote = quoteProduct({ query: 'Dyson Airwrap' });
  const dealerSources = listDealerSources();
  const dealerTelegramSummary = buildTelegramDealSummary(dealerSearch);
  const conduit = buildConduitReferenceModel();
  const conduitPlan = buildDealerConduitIntegrationPlan();
  const dealerPaymentProducts = buildPaymentProducts({ apiBaseUrl });
  const dealerPaymentLink = createDealerPaymentLink({ query: 'Dyson Airwrap', baseUrl: apiBaseUrl });
  const dealerMarketplaceListing = buildDealerMarketplaceListing({ baseUrl: apiBaseUrl });
  const scoutReport = buildScoutReport({ query: 'Dyson Airwrap', baseUrl: apiBaseUrl });
  const dealRequestTicket = createDealRequestTicket({ query: 'Dyson Airwrap', baseUrl: apiBaseUrl });
  const dealerCapabilityCard = buildDealerCapabilityCard({ baseUrl: apiBaseUrl });
  const walletPolicy = createAgentWalletPolicy({
    dailyLimitUsdc: process.env.DEALAR_AGENT_DAILY_LIMIT_USDC || '1.00',
    perRequestLimitUsdc: process.env.DEALAR_AGENT_PER_REQUEST_LIMIT_USDC || '0.25',
    allowlistedBaseUrls: [apiBaseUrl],
    mode: paymentMode,
  });

  const endpoints = [
    { method: 'GET', path: '/v1/deals/search', price: '0.25 USDC', product: 'WHOOP + retail deal intelligence', status: 'live' },
    { method: 'GET', path: '/v1/retailers', price: '0.05 USDC', product: 'US/EU beauty retailer database', status: 'live' },
    { method: 'POST', path: '/v1/coupons/verify', price: '0.01 USDC', product: 'Coupon verification', status: 'live' },
  ];

  const requestLogs = [
    { agent: 'dealar-agent', endpoint: '/v1/deals/search', amount: '0.25', status: 'paid', result: 'WHOOP report unlocked' },
    { agent: 'coupon-bot', endpoint: '/v1/coupons/verify', amount: '0.01', status: 'paid', result: 'WELCOME20 valid' },
    { agent: 'retail-scout', endpoint: '/v1/retailers', amount: '0.05', status: 'paid', result: '11 retailers returned' },
  ];
  const revenueMicroUsdc = requestLogs.reduce((sum, log) => {
    const [whole, fraction = ''] = log.amount.split('.');
    return sum + BigInt(whole) * 1000000n + BigInt(fraction.padEnd(6, '0'));
  }, 0n);

  return {
    brand: {
      ...brandSystem,
      name: 'Dealar',
      tagline: 'AI Deal Scout Agent for cheap prices, sales, vouchers, and product quotes',
      apiBaseUrl,
    },
    payment: {
      mode: paymentMode,
      protocol: 'x402 / Circle Gateway batching',
      network: 'Arc Testnet',
      currency: 'USDC',
    },
    wallet: {
      label: walletPolicy.walletLabel,
      dailyLimitUsdc: walletPolicy.dailyLimitUsdc,
      perRequestLimitUsdc: walletPolicy.perRequestLimitUsdc,
      allowlistedBaseUrls: walletPolicy.allowlistedBaseUrls,
      controls: walletPolicy.controls,
    },
    metrics: {
      endpoints: endpoints.length,
      demoRevenueUsdc: ledgerSummary.totalRevenueUsdc || formatUsdcAmount(revenueMicroUsdc),
      dealSources: whoop.best_deals.length,
      retailerCount: retailers.retailers.length,
      marketplaceServices: serviceSummary.totalServices,
      receipts: ledgerSummary.totalReceipts,
      dealerSources: dealerSources.length,
      bestDealerSource: dealerSearch.bestDeal?.retailer || 'n/a',
    },
    endpoints,
    requestLogs,
    dealReport: whoop,
    retailers: retailers.retailers.slice(0, 6),
    paymentFlow: ['Request paid endpoint', 'Receive 402 Payment Required', 'Agent policy check', 'USDC payment via x402', 'Retry with payment proof', 'Unlock intelligence'],
    gatewayTrace,
    agentStack,
    services,
    serviceSummary,
    receiptLedger,
    ledgerSummary,
    dealerSearch,
    dealerQuote,
    dealerSources,
    dealerTelegramSummary,
    conduit,
    conduitPlan,
    dealerPaymentProducts,
    dealerPaymentLink,
    dealerMarketplaceListing,
    scoutReport,
    dealRequestTicket,
    dealerCapabilityCard,
    skillManifest,
    runtimeIntegrations: [
      { name: 'JSON CLI Bridge', command: 'npm run cli -- {"action":"deal.search","params":{"query":"whoop"}}', status: 'live' },
      { name: 'Hermes Plugin', command: 'dealar_search_deals(query="whoop", regions="us,eu")', status: 'scaffolded' },
      { name: 'x402 Buyer Client', command: 'npm run buyer:deal-search -- --mode x402', status: 'live' },
      { name: 'Agent Wallet Policy', command: 'npm run agent:deal-search -- --daily-limit 1.00', status: 'live' },
    ],
  };
}

export function renderDashboardHtml(model = buildDashboardModel()) {
  const cards = [
    ['Scout artifacts', model.metrics.endpoints],
    ['Deal receipts', model.metrics.receipts],
    ['Source mix', model.metrics.dealerSources],
    ['Best source', model.metrics.bestDealerSource],
  ];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(model.brand.name)} Dashboard</title>
  <style>
    :root { color-scheme: dark; --black:#000000; --charcoal:#0B0B0B; --graphite:#272A2A; --white:#FFFFFF; --ash:#CECECE; --steel:#858585; --orange:#CC6437; --line:rgba(255,255,255,.16); }
    * { box-sizing: border-box; }
    body { margin:0; font-family: 'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, monospace; background:#000; color:var(--white); }
    body:before { content:""; position:fixed; inset:-20%; pointer-events:none; background:radial-gradient(circle at 78% 12%, rgba(204,100,55,.22), transparent 22%), radial-gradient(circle at 10% 4%, rgba(255,255,255,.12), transparent 16%), linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px); background-size:auto, auto, 64px 64px, 64px 64px; opacity:.8; }
    main { position:relative; max-width:1240px; margin:0 auto; padding:34px 20px 80px; }
    .topbar { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:34px; }
    .brand-lockup { display:flex; align-items:center; gap:13px; color:var(--white); text-decoration:none; }
    .logo { width:48px; height:48px; display:grid; place-items:center; }
    .wordmark { font-family:'Open Sans Condensed','Arial Narrow',Inter,sans-serif; font-size:20px; letter-spacing:-.02em; text-transform:uppercase; }
    .nav { display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end; }
    .hero { display:grid; gap:18px; grid-template-columns:1.35fr .9fr; align-items:stretch; }
    .panel { background:rgba(11,11,11,.82); border:1px solid var(--line); border-radius:10px; padding:24px; box-shadow:0 34px 90px rgba(0,0,0,.48); backdrop-filter:blur(18px); }
    .hero-main { min-height:430px; display:flex; flex-direction:column; justify-content:space-between; }
    h1 { font-family:'Open Sans Condensed','Arial Narrow',Inter,sans-serif; font-size:clamp(62px, 12vw, 148px); text-transform:uppercase; line-height:.9; margin:18px 0 8px; letter-spacing:-.06em; }
    h2 { font-family:'Open Sans Condensed','Arial Narrow',Inter,sans-serif; text-transform:uppercase; letter-spacing:-.02em; margin:0 0 16px; font-size:20px; }
    .eyebrow { color:var(--ash); font-size:11px; text-transform:uppercase; letter-spacing:.08em; }
    .tagline { max-width:760px; font-family:'Open Sans Condensed','Arial Narrow',Inter,sans-serif; font-size:clamp(24px, 4vw, 48px); line-height:1; letter-spacing:-.04em; color:#fff; margin:0 0 22px; }
    .muted { color:var(--steel); font-size:12px; line-height:1.45; }
    .pill { display:inline-flex; gap:8px; align-items:center; border:1px solid var(--white); background:transparent; color:var(--white); padding:9px 15px; border-radius:1440px; font-size:12px; margin:0 6px 8px 0; text-decoration:none; }
    .pill.accent { border-color:var(--orange); color:#fff; box-shadow:0 0 40px rgba(204,100,55,.22) inset; }
    .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin:18px 0 0; }
    .metric { background:#0B0B0B; border:1px solid var(--line); border-radius:10px; padding:16px; min-height:104px; }
    .metric b { display:block; font-family:'Open Sans Condensed','Arial Narrow',Inter,sans-serif; font-size:32px; line-height:1; margin-top:20px; letter-spacing:-.04em; }
    .metric span { color:var(--steel); font-size:11px; text-transform:uppercase; }
    .sections { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-top:18px; }
    table { width:100%; border-collapse:collapse; font-size:12px; }
    th, td { text-align:left; padding:13px 8px; border-bottom:1px solid var(--line); vertical-align:top; }
    th { color:var(--ash); font-size:10px; text-transform:uppercase; letter-spacing:.08em; }
    code { color:var(--white); background:#000; border:1px solid var(--line); padding:2px 6px; border-radius:4px; }
    .flow { display:grid; gap:8px; counter-reset: step; }
    .flow div { background:#000; border:1px solid var(--line); border-radius:10px; padding:12px; }
    .flow div:before { counter-increment:step; content:counter(step); display:inline-grid; place-items:center; width:22px; height:22px; margin-right:8px; border-radius:1440px; border:1px solid var(--orange); color:var(--orange); font-size:11px; }
    .deal { display:grid; gap:8px; }
    .deal-card { background:#000; border:1px solid var(--line); border-radius:10px; padding:14px; }
    .deal-card strong { color:#fff; text-transform:uppercase; font-family:'Open Sans Condensed','Arial Narrow',Inter,sans-serif; }
    .score { color:var(--orange); }
    .brand-note { display:grid; gap:10px; margin-top:16px; }
    @media (max-width: 850px) { .hero,.sections,.grid { grid-template-columns:1fr; } .topbar{align-items:flex-start; flex-direction:column;} }
  </style>
</head>
<body>
<main>
  <nav class="topbar">
    <a class="brand-lockup" href="/dashboard" aria-label="Dealar home">
      <span class="logo">${model.brand.logo.svg}</span>
      <span class="wordmark">${escapeHtml(model.brand.name)}</span>
    </a>
    <div class="nav">
      <a class="pill" href="/v1/scout/capabilities">Capability Card</a>
      <a class="pill" href="/v1/scout/report?query=Dyson%20Airwrap">Scout Report</a>
      <a class="pill accent" href="/v1/agent-card">Agent Card</a>
    </div>
  </nav>
  <section class="hero">
    <div class="panel hero-main">
      <div>
        <div class="eyebrow">Inspired by paid-resource clarity + Ciridae monochrome grid · transformed into Dealar-native scout UX</div>
        <h1>${escapeHtml(model.brand.name)}</h1>
        <p class="tagline">Precision deal scouting for agents: tickets, reports, vouchers, trust scores, receipts.</p>
        <p class="muted">API base: <code>${escapeHtml(model.brand.apiBaseUrl)}</code></p>
      </div>
      <div>
        <span class="pill">● ${escapeHtml(model.payment.currency)}</span><span class="pill">${escapeHtml(model.payment.protocol)}</span><span class="pill accent">Scout Report Ready</span>
        <div class="grid">
          ${cards.map(([label, value]) => `<div class="metric"><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></div>`).join('')}
        </div>
      </div>
    </div>
    <div class="panel">
      <h2>Brand System</h2>
      <p class="muted">${escapeHtml(model.brand.thesis)}</p>
      <div class="brand-note">
        ${model.brand.productLanguage.slice(0, 5).map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join('')}
      </div>
      <h2 style="margin-top:24px">Wallet Policy</h2>
      <p><span class="muted">Mode:</span> <code>${escapeHtml(model.payment.mode)}</code></p>
      <p><span class="muted">Network:</span> ${escapeHtml(model.payment.network)}</p>
      <p><span class="muted">Daily limit:</span> ${escapeHtml(model.wallet.dailyLimitUsdc)} USDC</p>
      <p><span class="muted">Per request:</span> ${escapeHtml(model.wallet.perRequestLimitUsdc)} USDC</p>
      <p><span class="muted">Controls:</span><br>${model.wallet.controls.map((c) => `<code>${escapeHtml(c)}</code>`).join(' ')}</p>
    </div>
  </section>

  <section class="sections">
    <div class="panel">
      <h2>Paid Endpoints</h2>
      <table><thead><tr><th>Method</th><th>Path</th><th>Price</th><th>Product</th></tr></thead><tbody>
      ${model.endpoints.map((e) => `<tr><td>${escapeHtml(e.method)}</td><td><code>${escapeHtml(e.path)}</code></td><td>${escapeHtml(e.price)}</td><td>${escapeHtml(e.product)}</td></tr>`).join('')}
      </tbody></table>
    </div>
    <div class="panel">
      <h2>Payment Flow</h2>
      <div class="flow">${model.paymentFlow.map((step) => `<div>${escapeHtml(step)}</div>`).join('')}</div>
    </div>
  </section>

  <section class="sections">
    <div class="panel">
      <h2>Dealer Deal Scout</h2>
      <p class="muted">Amazon + eBay + Sephora + Slickdeals price, sale, voucher, and risk comparison.</p>
      <div class="deal">
      ${model.dealerSearch.results.map((d) => `<div class="deal-card"><strong>${escapeHtml(d.retailer)}</strong> · $${escapeHtml(d.effectivePrice)} · <span class="score">${escapeHtml(Math.round(d.confidence * 100))}%</span><br><span class="muted">${escapeHtml(d.title)} · Coupon: ${escapeHtml(d.couponCode || 'none')} · Risk: ${escapeHtml(d.risk)}</span></div>`).join('')}
      </div>
    </div>
    <div class="panel">
      <h2>Telegram Check Preview</h2>
      <p class="muted">Command: <code>check deal Dior Sauvage</code></p>
      <pre style="white-space:pre-wrap;background:#0b1220;border:1px solid var(--line);border-radius:16px;padding:14px;color:#d1fae5">${escapeHtml(model.dealerTelegramSummary)}</pre>
      <p class="muted">Quote sample: Dyson Airwrap best price <code>${escapeHtml(model.dealerQuote.bestPrice.retailer)} $${escapeHtml(model.dealerQuote.bestPrice.effectivePrice)}</code>; safer option <code>${escapeHtml(model.dealerQuote.safestDeal.retailer)} $${escapeHtml(model.dealerQuote.safestDeal.effectivePrice)}</code>.</p>
    </div>
  </section>

  <section class="sections">
    <div class="panel">
      <h2>Dealer Capability Card</h2>
      <p class="muted">Original Dealer discovery model: what the agent can scout, how much each Scout action costs, and where agents can call it.</p>
      <table><thead><tr><th>Capability</th><th>Endpoint</th><th>USDC</th></tr></thead><tbody>
      ${model.dealerCapabilityCard.capabilities.map((item) => `<tr><td>${escapeHtml(item.name)}<br><span class="muted">${escapeHtml(item.description)}</span></td><td><code>${escapeHtml(item.endpoint)}</code></td><td>${escapeHtml(item.price.usdc)}</td></tr>`).join('')}
      </tbody></table>
      <p class="muted">Deal Request Ticket: <code>${escapeHtml(model.dealRequestTicket.ticketUrl)}</code></p>
    </div>
    <div class="panel">
      <h2>Scout Report</h2>
      <p class="muted">Dealer-native output: Source Mix + Voucher Scan + Trust Score + Telegram-ready buy recommendation.</p>
      <p><span class="muted">Best deal:</span> <code>${escapeHtml(model.scoutReport.bestDeal.retailer)} $${escapeHtml(model.scoutReport.bestDeal.effectivePrice)}</code></p>
      <p><span class="muted">Trust score:</span> <code>${escapeHtml(model.scoutReport.trustScore.score)}/100 ${escapeHtml(model.scoutReport.trustScore.level)}</code></p>
      <p><span class="muted">Scout endpoint:</span> <code>${escapeHtml(model.dealerCapabilityCard.links.scoutReport)}</code></p>
      <p class="muted">x402/USDC remains protocol compatibility for paid unlocks; Dealer product language stays Deal Request Ticket → Scout Report → Deal Receipt.</p>
    </div>
  </section>

  <section class="sections">
    <div class="panel">
      <h2>Dealar Skill System</h2>
      <p class="muted">Circle skills principle translated into Dealar-native agent skills: narrow triggers, clear artifacts, read-only checks separated from paid/value-moving actions.</p>
      <table><thead><tr><th>Skill</th><th>Artifact</th><th>Policy</th></tr></thead><tbody>
      ${model.skillManifest.skills.map((skill) => `<tr><td>${escapeHtml(skill.name)}<br><span class="muted">${escapeHtml(skill.intent)}</span></td><td>${escapeHtml(skill.outputArtifact)}</td><td><code>${escapeHtml(skill.paymentPolicy)}</code></td></tr>`).join('')}
      </tbody></table>
      <p class="muted">Manifest: <code>${escapeHtml(model.skillManifest.endpoints.skillManifest)}</code></p>
    </div>
    <div class="panel">
      <h2>Skill Safety Guardrails</h2>
      <div class="flow">${model.skillManifest.referencePrinciples.map((principle) => `<div>${escapeHtml(principle)}</div>`).join('')}</div>
      <p class="muted">Never auto-execute: ${model.skillManifest.activationPolicy.neverAutoExecute.map((item) => `<code>${escapeHtml(item)}</code>`).join(' ')}</p>
    </div>
  </section>

  <section class="sections">
    <div class="panel">
      <h2>Marketplace Service Catalog</h2>
      <table><thead><tr><th>Service</th><th>Category</th><th>Price</th><th>Rail</th></tr></thead><tbody>
      ${model.services.map((service) => `<tr><td>${escapeHtml(service.name)}<br><code>${escapeHtml(service.endpoint.method)} ${escapeHtml(service.endpoint.path)}</code></td><td>${escapeHtml(service.category)}</td><td>${escapeHtml(service.price.usdc)} USDC</td><td>${escapeHtml(service.paymentRail)}</td></tr>`).join('')}
      </tbody></table>
    </div>
    <div class="panel">
      <h2>Receipt Ledger</h2>
      <p class="muted">Total revenue: <code>${escapeHtml(model.ledgerSummary.totalRevenueUsdc)} USDC</code> · Receipts: <code>${escapeHtml(model.ledgerSummary.totalReceipts)}</code></p>
      <table><thead><tr><th>Receipt</th><th>Service</th><th>USDC</th><th>Result</th></tr></thead><tbody>
      ${model.receiptLedger.map((receipt) => `<tr><td><code>${escapeHtml(receipt.id)}</code></td><td>${escapeHtml(receipt.serviceId)}</td><td>${escapeHtml(receipt.amount.usdc)}</td><td>${escapeHtml(receipt.resultSummary)}</td></tr>`).join('')}
      </tbody></table>
    </div>
  </section>

  <section class="sections">
    <div class="panel">
      <h2>WHOOP Deal Report</h2>
      <div class="deal">
      ${model.dealReport.best_deals.slice(0, 6).map((d) => `<div class="deal-card"><strong>${escapeHtml(d.merchant)}</strong> · ${escapeHtml(d.region.toUpperCase())} · <span class="score">${escapeHtml(Math.round(d.confidence * 100))}%</span><br><span class="muted">${escapeHtml(d.deal_type)} — ${escapeHtml(d.price_note)}</span></div>`).join('')}
      </div>
    </div>
    <div class="panel">
      <h2>Request Logs</h2>
      <table><thead><tr><th>Agent</th><th>Endpoint</th><th>USDC</th><th>Result</th></tr></thead><tbody>
      ${model.requestLogs.map((log) => `<tr><td>${escapeHtml(log.agent)}</td><td><code>${escapeHtml(log.endpoint)}</code></td><td>${escapeHtml(log.amount)}</td><td>${escapeHtml(log.result)}</td></tr>`).join('')}
      </tbody></table>
    </div>
  </section>

  <section class="panel" style="margin-top:18px">
    <h2>Circle Gateway Payment Trace</h2>
    <p class="muted">Settlement: <code>${escapeHtml(model.gatewayTrace.settlementId)}</code> · Status: <code>${escapeHtml(model.gatewayTrace.status)}</code></p>
    <div class="flow">${model.gatewayTrace.steps.map((step) => `<div><strong>${escapeHtml(step.title)}</strong><br><span class="muted">${escapeHtml(step.description)}</span></div>`).join('')}</div>
    <p class="muted">Batch tx: <code>${escapeHtml(model.gatewayTrace.batchTx || 'pending')}</code></p>
  </section>

  <section class="sections">
    <div class="panel">
      <h2>Circle Agent Stack Quickstart Notes</h2>
      <p class="muted">${escapeHtml(model.agentStack.thesis)}</p>
      <table><thead><tr><th>Component</th><th>Dealar mapping</th></tr></thead><tbody>
      ${model.agentStack.components.map((component) => `<tr><td>${escapeHtml(component.name)}</td><td>${escapeHtml(component.dealarMapping)}</td></tr>`).join('')}
      </tbody></table>
    </div>
    <div class="panel">
      <h2>Buyer Workflow Checklist</h2>
      <div class="flow">${model.agentStack.buyerWorkflow.slice(0, 8).map((step) => `<div>${escapeHtml(step)}</div>`).join('')}</div>
    </div>
  </section>

  <section class="sections">
    <div class="panel">
      <h2>Retail Intelligence Preview</h2>
      <table><thead><tr><th>Retailer</th><th>Market</th><th>Strengths</th><th>Confidence</th></tr></thead><tbody>
      ${model.retailers.map((r) => `<tr><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.market.toUpperCase())}</td><td>${escapeHtml(r.strengths.join(', '))}</td><td>${escapeHtml(Math.round(r.confidence * 100))}%</td></tr>`).join('')}
      </tbody></table>
    </div>
    <div class="panel">
      <h2>Agent Runtime Integration</h2>
      <table><thead><tr><th>Runtime</th><th>Status</th><th>Command / Tool</th></tr></thead><tbody>
      ${model.runtimeIntegrations.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.status)}</td><td><code>${escapeHtml(item.command)}</code></td></tr>`).join('')}
      </tbody></table>
    </div>
  </section>
</main>
</body>
</html>`;
}
