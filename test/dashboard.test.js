import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDashboardModel,
  renderDashboardHtml,
} from '../src/dashboard.js';

test('buildDashboardModel summarizes Dealar product, payments, wallet, and endpoints', () => {
  const model = buildDashboardModel({
    paymentMode: 'demo',
    apiBaseUrl: 'http://127.0.0.1:8787',
  });

  assert.equal(model.brand.name, 'Dealar');
  assert.equal(model.payment.mode, 'demo');
  assert.equal(model.payment.network, 'Arc Testnet');
  assert.ok(model.metrics.endpoints >= 3);
  assert.ok(model.endpoints.some((endpoint) => endpoint.path === '/v1/deals/search'));
  assert.ok(model.wallet.controls.includes('daily_limit'));
});

test('renderDashboardHtml returns complete HTML with key Dealar dashboard sections', () => {
  const html = renderDashboardHtml(buildDashboardModel({ paymentMode: 'demo', apiBaseUrl: 'http://127.0.0.1:8787' }));

  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /Dealar/);
  assert.match(html, /Precision deal scouting/i);
  assert.match(html, /Dealer Capability Card/i);
  assert.match(html, /Scout Report/i);
  assert.match(html, /Brand System/i);
  assert.match(html, /Dealar Skill System/i);
  assert.match(html, /Skill Safety Guardrails/i);
  assert.match(html, /#CC6437/i);
  assert.match(html, /WHOOP Official/);
  assert.match(html, /Wallet Policy/i);
  assert.match(html, /Payment Flow/i);
  assert.match(html, /Deal receipts/i);
});
