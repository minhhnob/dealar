#!/usr/bin/env node
import { executeCliAction, parseCliPayload } from '../src/cli-actions.js';

export const DEALAR_REPO = 'https://github.com/dealar-ai/dealar-api';

function printUsage() {
  console.error(`Dealar CLI — JSON bridge for agents → Dealar API intelligence

Repository: ${DEALAR_REPO}

Usage:
  node bin/dealar-cli.js '<json-payload>'

Payload shape:
  { "action": "<name>", "params": { ... } }

Actions:
  deal.search
  retailers.list
  coupon.verify
  wallet.policy
  dashboard.summary

Examples:
  node bin/dealar-cli.js '{"action":"deal.search","params":{"query":"whoop","regions":["us","eu"]}}'
  node bin/dealar-cli.js '{"action":"coupon.verify","params":{"merchant":"lookfantastic","code":"WELCOME20","region":"uk"}}'
`);
}

async function main() {
  const payloadText = process.argv[2];
  if (!payloadText) {
    printUsage();
    process.exit(1);
  }

  try {
    const payload = parseCliPayload(payloadText);
    const result = await executeCliAction(payload);
    const output = JSON.stringify(result);
    if (result.ok) {
      console.log(output);
      return;
    }
    console.error(output);
    process.exit(1);
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error.message || String(error) }));
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
