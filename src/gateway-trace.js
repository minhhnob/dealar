const GATEWAY_API_DEFAULT = 'https://gateway-api-testnet.circle.com';
const ARC_EXPLORER_DEFAULT = 'https://testnet.arcscan.app';

const PINNED_BATCH_TX = {
  'c9933054-6b34-44bb-8c04-e7e9e1b8352c': '0xfbad1baae7fd9b88f4e1b034a4236da02012870acbd6ae83b583e85528be396e',
};

function formatUsdcFromAtomic(amount) {
  const raw = BigInt(amount || 0);
  const whole = raw / 1_000_000n;
  const fraction = (raw % 1_000_000n).toString().padStart(6, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : `${whole}`;
}

export function normalizeSettlementForTrace(settlement) {
  return {
    id: settlement.id || settlement.transaction || settlement.settlementId,
    status: settlement.status || 'unknown',
    fromAddress: settlement.fromAddress || settlement.from || settlement.payer || null,
    toAddress: settlement.toAddress || settlement.to || settlement.seller || null,
    amountAtomic: String(settlement.amount || settlement.amountAtomic || '0'),
    amountUsdc: settlement.amountUsdc || formatUsdcFromAtomic(settlement.amount || settlement.amountAtomic || '0'),
    network: settlement.network || 'eip155:5042002',
    createdAt: settlement.createdAt || null,
    updatedAt: settlement.updatedAt || null,
  };
}

export function getPinnedGatewayBatchTx(settlementId, { explorerBaseUrl = ARC_EXPLORER_DEFAULT } = {}) {
  const batchTx = PINNED_BATCH_TX[settlementId];
  if (!batchTx) return { batchTx: null, explorerUrl: null, status: 'unknown' };
  return { batchTx, explorerUrl: `${explorerBaseUrl}/tx/${batchTx}`, status: 'completed' };
}

export function buildGatewayTraceModel({
  settlementId = 'demo',
  status = 'demo',
  batchTx = null,
  explorerUrl = null,
  gatewayApi = GATEWAY_API_DEFAULT,
} = {}) {
  const settlementUrl = settlementId && settlementId !== 'demo'
    ? `${gatewayApi}/v1/x402/transfers/${settlementId}`
    : null;

  return {
    settlementId,
    status,
    batchTx,
    explorerUrl,
    steps: [
      {
        key: 'eip712_signed',
        title: 'Buyer signs EIP-712 authorization',
        description: 'The buyer wallet signs an off-chain TransferWithAuthorization message. No gas is spent by the buyer at this step.',
        links: {},
      },
      {
        key: 'facilitator_settle',
        title: 'Seller middleware settles with Circle facilitator',
        description: 'Dealar Gateway middleware forwards the signed authorization to Circle Gateway via x402 settle.',
        links: { gatewayApi },
      },
      {
        key: 'settlement_queued',
        title: 'Settlement UUID queued',
        description: 'Circle accepts the authorization and returns a settlement UUID while the relayer waits to batch payments.',
        links: settlementUrl ? { settlement: settlementUrl } : {},
      },
      {
        key: 'relayer_batches',
        title: 'Relayer batches transfers',
        description: 'Circle relayer combines multiple small USDC payments into a Gateway batch.',
        links: {},
      },
      {
        key: 'submit_batch',
        title: 'On-chain submitBatch transaction',
        description: 'The relayer submits batched balance deltas on Arc Testnet.',
        links: explorerUrl ? { explorer: explorerUrl } : {},
      },
      {
        key: 'settlement_completed',
        title: 'Settlement completed',
        description: 'Circle marks the settlement completed after the batch transaction is mined.',
        links: settlementUrl ? { settlement: settlementUrl } : {},
      },
    ],
  };
}

export async function fetchGatewaySettlement(settlementId, { gatewayApi = GATEWAY_API_DEFAULT, fetchImpl = fetch } = {}) {
  const response = await fetchImpl(`${gatewayApi}/v1/x402/transfers/${settlementId}`);
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text }; }
  return { statusCode: response.status, ok: response.ok, settlement: response.ok ? normalizeSettlementForTrace(body) : null, raw: body };
}

export async function resolveGatewayBatchTx(settlementId, options = {}) {
  const pinned = getPinnedGatewayBatchTx(settlementId, options);
  if (pinned.batchTx) return pinned;
  return { batchTx: null, explorerUrl: null, status: 'not_found' };
}
