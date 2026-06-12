import crypto from 'node:crypto';

export const nowIso = () => new Date().toISOString();
export const canonical = (value) => String(value || '').trim().toLowerCase();

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

export const decodeXml = (value) => String(value || '')
  .replaceAll('&amp;', '&')
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'")
  .trim();

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

export function buildSlickdealsSearchUrl(query = '') {
  return `https://slickdeals.net/newsearch.php?q=${encodeURIComponent(query)}`;
}

export function buildSlickdealsRssUrl({ query = '', category = 'all', limit = 20 } = {}) {
  const params = new URLSearchParams();
  params.set('q', query);
  params.set('pp', String(limit));
  params.set('forumid', 'all');
  params.set('sort', 'newest');
  if (category && category !== 'all') params.set('mode', category);
  params.set('r', '1');
  return `https://slickdeals.net/newsearch.php?${params.toString().replaceAll('+', '%20')}`;
}
