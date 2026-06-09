import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDealarMcpReadiness,
  formatMcpReadinessTelegramSummary,
  listMcpIntegrations,
  summarizeMcpIntegrations,
} from '../src/mcp-integration-catalog.js';

test('listMcpIntegrations prioritizes a small Dealar-ready MCP stack', () => {
  const integrations = listMcpIntegrations();

  assert.ok(integrations.length >= 7);
  assert.ok(integrations.some((item) => item.id === 'github'));
  assert.ok(integrations.some((item) => item.id === 'context7'));
  assert.ok(integrations.some((item) => item.id === 'playwright'));
  assert.ok(integrations.every((item) => item.dealarUseCase));
});

test('summarizeMcpIntegrations exposes safety principles from the MCP article', () => {
  const summary = summarizeMcpIntegrations();

  assert.ok(summary.recommended >= 5);
  assert.ok(summary.categories.includes('payments-safety'));
  assert.ok(summary.safetyPrinciples.some((principle) => principle.includes('3-5')));
  assert.ok(summary.safetyPrinciples.some((principle) => principle.includes('read-only')));
  assert.ok(summary.safetyPrinciples.some((principle) => principle.includes('money-moving')));
});

test('buildDealarMcpReadiness returns endpoint-safe plan metadata', () => {
  const plan = buildDealarMcpReadiness({ baseUrl: 'https://dealar.example/' });

  assert.equal(plan.name, 'Dealar MCP Readiness Plan');
  assert.equal(plan.baseUrl, 'https://dealar.example');
  assert.deepEqual(plan.recommendedStarterStack, ['github', 'context7', 'playwright', 'brave-search', 'vercel']);
  assert.ok(plan.sourceInspiration.includes('read-only'));
});

test('formatMcpReadinessTelegramSummary is concise and Telegram-ready', () => {
  const summary = formatMcpReadinessTelegramSummary(buildDealarMcpReadiness());

  assert.match(summary, /MCP Readiness Plan/);
  assert.match(summary, /github/);
  assert.match(summary, /Playwright MCP/);
});
