import fs from 'node:fs';
import { slugify } from './import-aliexpress.mjs';

// Builds the production catalog from VERIFIED evidence only:
//   data/resolved.json (retailer titles + gallery, single polite fetch each)
//   data/image-report.json (locally downloaded, content-verified images)
//   data/curation.json (hand-written editorial layer from evidenced nouns)
// Usage: node scripts/build-real-catalog.mjs
// Refuses to write unless every curated entry resolves cleanly.

const resolved = JSON.parse(fs.readFileSync('data/resolved.json', 'utf-8'));
const imgReport = JSON.parse(fs.readFileSync('data/image-report.json', 'utf-8'));
const curation = JSON.parse(fs.readFileSync('data/curation.json', 'utf-8'));
const input = JSON.parse(JSON.stringify((await import('./import-aliexpress.mjs')).readInputFile()));
const approved = new Set(input.urls.map((u) => u.url));

const byId = new Map(resolved.results.filter((r) => r.ok).map((r) => [r.product_id, r]));
const imgById = new Map(imgReport.report.map((r) => [r.product_id, r.files]));
const usedSlugs = new Set();
const now = new Date().toISOString();
const errors = [];
const products = [];

curation.items.forEach((c, i) => {
  const rec = byId.get(c.product_id);
  if (!rec) { errors.push(`${c.product_id}: no verified source record`); return; }
  if (!approved.has(rec.source_url)) { errors.push(`${c.product_id}: source not in approved input`); return; }
  const files = (imgById.get(c.product_id) || []).filter((f) => fs.existsSync('public' + f));
  if (!files.length) { errors.push(`${c.product_id}: IMAGE_REQUIRED — no legitimate image`); return; }
  let slug = slugify(c.display);
  let n = 2;
  while (usedSlugs.has(slug)) slug = `${slugify(c.display)}-${n++}`;
  usedSlugs.add(slug);
  const genderLabel = c.gender === 'unisex' ? 'Unisex' : c.gender === 'men' ? "Men's" : "Women's";
  products.push({
    id: `ali-${String(i + 1).padStart(3, '0')}`,
    slug,
    title: c.display.toUpperCase(),
    subtitle: `${genderLabel} · AliExpress`,
    description: `${c.display} — ${c.description}`,
    editor_note: c.note,
    category: c.category,
    collection: c.collections,
    price: null,
    currency: 'EUR',
    original_price: null,
    image_urls: files,
    thumbnail_url: files[0],
    ...(c.color ? { color: c.color } : {}),
    gender: c.gender,
    tags: c.tags,
    ali_product_id: c.product_id,
    affiliate_url: null,
    source_url: rec.source_url,
    source_title: rec.title.slice(0, 300),
    source_name: 'AliExpress',
    source_product_id: c.product_id,
    source_last_checked: now,
    affiliate_verified: false,
    source_price: null,
    source_currency: 'EUR',
    price_checked_at: null,
    is_featured: Boolean(c.featured),
    is_new: true,
    is_best_value: false,
    is_limited: false,
    is_published: true,
    status: 'PUBLISHED',
    editorial_score: 85,
    editor_pick: Boolean(c.pick),
    seo_title: `${c.display} — Curated Jewelry | VELORA EDIT`,
    seo_description: `${c.display}: a curated ${c.category.slice(0, -1)} via VELORA EDIT. See current price on AliExpress.`,
    og_image: files[0],
    demo: false,
    price_freshness: null,
    created_at: now,
    updated_at: now,
  });
});

// Document exclusions: unresolved (blocked) + resolved-but-unclassifiable.
const curatedIds = new Set(curation.items.map((c) => c.product_id));
const blocked = resolved.results.filter((r) => !r.ok).map((r) => ({ product_id: r.product_id, source_url: r.source_url, reason: r.error || 'unresolved' }));
const excluded = resolved.results
  .filter((r) => r.ok && !curatedIds.has(r.product_id))
  .map((r) => ({ product_id: r.product_id, source_url: r.source_url, reason: 'multi-piece set incl. non-jewelry — no single fitting category', title: r.title.slice(0, 120) }));
const report = {
  date: now,
  published: products.length,
  excluded,
  blocked,
  affiliate: 'none — all outbound links are direct source URLs marked pending affiliate conversion',
};
fs.writeFileSync('data/import-report.json', JSON.stringify(report, null, 2));

if (errors.length) {
  console.error('BUILD REFUSED:');
  errors.forEach((e) => console.error(' -', e));
  process.exit(1);
}
fs.writeFileSync('src/content/products.json', JSON.stringify(products, null, 2));
console.log(`Wrote ${products.length} verified production records. Excluded: ${excluded.length}, blocked: ${blocked.length} (see data/import-report.json).`);
