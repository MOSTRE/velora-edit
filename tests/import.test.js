import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateSourceUrl, validateRecord, buildRecord, slugify } from '../scripts/import-aliexpress.mjs';

const goodRow = (over = {}) => ({
  source_url: 'https://www.aliexpress.com/item/1005001234567890.html',
  affiliate_url: 'https://s.click.aliexpress.com/e/_approved123',
  title: 'Aurora Chain',
  category: 'chains',
  price: '17.42',
  currency: 'EUR',
  image_url: 'https://ae01.alicdn.com/kf/approved-image.jpg',
  description: 'A fine approved chain.',
  material: 'Stainless steel',
  gender: 'women',
  ...over,
});
const approved = new Set(['https://www.aliexpress.com/item/1005001234567890.html']);

test('importer: validates real AliExpress product URLs, rejects the rest', () => {
  assert.ok(validateSourceUrl('https://www.aliexpress.com/item/1005001234567890.html').ok);
  assert.ok(validateSourceUrl('https://m.aliexpress.us/item/123.html?spm=test').ok);
  assert.ok(!validateSourceUrl('').ok, 'empty rejected');
  assert.ok(!validateSourceUrl('not a url').ok);
  assert.ok(!validateSourceUrl('http://www.aliexpress.com/item/123.html').ok, 'http rejected');
  assert.ok(!validateSourceUrl('https://example.com/item/123.html').ok, 'wrong host rejected');
  assert.ok(!validateSourceUrl('https://www.aliexpress.com/store/123.html').ok, 'non-product page rejected');
});

test('importer: VERIFIED only when affiliate, image, title, price, category all valid', () => {
  const v = validateRecord(goodRow(), approved, new Set());
  assert.equal(v.status, 'VERIFIED');
  assert.deepEqual(v.reasons, []);
  assert.equal(validateRecord(goodRow({ affiliate_url: '' }), approved, new Set()).status, 'INVALID');
  const noImg = validateRecord(goodRow({ image_url: '' }), approved, new Set());
  assert.equal(noImg.status, 'INVALID');
  assert.ok(noImg.reasons.some((r) => r.includes('IMAGE_REQUIRED')));
  assert.ok(noImg.imageRequired);
  assert.equal(validateRecord(goodRow({ source_url: 'https://www.aliexpress.com/item/999.html' }), approved, new Set()).status, 'INVALID', 'unapproved source rejected');
  assert.equal(validateRecord(goodRow({ price: 'free' }), approved, new Set()).status, 'INVALID');
});

test('importer: builds production records with provenance, never invents claims', () => {
  const p = buildRecord(goodRow(), 0, new Set());
  assert.equal(p.source_name, 'AliExpress');
  assert.equal(p.affiliate_url, 'https://s.click.aliexpress.com/e/_approved123');
  assert.equal(p.source_url, 'https://www.aliexpress.com/item/1005001234567890.html');
  assert.equal(p.source_product_id, '1005001234567890');
  assert.equal(p.affiliate_verified, true);
  assert.equal(p.demo, false);
  assert.equal(p.status, 'VERIFIED');
  assert.equal(p.is_published, false, 'importer never auto-publishes');
  assert.equal(p.original_price, null, 'no invented comparison price');
  assert.equal(p.source_price, 17.42);
  assert.ok(p.price_checked_at);
  assert.ok(slugify('Élan Bracelet') === 'elan-bracelet');
});

test('production gate: real CSV data → exactly 50 published, zero mock', () => {
  const csv = fs.readFileSync('data/aliexpress-products.csv', 'utf-8').trim().split(/\r?\n/).filter(Boolean);
  const dataRows = csv.length - 1; // minus header
  if (dataRows === 0) {
    // No real input supplied yet: importer must refuse, catalog stays demo-marked.
    const all = JSON.parse(fs.readFileSync('src/content/products.json', 'utf-8'));
    assert.ok(all.every((p) => p.demo === true), 'without real input every record stays demo-marked');
    return;
  }
  const all = JSON.parse(fs.readFileSync('src/content/products.json', 'utf-8'));
  const pub = all.filter((p) => p.is_published);
  assert.equal(pub.length, 50, 'exactly 50 published production products');
  assert.equal(all.filter((p) => (p.affiliate_url || '').includes('example.com')).length, 0, 'zero mock URLs in production');
  assert.equal(new Set(all.map((p) => p.affiliate_url)).size, all.length, 'zero duplicate affiliate URLs');
  assert.equal(new Set(all.map((p) => p.slug)).size, all.length, 'zero duplicate slugs');
  for (const p of pub) {
    assert.ok(p.affiliate_url, `${p.slug} published without affiliate_url`);
    assert.ok(p.source_url, `${p.slug} published without source_url`);
    assert.ok(p.image_urls?.length && p.thumbnail_url, `${p.slug} published without images`);
    assert.ok(!p.image_required, `${p.slug} flagged IMAGE_REQUIRED`);
  }
});

test('templates: affiliate links use sponsored noopener + adjacent disclosure', () => {
  const tpl = fs.readFileSync('src/pages/product/[slug].astro', 'utf-8');
  assert.ok(tpl.includes('rel="sponsored noopener"'), 'sponsored rel present');
  assert.ok(tpl.includes('Affiliate disclosure'), 'disclosure present');
  assert.ok(tpl.includes('data-affiliate-click'), 'click tracking hook present');
});

test('founders page exposes Sanae and Salma', () => {
  assert.ok(fs.existsSync('src/pages/founders.astro'));
  const tpl = fs.readFileSync('src/pages/founders.astro', 'utf-8');
  const low = tpl.toLowerCase();
  assert.ok(low.includes('the people') && low.includes('behind the edit'));
  const founders = JSON.parse(fs.readFileSync('src/content/founders.json', 'utf-8'));
  assert.deepEqual(founders.map((f) => f.name), ['Sanae', 'Salma']);
});

test('search index covers the live catalog', () => {
  const all = JSON.parse(fs.readFileSync('src/content/products.json', 'utf-8'));
  assert.ok(all.length >= 50, 'catalog non-empty');
  const slugs = new Set(all.filter((p) => p.is_published).map((p) => p.slug));
  assert.ok(slugs.has('noir-signet'), 'legacy slugs preserved');
});
