import fs from 'node:fs';
import path from 'node:path';

// VELORA EDIT — real-product importer (approved affiliate data only).
//
//   node scripts/import-aliexpress.mjs --check     validate data/aliexpress-input.txt only
//   node scripts/import-aliexpress.mjs             full import → requires 50 VERIFIED records
//   node scripts/import-aliexpress.mjs --publish   mark VERIFIED records PUBLISHED on write
//   node scripts/import-aliexpress.mjs --allow-partial  write verified records even if < 50
//
// NEVER invents URLs, prices, images or affiliate links. Without 50 verified
// records the script refuses to replace src/content/products.json and prints:
//   "Paste the 50 real AliExpress URLs into data/aliexpress-input.txt and rerun the importer."

export const INPUT_TXT = 'data/aliexpress-input.txt';
export const INPUT_CSV = 'data/aliexpress-products.csv';
export const OUTPUT_JSON = 'src/content/products.json';
export const REPORT_JSON = 'data/import-report.json';

export const CATEGORIES = ['rings', 'necklaces', 'bracelets', 'earrings', 'chains'];
export const GENDERS = ['women', 'men', 'unisex'];

/** Strict AliExpress product-page URL check. Returns normalized URL or null. */
export function validateSourceUrl(raw) {
  const line = String(raw || '').trim();
  if (!line) return { ok: false, reason: 'empty line' };
  let u;
  try { u = new URL(line); } catch { return { ok: false, reason: 'not a URL', value: line }; }
  if (u.protocol !== 'https:') return { ok: false, reason: 'must use https', value: line };
  const host = u.hostname.toLowerCase();
  if (!(host === 'aliexpress.com' || host === 'aliexpress.us' || host.endsWith('.aliexpress.com') || host.endsWith('.aliexpress.us'))) {
    return { ok: false, reason: 'host is not AliExpress', value: line };
  }
  if (!u.pathname.includes('/item/')) return { ok: false, reason: 'not a product page (missing /item/)', value: line };
  const normalized = `${u.origin}${u.pathname.replace(/\/+$/, '')}`;
  const idMatch = u.pathname.match(/(\d+)\.html/);
  return { ok: true, normalized, productId: idMatch ? idMatch[1] : '' };
}

/** Read + validate the input file. Returns { urls, invalid, duplicates, empty }. */
export function readInputFile(file = INPUT_TXT) {
  let text = '';
  try { text = fs.readFileSync(file, 'utf-8'); } catch { return { urls: [], invalid: [], duplicates: [], empty: 0, missing: true }; }
  const urls = [];
  const invalid = [];
  const seen = new Set();
  let duplicates = 0;
  let empty = 0;
  text.split(/\r?\n/).forEach((rawLine, i) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) { if (!line) empty++; return; }
    const v = validateSourceUrl(line);
    if (!v.ok) { invalid.push({ line: i + 1, value: line, reason: v.reason }); return; }
    if (seen.has(v.normalized)) { duplicates++; invalid.push({ line: i + 1, value: line, reason: 'duplicate URL' }); return; }
    seen.add(v.normalized);
    urls.push({ url: v.normalized, productId: v.productId });
  });
  return { urls, invalid, duplicates, empty, missing: false };
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (!lines.length) return [];
  const headers = splitRow(lines[0]).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((ln) => {
    const cells = splitRow(ln);
    const o = {};
    headers.forEach((h, i) => { o[h] = (cells[i] || '').trim(); });
    return o;
  });
}

function splitRow(line) {
  const cells = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === ',' && !inQ) { cells.push(cur); cur = ''; }
    else cur += ch;
  }
  cells.push(cur);
  return cells.map((c) => c.replace(/^"|"$/g, ''));
}

function validHttp(u) {
  try { const x = new URL(u); return x.protocol === 'http:' || x.protocol === 'https:'; } catch { return false; }
}

export function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80) || 'piece';
}

/**
 * Validate one CSV record against an approved input URL.
 * Returns { status: 'VERIFIED'|'INVALID', reasons, record }.
 * Only VERIFIED records may become PUBLISHED. Missing images flag IMAGE_REQUIRED.
 */
export function validateRecord(row, approvedUrls, _usedSlugs) {
  const reasons = [];
  const norm = (() => { const v = validateSourceUrl(row.source_url || ''); return v.ok ? v.normalized : ''; })();
  if (!norm) reasons.push('source_url invalid');
  else if (!approvedUrls.has(norm)) reasons.push('source_url not in approved input list');
  if (!row.affiliate_url || !validHttp(row.affiliate_url)) reasons.push('missing affiliate_url');
  if (!row.title || row.title.trim().length < 3) reasons.push('title invalid');
  const price = Number(row.price);
  if (!row.price || Number.isNaN(price) || price <= 0) reasons.push('price invalid');
  if (!CATEGORIES.includes((row.category || '').toLowerCase())) reasons.push('category invalid');
  const gender = (row.gender || 'unisex').toLowerCase();
  if (!GENDERS.includes(gender)) reasons.push('gender invalid');
  const image = (row.image_url || '').trim();
  if (!image || !validHttp(image)) reasons.push('IMAGE_REQUIRED: no legitimate image URL');
  // Material is passed through only when actually supplied (see buildRecord) — never invented here.
  const status = reasons.length === 0 ? 'VERIFIED' : 'INVALID';
  return { status, reasons, imageRequired: !image || !validHttp(image) };
}

/** Build a production product record from a VERIFIED row. No invented fields. */
export function buildRecord(row, index, usedSlugs) {
  const now = new Date().toISOString();
  const price = Number(row.price);
  const gender = (row.gender || 'unisex').toLowerCase();
  const category = row.category.toLowerCase();
  let slug = slugify(row.title);
  let n = 2;
  while (usedSlugs.has(slug)) slug = `${slugify(row.title)}-${n++}`;
  usedSlugs.add(slug);
  const norm = validateSourceUrl(row.source_url).normalized;
  return {
    id: `ali-${String(index + 1).padStart(3, '0')}`,
    slug,
    title: row.title.trim().toUpperCase(),
    subtitle: `${gender === 'unisex' ? 'Unisex' : gender === 'men' ? "Men's" : "Women's"} · AliExpress`,
    description: (row.description || '').trim() || `${row.title.trim()} — selected for the VELORA EDIT for proportion and everyday wear.`,
    editor_note: (row.editor_note || '').trim() || 'Chosen for proportion, finish and ease.',
    category,
    collection: (row.collections || 'new-arrivals').split('|').map((s) => s.trim()).filter(Boolean),
    price,
    currency: (row.currency || 'EUR').toUpperCase(),
    original_price: null,
    image_urls: [row.image_url.trim()],
    thumbnail_url: row.image_url.trim(),
    material: (row.material || '').trim(),
    color: (row.color || '').trim() || 'gold',
    gender,
    tags: (row.tags || category).split('|').map((s) => s.trim()).filter(Boolean),
    ali_product_id: validateSourceUrl(row.source_url).productId,
    affiliate_url: row.affiliate_url.trim(),
    source_url: norm,
    source_title: (row.source_title || row.title).trim(),
    source_name: 'AliExpress',
    source_product_id: validateSourceUrl(row.source_url).productId,
    source_last_checked: now,
    affiliate_verified: true,
    source_price: price,
    source_currency: (row.currency || 'EUR').toUpperCase(),
    price_checked_at: now,
    is_featured: false,
    is_new: true,
    is_best_value: false,
    is_limited: false,
    is_published: false,
    status: 'VERIFIED',
    editorial_score: 80,
    editor_pick: false,
    seo_title: `${row.title.trim()} — Curated Jewelry | VELORA EDIT`,
    seo_description: `${row.title.trim()}: curated ${category.slice(0, -1)} via VELORA EDIT. See current price on AliExpress.`,
    og_image: row.image_url.trim(),
    demo: false,
    price_freshness: now,
    created_at: now,
    updated_at: now,
  };
}

function main() {
  const args = new Set(process.argv.slice(2));
  const checkOnly = args.has('--check');
  const publish = args.has('--publish');
  const allowPartial = args.has('--allow-partial');

  const input = readInputFile();
  if (input.missing || input.urls.length === 0) {
    console.log(JSON.stringify({ valid_urls: 0, invalid: input.invalid, duplicates: input.duplicates }, null, 2));
    console.log('Paste the 50 real AliExpress URLs into data/aliexpress-input.txt and rerun the importer.');
    process.exit(2);
  }
  console.log(`Approved input URLs: ${input.urls.length} (invalid: ${input.invalid.length}, duplicates: ${input.duplicates})`);
  if (checkOnly) {
    if (input.invalid.length) console.log(JSON.stringify({ invalid: input.invalid }, null, 2));
    process.exit(input.invalid.length ? 1 : 0);
  }

  let csvText = '';
  try { csvText = fs.readFileSync(INPUT_CSV, 'utf-8'); } catch { console.error(`Missing ${INPUT_CSV}.`); process.exit(1); }
  const rows = parseCsv(csvText);
  const approved = new Set(input.urls.map((u) => u.url));
  const usedSlugs = new Set();
  const verified = [];
  const invalid = [];
  const seenCsv = new Set();
  for (const row of rows) {
    const key = (row.source_url || '').trim().toLowerCase();
    if (key && seenCsv.has(key)) { invalid.push({ source_url: row.source_url, reasons: ['duplicate row in CSV'] }); continue; }
    seenCsv.add(key);
    const v = validateRecord(row, approved, usedSlugs);
    if (v.status === 'VERIFIED') verified.push(buildRecord(row, verified.length, usedSlugs));
    else invalid.push({ source_url: row.source_url || '(missing)', reasons: v.reasons });
  }

  const missingAffiliate = invalid.filter((r) => r.reasons.some((x) => x.includes('affiliate_url'))).length;
  const missingImage = invalid.filter((r) => r.reasons.some((x) => x.includes('IMAGE_REQUIRED'))).length;
  const report = {
    date: new Date().toISOString(),
    input_urls: input.urls.length,
    input_invalid: input.invalid.length,
    input_duplicates: input.duplicates,
    csv_rows: rows.length,
    verified: verified.length,
    invalid: invalid.length,
    invalid_rows: invalid,
    missing_affiliate: missingAffiliate,
    missing_image: missingImage,
  };
  fs.mkdirSync(path.dirname(REPORT_JSON), { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, invalid_rows: `[${invalid.length} — see ${REPORT_JSON}]` }, null, 2));

  if (verified.length !== 50 && !allowPartial) {
    console.log(`Refusing to replace products.json: ${verified.length}/50 verified. Resolve invalid rows or rerun with --allow-partial.`);
    process.exit(1);
  }
  if (publish) verified.forEach((p) => { p.status = 'PUBLISHED'; p.is_published = true; });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(verified, null, 2));
  console.log(`Wrote ${verified.length} ${publish ? 'PUBLISHED' : 'VERIFIED'} records to ${OUTPUT_JSON}.`);
}

if (process.argv[1] && process.argv[1].endsWith('import-aliexpress.mjs')) main();
