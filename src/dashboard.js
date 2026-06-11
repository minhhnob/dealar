import { buildSlickdealsDashboardModel } from './slickdeals-alerts.js';

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

export function buildDashboardModel({ apiBaseUrl = process.env.DEALAR_API_BASE_URL || 'http://127.0.0.1:8787' } = {}) {
  const slickdeals = buildSlickdealsDashboardModel();
  return {
    brand: {
      name: 'Dealar',
      tagline: 'Bot canh sale Slickdeals cho sếp.',
      subheadline: 'Theo dõi deal mới, lọc deal ngon, chống trùng và gửi Telegram alert khi có sale đáng mua.',
      apiBaseUrl,
    },
    metrics: {
      dealsTracked: slickdeals.metrics.deals,
      activeAlerts: slickdeals.alerts.filter((alert) => alert.enabled).length,
      notificationsQueued: slickdeals.metrics.queued,
      hotDeals: slickdeals.metrics.hotDeals,
      endpoints: 5,
    },
    slickdeals,
    commands: [
      { input: 'check sale iphone 17 hôm nay', output: 'Kiểm tra watchlist hiện tại và trả deal Slickdeals khớp nếu có.' },
      { input: 'canh sale macbook dưới 800', output: 'Tạo alert rule Telegram cho MacBook, max price $800.' },
      { input: 'list alert', output: 'Liệt kê rule đang bật, keyword, giá tối đa và min score.' },
    ],
    endpoints: [
      { method: 'GET', path: '/v1/deals', description: 'Lấy danh sách deal đã lưu' },
      { method: 'GET', path: '/v1/alerts', description: 'Lấy alert rules' },
      { method: 'POST', path: '/v1/alerts', description: 'Tạo rule canh sale mới' },
      { method: 'POST', path: '/v1/slickdeals/poll', description: 'Chạy poll Slickdeals thủ công' },
      { method: 'GET', path: '/v1/notifications', description: 'Xem Telegram alert queue' },
    ],
  };
}

const metricCard = ([label, value]) => `<div class="metric"><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></div>`;

export function renderDashboardHtml(model = buildDashboardModel()) {
  const cards = [
    ['Deals tracked', model.metrics.dealsTracked],
    ['Active alerts', model.metrics.activeAlerts],
    ['Notifications queued', model.metrics.notificationsQueued],
    ['Hot deals', model.metrics.hotDeals],
  ];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Dealar — Slickdeals Alert Dashboard</title>
  <style>
    :root { color-scheme: dark; --bg:#070707; --panel:#101010; --ink:#fff; --muted:#a7a7a7; --line:rgba(255,255,255,.14); --orange:#CC6437; --green:#79D37C; }
    *{box-sizing:border-box} body{margin:0;background:radial-gradient(circle at 82% 8%,rgba(204,100,55,.22),transparent 28%),var(--bg);color:var(--ink);font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,monospace} a{color:inherit} main{max-width:1180px;margin:auto;padding:28px 18px 72px}.topbar{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:24px}.brand{font-size:22px;font-weight:800;letter-spacing:-.06em;text-transform:uppercase}.nav{display:flex;gap:8px;flex-wrap:wrap}.pill{border:1px solid var(--line);border-radius:999px;padding:9px 13px;text-decoration:none;font-size:12px}.pill.accent{border-color:var(--orange);box-shadow:0 0 34px rgba(204,100,55,.18) inset}.hero{display:grid;grid-template-columns:1.3fr .7fr;gap:16px}.panel{background:rgba(16,16,16,.84);border:1px solid var(--line);border-radius:18px;padding:22px;box-shadow:0 30px 90px rgba(0,0,0,.35)}.eyebrow{color:var(--orange);text-transform:uppercase;font-size:11px;letter-spacing:.08em}h1{font-size:clamp(54px,11vw,128px);line-height:.86;margin:16px 0 10px;letter-spacing:-.08em;text-transform:uppercase}h2{font-size:18px;text-transform:uppercase;letter-spacing:-.03em;margin:0 0 14px}.lead{font-size:clamp(21px,3vw,38px);line-height:1.04;letter-spacing:-.04em;margin:0 0 16px}.muted{color:var(--muted);font-size:13px;line-height:1.55}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px}.metric{background:#050505;border:1px solid var(--line);border-radius:14px;padding:15px;min-height:102px}.metric span{color:var(--muted);font-size:11px;text-transform:uppercase}.metric b{display:block;font-size:34px;margin-top:20px}.sections{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}.flow{display:grid;gap:8px}.flow div,.deal-card,.rule,.queue,.command,.endpoint{background:#050505;border:1px solid var(--line);border-radius:13px;padding:13px}.deal-list,.rule-list,.queue-list,.command-list,.endpoint-list{display:grid;gap:10px}.score{color:var(--orange)}.status{color:var(--green)}code{background:#000;border:1px solid var(--line);border-radius:7px;padding:2px 6px}@media(max-width:860px){.hero,.sections,.grid{grid-template-columns:1fr}.topbar{align-items:flex-start;flex-direction:column}}
  </style>
</head>
<body>
<main>
  <nav class="topbar">
    <div class="brand">DEALAR</div>
    <div class="nav">
      <a class="pill" href="/v1/deals">Deals API</a>
      <a class="pill" href="/v1/alerts">Alert Rules</a>
      <a class="pill accent" href="/v1/telegram/webhook/setup">Telegram Setup</a>
    </div>
  </nav>

  <section class="hero">
    <div class="panel">
      <div class="eyebrow">Slickdeals → Collector → Filter → Database → Telegram Alert</div>
      <h1>Dealar</h1>
      <p class="lead">${escapeHtml(model.brand.tagline)}</p>
      <p class="muted">${escapeHtml(model.brand.subheadline)}</p>
      <p><a class="pill accent" href="/v1/deals">Xem deal mới</a><a class="pill" href="/v1/alerts">Tạo alert rule</a><a class="pill" href="/v1/slickdeals/poll">Run poll now</a></p>
      <div class="grid">${cards.map(metricCard).join('')}</div>
    </div>
    <div class="panel">
      <h2>Poll Status</h2>
      <p class="muted">Source: <code>Slickdeals RSS/search</code></p>
      <p class="muted">Last poll: <code>${escapeHtml(model.slickdeals.lastPoll?.checked_at || 'not run yet')}</code></p>
      <p class="muted">Status: <span class="status">Monitoring</span></p>
      <h2 style="margin-top:24px">Modules</h2>
      <div class="flow">${model.slickdeals.modules.map((m) => `<div><b>${escapeHtml(m.name)}</b><br><span class="muted">${escapeHtml(m.file)} — ${escapeHtml(m.role)}</span></div>`).join('')}</div>
    </div>
  </section>

  <section class="sections">
    <div class="panel">
      <h2>Slickdeals Alert Pipeline</h2>
      <div class="flow">${model.slickdeals.pipeline.map((step) => `<div>${escapeHtml(step)}</div>`).join('')}</div>
    </div>
    <div class="panel">
      <h2>Bot commands</h2>
      <div class="command-list">${model.commands.map((cmd) => `<div class="command"><code>${escapeHtml(cmd.input)}</code><br><span class="muted">${escapeHtml(cmd.output)}</span></div>`).join('')}</div>
    </div>
  </section>

  <section class="sections">
    <div class="panel">
      <h2>Hot Slickdeals Now</h2>
      <div class="deal-list">${model.slickdeals.deals.slice(0, 6).map((d) => `<div class="deal-card"><b>${escapeHtml(d.title)}</b> <span class="score">+${escapeHtml(d.thumb_score)}</span><br><span class="muted">${escapeHtml(d.merchant)} · ${escapeHtml(d.price === null ? 'n/a' : `$${d.price}`)} · <a href="${escapeHtml(d.url)}">open deal</a></span></div>`).join('') || '<p class="muted">Chưa có deal khớp. Dealar vẫn đang theo dõi Slickdeals.</p>'}</div>
    </div>
    <div class="panel">
      <h2>Alert Rules</h2>
      <div class="rule-list">${model.slickdeals.alerts.map((a) => `<div class="rule"><b>${escapeHtml(a.name)}</b> · <span class="status">${a.enabled ? 'Monitoring' : 'Paused'}</span><br><span class="muted">include: ${escapeHtml(a.includeKeywords.join(', ') || 'any')} · exclude: ${escapeHtml(a.excludeKeywords.join(', ') || 'none')} · max: ${escapeHtml(a.maxPrice ? `$${a.maxPrice}` : 'any')} · min score: +${escapeHtml(a.minThumbScore)}</span></div>`).join('')}</div>
    </div>
  </section>

  <section class="sections">
    <div class="panel">
      <h2>Telegram Alert Queue</h2>
      <div class="queue-list">${model.slickdeals.notifications.map((n) => `<div class="queue"><b>${escapeHtml(n.channel)}</b> · <span class="status">${escapeHtml(n.status)}</span><br><span class="muted">${escapeHtml(n.id)}</span></div>`).join('') || '<p class="muted">Chưa có alert queued. Khi deal khớp rule, Telegram queue sẽ hiện ở đây.</p>'}</div>
    </div>
    <div class="panel">
      <h2>API for dashboard</h2>
      <div class="endpoint-list">${model.endpoints.map((e) => `<div class="endpoint"><code>${escapeHtml(e.method)} ${escapeHtml(e.path)}</code><br><span class="muted">${escapeHtml(e.description)}</span></div>`).join('')}</div>
    </div>
  </section>
</main>
</body>
</html>`;
}
