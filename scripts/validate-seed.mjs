import fs from 'node:fs';

// Validates seed integrity: every PUBLISHED product needs affiliate_url + image.
const products = JSON.parse(fs.readFileSync('src/content/products.json', 'utf-8'));
let errors = 0;
const slugs = new Set();
for (const p of products) {
  if (slugs.has(p.slug)) { console.error(`duplicate slug: ${p.slug}`); errors++; }
  slugs.add(p.slug);
  if (p.status === 'PUBLISHED' && p.is_published && !p.affiliate_url) {
    console.error(`published without affiliate_url: ${p.slug}`); errors++;
  }
  if (!p.thumbnail_url && !(p.image_urls && p.image_urls.length)) {
    console.error(`missing image: ${p.slug}`); errors++;
  }
  if (p.original_price != null) {
    console.error(`original_price set on ${p.slug} — ensure it is verified, never invented`); errors++;
  }
}
console.log(`${products.length} products checked, ${errors} errors`);
process.exit(errors ? 1 : 0);
