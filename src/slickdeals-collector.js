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

function numericOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function normalizeDeal(input = {}) {
  const title = String(input.title || '').trim();
  const url = String(input.url || input.link || '').trim();
  const externalId = String(input.external_id || input.guid || crypto.createHash('sha256').update(`${title}:${url}`).digest('hex').slice(0, 16));
  const parsedPrice = numericOrNull(input.price);
  const parsedScore = numericOrNull(input.thumb_score ?? input.thumbScore);
  return {
    source: 'slickdeals',
    external_id: externalId,
    title,
    url,
    price: parsedPrice ?? extractPrice(title),
    merchant: input.merchant || extractMerchant(title),
    thumb_score: parsedScore ?? extractThumbScore(input.description || input.rawDescription || ''),
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

export function buildSlickdealsJinaUrl(slickdealsUrl = '') {
  return `https://r.jina.ai/http://r.jina.ai/http://${slickdealsUrl}`;
}

export function isSlickdealsBlockedResponse({ status = 0, text = '' } = {}) {
  const body = String(text || '').toLowerCase();
  return status === 403 || body.includes('just a moment') || body.includes('challenges.cloudflare.com');
}

function absoluteSlickdealsUrl(url = '') {
  const value = String(url || '').trim();
  if (!value) return '';
  if (value.startsWith('http')) return value;
  if (value.startsWith('/')) return `https://slickdeals.net${value}`;
  return `https://slickdeals.net/${value}`;
}

function extractMarkdownSearchDeals(markdown = '', { limit = 10 } = {}) {
  const blocks = String(markdown || '').split(/\n\*\s+\n(?=\[!\[Image)/g);
  const deals = [];
  for (const block of blocks) {
    if (!block.includes('Found by') || !block.includes('slickdeals.net/f/')) continue;
    const imageMatch = block.match(/!\[Image[^\]]*\]\(([^)]+)\)/i);
    const afterImage = block.slice(imageMatch ? block.indexOf(imageMatch[0]) + imageMatch[0].length : 0);
    const titleMatch = afterImage.match(/\n\[([^\]\n]+)\]\((https?:\/\/slickdeals\.net\/f\/[^\s)]+)(?:\s+"[^"]*")?\)Found by/i);
    if (!titleMatch) continue;
    const priceMatch = block.match(/\[\$?([0-9][0-9,.]*(?:\.[0-9]{1,2})?)(?:[^\]\n]*)\]\(https?:\/\/slickdeals\.net\/f\//i);
    const merchantMatch = block.match(/\[\$[^\]\n]*\]\(https?:\/\/slickdeals\.net\/f\/[^)]*\)([^\n]+)\s+\n\n[+\-]?\d+/i);
    const scoreMatch = block.match(/\n\n\+?(-?\d+)\n\n(?:\s*frontpage)?/i);
    const postedMatch = block.match(/\n\n([A-Z][a-z]{2} \d{1,2}, \d{4} [0-9:]+ [AP]M)\n/i);
    const url = absoluteSlickdealsUrl(titleMatch[2].split('?')[0]);
    deals.push(normalizeDeal({
      title: decodeXml(titleMatch[1]),
      url,
      external_id: url.match(/\/f\/(\d+)/)?.[1] || url,
      price: priceMatch ? Number(priceMatch[1].replaceAll(',', '')) : null,
      merchant: merchantMatch ? merchantMatch[1].trim() : 'Slickdeals merchant',
      thumb_score: scoreMatch ? Number(scoreMatch[1]) : 0,
      image_url: imageMatch?.[1] || null,
      posted_at: postedMatch ? new Date(`${postedMatch[1]} UTC`).toISOString() : nowIso(),
      raw: { parser: 'jina-markdown' },
    }));
    if (deals.length >= Number(limit || 10)) break;
  }
  return deals;
}

export async function fetchSlickdealsLiveSearch({ query = '', limit = 10, fetchImpl = fetch } = {}) {
  const searchUrl = buildSlickdealsSearchUrl(query);
  const headers = {
    'user-agent': 'Mozilla/5.0 (compatible; DealarBot/1.0; +https://prodeal-api.vercel.app)',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };
  const direct = await fetchImpl(searchUrl, { headers });
  const directText = await direct.text();
  if (!isSlickdealsBlockedResponse({ status: direct.status, text: directText })) {
    const rssDeals = parseSlickdealsRss(directText);
    if (rssDeals.length) return { deals: rssDeals.slice(0, limit), source_url: searchUrl, fetch_mode: 'direct-rss', blocked: false };
    const htmlDeals = extractMarkdownSearchDeals(directText, { limit });
    if (htmlDeals.length) return { deals: htmlDeals, source_url: searchUrl, fetch_mode: 'direct-html', blocked: false };
  }

  const jinaUrl = buildSlickdealsJinaUrl(searchUrl);
  const fallback = await fetchImpl(jinaUrl, { headers: { 'user-agent': headers['user-agent'], accept: 'text/markdown,*/*;q=0.8' } });
  const fallbackText = await fallback.text();
  if (!fallback.ok) {
    return { deals: [], source_url: searchUrl, fallback_url: jinaUrl, fetch_mode: 'jina-markdown', blocked: true, error: `fallback_http_${fallback.status}` };
  }
  return {
    deals: extractMarkdownSearchDeals(fallbackText, { limit }),
    source_url: searchUrl,
    fallback_url: jinaUrl,
    fetch_mode: 'jina-markdown',
    blocked: true,
  };
}
