import test from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../src/server.js';
import {
  evaluateAlerts,
  fetchSlickdealsLiveSearch,
  listDeals,
  parseSlickdealsRss,
  pollSlickdealsDemo,
  resetSlickdealsState,
  upsertDeals,
} from '../src/slickdeals-alerts.js';

test('parseSlickdealsRss normalizes RSS items into Dealar deal records', () => {
  const deals = parseSlickdealsRss(`<?xml version="1.0"?><rss><channel><item>
    <title><![CDATA[$599 MacBook Air M2 at Best Buy]]></title>
    <link>https://slickdeals.net/f/1</link>
    <guid>slick-1</guid>
    <description><![CDATA[Thumb Score: 38]]></description>
  </item></channel></rss>`);

  assert.equal(deals.length, 1);
  assert.equal(deals[0].source, 'slickdeals');
  assert.equal(deals[0].external_id, 'slick-1');
  assert.equal(deals[0].price, 599);
  assert.equal(deals[0].thumb_score, 38);
  assert.equal(deals[0].merchant, 'Best Buy');
});

test('buildSlickdealsRssUrl creates feed URL for Slickdeals keywords and categories', async () => {
  const { buildSlickdealsRssUrl } = await import('../src/slickdeals-alerts.js');

  assert.equal(
    buildSlickdealsRssUrl({ query: 'macbook air', category: 'frontpage' }),
    'https://slickdeals.net/newsearch.php?q=macbook%20air&pp=20&forumid=all&sort=newest&mode=frontpage&r=1'
  );
});


test('fetchSlickdealsLiveSearch falls back to readable Markdown when Cloudflare blocks direct search', async () => {
  const fetchImpl = async (url) => {
    if (String(url).startsWith('https://slickdeals.net/')) {
      return new Response('<title>Just a moment...</title><script src="https://challenges.cloudflare.com"></script>', { status: 403 });
    }
    return new Response(`Title: Slickdeals Search

*   
[![Image 3](https://static.slickdealscdn.com/attachment/apple-watch.thumb)](https://slickdeals.net/f/19607439-apple-watch-test)

[VONUV 3-in-1 Wireless Adapter for Apple Watch](https://slickdeals.net/f/19607439-vonuv-3-in-1-apple-watch-8-80?src=SDSearchv3 "VONUV 3-in-1 Wireless Adapter for Apple Watch")Found by LolaBunny21 • Jun 08, 2026 10:04 PM  [$8.80$26 66% off](https://slickdeals.net/f/19607439-vonuv-3-in-1-apple-watch-8-80)Amazon  

+117

 frontpage
`, { status: 200 });
  };

  const result = await fetchSlickdealsLiveSearch({ query: 'apple watch', fetchImpl });

  assert.equal(result.blocked, true);
  assert.equal(result.fetch_mode, 'jina-markdown');
  assert.equal(result.deals.length, 1);
  assert.match(result.deals[0].title, /Apple Watch/);
  assert.equal(result.deals[0].price, 8.80);
  assert.equal(result.deals[0].merchant, 'Amazon');
  assert.equal(result.deals[0].thumb_score, 117);
});

test('Slickdeals alert engine dedupes deals and queues Telegram-ready notifications', () => {
  resetSlickdealsState();
  const upsert = upsertDeals([{ title: '$699 iPhone 16 at Best Buy', url: 'https://slickdeals.net/f/2', external_id: 'slick-2', price: 699, thumb_score: 11, merchant: 'Best Buy' }]);
  assert.equal(upsert.inserted.length, 1);

  const matches = evaluateAlerts({ deals: upsert.inserted });
  assert.equal(matches.length, 1);
  assert.match(matches[0].notification.message, /Deal mới trên Slickdeals/);
  assert.match(matches[0].notification.message, /iPhone 16/);

  const second = evaluateAlerts({ deals: upsert.inserted });
  assert.equal(second.length, 0, 'same alert/deal notification should not be duplicated');
});

test('pollSlickdealsDemo returns pipeline stats and stored deals', () => {
  resetSlickdealsState();
  const result = pollSlickdealsDemo();
  assert.equal(result.source, 'slickdeals');
  assert.ok(result.total_deals >= 3);
  assert.ok(listDeals({ query: 'macbook' }).some((deal) => deal.external_id.includes('macbook')));
});

test('server exposes Slickdeals deal, alert, notification, and poll APIs', async () => {
  resetSlickdealsState();
  const app = await createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    const { port } = server.address();
    const base = `http://127.0.0.1:${port}`;

    const deals = await fetch(`${base}/v1/deals?query=macbook`);
    assert.equal(deals.status, 200);
    const dealsBody = await deals.json();
    assert.ok(dealsBody.deals.length >= 1);

    const detail = await fetch(`${base}/v1/deals/${dealsBody.deals[0].external_id}`);
    assert.equal(detail.status, 200);

    const createAlert = await fetch(`${base}/v1/alerts`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Test laptop alert', includeKeywords: ['laptop'], minThumbScore: 1, maxPrice: 1000 }),
    });
    assert.equal(createAlert.status, 201);
    const createAlertBody = await createAlert.json();

    const patchAlert = await fetch(`${base}/v1/alerts/${createAlertBody.alert.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ enabled: false }),
    });
    assert.equal(patchAlert.status, 200);

    const poll = await fetch(`${base}/v1/slickdeals/poll`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    assert.equal(poll.status, 200);
    const pollBody = await poll.json();
    assert.equal(pollBody.source, 'slickdeals');

    const notifications = await fetch(`${base}/v1/notifications`);
    assert.equal(notifications.status, 200);

    const deleteAlert = await fetch(`${base}/v1/alerts/${createAlertBody.alert.id}`, { method: 'DELETE' });
    assert.equal(deleteAlert.status, 204);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
