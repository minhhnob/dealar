export function listDealarSkillBlueprints() {
  return [
    {
      id: 'dealar.scout.ticket',
      name: 'Deal Request Ticket',
      intent: 'Capture a shopping request with query, target price, source preferences, urgency, and optional paid unlock state.',
      circleLesson: 'Circle skills separate wallet bootstrap, funding, policy, and payment into narrow reusable flows.',
      dealarTranslation: 'Dealar separates shopping intent capture from payment, report generation, receipt, and watch alerts.',
      triggerPhrases: ['find a deal', 'check sale', 'target price', 'create ticket', 'săn deal'],
      requiresConfirmation: false,
      paymentPolicy: 'free_to_create_paid_to_unlock_report',
      outputArtifact: 'Deal Request Ticket',
    },
    {
      id: 'dealar.scout.report',
      name: 'Scout Report',
      intent: 'Generate a source-mixed deal intelligence report with best deal, safe deal, voucher scan, and trust score.',
      circleLesson: 'Paid service skills use discover → inspect → pay → receive result instead of assuming one hardcoded API.',
      dealarTranslation: 'Dealar uses capability discovery before producing or unlocking Scout Reports for agents.',
      triggerPhrases: ['scout report', 'deep report', 'best price', 'compare sources', 'quote product'],
      requiresConfirmation: false,
      paymentPolicy: 'optional_x402_unlock',
      outputArtifact: 'Scout Report',
    },
    {
      id: 'dealar.payment.policy',
      name: 'Payment Safety Policy',
      intent: 'Protect paid unlocks with per-ticket limits, one payment attempt, allowlisted Dealar endpoints, and receipt requirements.',
      circleLesson: 'Agent wallet policies expose per-transaction/daily caps and require human OTP for sensitive policy changes.',
      dealarTranslation: 'Dealar never auto-retries paid unlocks and requires explicit user confirmation for payment-policy changes.',
      triggerPhrases: ['payment limit', 'wallet policy', 'spend cap', 'retry payment', 'paid unlock'],
      requiresConfirmation: true,
      paymentPolicy: 'one_attempt_manual_retry_only',
      outputArtifact: 'Deal Receipt',
    },
    {
      id: 'dealar.wallet.status',
      name: 'Wallet Readiness Check',
      intent: 'Summarize whether a buyer agent can pay for Dealar reports: wallet status, funding, Gateway readiness, and allowed network.',
      circleLesson: 'Circle wallet skills bootstrap login, wallet creation, balance inspection, and Gateway deposits as separate steps.',
      dealarTranslation: 'Dealar surfaces a read-only readiness checklist before any paid Scout Report unlock.',
      triggerPhrases: ['wallet status', 'can pay', 'fund wallet', 'gateway balance', 'USDC ready'],
      requiresConfirmation: false,
      paymentPolicy: 'read_only_until_user_confirms',
      outputArtifact: 'Wallet Readiness Checklist',
    },
    {
      id: 'dealar.watch.alert',
      name: 'Price Watch Alert',
      intent: 'Schedule recurring scans and notify Telegram when a price target or strong voucher appears.',
      circleLesson: 'Narrow skills define clear triggers and operational boundaries so agents know when to activate them.',
      dealarTranslation: 'Dealar watch alerts have explicit query, threshold, cadence, source mix, and notification channel.',
      triggerPhrases: ['watch price', 'alert me', 'below $', 'voucher appears', 'theo dõi giá'],
      requiresConfirmation: false,
      paymentPolicy: 'free_demo_paid_monitoring_future',
      outputArtifact: 'Price Watch Alert',
    },
  ];
}

export function buildDealarSkillManifest({ baseUrl = 'https://prodeal-api.vercel.app' } = {}) {
  const root = String(baseUrl).replace(/\/$/, '');
  const blueprints = listDealarSkillBlueprints();
  return {
    name: 'Dealar Skill System',
    version: '0.1.0',
    description: 'Dealar-native agent skill manifest for shopping intelligence, derived from Circle skill-catalog principles and translated into Deal Scout workflows.',
    referencePrinciples: [
      'Use narrow, reusable skills with explicit trigger phrases.',
      'Separate wallet setup, funding, spending policy, payment, and result retrieval.',
      'Treat paid APIs as discoverable services: discover, inspect, pay, receive, receipt.',
      'Require human confirmation for sensitive wallet/payment-policy changes.',
      'Keep read-only checks separate from value-moving actions.',
    ],
    productGuardrail: 'Circle skills are used as operating principles only; Dealar keeps original shopping-intelligence language and artifacts.',
    activationPolicy: {
      readOnlySkills: blueprints.filter((skill) => !skill.requiresConfirmation).map((skill) => skill.id),
      confirmationRequired: blueprints.filter((skill) => skill.requiresConfirmation).map((skill) => skill.id),
      neverAutoExecute: ['send_usdc', 'change_wallet_limit', 'retry_paid_unlock_without_user_confirmation'],
    },
    endpoints: {
      capabilityCard: `${root}/v1/scout/capabilities`,
      skillManifest: `${root}/v1/scout/skills`,
      scoutReport: `${root}/v1/scout/report`,
      tickets: `${root}/v1/scout/tickets`,
      receipts: `${root}/v1/scout/receipts`,
    },
    skills: blueprints,
  };
}

export function formatDealarSkillTelegramSummary(manifest = buildDealarSkillManifest()) {
  const lines = [
    `🧩 ${manifest.name}`,
    `Skills: ${manifest.skills.length}`,
    `Guardrail: ${manifest.productGuardrail}`,
    '',
    ...manifest.skills.map((skill) => `• ${skill.name}: ${skill.outputArtifact}`),
  ];
  return lines.join('\n');
}
