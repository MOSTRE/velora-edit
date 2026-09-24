import fs from 'node:fs';
import { ROWS } from './catalog-data.mjs';

// VELORA EDIT catalog generator — exactly 100 curated demo records.
// Run: node scripts/seed.mjs  →  writes src/content/products.json (+ founders.json)

const now = Date.now();
const iso = (i) => new Date(now - i * 2 * 86400000).toISOString();
const mockUrl = (i) => `https://example.com/mock-aliexpress-product-${String(i).padStart(3, '0')}`;

if (ROWS.length !== 100) {
  console.error(`catalog-data.mjs must contain exactly 100 rows, found ${ROWS.length}`);
  process.exit(1);
}

const seen = new Set();
const products = ROWS.map((r, idx) => {
  const i = idx + 1;
  if (seen.has(r.s)) { console.error(`duplicate slug: ${r.s}`); process.exit(1); }
  seen.add(r.s);
  const genderLabel = r.g === 'unisex' ? 'Unisex' : r.g === 'men' ? "Men's" : "Women's";
  const isMockTest = r.s === 'mock-gold-ring';
  const created = iso(idx);
  // New-flagged pieces always belong to New Arrivals; legacy aliases stay as tagged.
  const collection = Array.from(new Set([...r.coll, ...(r.N ? ['new-arrivals'] : [])]));
  return {
    id: `seed-${String(i).padStart(3, '0')}`,
    slug: r.s,
    title: r.n.toUpperCase(),
    subtitle: `${r.col[0].toUpperCase() + r.col.slice(1)}-tone · ${genderLabel}`,
    description: `${r.n} — ${r.d}`,
    editor_note: r.note,
    category: r.c,
    collection,
    price: r.p,
    currency: 'EUR',
    original_price: null,
    image_urls: [`/images/p-${String(i).padStart(3, '0')}-main.svg`, `/images/p-${String(i).padStart(3, '0')}-alt.svg`],
    thumbnail_url: `/images/p-${String(i).padStart(3, '0')}-main.svg`,
    material: r.mat,
    color: r.col,
    gender: r.g,
    tags: r.t,
    ali_product_id: `mock-${String(i).padStart(4, '0')}`,
    affiliate_url: isMockTest ? 'https://example.com/test-affiliate' : mockUrl(i),
    source_url: '',
    is_featured: Boolean(r.F),
    is_new: Boolean(r.N),
    is_best_value: Boolean(r.B),
    is_limited: Boolean(r.L),
    is_published: true,
    status: 'PUBLISHED',
    editorial_score: r.sc,
    editor_pick: Boolean(r.P),
    seo_title: `${r.n} — Curated Jewelry | VELORA EDIT`,
    seo_description: `${r.n}: a curated ${r.c.slice(0, -1)} with a quiet-luxury point of view. See current price on AliExpress via VELORA EDIT.`,
    og_image: `/images/p-${String(i).padStart(3, '0')}-main.svg`,
    demo: true,
    price_freshness: created,
    created_at: created,
    updated_at: created,
  };
});

fs.mkdirSync('src/content', { recursive: true });
fs.writeFileSync('src/content/products.json', JSON.stringify(products, null, 2));

// Founders content (editable via /admin/founders; bios are placeholders, no invented history)
const founders = [
  {
    id: 'sanae',
    name: 'Sanae',
    role: 'Co-Founder & Creative Director',
    bio: 'Sanae brings the creative direction behind VELORA EDIT, with a focus on visual identity, styling and the small details that make a piece feel distinctive.',
    quote: 'Beauty doesn’t need to be loud to be noticed.',
    portrait: '/images/founder-sanae.svg',
    socials: { instagram: '', tiktok: '', pinterest: '' },
    order: 1,
    published: true,
  },
  {
    id: 'salma',
    name: 'Salma',
    role: 'Co-Founder & Brand Director',
    bio: 'Salma shapes the brand experience behind VELORA EDIT, from the pieces we discover to the way they are presented, making every collection feel intentional and easy to explore.',
    quote: 'Good style is often found in the details people almost miss.',
    portrait: '/images/founder-salma.svg',
    socials: { instagram: '', tiktok: '', pinterest: '' },
    order: 2,
    published: true,
  },
];
fs.writeFileSync('src/content/founders.json', JSON.stringify(founders, null, 2));

// Category / gender balance report
const byCat = {};
const byGender = {};
for (const p of products) {
  byCat[p.category] = (byCat[p.category] || 0) + 1;
  byGender[p.gender] = (byGender[p.gender] || 0) + 1;
}
console.log(`seeded ${products.length} products + ${founders.length} founders`);
console.log('by category:', JSON.stringify(byCat));
console.log('by gender:', JSON.stringify(byGender));
