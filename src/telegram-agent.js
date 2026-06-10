import { DEFAULT_DEALER_SOURCES, searchDealerCoupons, searchDealerDeals, quoteProduct } from './dealer-scout.js';
import { buildScoutReport, createDealRequestTicket } from './dealer-native-product.js';

const DEFAULT_SOURCES = DEFAULT_DEALER_SOURCES;

function normalizeText(text) {
  return String(text || '').trim();
}

function extractQuery(text) {
  const value = normalizeText(text)
    .replace(/^\/(start|help|deal|scout|quote|coupon|voucher|ticket)\b/i, '')
    .replace(/^(săn deal|san deal|tìm deal|tim deal|check deal|check giá|check gia|báo giá|bao gia|tìm voucher|tim voucher)\s*/i, '')
    .trim();
  return value || 'Dyson Airwrap';
}

function detectIntent(text) {
  const lower = normalizeText(text).toLowerCase();
  if (!lower || lower === '/start' || lower === 'start') return 'help';
  if (lower.startsWith('/help') || lower.includes('hướng dẫn') || lower.includes('huong dan')) return 'help';
  if (lower.startsWith('/ticket') || lower.includes('tạo ticket') || lower.includes('tao ticket')) return 'ticket';
  if (lower.startsWith('/coupon') || lower.startsWith('/voucher') || lower.includes('voucher') || lower.includes('coupon') || lower.includes('mã giảm') || lower.includes('ma giam')) return 'coupon';
  if (lower.startsWith('/quote') || lower.includes('báo giá') || lower.includes('bao gia') || lower.includes('check giá') || lower.includes('check gia') || lower.includes('giá bao nhiêu') || lower.includes('gia bao nhieu')) return 'quote';
  if (lower.startsWith('/scout') || lower.includes('report') || lower.includes('so sánh') || lower.includes('so sanh')) return 'report';
  return 'deal';
}

function helpMessage(baseUrl) {
  return [
    '🛒 Dealar Agent đã sẵn sàng săn deal.',
    '',
    'Sếp/user có thể hỏi tự nhiên, ví dụ:',
    '• săn deal Dyson Airwrap dưới 350$',
    '• check giá iPhone 15 Pro Max',
    '• tìm voucher WHOOP hôm nay',
    '• so sánh WHOOP Amazon eBay Slickdeals',
    '',
    'Lệnh nhanh:',
    '/deal <sản phẩm>',
    '/quote <sản phẩm>',
    '/voucher <store hoặc sản phẩm>',
    '/scout <sản phẩm>',
    '/ticket <sản phẩm>',
    '',
    `Dashboard: ${baseUrl}/dashboard`,
  ].join('\n');
}

function formatQuote(query, quote) {
  const best = quote.bestPrice;
  const safe = quote.safestDeal;
  return [
    `💬 Báo giá Dealar: ${query}`,
    '',
    best ? `Giá tốt nhất: ${best.retailer} — $${best.effectivePrice}` : 'Giá tốt nhất: chưa có dữ liệu',
    best ? `Sản phẩm: ${best.title}` : '',
    safe ? `Lựa chọn an toàn: ${safe.retailer} — $${safe.effectivePrice} (${safe.risk})` : '',
    `Giá trung bình demo: $${quote.averageMarketPrice}`,
    '',
    `Khuyến nghị: ${quote.buyAdvice}`,
  ].filter(Boolean).join('\n');
}

function formatTicket(ticket) {
  return [
    '🎫 Deal Request Ticket đã tạo',
    '',
    `ID: ${ticket.id}`,
    `Query: ${ticket.query}`,
    `Capability: ${ticket.capabilityId}`,
    `Status: ${ticket.status}`,
    `Network: Arc Testnet / eip155:5042002`,
  ].join('\n');
}

function formatScoutReport(report) {
  const best = report.bestDeal;
  const safe = report.safeDeal;
  return [
    `📊 Scout Report: ${report.query}`,
    '',
    best ? `Best deal: ${best.retailer} — $${best.effectivePrice}` : 'Best deal: chưa có dữ liệu',
    safe ? `Safe deal: ${safe.retailer} — $${safe.effectivePrice}` : '',
    `Trust score: ${report.trustScore?.score ?? report.trustScore ?? 'demo'}`,
    `Source mix: ${(Array.isArray(report.sourceMix) ? report.sourceMix : report.sourceMix?.sources || []).join(', ')}`,
    '',
    report.telegramSummary || 'Dealar đã tạo Scout Report.',
  ].filter(Boolean).join('\n');
}

export function answerTelegramDealRequest({ text = '', baseUrl = 'https://prodeal-api.vercel.app', userId = 'telegram-user' } = {}) {
  const intent = detectIntent(text);
  const query = extractQuery(text);

  if (intent === 'help') {
    return { ok: true, intent, query: null, message: helpMessage(baseUrl), artifacts: [] };
  }

  if (intent === 'coupon') {
    const result = searchDealerCoupons({ query });
    return { ok: true, intent, query, message: result.telegramSummary, artifacts: [{ type: 'Voucher Scan', data: result }] };
  }

  if (intent === 'quote') {
    const result = quoteProduct({ query });
    return { ok: true, intent, query, message: formatQuote(query, result), artifacts: [{ type: 'Product Quote', data: result }] };
  }

  if (intent === 'ticket') {
    const ticket = createDealRequestTicket({ query, capabilityId: 'scout.report', baseUrl });
    return { ok: true, intent, query, message: formatTicket(ticket), artifacts: [{ type: 'Deal Request Ticket', data: ticket }], userId };
  }

  if (intent === 'report') {
    const report = buildScoutReport({ query, sources: DEFAULT_SOURCES, baseUrl });
    return { ok: true, intent, query, message: formatScoutReport(report), artifacts: [{ type: 'Scout Report', data: report }] };
  }

  const result = searchDealerDeals({ query, sources: DEFAULT_SOURCES, region: 'us' });
  return { ok: true, intent: 'deal', query, message: result.telegramSummary, artifacts: [{ type: 'Deal Search', data: result }] };
}

export function buildTelegramSetupGuide({ baseUrl = 'https://prodeal-api.vercel.app' } = {}) {
  return {
    name: 'Dealar Telegram Agent Setup',
    description: 'Telegram-ready Dealar agent flow for natural-language deal scouting.',
    webhookEndpoint: `${baseUrl}/v1/telegram/dealar-agent`,
    healthEndpoint: `${baseUrl}/v1/telegram/dealar-agent/health`,
    supportedMessages: [
      'săn deal Dyson Airwrap dưới 350$',
      'check giá iPhone 15 Pro Max',
      'tìm voucher WHOOP hôm nay',
      '/scout Dior Sauvage',
      '/ticket Dyson Airwrap',
    ],
    responseFormat: 'Returns JSON with a Telegram-ready message field. A Telegram bot wrapper can send message directly to chat_id.',
    network: { name: 'Arc Testnet', caip2: 'eip155:5042002' },
  };
}
