#!/usr/bin/env node
import { buildDealSearchUrl, createPaidFetch, requestJsonWithPayment } from '../src/buyer-client.js';

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (arg.startsWith('--')) {
    const key = arg.slice(2);
    const next = process.argv[i + 1];
    if (next && !next.startsWith('--')) {
      args.set(key, next);
      i += 1;
    } else {
      args.set(key, 'true');
    }
  }
}

const baseUrl = args.get('base-url') || process.env.DEALAR_API_BASE_URL || 'http://127.0.0.1:8787';
const query = args.get('query') || 'whoop';
const regions = (args.get('regions') || 'us,eu').split(',').map((item) => item.trim()).filter(Boolean);
const mode = args.get('mode') || process.env.DEALAR_PAYMENT_MODE || 'demo';

const url = buildDealSearchUrl(baseUrl, { query, regions });
const paidFetch = await createPaidFetch({ mode });
const result = await requestJsonWithPayment(url, { paidFetch });

console.log(JSON.stringify({
  request: { url, mode, query, regions },
  response: result,
}, null, 2));

if (!result.ok) process.exitCode = 1;
