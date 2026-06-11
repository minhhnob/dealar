import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDashboardModel,
  renderDashboardHtml,
} from '../src/dashboard.js';

test('buildDashboardModel summarizes the Slickdeals alert app', () => {
  const model = buildDashboardModel({
    apiBaseUrl: 'http://127.0.0.1:8787',
  });

  assert.equal(model.brand.name, 'Dealar');
  assert.match(model.brand.tagline, /Bot canh sale Slickdeals/i);
  assert.ok(model.metrics.dealsTracked >= 1);
  assert.ok(model.slickdeals.modules.some((item) => item.name === 'Collector'));
  assert.ok(model.endpoints.some((endpoint) => endpoint.path === '/v1/alerts'));
});

test('renderDashboardHtml returns complete HTML with key Dealar dashboard sections', () => {
  const html = renderDashboardHtml(buildDashboardModel({ paymentMode: 'demo', apiBaseUrl: 'http://127.0.0.1:8787' }));

  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /Dealar/);
  assert.match(html, /Bot canh sale Slickdeals/i);
  assert.match(html, /Slickdeals Alert Pipeline/i);
  assert.match(html, /Telegram Alert Queue/i);
  assert.match(html, /Bot commands/i);
  assert.match(html, /Poll Status/i);
  assert.match(html, /Collector/i);
  assert.match(html, /Database/i);
  assert.match(html, /Notifier/i);
  assert.match(html, /Deals tracked/i);
  assert.match(html, /Active alerts/i);
});
