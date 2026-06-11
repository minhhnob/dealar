import crypto from 'node:crypto';
import { canonical, nowIso } from './slickdeals-collector.js';

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

export function normalizeAlertRule(input = {}) {
  const id = input.id || `alert-${crypto.createHash('sha256').update(`${input.name || ''}:${Date.now()}`).digest('hex').slice(0, 10)}`;
  return {
    id,
    name: input.name || 'Untitled Slickdeals alert',
    enabled: input.enabled !== false,
    includeKeywords: splitList(input.includeKeywords || input.include || '').map(canonical).filter(Boolean),
    excludeKeywords: splitList(input.excludeKeywords || input.exclude || '').map(canonical).filter(Boolean),
    maxPrice: input.maxPrice === undefined || input.maxPrice === '' ? null : Number(input.maxPrice),
    minThumbScore: Number(input.minThumbScore ?? input.minScore ?? 0),
    merchant: input.merchant || '',
    channels: splitList(input.channels || 'telegram').map(canonical).filter(Boolean),
    created_at: input.created_at || nowIso(),
    updated_at: nowIso(),
  };
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

export function parseNaturalAlertCommand(text = '') {
  const raw = String(text || '').trim();
  const lower = canonical(raw);
  const createIntent = /^(canh|báo|bao|alert|watch|theo dõi|theo doi)\b/.test(lower);
  if (!createIntent) return null;

  let query = raw
    .replace(/^(canh|báo|bao|alert|watch|theo dõi|theo doi)\s*/i, '')
    .replace(/\b(sale|deal|giá|gia)\b/gi, ' ')
    .trim();

  const priceMatch = query.match(/(?:dưới|duoi|under|below)\s*\$?\s*(\d+(?:\.\d{1,2})?)/i);
  const maxPrice = priceMatch ? Number(priceMatch[1]) : null;
  if (priceMatch) query = query.slice(0, priceMatch.index).trim();

  const keywords = query.split(/\s+/).filter(Boolean).join(' ');
  if (!keywords) return null;

  return normalizeAlertRule({
    name: `${keywords} sale watch${maxPrice ? ` under $${maxPrice}` : ''}`,
    includeKeywords: [canonical(keywords)],
    excludeKeywords: ['case', 'charger', 'screen protector', 'refurbished'],
    maxPrice,
    minThumbScore: 5,
    channels: ['telegram'],
  });
}
