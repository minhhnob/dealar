export const LOOM_REFERENCE_SOURCE = {
  homepage: 'https://loomonarc.xyz/',
  apiDocs: 'https://loomonarc.xyz/docs/api',
  x402Docs: 'https://loomonarc.xyz/docs/x402',
  contractsDocs: 'https://loomonarc.xyz/docs/contracts',
  checkedAt: '2026-06-08',
};

export const LOOM_CONTRACTS = {
  rpcUrl: 'https://rpc.testnet.arc.network',
  agentNft: '0xB00A91b65dAa370b837BD071B1374baE3746F52d',
  collectionFactory: '0x4Ba7Fe866930E7016793874EC7bE579D42CaAE34',
  marketplace: '0xE4123c2d72E79CEbEe3452546c9F2b772fCBeBb4',
  commissions: '0xD9fFA64efb2EE280939F4b3a083aa30a746d560f',
  reputation: '0x089b8BdCFC82Fb3c47b93592373531DCF9Dd35E7',
};

export function buildLoomReferenceModel() {
  return {
    source: LOOM_REFERENCE_SOURCE,
    thesis: 'Loom gives AI agents verifiable onchain identity, marketplace access, commissions, reputation, and x402/USDC payment flows on Arc Testnet.',
    contracts: LOOM_CONTRACTS,
    primitives: [
      {
        name: 'Agent Identity NFT',
        loomPath: '/docs/agent',
        contract: LOOM_CONTRACTS.agentNft,
        dealarMapping: 'Register Dealar/Dealer as an onchain agent with name, tags, and avatar/metadata URI.',
      },
      {
        name: 'Marketplace Listings',
        loomPath: '/docs/marketplace',
        contract: LOOM_CONTRACTS.marketplace,
        dealarMapping: 'Represent Dealar paid endpoints as discoverable services with price, rail, input schema, output summary, and receipt fields.',
      },
      {
        name: 'Collections',
        loomPath: '/docs/collections',
        contract: LOOM_CONTRACTS.collectionFactory,
        dealarMapping: 'Future: mint proofs/receipts or service-access NFTs for Dealar API packages.',
      },
      {
        name: 'Commissions',
        loomPath: '/docs/commissions',
        contract: LOOM_CONTRACTS.commissions,
        dealarMapping: 'Future: accept custom research bounties with USDC escrow and encrypted deliverables.',
      },
      {
        name: 'Reputation',
        loomPath: '/docs/reputation',
        contract: LOOM_CONTRACTS.reputation,
        dealarMapping: 'Track completed paid requests, weighted quality, and fees paid as trust signals for agents.',
      },
      {
        name: 'x402 Payments',
        loomPath: '/docs/x402',
        contract: null,
        dealarMapping: 'Keep Dealar endpoints HTTP 402/x402-compatible: no API key, wallet pays, retry unlocks response, receipt returned.',
      },
    ],
    readApis: [
      'GET /collections',
      'GET /collections/:addr',
      'GET /marketplace/listings',
      'GET /agent/:address',
      'Reputation.getRating(address)',
    ],
    writeActions: [
      'registerAgent(name,tags,avatarURI)',
      'createCollection(name,symbol,baseURI,royaltyBps,royaltyReceiver,maxSupply)',
      'mint()',
      'marketplace.list(collection,tokenId,price)',
      'marketplace.buy(listingId)',
      'createCommission(title,description,publicKey)',
      'submit(jobId,encryptedDeliverable)',
      'pickWinner(jobId,submissionId)',
      'rateWinner(jobId,rating)',
    ],
    delearRoadmap: [
      'Expose /v1/agent-card with identity, capabilities, service catalog, payment rails, and Telegram check instructions.',
      'Add /v1/check returning Telegram-friendly production health, services, receipts, revenue, and dashboard URL.',
      'Add Loom readiness metadata: Arc RPC, AgentNFT registration target, service tags, avatar/metadata URI checklist.',
      'Later: register Dealar agent NFT on Loom when wallet/private-key/funding are available.',
      'Later: publish Dealar service/access collection or commission workflow for custom deal research bounties.',
    ],
  };
}
