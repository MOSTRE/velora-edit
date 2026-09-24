import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('seed: 30 products, all publishable have affiliate destinations', () => {
  const products = JSON.parse(fs.readFileSync('src/content/products.json', 'utf-8'));
  assert.equal(products.length, 30);
  for (const p of products.filter((x) => x.is_published)) {
    assert.ok(p.affiliate_url, `${p.slug} missing affiliate_url`);
    assert.ok(p.thumbnail_url || p.image_urls?.length, `${p.slug} missing image`);
  }
});

test('mock affiliate destination exists for dev test product', () => {
  const products = JSON.parse(fs.readFileSync('src/content/products.json', 'utf-8'));
  const mock = products.find((p) => p.slug === 'mock-gold-ring');
  assert.ok(mock);
  assert.equal(mock.affiliate_url, 'https://example.com/test-affiliate');
});

test('no invented comparison prices in seed', () => {
  const products = JSON.parse(fs.readFileSync('src/content/products.json', 'utf-8'));
  for (const p of products) {
    assert.equal(p.original_price, null, `${p.slug} has unverified original_price`);
  }
});

test('affiliate links use http(s)', () => {
  const products = JSON.parse(fs.readFileSync('src/content/products.json', 'utf-8'));
  for (const p of products) {
    const u = new URL(p.affiliate_url);
    assert.ok(['http:', 'https:'].includes(u.protocol));
  }
});
