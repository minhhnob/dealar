# Dealar

**AI Deal Scout Agent for cheap prices, sales, vouchers, product quotes, and paid Scout Reports.**

Dealar is an agent-facing deal intelligence API. It helps buyer agents and Telegram workflows search retail sources, compare prices, scan vouchers, score trust, and optionally unlock deeper reports through demo/x402/Circle Gateway-compatible payment rails.

Production:

- Dashboard: https://prodeal-api.vercel.app/dashboard
- Agent Card: https://prodeal-api.vercel.app/v1/agent-card
- Scout Capabilities: https://prodeal-api.vercel.app/v1/scout/capabilities
- Skill Manifest: https://prodeal-api.vercel.app/v1/scout/skills
- Logo: https://prodeal-api.vercel.app/dealar-logo.svg

---

## What Dealar does

Dealar turns shopping requests into structured agent artifacts:

- **Deal Request Ticket** — captures a product query, target price, source preferences, urgency, and unlock/payment state.
- **Scout Report** — compares sources and returns best deal, safe deal, voucher scan, risk notes, and trust score.
- **Dealer Capability Card** — machine-readable metadata so other agents can discover Dealar’s scouting abilities.
- **Deal Receipt** — records the result, source mix, payment/unlock metadata, and recommendation summary.
- **Price Watch Alert** — planned scheduled monitoring for target prices and voucher signals.

Core sources currently modeled:

- Amazon
- eBay
- Sephora
- Slickdeals
- curated demo retailer/coupon intelligence

---

## Product identity

Dealar is not a generic payment demo. It is a shopping intelligence agent.

Reference projects were used only as learning sources:

- Conduit Pay → paid resource clarity and x402-style payment flow
- Circle Skills → narrow agent skill manifests and payment safety guardrails
- Ciridae DESIGN.md → monochrome UI direction, sparse orange accent, technical layout language

Dealar’s own product language remains:

```text
Deal Request Ticket
Scout Report
Dealer Capability Card
Deal Receipt
Voucher Scan
Trust Score
Source Mix
Price Watch Alert
```

---

## Design direction

Theme:

```text
Monochrome Deal Scout
```

Visual system:

- black/white-first interface
- sparse orange accent: `#CC6437`
- condensed headings
- mono technical copy
- high-contrast cards and grid layout
- pill-style CTAs
- D-shaped Dealar logo with scout arrow and deal signal dot

Logo:

```text
GET /dealar-logo.svg
```

---

## Quick start

```bash
git clone https://github.com/minhhnob/dealar.git
cd dealar
npm install
npm test
npm start
```

Local server defaults to:

```text
http://127.0.0.1:8787
```

Open:

```text
http://127.0.0.1:8787/dashboard
```

---

## Environment variables

Common:

```bash
export PORT=8787
export DEALAR_API_BASE_URL='http://127.0.0.1:8787'
export DEALAR_PAYMENT_MODE=demo
```

Payment modes:

```text
demo      local demo unlock with x-dealar-paid: demo
x402      x402 exact-payment middleware mode
gateway   Circle Gateway / Arc Testnet-oriented configuration
```

x402 mode:

```bash
export DEALAR_PAYMENT_MODE=x402
export DEALAR_EVM_ADDRESS='0xYOUR_RECEIVING_WALLET'
export X402_FACILITATOR_URL='https://conduitpay.xyz/api/x402'
export X402_NETWORK='eip155:5042002'
npm start
```

Gateway mode:

```bash
export DEALAR_PAYMENT_MODE=gateway
export DEALAR_EVM_ADDRESS='0xYOUR_RECEIVING_WALLET'
export DEALAR_GATEWAY_API='https://gateway-api-testnet.circle.com'
export DEALAR_GATEWAY_NETWORK='eip155:5042002'
export DEALAR_GATEWAY_CHAIN='arcTestnet'
npm start
```

Keep real wallet addresses, keys, and deployment secrets outside source code.

---

## Main API routes

Health and product surfaces:

```text
GET  /health
GET  /dashboard
GET  /dealar-logo.svg
GET  /v1/agent-card
GET  /v1/check
```

Scout-native routes:

```text
GET  /v1/scout/capabilities
GET  /v1/scout/skills
GET  /v1/scout/report?query=Dyson%20Airwrap
POST /v1/scout/tickets
GET  /v1/scout/receipts?query=Dior%20Sauvage
```

Dealer intelligence routes:

```text
GET  /v1/dealer/search?query=whoop&regions=us,eu
GET  /v1/dealer/quote?query=Dyson%20Airwrap
GET  /v1/dealer/coupons?query=Sephora
GET  /v1/dealer/deep-report?query=whoop
```

Payment and marketplace routes:

```text
GET  /v1/payments/challenge
GET  /v1/payments/receipts
GET  /v1/services
GET  /v1/dealer/payment-products
GET  /v1/dealer/marketplace-listing
```

Gateway trace routes:

```text
GET  /v1/gateway/trace
GET  /v1/gateway/settlement/:batchTx
```

---

## Demo payment unlock

In demo mode, protected resources can be unlocked with:

```bash
curl 'http://127.0.0.1:8787/v1/dealer/deep-report?query=whoop' \
  -H 'x-dealar-paid: demo'
```

Without payment proof, protected routes return a payment challenge / `402 Payment Required` style response.

---

## Example: create a Deal Request Ticket

```bash
curl -X POST 'http://127.0.0.1:8787/v1/scout/tickets' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "Dyson Airwrap",
    "targetPrice": "350 USD",
    "capabilityId": "scout.report",
    "sourcePreferences": ["Amazon", "eBay", "Slickdeals"],
    "urgency": "normal"
  }'
```

---

## Example: get a Scout Report

```bash
curl 'http://127.0.0.1:8787/v1/scout/report?query=Dyson%20Airwrap'
```

A Scout Report includes:

- query
- source mix
- best deal
- safe deal
- voucher intelligence
- risk notes
- trust score
- Telegram-ready summary

---

## Dealar Skill System

Dealar includes a skill manifest inspired by Circle’s public skill-catalog principles, translated into original shopping-intelligence workflows.

```text
GET /v1/scout/skills
```

Included skills:

```text
dealar.scout.ticket
dealar.scout.report
dealar.payment.policy
dealar.wallet.status
dealar.watch.alert
```

Safety guardrails:

```text
never auto-send USDC
never auto-change wallet limits
never auto-retry paid unlocks without user confirmation
separate read-only checks from value-moving actions
require receipt metadata for paid unlocks
```

---

## Agent Card

```text
GET /v1/agent-card
```

The agent card exposes:

- Dealar identity
- payment mode and rails
- marketplace services
- Dealer Capability Card
- Dealar Skill Manifest
- Telegram command hints
- Loom/Arc registration readiness metadata

---

## CLI bridge

Dealar includes a JSON-in / JSON-out CLI bridge for agent runtimes.

```bash
npm run cli -- '{"action":"deal.search","params":{"query":"whoop","regions":["us","eu"]}}'
```

Supported action groups:

```text
deal.search
retailers.list
coupon.verify
wallet.policy
dashboard.summary
```

---

## Buyer demos

Run the buyer demo:

```bash
npm run buyer:deal-search
```

Run the agent-wallet policy demo:

```bash
npm run agent:deal-search
```

These scripts demonstrate:

- `402 → pay → retry` style flow
- demo payment proof
- wallet policy checks
- allowlisted paid endpoint access

---

## Repository layout

```text
dealar/
├── api/                         # Vercel serverless entrypoint
├── bin/                         # CLI and buyer demo scripts
│   ├── dealar-cli.js
│   ├── dealar-buyer.js
│   └── dealar-agent-wallet.js
├── hermes-plugin/dealar/        # Hermes plugin scaffold
├── public/
│   └── dealar-logo.svg
├── src/
│   ├── agent-card.js
│   ├── dashboard.js
│   ├── dealar-brand.js
│   ├── dealar-skill-system.js
│   ├── dealer-native-product.js
│   ├── dealer-scout.js
│   ├── dealer-payment-products.js
│   ├── server.js
│   └── x402-config.js
├── test/                        # Node test suite
├── package.json
└── vercel.json
```

---

## Testing

```bash
npm test
```

Current expected suite:

```text
68 tests passing
0 failures
```

---

## Deployment

This repo is deployed on Vercel.

Production alias:

```text
https://prodeal-api.vercel.app
```

Manual deploy example:

```bash
npx vercel --prod
```

Verify production after deployment:

```bash
curl https://prodeal-api.vercel.app/health
curl https://prodeal-api.vercel.app/v1/scout/skills
curl https://prodeal-api.vercel.app/v1/agent-card
```

---

## Roadmap

Near-term:

- real retailer adapter integrations
- real coupon/voucher validation feeds
- persistent Deal Request Ticket storage
- Price Watch Alert scheduling
- Telegram bot command surface
- richer paid Scout Report unlock flow

Longer-term:

- agent-to-agent marketplace registration
- production x402 settlement
- Circle Gateway payment trace hardening
- wallet readiness UX
- trust/reputation scoring for sellers and sources
- public Dealar landing page

---

## Project status

Dealar is an MVP / demo-grade agent product surface. It is designed to prove the product loop:

```text
shopping request → deal scout → optional paid unlock → receipt → agent-readable result
```

The current implementation uses curated data and demo-compatible payment flows while keeping the product architecture ready for x402, Circle Gateway, and future real source integrations.
