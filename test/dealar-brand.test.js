import test from 'node:test';
import assert from 'node:assert/strict';

import { buildDealarBrandSystem, buildDealarLogoSvg } from '../src/dealar-brand.js';

test('buildDealarLogoSvg returns a monochrome D mark with rare orange scout accent', () => {
  const svg = buildDealarLogoSvg({ size: 48 });

  assert.match(svg, /^<svg/);
  assert.match(svg, /width="48"/);
  assert.match(svg, /#000000/);
  assert.match(svg, /#FFFFFF/);
  assert.match(svg, /#CC6437/);
  assert.match(svg, /aria-label="Dealar logo"/);
});

test('buildDealarBrandSystem synthesizes Conduit and Ciridae into Dealar-native design language', () => {
  const brand = buildDealarBrandSystem();

  assert.equal(brand.name, 'Dealar');
  assert.match(brand.thesis, /shopping intelligence/i);
  assert.ok(brand.references.some((ref) => ref.name === 'Conduit Pay'));
  assert.ok(brand.references.some((ref) => ref.name === 'Ciridae DESIGN.md'));
  assert.ok(brand.productLanguage.includes('Deal Request Ticket'));
  assert.ok(brand.productLanguage.includes('Scout Report'));
  assert.equal(brand.colors.orange, '#CC6437');
  assert.match(brand.logo.concept, /scout arrow/i);
});
