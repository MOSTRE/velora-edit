import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const products = () => JSON.parse(fs.readFileSync('src/content/products.json', 'utf-8'));

test('seed: exactly 100 unique products with complete records', () => {
  const all = products();
  assert.equal(all.length, 100);
  assert.equal(new Set(all.map((p) => p.slug)).size, 100, 'slugs must be unique');
  assert.equal(new Set(all.map((p) => p.id)).size, 100, 'ids must be unique');
  const required = ['id', 'slug', 'title', 'subtitle', 'description', 'editor_note', 'category', 'collection', 'price', 'currency', 'material', 'color', 'gender', 'tags', 'affiliate_url', 'ali_product_id', 'image_urls', 'thumbnail_url', 'is_featured', 'is_new', 'is_best_value', 'is_published', 'seo_title', 'seo_description', 'created_at', 'updated_at'];
  for (const p of all) {
    for (const k of required) assert.ok(p[k] !== undefined, `${p.slug} missing ${k}`);
  }
});

test('seed: category balance (minimums per group)', () => {
  const all = products();
  const count = (c) => all.filter((p) => p.category === c).length;
  assert.ok(count('rings') >= 20, `rings: ${count('rings')}`);
  assert.ok(count('necklaces') >= 20, `necklaces: ${count('necklaces')}`);
  assert.ok(count('bracelets') >= 15, `bracelets: ${count('bracelets')}`);
  assert.ok(count('earrings') >= 15, `earrings: ${count('earrings')}`);
  assert.ok(count('chains') >= 10, `chains: ${count('chains')}`);
  assert.ok(all.filter((p) => p.gender === 'men').length >= 10, 'men group');
  assert.ok(all.filter((p) => p.gender === 'unisex').length >= 10, 'unisex group');
});

test('seed: no duplicate copy or imagery', () => {
  const all = products();
  assert.equal(new Set(all.map((p) => p.description)).size, 100, 'descriptions must be unique');
  assert.equal(new Set(all.map((p) => p.editor_note)).size, 100, 'editor notes must be unique');
  assert.equal(new Set(all.map((p) => p.title)).size, 100, 'titles must be unique');
  assert.equal(new Set(all.map((p) => p.thumbnail_url)).size, 100, 'thumbnails must be unique');
  for (const p of all) {
    assert.ok(p.image_urls.length >= 2, `${p.slug} needs primary + secondary image`);
    for (const u of p.image_urls) {
      assert.ok(fs.existsSync('public' + u), `missing image file: ${u}`);
    }
  }
});

test('seed: mock affiliate URL format, published products have destinations', () => {
  const all = products();
  for (const p of all.filter((x) => x.is_published)) {
    assert.ok(p.affiliate_url, `${p.slug} missing affiliate_url`);
    const u = new URL(p.affiliate_url);
    assert.ok(['http:', 'https:'].includes(u.protocol));
  }
  const mockPattern = /^https:\/\/example\.com\/mock-aliexpress-product-\d{3}$/;
  const mocks = all.filter((p) => p.slug !== 'mock-gold-ring');
  for (const p of mocks) assert.match(p.affiliate_url, mockPattern, p.slug);
  assert.ok(!all.some((p) => p.affiliate_url.includes('aliexpress.com')), 'no fabricated real AliExpress URLs');
});

test('mock affiliate destination exists for dev test product', () => {
  const all = products();
  const mock = all.find((p) => p.slug === 'mock-gold-ring');
  assert.ok(mock);
  assert.equal(mock.affiliate_url, 'https://example.com/test-affiliate');
});

test('no invented comparison prices in seed', () => {
  for (const p of products()) {
    assert.equal(p.original_price, null, `${p.slug} has unverified original_price`);
  }
});

test('homepage curated sections have enough products', () => {
  const all = products();
  const inColl = (c) => all.filter((p) => p.collection.includes(c) && p.affiliate_url);
  assert.ok(inColl('new-arrivals').length >= 8, 'new arrivals');
  assert.ok(inColl('quiet-luxury').length >= 8, 'quiet luxury');
  assert.ok(inColl('under-20').length >= 8, 'under 20');
  assert.ok(all.filter((p) => p.is_featured).length >= 8, 'signature');
  assert.ok(all.filter((p) => p.editor_pick).length >= 8, 'editor picks');
  assert.ok(inColl('for-him').length >= 8, 'for him');
  assert.ok(inColl('for-her').length >= 8, 'for her');
});

test('founders content exists and is placeholder-honest', () => {
  const founders = JSON.parse(fs.readFileSync('src/content/founders.json', 'utf-8'));
  assert.equal(founders.length, 2);
  for (const f of founders) {
    for (const k of ['id', 'name', 'role', 'bio', 'quote', 'portrait', 'socials', 'order', 'published']) {
      assert.ok(f[k] !== undefined, `founder missing ${k}`);
    }
    assert.ok(fs.existsSync('public' + f.portrait), `missing portrait: ${f.portrait}`);
  }
});
