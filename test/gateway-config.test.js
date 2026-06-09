import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildGatewayRoutePrices,
  getGatewayEnvironment,
  requireGatewaySellerAddress,
} from '../src/gateway-config.js';

test('getGatewayEnvironment defaults to Circle Gateway Arc Testnet settings when gateway mode enabled', () => {
  const env = getGatewayEnvironment({
    DEALAR_PAYMENT_MODE: 'gateway',
    DEALAR_EVM_ADDRESS: '0x933a2405f84c224be1ef373ba16e992e1f459682',
  });

  assert.equal(env.enabled, true);
  assert.equal(env.sellerAddress, '0x933a2405f84c224be1ef373ba16e992e1f459682');
  assert.equal(env.facilitatorUrl, 'https://gateway-api-testnet.circle.com');
  assert.equal(env.network, 'eip155:5042002');
  assert.equal(env.chain, 'arcTestnet');
});

test('requireGatewaySellerAddress rejects missing or placeholder seller addresses', () => {
  assert.throws(() => requireGatewaySellerAddress(undefined), /DEALAR_EVM_ADDRESS/);
  assert.throws(() => requireGatewaySellerAddress('0xYOUR_RECEIVING_WALLET'), /DEALAR_EVM_ADDRESS/);
  assert.equal(
    requireGatewaySellerAddress('0x933a2405f84c224be1ef373ba16e992e1f459682'),
    '0x933a2405f84c224be1ef373ba16e992e1f459682',
  );
});

test('buildGatewayRoutePrices maps Dealar paid endpoints to USDC price strings', () => {
  assert.deepEqual(buildGatewayRoutePrices(), {
    '/v1/deals/search': '$0.25',
    '/v1/retailers': '$0.05',
    '/v1/coupons/verify': '$0.01',
  });
});
