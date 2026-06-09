export const AGENT_STACK_VIDEO_SOURCE = {
  title: 'Circle Agent Stack Quickstart - financial infrastructure for the agentic economy',
  url: 'https://community.arc.io/public/clubs/agentic-economy-dofua/videos/introducing-circle-agent-stack-quickstart',
  wistiaUrl: 'https://circle-com.wistia.com/medias/19vl7tjexu',
};

export function buildAgentStackQuickstartModel() {
  return {
    source: AGENT_STACK_VIDEO_SOURCE,
    thesis: 'Circle Agent Stack gives agents controlled USDC wallets, marketplace discovery, CLI orchestration, and gasless/nano USDC payments through Circle Gateway.',
    components: [
      {
        name: 'Agent Wallets',
        role: 'Let an agent hold and move USDC autonomously inside predefined policies instead of relying on human-custodied wallets.',
        dealarMapping: 'Dealar agent wallet policy controls daily spend, per-request spend, and recipient allowlists before paid API calls.',
      },
      {
        name: 'Gateway Balance',
        role: 'Funds used for gasless Gateway payments and nanopayments, separate from the regular wallet balance that initially receives USDC.',
        dealarMapping: 'Gateway mode should display both buyer wallet funding and gateway payment readiness before real paid calls.',
      },
      {
        name: 'Agent Marketplace',
        role: 'A service directory where agents discover paid endpoints by intent, evaluate price/rail, and buy results.',
        dealarMapping: 'Dealar should present its paid endpoints as marketplace-ready services with price, category, rail, and receipt metadata.',
      },
      {
        name: 'Circle CLI',
        role: 'Repeatable command-line orchestration for wallet creation, login checks, balance checks, service search, and pay actions.',
        dealarMapping: 'Dealar JSON CLI and Hermes plugin mirror this pattern for agent-native service search and payment workflows.',
      },
      {
        name: 'Receipts',
        role: 'After payment, the agent receives the purchased result plus a receipt describing what happened.',
        dealarMapping: 'Dealar should persist settlement id, amount, endpoint, rail, timestamp, buyer/seller, and result summary.',
      },
    ],
    buyerWorkflow: [
      'Open agents.circle.com and copy the “give USDC to your agent” prompt into an AI coding assistant.',
      'Assistant checks whether Circle CLI is installed and whether the user is logged in.',
      'Assistant creates or locates an agent wallet, defaulting to Base in the demo flow.',
      'User funds the agent wallet with USDC via fiat deposit or existing wallet transfer.',
      'Assistant checks wallet balance, then checks/funds the associated Gateway balance.',
      'Agent searches Agent Marketplace for paid endpoints by intent, such as ETH price.',
      'Agent verifies endpoint price and supported rail, then pays through Circle Gateway for a gasless/nano USDC payment.',
      'Endpoint returns the purchased result and a receipt.',
    ],
    sellerWorkflow: [
      'Expose a useful API endpoint as a paid service.',
      'List the service with category, price, payment rail, endpoint description, and contact/demo information.',
      'Return receipts so buyers can verify settlement and understand what was purchased.',
    ],
    implicationsForDealar: [
      'Add marketplace-style service metadata for every paid endpoint.',
      'Show wallet balance versus Gateway balance readiness in docs/dashboard.',
      'Treat receipts as a product feature, not just debug metadata.',
      'Position Dealar as a seller-side storefront for agent-purchased deal intelligence.',
      'Keep CLI/Hermes workflows deterministic so coding agents can execute them safely.',
    ],
  };
}
