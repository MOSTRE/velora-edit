import fs from 'node:fs';
import { AliExpressAffiliateProvider, configFromEnv } from '../src/lib/affiliate/aliexpress.ts';

// Affiliate conversion runner (server-side only — never bundle for browsers).
//
//   node scripts/convert-affiliate.mjs --dry-run        # plan without any API call
//   node scripts/convert-affiliate.mjs --test-url <url> # getProductByUrl + generateAffiliateLink, verified
//   node scripts/convert-affiliate.mjs                  # convert 19 + resolve blocked via API
//
// Reads credentials from process.env (ALIPRESS_* or ALIEXPRESS_* aliases).
// NEVER prints credential values or full affiliate URLs (tracking IDs inside).
// Polite: 1s between API calls; aborts immediately on gateway auth rejection.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

export function presence(env = process.env) {
  const keys = ['ALIPRESS_APP_KEY', 'ALIPRESS_APP_SECRET', 'ALIPRESS_TRACKING_ID', 'ALIEXPRESS_APP_KEY', 'ALIEXPRESS_APP_SECRET', 'ALIEXPRESS_TRACKING_ID'];
  const out = {};
  for (const k of keys) out[k] = env[k] ? 'SET' : 'unset';
  return out;
}

const AFFILIATE_HOSTS = ['s.click.aliexpress.com', 'a.aliexpress.com', 'aliexpress.com', 'aliexpress.us'];

/** Verify a generated link without exposing it: host allowlist + tracking echo. */
export function verifyAffiliateResult(link, _trackingId, _sourceUrl) {
  const reasons = [];
  let host = '';
  try {
    const u = new URL(link);
    host = u.hostname.toLowerCase();
    if (u.protocol !== 'https:') reasons.push('not https');
    if (!AFFILIATE_HOSTS.some((h) => host === h || host.endsWith('.' + h))) reasons.push(`unexpected host: ${host}`);
  } catch { reasons.push('not a URL'); }
  return { ok: reasons.length === 0, host, chars: String(link || '').length, reasons };
}

function loadCatalog() {
  return JSON.parse(fs.readFileSync('src/content/products.json', 'utf-8'));
}

async function downloadImage(url, dest) {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  const ct = r.headers.get('content-type') || '';
  const buf = Buffer.from(await r.arrayBuffer());
  if (!r.ok || !ct.includes('image') || buf.length < 8000) return false;
  fs.mkdirSync('public/images/real', { recursive: true });
  fs.writeFileSync(dest, buf);
  return true;
}

function categoryGuess(apiCategoryName, title) {
  const hay = `${apiCategoryName || ''} ${title || ''}`.toLowerCase();
  if (/earring|ear cuff|earcuff/.test(hay)) return 'earrings';
  if (/necklace|pendant|choker|lariat/.test(hay)) return 'necklaces';
  if (/bracelet|bangle|cuff(?!link)|anklet/.test(hay) && !/ear cuff/.test(hay)) return 'bracelets';
  if (/ring/.test(hay)) return 'rings';
  if (/\bchain\b|choker|cuban|curb|figaro|rope chain/.test(hay)) return 'chains';
  return '';
}

async function main() {
  const args = process.argv.slice(2);
  const cfg = configFromEnv(process.env);
  const provider = new AliExpressAffiliateProvider(process.env);
  console.log('credential presence:', JSON.stringify(presence()));
  if (!provider.isConfigured()) {
    console.log('Affiliate credentials are NOT configured in this environment.');
    console.log('Set ALIPRESS_APP_KEY / ALIPRESS_APP_SECRET / ALIPRESS_TRACKING_ID (or ALIEXPRESS_* aliases) where this command runs, then retry. Values are never printed or committed.');
    return 2;
  }
  if (args.includes('--dry-run')) {
    const catalog = loadCatalog();
    const pending = catalog.filter((p) => p.is_published && !p.affiliate_url);
    const report = JSON.parse(fs.readFileSync('data/import-report.json', 'utf-8'));
    const blocked = report.rows.filter((r) => r.status === 'BLOCKED').length;
    console.log(`DRY RUN: would convert ${pending.length} published direct links + attempt ${blocked} blocked URLs via official API only. No calls made.`);
    return 0;
  }
  const testIdx = args.indexOf('--test-url');
  if (testIdx !== -1) {
    const url = args[testIdx + 1];
    if (!url) { console.error('--test-url requires a URL argument'); return 1; }
    console.log('testing getProductByUrl...');
    const prod = await provider.getProductByUrl(url);
    const wantId = AliExpressAffiliateProvider.productIdFromUrl(url);
    console.log(JSON.stringify({
      product_found: Boolean(prod),
      id_matches_url: prod?.source_product_id === wantId || prod?.ali_product_id === wantId,
      title_chars: (prod?.title || '').length,
      images: (prod?.image_urls || []).length,
    }));
    if (!prod) return 1;
    console.log('testing generateAffiliateLink...');
    const link = await provider.generateAffiliateLink(url);
    const v = verifyAffiliateResult(link.affiliate_url, cfg.trackingId, url);
    console.log(JSON.stringify({
      host: v.host, chars: v.chars, ok: v.ok, reasons: v.reasons,
      tracking_echo_ok: link.tracking_id === cfg.trackingId,
    }));
    return v.ok && link.tracking_id === cfg.trackingId ? 0 : 1;
  }

  // FULL RUN
  const catalog = loadCatalog();
  const now = new Date().toISOString();
  let converted = 0;
  let failed = 0;
  const errors = [];
  const pending = catalog.filter((p) => p.is_published && !p.affiliate_url);
  for (const p of pending) {
    try {
      const link = await provider.generateAffiliateLink(p.source_url);
      const v = verifyAffiliateResult(link.affiliate_url, cfg.trackingId, p.source_url);
      if (!v.ok || link.tracking_id !== cfg.trackingId) throw new Error(`verification failed: ${v.reasons.join('; ') || 'tracking mismatch'}`);
      p.affiliate_url = link.affiliate_url;
      p.affiliate_verified = true;
      p.tracking_id = cfg.trackingId;
      p.affiliate_checked_at = link.checked_at;
      p.updated_at = now;
      converted++;
      console.log(`converted ${p.slug} (host: ${v.host})`);
    } catch (e) {
      failed++;
      errors.push({ slug: p.slug, error: e.message });
      console.log(`FAILED ${p.slug}: ${e.message}`);
      if (/signature|app_key|auth|permission|tracking_id/i.test(e.message)) {
        console.log('Aborting: gateway rejected credentials/permissions. Fix access, then rerun.');
        break;
      }
    }
    await sleep(1000);
  }

  // Attempt blocked URLs via official product API only (no page fetching).
  const report = JSON.parse(fs.readFileSync('data/import-report.json', 'utf-8'));
  const blockedUrls = report.rows.filter((r) => r.status === 'BLOCKED').map((r) => r.source_url);
  let resolvedNew = 0;
  const usedSlugs = new Set(catalog.map((p) => p.slug));
  for (const url of blockedUrls) {
    const id = AliExpressAffiliateProvider.productIdFromUrl(url);
    if (!id) continue;
    try {
      const prod = await provider.getProductById(id);
      if (!prod?.title || !prod.image_urls?.length) { console.log(`blocked ${id}: API returned no usable data`); continue; }
      const slugBase = prod.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60) || `piece-${id}`;
      let slug = slugBase; let n = 2;
      while (usedSlugs.has(slug)) slug = `${slugBase}-${n++}`;
      usedSlugs.add(slug);
      // Download official API images locally (verified content) for the primary.
      const dest = `public/images/real/api-${id}-a.jpg`;
      const dl = await downloadImage(prod.image_urls[0], dest);
      const gender = /women|woman|her\b|mujer|femme/i.test(prod.title) ? 'women' : /men\b|hombre|homme/i.test(prod.title) ? 'men' : 'unisex';
      catalog.push({
        id: `ali-api-${id.slice(-6)}`, slug,
        title: prod.title.slice(0, 60).toUpperCase(),
        subtitle: 'Via official AliExpress API — editorial pass pending',
        description: `${prod.title.slice(0, 140)} — imported via the official AliExpress affiliate API. Editorial review pending.`,
        editor_note: 'Imported via API; awaiting editorial review before featuring.',
        category: categoryGuess('', prod.title),
        collection: ['new-arrivals'],
        price: prod.price ?? null, currency: prod.currency || 'EUR', original_price: null,
        image_urls: dl ? [`/images/real/api-${id}-a.jpg`] : [],
        thumbnail_url: dl ? `/images/real/api-${id}-a.jpg` : '',
        gender, tags: ['new'],
        ali_product_id: id, affiliate_url: null, source_url: url,
        source_title: (prod.title || '').slice(0, 300), source_name: 'AliExpress',
        source_product_id: id, source_last_checked: now, affiliate_verified: false,
        source_price: prod.price ?? null, source_currency: prod.currency || 'EUR',
        price_checked_at: prod.price != null ? now : null,
        is_featured: false, is_new: true, is_best_value: false, is_limited: false,
        is_published: false, status: dl ? 'DRAFT' : 'INVALID',
        editorial_score: 50, editor_pick: false,
        seo_title: `${prod.title.slice(0, 60)} — VELORA EDIT`,
        seo_description: 'Imported via the official AliExpress affiliate API. Under editorial review.',
        og_image: dl ? `/images/real/api-${id}-a.jpg` : '',
        demo: false, price_freshness: null, created_at: now, updated_at: now,
        ...(dl ? {} : { image_required: true }),
      });
      resolvedNew++;
      console.log(`drafted ${slug} (category: ${categoryGuess('', prod.title) || 'unassigned'})`);
      // Update report row
      const row = report.rows.find((r) => r.source_url === url);
      if (row) { row.status = dl ? 'DRAFT' : 'INVALID'; row.reason = dl ? 'resolved via official API; awaiting editorial review' : 'IMAGE_REQUIRED'; }
    } catch (e) {
      console.log(`blocked ${id}: ${e.message}`);
      if (/signature|app_key|auth|permission/i.test(e.message)) { console.log('Aborting on gateway auth failure.'); break; }
    }
    await sleep(1000);
  }

  fs.writeFileSync('src/content/products.json', JSON.stringify(catalog, null, 2));
  report.date = now;
  const t = { PUBLISHED: 0, DRAFT: 0, INVALID: 0, BLOCKED: 0, DUPLICATE: 0 };
  for (const r of report.rows) t[r.status] = (t[r.status] || 0) + 1;
  report.totals = { input: report.rows.length, published: t.PUBLISHED || 0, draft: t.DRAFT || 0, invalid: t.INVALID || 0, blocked: t.BLOCKED || 0, duplicate: t.DUPLICATE || 0 };
  fs.writeFileSync('data/import-report.json', JSON.stringify(report, null, 2));
  fs.writeFileSync('data/pending.json', JSON.stringify(report.rows.filter((r) => r.status !== 'PUBLISHED'), null, 2));
  console.log(JSON.stringify({ converted, failed, resolvedNew, errors, totals: report.totals }));
  return failed && converted === 0 ? 1 : 0;
}

const isMain = process.argv[1] && process.argv[1].endsWith('convert-affiliate.mjs');
if (isMain) main().then((code) => { process.exitCode = code; }).catch((e) => { console.error('FATAL:', e.message); process.exitCode = 1; });
