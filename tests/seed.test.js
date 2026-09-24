import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const products = () => JSON.parse(fs.readFileSync('src/content/products.json', 'utf-8'));
const approvedInput = () => {
  const txt = fs.readFileSync('data/aliexpress-input.txt', 'utf-8');
  const norm = (u) => { try { const x = new URL(u.trim()); return `${x.origin}${x.pathname.replace(/\/+$/, '')}`; } catch { return ''; } };
  return new Set(txt.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map(norm).filter(Boolean));
};

test('catalog: published real records, complete and unique', () => {
  const all = products();
  const pub = all.filter((p) => p.is_published && p.status === 'PUBLISHED');
  assert.ok(pub.length >= 1, 'at least one published product');
  assert.equal(new Set(all.map((p) => p.slug)).size, all.length, 'zero duplicate slugs');
  assert.equal(new Set(all.map((p) => p.id)).size, all.length, 'zero duplicate ids');
  const required = ['id', 'slug', 'title', 'description', 'editor_note', 'category', 'collection', 'currency', 'image_urls', 'thumbnail_url', 'gender', 'tags', 'source_url', 'source_name', 'source_product_id', 'source_last_checked', 'is_published', 'status', 'seo_title', 'seo_description', 'created_at', 'updated_at'];
  for (const p of pub) {
    for (const k of required) assert.ok(p[k] !== undefined && p[k] !== '', `${p.slug} missing ${k}`);
  }
});

test('catalog: zero mock/example.com product URLs', () => {
  const all = products();
  const mock = all.filter((p) => [p.affiliate_url, p.source_url, p.thumbnail_url, ...(p.image_urls || [])].some((u) => (u || '').includes('example.com')));
  assert.equal(mock.length, 0, `mock URLs remain: ${mock.map((p) => p.slug).join(',')}`);
  assert.ok(all.every((p) => p.demo !== true), 'no demo-marked records in production catalog');
});

test('catalog: every published product has an approved source_url', () => {
  const approved = approvedInput();
  assert.ok(approved.size === 50, 'input file holds 50 approved URLs');
  for (const p of products().filter((x) => x.is_published)) {
    assert.ok(p.source_url, `${p.slug} missing source_url`);
    assert.ok(approved.has(p.source_url), `${p.slug} source not in approved input`);
  }
});

test('catalog: affiliate_url or clearly-marked pending conversion', () => {
  const tpl = fs.readFileSync('src/pages/product/[slug].astro', 'utf-8');
  assert.ok(tpl.includes('pending'), 'template marks pending conversion');
  assert.ok(tpl.includes('rel={affiliateLive'), 'rel adapts to affiliate state');
  for (const p of products().filter((x) => x.is_published)) {
    const hasAff = Boolean(p.affiliate_url);
    if (!hasAff) assert.equal(p.affiliate_verified, false, `${p.slug} must be flagged affiliate_verified:false`);
  }
});

test('catalog: no fabricated AliExpress URLs, no invented comparison prices', () => {
  for (const p of products()) {
    assert.equal(p.original_price, null, `${p.slug} has unverified original_price`);
    if (p.affiliate_url) {
      assert.ok(!p.affiliate_url.includes('aliexpress.com') || p.affiliate_verified, `${p.slug}: retailer URL presented as affiliate`);
    }
  }
});

test('catalog: real local images exist for every published product', () => {
  for (const p of products().filter((x) => x.is_published)) {
    assert.ok(p.image_urls.length >= 1, `${p.slug} needs images`);
    for (const u of p.image_urls) {
      assert.ok(!u.startsWith('http'), `${p.slug} must serve local images, got ${u}`);
      assert.ok(fs.existsSync('public' + u), `missing image file: ${u}`);
    }
  }
});

test('catalog: unique copy, valid categories', () => {
  const all = products();
  assert.equal(new Set(all.map((p) => p.title)).size, all.length, 'titles unique');
  assert.equal(new Set(all.map((p) => p.description)).size, all.length, 'descriptions unique');
  assert.equal(new Set(all.map((p) => p.editor_note)).size, all.length, 'editor notes unique');
  const cats = ['rings', 'necklaces', 'bracelets', 'earrings', 'chains'];
  for (const p of all) assert.ok(cats.includes(p.category), `${p.slug} bad category`);
});

test('homepage curated sections have enough products', () => {
  const all = products().filter((p) => p.is_published);
  const inColl = (c) => all.filter((p) => p.collection.includes(c));
  assert.ok(inColl('new-arrivals').length >= 6, 'new arrivals');
  assert.ok(all.filter((p) => p.is_featured).length >= 6, 'featured');
  assert.ok(all.filter((p) => p.editor_pick).length >= 6, 'editor picks');
  assert.ok(inColl('quiet-luxury').length >= 4, 'quiet luxury');
  assert.ok(inColl('for-her').length >= 4, 'for her');
});

test('founders content exists and is placeholder-honest', () => {
  const founders = JSON.parse(fs.readFileSync('src/content/founders.json', 'utf-8'));
  assert.equal(founders.length, 2);
  for (const f of founders) {
    for (const k of ['id', 'name', 'role', 'bio', 'quote', 'portrait', 'socials', 'order', 'published']) {
      assert.ok(f[k] !== undefined, `founder missing ${k}`);
    }
  }
});
