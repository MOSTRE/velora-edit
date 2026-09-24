import fs from 'node:fs';

// Validates production catalog integrity:
// every PUBLISHED product needs a verified outbound destination + real images.
const products = JSON.parse(fs.readFileSync('src/content/products.json', 'utf-8'));
let errors = 0;
const slugs = new Set();
const sources = new Set();
for (const p of products) {
  if (slugs.has(p.slug)) { console.error(`duplicate slug: ${p.slug}`); errors++; }
  slugs.add(p.slug);
  if (p.source_url) {
    if (sources.has(p.source_url)) { console.error(`duplicate source_url: ${p.slug}`); errors++; }
    sources.add(p.source_url);
  }
  if (p.status === 'PUBLISHED' && p.is_published) {
    if (!p.affiliate_url && !p.source_url) { console.error(`published without outbound destination: ${p.slug}`); errors++; }
    if (!p.affiliate_url && p.affiliate_verified !== false) { console.error(`pending product not flagged: ${p.slug}`); errors++; }
  }
  if (!p.thumbnail_url && !(p.image_urls && p.image_urls.length)) {
    console.error(`missing image: ${p.slug}`); errors++;
  }
  if (p.original_price != null) {
    console.error(`original_price set on ${p.slug} — ensure it is verified, never invented`); errors++;
  }
  const mocks = [p.affiliate_url, p.source_url, p.thumbnail_url, ...(p.image_urls || [])].filter((u) => (u || '').includes('example.com'));
  if (mocks.length) { console.error(`mock URL on ${p.slug}`); errors++; }
  if (p.demo === true) { console.error(`demo-marked record in production: ${p.slug}`); errors++; }
}
console.log(`${products.length} products checked, ${errors} errors`);
process.exit(errors ? 1 : 0);
