import { getMarketplaceService } from './service-catalog.js';

const MICRO_USDC = 1_000_000n;

function parseUsdcToMicro(value) {
  const raw = String(value ?? '0').trim();
  if (!/^\d+(\.\d{0,6})?$/.test(raw)) throw new Error(`Invalid USDC amount: ${raw}`);
  const [whole, fraction = ''] = raw.split('.');
  return BigInt(whole) * MICRO_USDC + BigInt(fraction.padEnd(6, '0'));
}

function formatMicroUsdc(value) {
  const amount = BigInt(value);
  const whole = amount / MICRO_USDC;
  const fraction = (amount % MICRO_USDC).toString().padStart(6, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : `${whole}`;
}

function stableReceiptId({ serviceId, endpoint, settlementId, timestamp, amountUsdc }) {
  const text = `${serviceId}|${endpoint}|${settlementId}|${timestamp}|${amountUsdc}`;
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = ((hash << 5) - hash + text.charCodeAt(i)) >>> 0;
  return `rcpt_${hash.toString(16).padStart(8, '0')}`;
}

export function createPaymentReceipt({
  serviceId,
  endpoint,
  amountUsdc,
  buyer = 'demo-buyer-agent',
  seller = process.env.DEALAR_EVM_ADDRESS || 'demo-dealar-seller',
  paymentRail = 'circle_gateway_x402',
  settlementId = `demo-${serviceId || endpoint}`,
  resultSummary = 'Paid service unlocked',
  timestamp = new Date().toISOString(),
  status = 'paid',
} = {}) {
  const service = getMarketplaceService(serviceId || endpoint);
  const resolvedServiceId = serviceId || service?.id || 'dealar.unknown';
  const resolvedEndpoint = endpoint || service?.endpoint?.path || 'unknown';
  const resolvedAmount = amountUsdc || service?.price?.usdc || '0.00';
  const microUsdc = parseUsdcToMicro(resolvedAmount);

  return {
    id: stableReceiptId({ serviceId: resolvedServiceId, endpoint: resolvedEndpoint, settlementId, timestamp, amountUsdc: resolvedAmount }),
    status,
    serviceId: resolvedServiceId,
    serviceName: service?.name || resolvedServiceId,
    endpoint: resolvedEndpoint,
    amount: {
      usdc: formatMicroUsdc(microUsdc),
      microUsdc: microUsdc.toString(),
    },
    paymentRail,
    settlementId,
    buyer,
    seller,
    timestamp,
    resultSummary,
  };
}

export function appendPaymentReceipt(ledger, receipt) {
  ledger.push(receipt);
  return receipt;
}

export function listPaymentReceipts(ledger) {
  return [...ledger];
}

export function getPaymentReceipt(ledger, id) {
  return ledger.find((receipt) => receipt.id === id) || null;
}

export function summarizePaymentLedger(ledger) {
  const total = ledger.reduce((sum, receipt) => sum + BigInt(receipt.amount.microUsdc), 0n);
  const byRail = ledger.reduce((acc, receipt) => {
    acc[receipt.paymentRail] = (acc[receipt.paymentRail] || 0) + 1;
    return acc;
  }, {});
  return {
    totalReceipts: ledger.length,
    totalRevenueUsdc: formatMicroUsdc(total),
    byRail,
    latestReceiptId: ledger.at(-1)?.id || null,
  };
}

export function createDemoReceiptLedger() {
  return [
    createPaymentReceipt({
      serviceId: 'dealar.deals.search',
      endpoint: '/v1/deals/search',
      amountUsdc: '0.25',
      settlementId: 'c9933054-6b34-44bb-8c04-e7e9e1b8352c',
      resultSummary: 'WHOOP report unlocked',
      timestamp: '2026-06-08T00:00:00.000Z',
    }),
    createPaymentReceipt({
      serviceId: 'dealar.coupons.verify',
      endpoint: '/v1/coupons/verify',
      amountUsdc: '0.01',
      settlementId: 'demo-coupon-settlement',
      resultSummary: 'WELCOME20 valid',
      timestamp: '2026-06-08T00:01:00.000Z',
    }),
    createPaymentReceipt({
      serviceId: 'dealar.retailers.list',
      endpoint: '/v1/retailers',
      amountUsdc: '0.05',
      settlementId: 'demo-retailer-settlement',
      resultSummary: 'Retailer directory returned',
      timestamp: '2026-06-08T00:02:00.000Z',
    }),
  ];
}
