     1|     1|# Dealar API
     2|     2|
     3|     3|USDC-paywalled deal intelligence API MVP for AI agents.
     4|     4|
     5|     5|Dealar demonstrates the model from x402/MPP examples: an agent calls an HTTP endpoint, receives `402 Payment Required`, pays USDC through x402/MPP-compatible rails, retries with payment proof, then receives shopping intelligence.
     6|     6|
     7|     7|## Why agent builders need this
     8|     8|
     9|     9|Agents increasingly need paid data at request time: deals, coupons, merchant intelligence, checkout context, and retail signals. Dealar packages that into a small API + agent tooling stack:
    10|    10|
    11|    11|- **Paid API:** x402-ready HTTP endpoints for deal intelligence.
    12|    12|- **Buyer client:** `402 → pay → retry` flow for agents.
    13|    13|- **Wallet policy:** Circle Agent Wallet-style budget and allowlist controls.
    14|    14|- **Dashboard:** visual demo for API revenue, wallet controls, and reports.
    15|    15|- **Agent runtime bridge:** JSON CLI and Hermes plugin scaffold, following the Arc App Kit plugin pattern.
    16|    16|
    17|    17|## Tool groups
    18|    18|
    19|    19|- **Deal Intelligence:** `deal.search`, `dealar_search_deals`
    20|    20|- **Retailer Intelligence:** `retailers.list`, `dealar_list_retailers`
    21|    21|- **Coupon Verification:** `coupon.verify`, `dealar_verify_coupon`
    22|    22|- **Wallet Policy:** `wallet.policy`, `dealar_wallet_policy`
    23|    23|- **Dashboard Summary:** `dashboard.summary`, `dealar_dashboard_summary`
    24|    24|
    25|    25|## Repository layout
    26|    26|
    27|    27|```text
    28|    28|dealar-api/
    29|    29|├── bin/
    30|    30|│   ├── dealar-cli.js              # JSON-in / JSON-out bridge for agents
    31|    31|│   ├── dealar-buyer.js            # x402 buyer demo client
    32|    32|│   └── dealar-agent-wallet.js     # wallet-policy demo agent
    33|    33|├── hermes-plugin/dealar/          # Hermes plugin scaffold
    34|    34|├── src/
    35|    35|│   ├── deal-intelligence.js       # core data/search/coupon logic
    36|    36|│   ├── x402-config.js             # x402 route config
    37|    37|│   ├── buyer-client.js            # paid fetch wrapper
    38|    38|│   ├── agent-wallet-policy.js     # Circle-style policy controls
    39|    39|│   ├── cli-actions.js             # generic CLI action dispatcher
    40|    40|│   ├── dashboard.js               # dashboard view model + HTML
    41|    41|│   └── server.js                  # Express API + dashboard
    42|    42|└── test/                          # Node test suite
    43|    43|```
    44|    44|
    45|    45|> Current local path is `/root/prodeal-api`; rename to `/root/dealar-api` when convenient.
    46|    46|
    47|    47|## What is included
    48|    48|
    49|    49|- `GET /health` — service health check.
    50|    50|- `GET /v1/payments/challenge` — local fallback payment challenge.
    51|    51|- `GET /v1/deals/search?query=whoop&regions=us,eu` — WHOOP deal intelligence.
    52|    52|- `GET /v1/retailers?category=beauty&markets=us,eu` — curated US/EU beauty retailer database.
    53|    53|- `POST /v1/coupons/verify` — curated coupon verification.
    54|    54|- `GET /dashboard` — built-in demo dashboard.
    55|    55|
    56|    56|## Payment modes
    57|    57|
    58|    58|### Demo mode
    59|    59|
    60|    60|Demo mode uses a mock payment header so the product API can be tested without a wallet:
    61|    61|
    62|    62|```bash
    63|    63|cd /root/prodeal-api
    64|    64|DEALAR_PAYMENT_MODE=demo npm start
    65|    65|```
    66|    66|
    67|    67|Protected endpoints require:
    68|    68|
    69|    69|```bash
    70|    70|-H 'x-dealar-paid: demo'
    71|    71|```
    72|    72|
    73|    73|### x402 mode
    74|    74|
    75|    75|x402 mode uses the official x402 middleware packages:
    76|    76|
    77|    77|- `@x402/express`
    78|    78|- `@x402/core`
    79|    79|- `@x402/evm`
    80|    80|
    81|    81|Start with a real receiving EVM wallet address:
    82|    82|
    83|    83|```bash
    84|    84|cd /root/prodeal-api
    85|    85|export DEALAR_PAYMENT_MODE=x402
    86|    86|export DEALAR_EVM_ADDRESS='0xYOUR_RECEIVING_WALLET'
    87|    87|export X402_FACILITATOR_URL='https://x402.org/facilitator'
    88|    88|export X402_NETWORK='eip155:84532' # Base Sepolia
    89|    89|npm start
    90|    90|```
    91|    91|
    92|    92|Protected routes are configured as exact-payment x402 resources:
    93|    93|
    94|    94|- `GET /v1/deals/search` — `$0.25` USDC
    95|    95|- `GET /v1/retailers` — `$0.05` USDC
    96|    96|- `POST /v1/coupons/verify` — `$0.01` USDC
    97|    97|
    98|    98|For production, switch `X402_NETWORK` and facilitator settings to the desired mainnet and keep the receiving wallet address in the deployment environment, not source code.
    99|    99|
   100|   100|
   101|   101|### Circle Gateway mode on Arc Testnet
   102|   102|
   103|   103|Gateway mode follows the Canteen `circle-agent` reference and uses Circle Gateway batching on Arc Testnet.
   104|   104|
   105|   105|```bash
   106|   106|cd /root/prodeal-api
   107|   107|export DEALAR_PAYMENT_MODE=gateway
   108|   108|export DEALAR_EVM_ADDRESS='0xYOUR_RECEIVING_WALLET'
   109|   109|export DEALAR_GATEWAY_API='https://gateway-api-testnet.circle.com'
   110|   110|export DEALAR_GATEWAY_NETWORK='eip155:5042002'
   111|   111|export DEALAR_GATEWAY_CHAIN='arcTestnet'
   112|   112|npm start
   113|   113|```
   114|   114|
   115|   115|Gateway-protected route prices:
   116|   116|
   117|   117|- `GET /v1/deals/search` — `$0.25` USDC
   118|   118|- `GET /v1/retailers` — `$0.05` USDC
   119|   119|- `POST /v1/coupons/verify` — `$0.01` USDC
   120|   120|
   121|   121|Payment trace endpoints:
   122|   122|
   123|   123|```text
   124|   124|GET /v1/payments/trace/:settlementId
   125|   125|GET /v1/payments/settlements/:settlementId
   126|   126|GET /v1/payments/batch-tx/:settlementId
   127|   127|```
   128|   128|
   129|   129|The trace model follows Canteen's six-step lifecycle: EIP-712 signature, facilitator settle, settlement queued, relayer batch, on-chain `submitBatch`, completed settlement.
   130|   130|
   131|   131|## Run
   132|   132|
   133|   133|```bash
   134|   134|cd /root/prodeal-api
   135|   135|npm test
   136|   136|DEALAR_PAYMENT_MODE=demo npm start
   137|   137|```
   138|   138|
   139|   139|## Smoke tests in demo mode
   140|   140|
   141|   141|```bash
   142|   142|curl -s 'http://127.0.0.1:8787/health'
   143|   143|
   144|   144|# Unpaid request returns 402 challenge
   145|   145|curl -s 'http://127.0.0.1:8787/v1/deals/search?query=whoop&regions=us,eu'
   146|   146|
   147|   147|# Paid/demo request returns unlocked data
   148|   148|curl -s -H 'x-dealar-paid: demo' \
   149|   149|  'http://127.0.0.1:8787/v1/deals/search?query=whoop&regions=us,eu'
   150|   150|
   151|   151|curl -s -H 'x-dealar-paid: demo' \
   152|   152|  'http://127.0.0.1:8787/v1/retailers?category=beauty&markets=us,eu'
   153|   153|
   154|   154|curl -s -X POST -H 'Content-Type: application/json' -H 'x-dealar-paid: demo' \
   155|   155|  -d '{"merchant":"lookfantastic","code":"WELCOME20","region":"uk"}' \
   156|   156|  'http://127.0.0.1:8787/v1/coupons/verify'
   157|   157|```
   158|   158|
   159|   159|## Generic CLI bridge
   160|   160|
   161|   161|Following the Arc App Kit plugin repo pattern, Dealar includes a generic JSON-in / JSON-out CLI bridge for agents and plugin runtimes.
   162|   162|
   163|   163|```bash
   164|   164|cd /root/prodeal-api
   165|   165|npm run cli -- '{"action":"deal.search","params":{"query":"whoop","regions":["us","eu"]}}'
   166|   166|```
   167|   167|
   168|   168|Output shape:
   169|   169|
   170|   170|```json
   171|   171|{"ok":true,"result":{}}
   172|   172|```
   173|   173|
   174|   174|Supported actions:
   175|   175|
   176|   176|- `deal.search`
   177|   177|- `retailers.list`
   178|   178|- `coupon.verify`
   179|   179|- `wallet.policy`
   180|   180|- `dashboard.summary`
   181|   181|
   182|   182|Examples:
   183|   183|
   184|   184|```bash
   185|   185|npm run cli -- '{"action":"retailers.list","params":{"category":"beauty","markets":["us","eu"]}}'
   186|   186|
   187|   187|npm run cli -- '{"action":"coupon.verify","params":{"merchant":"lookfantastic","code":"WELCOME20","region":"uk"}}'
   188|   188|
   189|   189|npm run cli -- '{"action":"dashboard.summary","params":{"apiBaseUrl":"http://127.0.0.1:8787"}}'
   190|   190|```
   191|   191|
   192|   192|## Hermes plugin scaffold
   193|   193|
   194|   194|Dealar includes a Hermes plugin scaffold at:
   195|   195|
   196|   196|```text
   197|   197|hermes-plugin/dealar/
   198|   198|```
   199|   199|
   200|   200|Tools exposed:
   201|   201|
   202|   202|- `dealar_search_deals`
   203|   203|- `dealar_list_retailers`
   204|   204|- `dealar_verify_coupon`
   205|   205|- `dealar_wallet_policy`
   206|   206|- `dealar_dashboard_summary`
   207|   207|
   208|   208|The Python plugin follows the Arc sample pattern: Hermes tools call the Node CLI bridge via subprocess, so the core Dealar logic stays in one Node implementation.
   209|   209|
   210|   210|Local install sketch:
   211|   211|
   212|   212|```bash
   213|   213|cd /root/prodeal-api/hermes-plugin/dealar
   214|   214|pip install -e .
   215|   215|```
   216|   216|
   217|   217|If the plugin is copied elsewhere, point it back to this repo:
   218|   218|
   219|   219|```bash
   220|   220|export DEALAR_REPO_ROOT=/root/prodeal-api
   221|   221|```
   222|   222|
   223|   223|## Buyer demo client
   224|   224|
   225|   225|The repo includes a buyer-side client wrapper that can call Dealar endpoints in either demo mode or real x402 mode.
   226|   226|
   227|   227|### Demo buyer flow
   228|   228|
   229|   229|```bash
   230|   230|# terminal 1
   231|   231|cd /root/prodeal-api
   232|   232|DEALAR_PAYMENT_MODE=demo npm start
   233|   233|
   234|   234|# terminal 2
   235|   235|cd /root/prodeal-api
   236|   236|npm run buyer:deal-search -- \
   237|   237|  --mode demo \
   238|   238|  --base-url http://127.0.0.1:8787 \
   239|   239|  --query whoop \
   240|   240|  --regions us,eu
   241|   241|```
   242|   242|
   243|   243|### x402 buyer flow
   244|   244|
   245|   245|Run the server in x402 mode with a receiving wallet:
   246|   246|
   247|   247|```bash
   248|   248|export DEALAR_PAYMENT_MODE=x402
   249|   249|export DEALAR_EVM_ADDRESS='0xYOUR_RECEIVING_WALLET'
   250|   250|npm start
   251|   251|```
   252|   252|
   253|   253|Then run the buyer with a funded buyer private key:
   254|   254|
   255|   255|```bash
   256|   256|export DEALAR_BUYER_EVM_PRIVATE_KEY='0xYOUR_BUYER_PRIVATE_KEY'
   257|   257|npm run buyer:deal-search -- \
   258|   258|  --mode x402 \
   259|   259|  --base-url http://127.0.0.1:8787 \
   260|   260|  --query whoop \
   261|   261|  --regions us,eu
   262|   262|```
   263|   263|
   264|   264|### Circle Gateway buyer flow
   265|   265|
   266|   266|With Gateway mode server running, use a funded Arc Testnet buyer key:
   267|   267|
   268|   268|```bash
   269|   269|export DEALAR_BUYER_EVM_PRIVATE_KEY='0xYOUR_BUYER_PRIVATE_KEY'
   270|   270|npm run buyer:deal-search -- \
   271|   271|  --mode gateway \
   272|   272|  --base-url http://127.0.0.1:8787 \
   273|   273|  --query whoop \
   274|   274|  --regions us,eu
   275|   275|```
   276|   276|
   277|   277|Gateway buyer uses `@circle-fin/x402-batching/client` and `GatewayClient({ chain: "arcTestnet", privateKey })`.
   278|   278|
   279|   279|The x402 buyer uses:
   280|   280|
   281|   281|- `@x402/fetch`
   282|   282|- `@x402/evm/exact/client`
   283|   283|- `viem/accounts`
   284|   284|
   285|   285|It wraps `fetch`, handles the x402 payment flow, and prints the unlocked JSON response plus any `PAYMENT-RESPONSE` receipt header.
   286|   286|
   287|   287|## Agent wallet policy demo
   288|   288|
   289|   289|The repo includes a Circle Agent Wallet-style policy wrapper. It does not expose keys or custody funds itself; it models the controls Circle Agent Wallets/Gateway should enforce before an agent pays:
   290|   290|
   291|   291|- daily USDC limit
   292|   292|- per-request USDC limit
   293|   293|- allowlisted API base URLs
   294|   294|- x402-payment-only policy
   295|   295|- local spend ledger and wallet summary
   296|   296|
   297|   297|Run in demo mode:
   298|   298|
   299|   299|```bash
   300|   300|# terminal 1
   301|   301|cd /root/prodeal-api
   302|   302|DEALAR_PAYMENT_MODE=demo npm start
   303|   303|
   304|   304|# terminal 2
   305|   305|cd /root/prodeal-api
   306|   306|npm run agent:deal-search -- \
   307|   307|  --mode demo \
   308|   308|  --base-url http://127.0.0.1:8787 \
   309|   309|  --query whoop \
   310|   310|  --regions us,eu \
   311|   311|  --daily-limit 1.00 \
   312|   312|  --per-request-limit 0.25 \
   313|   313|  --price 0.25
   314|   314|```
   315|   315|
   316|   316|The output includes the wallet policy, allow/deny decision, spend entry, remaining budget, and unlocked Dealar response.
   317|   317|
   318|   318|For real x402 mode, combine it with the buyer env vars:
   319|   319|
   320|   320|```bash
   321|   321|export DEALAR_PAYMENT_MODE=x402
   322|   322|export DEALAR_BUYER_EVM_PRIVATE_KEY='0xYOUR_BUYER_PRIVATE_KEY'
   323|   323|export DEALAR_AGENT_DAILY_LIMIT_USDC='1.00'
   324|   324|export DEALAR_AGENT_PER_REQUEST_LIMIT_USDC='0.25'
   325|   325|export DEALAR_AGENT_ALLOWLIST='https://your-dealar-api.example.com'
   326|   326|```
   327|   327|
   328|   328|Circle/Gateway production notes:
   329|   329|
   330|   330|- Circle Agent Wallets are user-custody and policy-controlled.
   331|   331|- Gateway nanopayments support gasless, small USDC payments for x402-compatible APIs.
   332|   332|- Keep private keys in `.env`/secure secrets, never in source code or shell history.
   333|   333|- Use a funded EOA wallet for Gateway nanopayments; smart contract wallets are not supported for Gateway payment signatures.
   334|   334|
   335|   335|
   336|   336|
   337|   337|
   338|   338|## Dealer Deal Scout MVP
   339|   339|
   340|   340|Dealer now behaves as a deal-hunting agent for Telegram and API clients. It compares demo intelligence across Amazon, eBay, Sephora, and Slickdeals for cheap prices, sale signals, voucher/coupon codes, seller/source risk, and product quote summaries.
   341|   341|
   342|   342|Endpoints:
   343|   343|
   344|   344|```text
   345|   345|GET /v1/dealer/sources
   346|   346|GET /v1/dealer/search?query=Dior%20Sauvage&sources=amazon,ebay,sephora,slickdeals
   347|   347|GET /v1/dealer/quote?query=Dyson%20Airwrap
   348|   348|GET /v1/dealer/coupons?query=sephora%20skincare&source=sephora
   349|   349|```
   350|   350|
   351|   351|CLI actions:
   352|   352|
   353|   353|```bash
   354|   354|node bin/dealar-cli.js '{"action":"dealer.search","params":{"query":"Dior Sauvage"}}'
   355|   355|node bin/dealar-cli.js '{"action":"dealer.quote","params":{"query":"Dyson Airwrap"}}'
   356|   356|node bin/dealar-cli.js '{"action":"dealer.coupons","params":{"query":"sephora skincare","source":"sephora"}}'
   357|   357|node bin/dealar-cli.js '{"action":"dealer.telegram","params":{"query":"iPhone 15 Pro Max"}}'
   358|   358|```
   359|   359|
   360|   360|Telegram-style user commands:
   361|   361|
   362|   362|```text
   363|   363|check deal Dior Sauvage
   364|   364|check giá iPhone 15 Pro Max
   365|   365|tìm voucher Sephora skincare
   366|   366|so sánh giá Dyson Airwrap amazon ebay sephora
   367|   367|```
   368|   368|
   369|   369|The current MVP uses deterministic demo adapters. Live adapters can later be connected to Amazon search/Rainforest/SerpAPI, eBay Browse API, Sephora search, and Slickdeals search/RSS.
   370|   370|
   371|   371|## Marketplace service catalog and receipt ledger
   372|   372|
   373|   373|Dealar now exposes its paid API endpoints as marketplace-ready services:
   374|   374|
   375|   375|```text
   376|   376|GET /v1/services
   377|   377|```
   378|   378|
   379|   379|Each service includes:
   380|   380|
   381|   381|- service id and display name
   382|   382|- category
   383|   383|- HTTP method/path
   384|   384|- USDC price and micro-USDC amount
   385|   385|- payment rail: `circle_gateway_x402`
   386|   386|- supported networks
   387|   387|- input schema
   388|   388|- output summary
   389|   389|- receipt fields
   390|   390|
   391|   391|Receipt ledger endpoints:
   392|   392|
   393|   393|```text
   394|   394|GET /v1/payments/receipts
   395|   395|GET /v1/payments/receipts/:id
   396|   396|```
   397|   397|
   398|   398|Receipt objects include:
   399|   399|
   400|   400|- receipt id
   401|   401|- status
   402|   402|- service id/name
   403|   403|- endpoint
   404|   404|- amount in USDC and micro-USDC
   405|   405|- payment rail
   406|   406|- settlement id
   407|   407|- buyer and seller
   408|   408|- timestamp
   409|   409|- result summary
   410|   410|
   411|   411|CLI actions:
   412|   412|
   413|   413|```bash
   414|   414|node bin/dealar-cli.js '{"action":"services.list","params":{}}'
   415|   415|node bin/dealar-cli.js '{"action":"receipts.list","params":{}}'
   416|   416|node bin/dealar-cli.js '{"action":"receipts.get","params":{"id":"rcpt_..."}}'
   417|   417|```
   418|   418|
   419|   419|The dashboard also shows a Marketplace Service Catalog panel and Receipt Ledger panel.
   420|   420|
   421|   421|## Circle Agent Stack quickstart notes
   422|   422|
   423|   423|Reference video:
   424|   424|
   425|   425|```text
   426|   426|https://community.arc.io/public/clubs/agentic-economy-dofua/videos/introducing-circle-agent-stack-quickstart
   427|   427|```
   428|   428|
   429|   429|Key takeaways for Dealar:
   430|   430|
   431|   431|- **Agent Wallets**: agents should hold and move USDC only inside predefined policies. Dealar maps this to daily limits, per-request limits, and recipient allowlists.
   432|   432|- **Gateway Balance**: the buyer flow distinguishes regular agent wallet USDC from Gateway balance used for gasless/nano payments. Dealar should show both readiness checks before real paid calls.
   433|   433|- **Agent Marketplace**: agents discover paid endpoints by intent, evaluate price/payment rail, then buy results. Dealar's paid endpoints should be marketplace-ready services with category, price, rail, and descriptions.
   434|   434|- **Circle CLI**: the demo uses CLI-driven orchestration for install/login checks, wallet creation, balance checks, service search, and pay actions. Dealar mirrors this with its JSON CLI bridge and Hermes plugin.
   435|   435|- **Receipts**: successful purchases return the result plus a receipt. Dealar should persist receipt fields including settlement id, amount, endpoint, rail, buyer/seller, timestamp, and result summary.
   436|   436|
   437|   437|Buyer-side checklist from the video:
   438|   438|
   439|   439|1. Copy the “give USDC to your agent” prompt from `agents.circle.com` into the AI coding assistant.
   440|   440|2. Assistant checks Circle CLI install/login status.
   441|   441|3. Assistant creates or locates an agent wallet.
   442|   442|4. User funds the wallet with USDC by fiat deposit or existing wallet transfer.
   443|   443|5. Assistant checks wallet balance and Gateway balance.
   444|   444|6. Agent searches Agent Marketplace for a paid service by intent.
   445|   445|7. Agent confirms price and rail, then pays via Circle Gateway.
   446|   446|8. Service returns the purchased result plus receipt.
   447|   447|
   448|   448|Seller-side implication for Dealar: present `/v1/deals/search`, `/v1/retailers`, and `/v1/coupons/verify` as marketplace-style services, not just raw API routes.
   449|   449|
   450|   450|## Dashboard
   451|   451|
   452|   452|Dealar includes a lightweight built-in dashboard at:
   453|   453|
   454|   454|```text
   455|   455|http://127.0.0.1:8787/dashboard
   456|   456|```
   457|   457|
   458|   458|Run it:
   459|   459|
   460|   460|```bash
   461|   461|cd /root/prodeal-api
   462|   462|DEALAR_PAYMENT_MODE=demo npm start
   463|   463|```
   464|   464|
   465|   465|The root path `/` redirects to `/dashboard`.
   466|   466|
   467|   467|Dashboard sections:
   468|   468|
   469|   469|- Paid endpoints and USDC prices
   470|   470|- Payment flow: request → 402 → policy check → x402 payment → unlock
   471|   471|- Wallet policy controls
   472|   472|- Mock API revenue and request logs
   473|   473|- WHOOP deal intelligence preview
   474|   474|- US/EU retail intelligence preview
   475|   475|- Agent Runtime Integration: CLI bridge, Hermes plugin, buyer client, wallet policy
   476|   476|
   477|   477|## Next integrations
   478|   478|
   479|   479|1. Add persistent request/payment ledger behind the dashboard.
   480|   480|2. Add real Circle Gateway nanopayment client path with `@circle-fin/x402-batching`.
   481|   481|3. Add live deal/coupon connectors and timestamped evidence.
   482|   482|4. Promote `hermes-plugin/dealar` into an installable Hermes plugin package.
   483|   483|5. Rename the project directory from `/root/prodeal-api` to `/root/dealar-api` if desired.
   484|   484|
   485|
   486|
## Dealer corrected product target

Dealer is an original AI Deal Scout Agent, not a one-to-one implementation of any reference project.

References used for learning:

```text
Loom on Arc: agent identity, reputation, marketplace/discovery principles
Conduit Pay / ace-coderr/conduit: paid-resource, x402, receipt, shareable-request principles
Circle Agent Stack: buyer-agent workflow and spending-policy principles
```

Dealer-native product language:

```text
Deal Request Ticket  -> shareable user shopping request
Scout Report         -> Dealer's enriched deal intelligence output
Dealer Capability Card -> machine-readable discovery metadata for agents
Deal Receipt         -> result/payment/history record
Voucher Scan         -> coupon and price-drop evidence
Trust Score          -> risk-adjusted confidence for buying advice
Source Mix           -> Amazon/eBay/Sephora/Slickdeals sources consulted
Price Watch Alert    -> future scheduled drop/voucher alert
```

Primary Dealer endpoints:

```text
GET  /v1/scout/capabilities
GET  /v1/scout/report?query=Dyson%20Airwrap
POST /v1/scout/tickets
GET  /v1/scout/receipts?query=Dior%20Sauvage
```

Legacy/transitional endpoints under `/v1/dealer/*` remain available for compatibility, but the product target is now the Dealer-native Scout model above.

Protocol compatibility:

- x402 / USDC / Arc details are kept only where useful for future paid Scout Report unlocks.
- Reference product names and UI flows should not drive Dealer naming or UX.

## Dealer Conduit-style paid products
   487|
   488|Reference implementation studied:
   489|
   490|```text
   491|https://github.com/ace-coderr/conduit
   492|https://conduit-pay.vercel.app/
   493|```
   494|
   495|Dealer now exposes Conduit-style payment products and marketplace metadata while production remains in demo payment mode:
   496|
   497|```text
   498|GET  /v1/dealer/payment-products
   499|GET  /v1/dealer/deep-report?query=Dyson%20Airwrap
   500|GET  /v1/dealer/payment-links
   501|POST /v1/dealer/payment-links
   502|GET  /v1/dealer/marketplace-listing
   503|```
   504|
   505|Paid product targets:
   506|
   507|```text
   508|Quick Deal Check      /v1/dealer/search       0.001 USDC
   509|Product Quote         /v1/dealer/quote        0.001 USDC
   510|Voucher Check         /v1/dealer/coupons      0.001 USDC
   511|Deep Deal Report      /v1/dealer/deep-report  0.005 USDC
   512|```
   513|
   514|The deep report currently returns directly in `demo_conduit_ready` mode and includes:
   515|
   516|- ranked Amazon/eBay/Sephora/Slickdeals deal search
   517|- product quote and safer option
   518|- voucher/coupon intelligence
   519|- Telegram-ready summary
   520|- Conduit/x402-ready payment metadata
   521|
   522|Future live-payment step:
   523|
   524|```text
   525|Port Conduit's x402 middleware pattern into Express, then require PAYMENT-SIGNATURE for /v1/dealer/deep-report before returning the report.
   526|```
   527|