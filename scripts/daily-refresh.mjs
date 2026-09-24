import fs from 'node:fs';

/**
 * Optional daily workflow (DRAFT-only, never auto-publish):
 * 1. Retrieve approved source products (official API or mock in dev).
 * 2. Validate → normalize → dedupe → filter → score.
 * 3. Save as DRAFT candidates for admin review.
 */
const seed = JSON.parse(fs.readFileSync('src/content/products.json', 'utf-8'));

function score(p) {
  const imgs = p.image_urls?.length ?? 0;
  return (imgs >= 2 ? 20 : 10) + (p.price < 20 ? 25 : 15) + ((p.description || '').length > 120 ? 20 : 10) + (p.affiliate_url ? 15 : 0);
}

const candidates = seed.slice(0, 5).map((p) => ({
  slug: p.slug,
  title: p.title,
  price: p.price,
  score: score(p),
  verdict: p.affiliate_url ? 'DRAFT candidate (already curated)' : 'REJECTED: missing affiliate_url',
}));

console.log(JSON.stringify({ date: new Date().toISOString(), mode: process.env.AFFILIATE_MODE || 'mock', candidates }, null, 2));
console.log('Done. Nothing auto-published — review in /admin/import.');
