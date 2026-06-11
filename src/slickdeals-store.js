import { DEMO_SLICKDEALS_FEED, canonical, normalizeDeal, nowIso } from './slickdeals-collector.js';
import { DEFAULT_ALERT_RULES, normalizeAlertRule } from './slickdeals-rules.js';

const seedDeals = () => new Map(DEMO_SLICKDEALS_FEED.map((deal) => [deal.external_id, { ...deal, first_seen_at: nowIso(), last_seen_at: nowIso() }]));
const seedAlerts = () => new Map(DEFAULT_ALERT_RULES.map((alert) => [alert.id, normalizeAlertRule(alert)]));

export const slickdealsStore = {
  deals: seedDeals(),
  alerts: seedAlerts(),
  notifications: [],
  pollRuns: [],
  lastPoll: null,
};

export function resetSlickdealsState() {
  slickdealsStore.deals = seedDeals();
  slickdealsStore.alerts = seedAlerts();
  slickdealsStore.notifications = [];
  slickdealsStore.pollRuns = [];
  slickdealsStore.lastPoll = null;
}

export function upsertDeals(deals = []) {
  const inserted = [];
  const updated = [];
  for (const input of deals) {
    const deal = normalizeDeal(input);
    if (!deal.title || !deal.url) continue;
    const existing = slickdealsStore.deals.get(deal.external_id);
    const record = { ...existing, ...deal, first_seen_at: existing?.first_seen_at || nowIso(), last_seen_at: nowIso() };
    slickdealsStore.deals.set(record.external_id, record);
    (existing ? updated : inserted).push(record);
  }
  return { inserted, updated, total: slickdealsStore.deals.size };
}

export function listDeals({ query = '', merchant = '', minThumbScore, maxPrice, limit = 50 } = {}) {
  const q = canonical(query);
  const m = canonical(merchant);
  return [...slickdealsStore.deals.values()]
    .filter((deal) => !q || canonical(deal.title).includes(q))
    .filter((deal) => !m || canonical(deal.merchant).includes(m))
    .filter((deal) => minThumbScore === undefined || Number(deal.thumb_score || 0) >= Number(minThumbScore))
    .filter((deal) => maxPrice === undefined || deal.price === null || Number(deal.price) <= Number(maxPrice))
    .sort((a, b) => Number(b.thumb_score || 0) - Number(a.thumb_score || 0))
    .slice(0, Number(limit) || 50);
}

export function getDeal(id) {
  return slickdealsStore.deals.get(id) || [...slickdealsStore.deals.values()].find((deal) => deal.url === id) || null;
}

export function listAlerts() {
  return [...slickdealsStore.alerts.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function createAlertRule(input = {}) {
  const alert = normalizeAlertRule(input);
  slickdealsStore.alerts.set(alert.id, alert);
  return alert;
}

export function updateAlertRule(id, patch = {}) {
  const existing = slickdealsStore.alerts.get(id);
  if (!existing) return null;
  const next = normalizeAlertRule({ ...existing, ...patch, id, created_at: existing.created_at });
  slickdealsStore.alerts.set(id, next);
  return next;
}

export function deleteAlertRule(id) {
  return slickdealsStore.alerts.delete(id);
}

export function pushNotification(notification) {
  if (slickdealsStore.notifications.some((item) => item.id === notification.id)) return null;
  slickdealsStore.notifications.push(notification);
  return notification;
}

export function listNotifications({ status, limit = 50 } = {}) {
  return slickdealsStore.notifications
    .filter((item) => !status || item.status === status)
    .slice(-Number(limit) || -50)
    .reverse();
}

export function recordPollRun(run) {
  slickdealsStore.lastPoll = run;
  slickdealsStore.pollRuns.push(run);
  return run;
}

export function listPollRuns({ limit = 20 } = {}) {
  return slickdealsStore.pollRuns.slice(-Number(limit) || -20).reverse();
}
