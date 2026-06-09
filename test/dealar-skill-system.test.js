import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDealarSkillManifest,
  formatDealarSkillTelegramSummary,
  listDealarSkillBlueprints,
} from '../src/dealar-skill-system.js';

test('listDealarSkillBlueprints translates Circle skill patterns into Dealar-native skills', () => {
  const skills = listDealarSkillBlueprints();

  assert.ok(skills.length >= 5);
  assert.ok(skills.some((skill) => skill.id === 'dealar.scout.report'));
  assert.ok(skills.some((skill) => skill.id === 'dealar.payment.policy'));
  assert.ok(skills.every((skill) => skill.dealarTranslation.includes('Dealar')));
  assert.ok(skills.every((skill) => skill.outputArtifact));
});

test('buildDealarSkillManifest exposes guardrails for wallet and paid unlock safety', () => {
  const manifest = buildDealarSkillManifest({ baseUrl: 'https://dealar.example' });

  assert.equal(manifest.name, 'Dealar Skill System');
  assert.equal(manifest.endpoints.skillManifest, 'https://dealar.example/v1/scout/skills');
  assert.ok(manifest.referencePrinciples.some((principle) => principle.includes('discover')));
  assert.ok(manifest.productGuardrail.includes('Circle skills'));
  assert.ok(manifest.activationPolicy.confirmationRequired.includes('dealar.payment.policy'));
  assert.ok(manifest.activationPolicy.neverAutoExecute.includes('send_usdc'));
});

test('formatDealarSkillTelegramSummary is concise and Telegram-ready', () => {
  const summary = formatDealarSkillTelegramSummary(buildDealarSkillManifest());

  assert.match(summary, /Dealar Skill System/);
  assert.match(summary, /Deal Request Ticket/);
  assert.match(summary, /Scout Report/);
  assert.match(summary, /Guardrail/);
});
