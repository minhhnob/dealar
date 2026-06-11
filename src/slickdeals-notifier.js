import { nowIso } from './slickdeals-collector.js';
import { pushNotification } from './slickdeals-store.js';

export function formatTelegramDealAlert({ deal, alert } = {}) {
  return [
    '🔥 Deal mới trên Slickdeals',
    '',
    deal?.title || 'Untitled deal',
    '',
    `💰 Price: ${deal?.price === null || deal?.price === undefined ? 'n/a' : `$${deal.price}`}`,
    `🏪 Merchant: ${deal?.merchant || 'n/a'}`,
    `👍 Score: +${deal?.thumb_score ?? 0}`,
    alert ? `🔎 Rule: ${alert.name}` : null,
    '',
    `Link: ${deal?.url || ''}`,
  ].filter((line) => line !== null).join('\n');
}

export function queueDealNotification({ deal, alert }) {
  const notification = {
    id: `${alert.id}:${deal.external_id}`,
    alert_id: alert.id,
    deal_id: deal.external_id,
    channel: alert.channels?.[0] || 'telegram',
    status: 'queued',
    message: formatTelegramDealAlert({ deal, alert }),
    created_at: nowIso(),
  };
  return pushNotification(notification);
}
