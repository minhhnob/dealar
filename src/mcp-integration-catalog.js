const MCP_INTEGRATIONS = [
  {
    id: 'github',
    name: 'GitHub MCP',
    category: 'universal-core',
    status: 'recommended',
    priority: 1,
    purpose: 'Repo, issue, PR, and code-search context for Dealar engineering agents.',
    dealarUseCase: 'Let a maintenance agent inspect Dealar bugs, open PR drafts, and link Scout Report regressions to code changes.',
    safety: 'Read-only token first; enable write scopes only after human approval.',
    link: 'https://github.com/github/github-mcp-server',
  },
  {
    id: 'context7',
    name: 'Context7 MCP',
    category: 'universal-core',
    status: 'recommended',
    priority: 2,
    purpose: 'Version-pinned package and SDK docs at agent runtime.',
    dealarUseCase: 'Ground x402, Vercel, Telegram Bot API, and frontend implementation against current docs instead of stale model memory.',
    safety: 'Read-only documentation source; optional API key for higher limits.',
    link: 'https://context7.com',
  },
  {
    id: 'playwright',
    name: 'Playwright MCP',
    category: 'qa-browser',
    status: 'recommended',
    priority: 3,
    purpose: 'Browser automation, screenshots, clicks, forms, and exploratory smoke tests.',
    dealarUseCase: 'Validate dashboard, Telegram setup pages, Scout Report links, and paid endpoint UX visually before deploy.',
    safety: 'Use for exploratory QA; keep release-critical regression as deterministic tests.',
    link: 'https://github.com/microsoft/playwright-mcp',
  },
  {
    id: 'brave-search',
    name: 'Brave Search MCP',
    category: 'deal-research',
    status: 'recommended',
    priority: 4,
    purpose: 'Grounded web search for live product, merchant, voucher, and pricing context.',
    dealarUseCase: 'Improve source discovery for deals, voucher checks, product quotes, and merchant trust scoring.',
    safety: 'Keep as read-only source intelligence; do not auto-purchase from search results.',
    link: 'https://github.com/brave/brave-search-mcp-server',
  },
  {
    id: 'vercel',
    name: 'Vercel MCP',
    category: 'deployment',
    status: 'recommended',
    priority: 5,
    purpose: 'Inspect deployments, logs, preview URLs, and production status.',
    dealarUseCase: 'Let a release agent verify prodeal-api deployments and catch webhook/server errors after shipping.',
    safety: 'Start read-only; deployment and env writes require explicit human confirmation.',
    link: 'https://vercel.com/docs/mcp',
  },
  {
    id: 'sentry',
    name: 'Sentry MCP',
    category: 'observability',
    status: 'planned',
    priority: 6,
    purpose: 'Production errors, traces, event details, and issue context.',
    dealarUseCase: 'Detect Telegram webhook failures, malformed payment requests, and dashboard runtime exceptions quickly.',
    safety: 'Read errors first; PR/write actions remain supervised.',
    link: 'https://docs.sentry.io/product/sentry-mcp/',
  },
  {
    id: 'stripe-paypal-reference',
    name: 'Payments MCP Reference',
    category: 'payments-safety',
    status: 'reference-only',
    priority: 7,
    purpose: 'Payment-operation patterns from Stripe/PayPal MCP guidance.',
    dealarUseCase: 'Translate money-moving guardrails into Dealar x402/Circle Gateway flows: read-only checks, restricted keys, human confirmation.',
    safety: 'Never let an agent move money, refund, retry paid unlocks, or change spend policy without explicit confirmation.',
    link: 'https://docs.stripe.com/mcp',
  },
];

export function listMcpIntegrations() {
  return MCP_INTEGRATIONS.map((item) => ({ ...item }));
}

export function summarizeMcpIntegrations(integrations = listMcpIntegrations()) {
  return {
    totalIntegrations: integrations.length,
    recommended: integrations.filter((item) => item.status === 'recommended').length,
    categories: Array.from(new Set(integrations.map((item) => item.category))),
    safetyPrinciples: [
      'Pick 3-5 high-value MCP servers, not a bloated catalog.',
      'Prefer vendor-official servers and pin versions for local/community servers.',
      'Scope tokens read-only until behavior is observed.',
      'Never enable unsupervised production writes or money-moving actions.',
      'Use browser/search/docs MCPs to improve agent grounding and QA before deploy.',
    ],
  };
}

export function buildDealarMcpReadiness({ baseUrl = 'https://prodeal-api.vercel.app' } = {}) {
  const root = String(baseUrl).replace(/\/$/, '');
  const integrations = listMcpIntegrations();
  return {
    name: 'Dealar MCP Readiness Plan',
    sourceInspiration: 'MCP server catalog principles: small high-value tool stack, official servers, read-only first, supervised writes.',
    baseUrl: root,
    recommendedStarterStack: integrations.filter((item) => item.status === 'recommended').slice(0, 5).map((item) => item.id),
    integrations,
    summary: summarizeMcpIntegrations(integrations),
  };
}

export function formatMcpReadinessTelegramSummary(plan = buildDealarMcpReadiness()) {
  return [
    `🔌 ${plan.name}`,
    `Starter stack: ${plan.recommendedStarterStack.join(', ')}`,
    `Safety: ${plan.summary.safetyPrinciples[0]}`,
    '',
    ...plan.integrations.slice(0, 5).map((item) => `• ${item.name}: ${item.dealarUseCase}`),
  ].join('\n');
}
