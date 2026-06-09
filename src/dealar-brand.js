export function buildDealarLogoSvg({ size = 64, title = 'Dealar' } = {}) {
  const dimension = Number(size) || 64;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${dimension}" height="${dimension}" viewBox="0 0 64 64" role="img" aria-label="${title} logo">
  <rect width="64" height="64" rx="18" fill="#000000"/>
  <path d="M18 16h17.5c10 0 17.5 6.6 17.5 16s-7.5 16-17.5 16H18V16Z" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linejoin="round"/>
  <path d="M29 22v20" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>
  <path d="M38 21l8 8-8 8" fill="none" stroke="#CC6437" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="18" cy="48" r="3" fill="#CC6437"/>
</svg>`;
}

export function buildDealarBrandSystem() {
  return {
    name: 'Dealar',
    theme: 'Monochrome Deal Scout',
    thesis: 'Precision shopping intelligence on a dark, high-contrast canvas: sparse color, condensed typography, pill actions, and agent-readable deal artifacts.',
    references: [
      {
        name: 'Conduit Pay',
        learned: 'Clear paid-resource narrative, x402 readiness, payment/state confidence, and developer-facing proof points.',
        transformed: 'Dealar uses Deal Request Tickets, Scout Reports, Trust Scores, and Deal Receipts instead of generic payment links.',
      },
      {
        name: 'Ciridae DESIGN.md',
        learned: 'Monochrome grid, dark laboratory feel, condensed headings, mono technical copy, large pill buttons, and rare orange accent.',
        transformed: 'Dealar applies the vibe to a shopping-intelligence dashboard with source mix, voucher scan, and scout artifacts.',
      },
    ],
    colors: {
      black: '#000000',
      charcoal: '#0B0B0B',
      graphite: '#272A2A',
      white: '#FFFFFF',
      ash: '#CECECE',
      steel: '#858585',
      orange: '#CC6437',
    },
    typography: {
      display: 'Open Sans Condensed, Arial Narrow, Inter, sans-serif',
      body: 'Roboto Mono, ui-monospace, SFMono-Regular, Menlo, monospace',
    },
    logo: {
      concept: 'A bold D-shaped deal aperture with an orange scout arrow moving through the center; the dot marks a discovered deal signal.',
      svg: buildDealarLogoSvg({ size: 64 }),
    },
    productLanguage: ['Deal Request Ticket', 'Scout Report', 'Dealer Capability Card', 'Deal Receipt', 'Voucher Scan', 'Trust Score', 'Source Mix'],
  };
}
