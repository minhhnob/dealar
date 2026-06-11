export {
  DEMO_SLICKDEALS_FEED,
  buildSlickdealsSearchUrl,
  canonical,
  extractMerchant,
  extractPrice,
  extractThumbScore,
  normalizeDeal,
  parseSlickdealsRss,
} from './slickdeals-collector.js';
export { DEFAULT_ALERT_RULES, matchesAlert, normalizeAlertRule, parseNaturalAlertCommand } from './slickdeals-rules.js';
export {
  createAlertRule,
  deleteAlertRule,
  getDeal,
  listAlerts,
  listDeals,
  listNotifications,
  listPollRuns,
  recordPollRun,
  resetSlickdealsState,
  updateAlertRule,
  upsertDeals,
} from './slickdeals-store.js';
export { formatTelegramDealAlert, queueDealNotification } from './slickdeals-notifier.js';

import { DEMO_SLICKDEALS_FEED, nowIso } from './slickdeals-collector.js';
import { matchesAlert } from './slickdeals-rules.js';
import { queueDealNotification } from './slickdeals-notifier.js';
import { listAlerts, listDeals, listNotifications, listPollRuns, recordPollRun, upsertDeals } from './slickdeals-store.js';

export function evaluateAlerts({ deals = listDeals({ limit: 200 }), alerts = listAlerts() } = {}) {
  const matches = [];
  for (const deal of deals) {
    for (const alert of alerts) {
      if (!matchesAlert(deal, alert)) continue;
      const notification = queueDealNotification({ deal, alert });
      if (notification) matches.push({ alert, deal, notification });
    }
  }
  return matches;
}

export function pollSlickdealsDemo({ feed = DEMO_SLICKDEALS_FEED, sourceUrl = 'demo://slickdeals/frontpage' } = {}) {
  const startedAt = nowIso();
  const upsert = upsertDeals(feed);
  const matchInput = upsert.inserted.length ? upsert.inserted : listDeals({ limit: 200 });
  const matches = evaluateAlerts({ deals: matchInput });
  const run = recordPollRun({
    id: `poll-${Date.now()}`,
    source: 'slickdeals',
    source_url: sourceUrl,
    status: 'ok',
    checked_at: nowIso(),
    started_at: startedAt,
    finished_at: nowIso(),
    fetched: feed.length,
    inserted: upsert.inserted.length,
    updated: upsert.updated.length,
    matches: matches.length,
  });
  return { ...run, total_deals: upsert.total, matches };
}

export function buildSlickdealsDashboardModel() {
  const deals = listDeals({ limit: 20 });
  const alerts = listAlerts();
  const notifications = listNotifications({ limit: 10 });
  const hotDeals = deals.filter((deal) => Number(deal.thumb_score || 0) >= 10);
  return {
    source: 'Slickdeals',
    positioning: 'Dealar — bot canh sale Slickdeals cho sếp.',
    pipeline: [
      'Slickdeals RSS/search collector',
      'Filter rules: keyword, price, thumb score',
      'Dedupe database: skip repeated deals',
      'Notification queue: Telegram-first alerts',
      'Dashboard/API: inspect deals, rules, poll status',
    ],
    modules: [
      { name: 'Collector', file: 'slickdeals-collector.js', role: 'Parse RSS/search feed into normalized deals' },
      { name: 'Rules', file: 'slickdeals-rules.js', role: 'Match keywords, exclusions, price and score' },
      { name: 'Database', file: 'slickdeals-store.js', role: 'Store deals, alerts, notifications and poll runs' },
      { name: 'Notifier', file: 'slickdeals-notifier.js', role: 'Build Telegram-ready deal alerts' },
    ],
    metrics: {
      deals: deals.length,
      alerts: alerts.length,
      notifications: notifications.length,
      hotDeals: hotDeals.length,
      queued: notifications.filter((item) => item.status === 'queued').length,
    },
    deals,
    hotDeals,
    alerts,
    notifications,
    lastPoll: listPollRuns({ limit: 1 })[0] || null,
  };
}

export function getSlickdealsStateSummary() {
  const model = buildSlickdealsDashboardModel();
  return { ...model, notifications: listNotifications({ limit: 50 }) };
}
