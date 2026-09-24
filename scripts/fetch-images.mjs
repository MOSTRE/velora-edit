import fs from 'node:fs';
import path from 'node:path';

// Downloads verified retailer gallery images for local serving.
// Only URLs already present in data/resolved.json (retrieved from the
// approved source pages) are fetched. Failures are reported, never faked.
// Usage: node scripts/fetch-images.mjs  →  public/images/real/ + data/image-report.json

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const dump = JSON.parse(fs.readFileSync('data/resolved.json', 'utf-8'));
const dir = 'public/images/real';
fs.mkdirSync(dir, { recursive: true });

const report = [];
let n = 0;
for (const rec of dump.results.filter((r) => r.ok)) {
  n++;
  const files = [];
  // og:image first (primary), then gallery, max 3.
  const urls = [rec.image, ...rec.images].filter(Boolean).filter((u, i, a) => a.indexOf(u) === i).slice(0, 3);
  const letters = ['a', 'b', 'c'];
  for (let i = 0; i < urls.length; i++) {
    const file = `ali-${String(n).padStart(3, '0')}-${letters[i]}.jpg`;
    try {
      const r = await fetch(urls[i], { headers: { 'User-Agent': UA }, redirect: 'follow' });
      const ct = r.headers.get('content-type') || '';
      const buf = Buffer.from(await r.arrayBuffer());
      if (r.ok && ct.includes('image') && buf.length > 8000) {
        fs.writeFileSync(path.join(dir, file), buf);
        files.push(`/images/real/${file}`);
        console.log(`ok  ${rec.product_id} ${file} (${Math.round(buf.length / 1024)}kb)`);
      } else {
        console.log(`bad ${rec.product_id} ${file} (status ${r.status}, ${ct}, ${buf.length}b)`);
      }
    } catch (e) { console.log(`fail ${rec.product_id} ${file}: ${e.message}`); }
    await sleep(300);
  }
  report.push({ product_id: rec.product_id, source_url: rec.source_url, files, image_ok: files.length > 0 });
}
fs.writeFileSync('data/image-report.json', JSON.stringify({ date: new Date().toISOString(), report }, null, 2));
const good = report.filter((r) => r.image_ok).length;
console.log(`Images OK for ${good}/${report.length} products.`);
