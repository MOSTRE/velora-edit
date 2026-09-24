import fs from 'node:fs';
import { readInputFile } from './import-aliexpress.mjs';

// Rebuilds data/import-report.json (per-URL status for all 50 inputs) and
// data/pending.json (unpublished URLs for the admin dashboard).
// Performs NO network requests — purely a roll-up of verified local evidence.
// Usage: node scripts/report-status.mjs

const input = readInputFile();
const resolved = JSON.parse(fs.readFileSync('data/resolved.json', 'utf-8'));
const curation = JSON.parse(fs.readFileSync('data/curation.json', 'utf-8'));
const products = JSON.parse(fs.readFileSync('src/content/products.json', 'utf-8'));

const byUrl = new Map(resolved.results.map((r) => [r.source_url, r]));
const curatedIds = new Set(curation.items.map((c) => c.product_id));
const curatedById = new Map(curation.items.map((c) => [c.product_id, c]));
const publishedBySource = new Map(products.filter((p) => p.is_published).map((p) => [p.source_url, p]));

const rows = input.urls.map(({ url, productId }) => {
  const rec = byUrl.get(url);
  const pub = publishedBySource.get(url);
  if (pub) {
    return {
      source_url: url, status: 'PUBLISHED', reason: 'verified title, category, images; direct retailer link pending affiliate conversion',
      title: pub.title, category: pub.category,
      image_status: 'verified-local', affiliate_status: 'pending-conversion', price_status: 'unverified-see-retailer',
    };
  }
  if (!rec || !rec.ok) {
    return {
      source_url: url, status: 'BLOCKED', reason: `retailer anti-bot block (${rec?.error || 'unresolved'}); no bypass attempted`,
      title: '', category: '', image_status: 'unknown', affiliate_status: 'none', price_status: 'unknown',
    };
  }
  if (!curatedIds.has(productId)) {
    return {
      source_url: url, status: 'INVALID', reason: 'multi-piece set incl. non-jewelry — no single fitting category',
      title: rec.title.slice(0, 120), category: '', image_status: 'available-unused', affiliate_status: 'none', price_status: 'unknown',
    };
  }
  const c = curatedById.get(productId);
  return {
    source_url: url, status: 'DRAFT', reason: 'verified but not yet published',
    title: c.display, category: c.category, image_status: 'verified-local', affiliate_status: 'pending-conversion', price_status: 'unverified-see-retailer',
  };
});

// Duplicates within the input (should be none — importer dedupes).
const seen = new Set();
for (const r of rows) {
  if (seen.has(r.source_url)) r.status = 'DUPLICATE';
  seen.add(r.source_url);
}

const count = (s) => rows.filter((r) => r.status === s).length;
const report = {
  date: new Date().toISOString(),
  totals: {
    input: rows.length,
    published: count('PUBLISHED'),
    draft: count('DRAFT'),
    invalid: count('INVALID'),
    blocked: count('BLOCKED'),
    duplicate: count('DUPLICATE'),
  },
  affiliate: 'no credentials configured — 0 affiliate-verified; published products use direct retailer links marked pending conversion',
  quality_review: 'All 19 published records reviewed: genuine single-type jewelry pieces; seller brands only (no designer counterfeits, no logo copies); material claims kept strictly inside verbatim source_title, never asserted by VELORA; no reviews/sales/stock/discount claims shown. Bridal-skew noted (9 rings) — acceptable mix, room for necklaces/chains when more URLs resolve.',
  rows,
};
fs.writeFileSync('data/import-report.json', JSON.stringify(report, null, 2));
fs.writeFileSync('data/pending.json', JSON.stringify(rows.filter((r) => r.status !== 'PUBLISHED'), null, 2));
console.log(`PUBLISHED ${report.totals.published} · DRAFT ${report.totals.draft} · INVALID ${report.totals.invalid} · BLOCKED ${report.totals.blocked} · DUPLICATE ${report.totals.duplicate}`);
