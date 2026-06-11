import crypto from 'node:crypto';

const nowIso = () => new Date().toISOString();
const canonical = (value) => String(value || '').trim().toLowerCase();
const splitList = (value) => Array.isArray(value) ? value : String(value || '').split(',');

export const DEFAULT_ALERT_RULES = [
  {
    id: 'alert-apple-hot',
    name: 'Apple / MacBook hot deals',
    enabled: true,
    includeKeywords: ['macbook', 'iphone', 'ipad', 'airpods'],
    excludeKeywords: ['case', 'charger only', 'screen protector', 'refurbished'],
    maxPrice: 900,
    minThumbScore: 5,
    channels: ['telegram'],
  },
  {
    id: 'alert-gaming-frontpage',
    name: 'Gaming gear frontpage watch',
    enabled: true,
    includeKeywords: ['steam deck', 'playstation', 'xbox', 'nintendo', 'gpu'],
    excludeKeywords: ['skin', 'sticker'],
    maxPrice: 700,
    minThumbScore: 8,
    channels: ['telegram'],
  },
];

export const DEMO_SLICKDEALS_FEED = [
  {
    source: 'slickdeals',
    external_id: 'sd-demo-macbook-air-m2-599',
    title: '$599 MacBook Air M2 at Best Buy',
    url: 'https://slickdeals.net/f/18000001-599-macbook-air-m2-at-best-buy',
    price: 599,
    merchant: 'Best Buy',
    thumb_score: 38,
    image_url: 'https://static.slickdealscdn.com/images/slickdeals-sd-logo.png',
    posted_at: '2026-06-11T09:00:00.000Z',
    raw: { category: 'frontpage' },
  },
  {
    source: 'slickdeals',
    external_id: 'sd-demo-steam-deck-319',
    title: '$319 Steam Deck LCD 512GB',
    url: 'https://slickdeals.net/f/18000002-319-steam-deck-lcd-512gb',
    price: 319,
    merchant: 'Valve / Steam',
    thumb_score: 22,
    image_url: 'https://static.slickdealscdn.com/images/slickdeals-sd-logo.png',
    posted_at: '2026-06-11T09:05:00.000Z',
    raw: { category: 'frontpage' },
  },
  {
    source: 'slickdeals',
    external_id: 'sd-demo-iphone-case',
    title: '$9 iPhone 16 silicone case',
    url: 'https://slickdeals.net/f/18000003-9-iphone-16-silicone-case',
    price: 9,
    merchant: 'Amazon',
    thumb_score: 12,
    image_url: 'https://static.slickdealscdn.com/images/slickdeals-sd-logo.png',
    posted_at: '2026-06-11T09:10:00.000Z',
    raw: { category: 'accessory' },
  },
];

const state = {
  deals: new Map(DEMO_SLICKDEALS_FEED.map((deal) => [deal.external_id, { ...deal, first_seen_at: nowIso(), last_seen_at: nowIso() }])),
  alerts: new Map(DEFAULT_ALERT_RULES.map((alert) => [alert.id, { ...alert, created_at: nowIso(), updated_at: nowIso() }])),
  notifications: [],
  lastPoll: null,
};

export function resetSlickdealsState() {
  state.deals = new Map(DEMO_SLICKDEALS_FEED.map((deal) => [deal.external_id, { ...deal, first_seen_at: nowIso(), last_seen_at: nowIso() }]));
  state.alerts = new Map(DEFAULT_ALERT_RULES.map((alert) => [alert.id, { ...alert, created_at: nowIso(), updated_at: nowIso() }]));
  state.notifications = [];
  state.lastPoll = null;
}

export function normalizeDeal(input = {}) {
  const title = String(input.title || '').trim();
  const url = String(input.url || input.link || '').trim();
  const externalId = String(input.external_id || input.guid || crypto.createHash('sha256').update(`${title}:${url}`).digest('hex').slice(0, 16));
  return {
    source: 'slickdeals',
    external_id: externalId,
    title,
    url,
    price: Number.isFinite(Number(input.price)) ? Number(input.price) : extractPrice(title),
    merchant: input.merchant || extractMerchant(title),
    thumb_score: Number.isFinite(Number(input.thumb_score ?? input.thumbScore)) ? Number(input.thumb_score ?? input.thumbScore) : extractThumbScore(input.description || input.rawDescription || ''),
    image_url: input.image_url || input.imageUrl || null,
    posted_at: input.posted_at || input.pubDate || nowIso(),
    raw: input.raw || {},
  };
}

export function extractPrice(text) {
  const match = String(text || '').match(/\$\s?(\d+(?:\.\d{1,2})?)/);
  return match ? Number(match[1]) : null;
}

export function extractThumbScore(text) {
  const match = String(text || '').match(/(?:thumb\s*score|score)\D{0,8}(-?\d+)/i);
  return match ? Number(match[1]) : 0;
}

export function extractMerchant(title) {
  const match = String(title || '').match(/\s(?:at|@)\s([^|\-–—]+)/i);
  return match ? match[1].trim() : 'Slickdeals merchant';
}

export function parseSlickdealsRss(xml = '') {
  const items = [...String(xml).matchAll(/<item[\s\S]*?<\/item>/gi)];
  return items.map(([item]) => normalizeDeal({
    title: decodeXml(item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/i)?.[1] || item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/i)?.[2] || ''),
    url: decodeXml(item.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || ''),
    guid: decodeXml(item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i)?.[1] || ''),
    pubDate: decodeXml(item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || nowIso()),
    rawDescription: decodeXml(item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/i)?.[1] || item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/i)?.[2] || ''),
  }));
}

const decodeXml = (value) => String(value || '')
  .replaceAll('&amp;', '&')
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'")
  .trim();

export function upsertDeals(deals = []) {
  const inserted = [];
  const updated = [];
  for (const input of deals) {
    const deal = normalizeDeal(input);
    if (!deal.title || !deal.url) continue;
    const existing = state.deals.get(deal.external_id);
    const record = { ...existing, ...deal, first_seen_at: existing?.first_seen_at || nowIso(), last_seen_at: nowIso() };
    state.deals.set(record.external_id, record);
    (existing ? updated : inserted).push(record);
  }
  return { inserted, updated, total: state.deals.size };
}

export function listDeals({ query = '', merchant = '', minThumbScore, maxPrice, limit = 50 } = {}) {
  const q = canonical(query);
  const m = canonical(merchant);
  return [...state.deals.values()]
    .filter((deal) => !q || canonical(deal.title).includes(q))
    .filter((deal) => !m || canonical(deal.merchant).includes(m))
    .filter((deal) => minThumbScore === undefined || Number(deal.thumb_score || 0) >= Number(minThumbScore))
    .filter((deal) => maxPrice === undefined || deal.price === null || Number(deal.price) <= Number(maxPrice))
    .sort((a, b) => Number(b.thumb_score || 0) - Number(a.thumb_score || 0))
    .slice(0, Number(limit) || 50);
}

export function getDeal(id) {
  return state.deals.get(id) || [...state.deals.values()].find((deal) => deal.url === id) || null;
}

export function listAlerts() {
  return [...state.alerts.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function createAlertRule(input = {}) {
  const id = input.id || `alert-${crypto.createHash('sha256').update(`${input.name || ''}:${Date.now()}`).digest('hex').slice(0, 10)}`;
  const alert = {
    id,
    name: input.name || 'Untitled Slickdeals alert',
    enabled: input.enabled !== false,
    includeKeywords: splitList(input.includeKeywords || input.include || '').map(canonical).filter(Boolean),
    excludeKeywords: splitList(input.excludeKeywords || input.exclude || '').map(canonical).filter(Boolean),
    maxPrice: input.maxPrice === undefined || input.maxPrice === '' ? null : Number(input.maxPrice),
    minThumbScore: Number(input.minThumbScore ?? input.minScore ?? 0),
    merchant: input.merchant || '',
    channels: splitList(input.channels || 'telegram').map(canonical).filter(Boolean),
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  state.alerts.set(id, alert);
  return alert;
}

export function updateAlertRule(id, patch = {}) {
  const existing = state.alerts.get(id);
  if (!existing) return null;
  const next = { ...existing, ...patch, updated_at: nowIso() };
  if (patch.includeKeywords || patch.include) next.includeKeywords = splitList(patch.includeKeywords || patch.include).map(canonical).filter(Boolean);
  if (patch.excludeKeywords || patch.exclude) next.excludeKeywords = splitList(patch.excludeKeywords || patch.exclude).map(canonical).filter(Boolean);
  state.alerts.set(id, next);
  return next;
}

export function deleteAlertRule(id) {
  return state.alerts.delete(id);
}

export function matchesAlert(deal, alert) {
  if (!alert.enabled) return false;
  const title = canonical(deal.title);
  const merchant = canonical(deal.merchant);
  const includeOk = !alert.includeKeywords?.length || alert.includeKeywords.some((keyword) => title.includes(keyword));
  const excludeHit = alert.excludeKeywords?.some((keyword) => title.includes(keyword));
  const scoreOk = Number(deal.thumb_score || 0) >= Number(alert.minThumbScore || 0);
  const priceOk = !alert.maxPrice || deal.price === null || Number(deal.price) <= Number(alert.maxPrice);
  const merchantOk = !alert.merchant || merchant.includes(canonical(alert.merchant));
  return includeOk && !excludeHit && scoreOk && priceOk && merchantOk;
}

export function evaluateAlerts({ deals = listDeals({ limit: 200 }), alerts = listAlerts() } = {}) {
  const matches = [];
  for (const deal of deals) {
    for (const alert of alerts) {
      if (!matchesAlert(deal, alert)) continue;
      const notificationId = `${alert.id}:${deal.external_id}`;
      if (!state.notifications.some((item) => item.id === notificationId)) {
        const notification = {
          id: notificationId,
          alert_id: alert.id,
          deal_id: deal.external_id,
          channel: alert.channels?.[0] || 'telegram',
          status: 'queued',
          message: formatTelegramDealAlert({ deal, alert }),
          created_at: nowIso(),
        };
        state.notifications.push(notification);
        matches.push({ alert, deal, notification });
      }
    }
  }
  return matches;
}

export function pollSlickdealsDemo({ feed = DEMO_SLICKDEALS_FEED } = {}) {
  const upsert = upsertDeals(feed);
  const matches = evaluateAlerts({ deals: upsert.inserted.length ? upsert.inserted : listDeals({ limit: 200 }) });
  state.lastPoll = { checked_at: nowIso(), source: 'slickdeals', inserted: upsert.inserted.length, updated: upsert.updated.length, matches: matches.length };
  return { ...state.lastPoll, total_deals: upsert.total, matches };
}

export function listNotifications({ status, limit = 50 } = {}) {
  return state.notifications
    .filter((item) => !status || item.status === status)
    .slice(-Number(limit) || -50)
    .reverse();
}

export function buildSlickdealsDashboardModel() {
  const deals = listDeals({ limit: 20 });
  const alerts = listAlerts();
  const notifications = listNotifications({ limit: 10 });
  return {
    source: 'Slickdeals',
    positioning: 'Dealar — sale alerts before the crowd.',
    pipeline: ['Slickdeals RSS/search collector', 'Filter hot deals', 'Dedupe and store database', 'Queue Telegram alerts', 'Expose API/dashboard'],
    metrics: {
      deals: deals.length,
      alerts: alerts.length,
      notifications: notifications.length,
      hotDeals: deals.filter((deal) => Number(deal.thumb_score || 0) >= 10).length,
    },
    deals,
    alerts,
    notifications,
    lastPoll: state.lastPoll,
  };
}

export function formatTelegramDealAlert({ deal, alert } = {}) {
  return [
    '🔥 Deal mới từ Slickdeals',
    '',
    deal?.title || 'Untitled deal',
    `👍 Slickdeals score: +${deal?.thumb_score ?? 0}`,
    `💰 Price: ${deal?.price === null || deal?.price === undefined ? 'n/a' : `$${deal.price}`}`,
    `🏪 Merchant: ${deal?.merchant || 'n/a'}`,
    alert ? `🔔 Alert: ${alert.name}` : null,
    '',
    `Link: ${deal?.url || ''}`,
  ].filter((line) => line !== null).join('\n');
}

export function getSlickdealsStateSummary() {
  return { ...buildSlickdealsDashboardModel(), notifications: listNotifications({ limit: 50 }) };
}
