import fs from 'node:fs';
import { readInputFile } from './import-aliexpress.mjs';

// Polite one-pass metadata resolver (public og:/gallery markup only).
// No credential use, no evasion, no API abuse — a single plain fetch per URL.
// Usage: node scripts/resolve-products.mjs  →  writes data/resolved.json
// Review the dump, then run the full import.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

async function resolveOne(record) {
  const out = { source_url: record.url, product_id: record.productId, ok: false };
  try {
    const r = await fetch(record.url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=1.0' },
      redirect: 'follow',
    });
    if (r.status !== 200) { out.error = `http ${r.status}`; return out; }
    const t = await r.text();
    const og = (p) => {
      const m = t.match(new RegExp('<meta[^>]+property="' + p + '"[^>]+content="([^"]+)"'));
      return m ? m[1] : '';
    };
    const title = (og('og:title') || '').trim();
    const images = [...new Set([...t.matchAll(/https:\/\/ae-pic-a\d?\.aliexpress-media\.com\/kf\/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)/g)].map((m) => m[0]))];
    const cat = t.match(/"categoryId":\s*"?(\d+)/);
    out.ok = Boolean(title && images.length);
    out.title = title;
    out.image = og('og:image');
    out.images = images.slice(0, 4);
    out.category_id = cat ? cat[1] : '';
    if (!title) out.error = 'no og:title';
    else if (!images.length) out.error = 'no product images';
  } catch (e) { out.error = `fetch failed: ${e.message}`; }
  return out;
}

const input = readInputFile();
if (!input.urls.length) {
  console.log('Paste the 50 real AliExpress URLs into data/aliexpress-input.txt and rerun the importer.');
  process.exit(2);
}
// --retry-missing: re-attempt only failures recorded in data/resolved.json
let targets = input.urls;
if (process.argv.includes('--retry-missing')) {
  try {
    const prev = JSON.parse(fs.readFileSync('data/resolved.json', 'utf-8'));
    const missing = new Set(prev.results.filter((r) => !r.ok).map((r) => r.source_url));
    targets = input.urls.filter((u) => missing.has(u.url));
    console.log(`Retrying ${targets.length} previously failed URLs (single gentle pass).`);
    if (!targets.length) { console.log('Nothing to retry.'); process.exit(0); }
  } catch { console.log('No prior resolved.json — resolving all.'); }
}
const spacing = process.argv.includes('--retry-missing') ? 5000 : 400;
const results = [];
for (let i = 0; i < targets.length; i++) {
  const rec = targets[i];
  process.stdout.write(`[${i + 1}/${targets.length}] ${rec.productId} ... `);
  const out = await resolveOne(rec);
  console.log(out.ok ? `OK (${out.images.length} imgs)` : `FAIL: ${out.error}`);
  results.push(out);
  await sleep(spacing);
}
// Merge with previous results when retrying.
let final = results;
try {
  const prev = JSON.parse(fs.readFileSync('data/resolved.json', 'utf-8'));
  if (process.argv.includes('--retry-missing')) {
    const byUrl = new Map(prev.results.map((r) => [r.source_url, r]));
    for (const r of results) byUrl.set(r.source_url, r);
    final = input.urls.map((u) => byUrl.get(u.url)).filter(Boolean);
  }
} catch { /* first run */ }
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/resolved.json', JSON.stringify({ date: new Date().toISOString(), results: final }, null, 2));
const ok = final.filter((r) => r.ok).length;
console.log(`Resolved ${ok}/${final.length}. Review data/resolved.json, then run the full import.`);
