import fs from 'node:fs';

const now = new Date().toISOString();
const img = (n) => `/images/product-${String(((n - 1) % 12) + 1).padStart(2, '0')}.svg`;
const img2 = (n) => `/images/product-${String(((n + 3) % 12) + 1).padStart(2, '0')}.svg`;
const mock = (slug) => `https://example.com/mock-affiliate?to=${slug}&utm_source=velora-edit&utm_medium=affiliate`;

// [title, slug, category, price, original(null), gender, color, material, collections[], tags[], featured, new, bestValue, editorPick, score]
const rows = [
  ['Noir Signet', 'noir-signet', 'rings', 14.90, null, 'men', 'black', 'Black ion-plated stainless steel', ['quiet-luxury', 'for-him', 'everyday', 'best-value'], ['signet', 'minimal'], true, false, true, true, 92],
  ['Luna Ring', 'luna-ring', 'rings', 11.40, null, 'women', 'gold', 'Gold-tone stainless steel', ['minimal-gold', 'under-20', 'for-her', 'everyday'], ['band', 'minimal'], true, true, false, false, 88],
  ['Aurelia Chain', 'aurelia-chain', 'chains', 17.42, null, 'women', 'gold', 'Gold-tone stainless steel', ['minimal-gold', 'under-20', 'for-her', 'best-value'], ['chain', 'layering'], true, false, true, true, 94],
  ['Forma Bracelet', 'forma-bracelet', 'bracelets', 13.20, null, 'unisex', 'gold', 'Gold-tone stainless steel', ['minimal-gold', 'under-20', 'everyday'], ['cuff', 'minimal'], true, false, false, false, 86],
  ['Serein Earrings', 'serein-earrings', 'earrings', 9.80, null, 'women', 'gold', 'Gold-tone alloy, nickel-free posts', ['under-20', 'for-her', 'everyday', 'best-value'], ['studs'], true, true, true, false, 90],
  ['Arc Pendant', 'arc-pendant', 'necklaces', 16.90, null, 'women', 'gold', 'Gold-tone stainless steel', ['minimal-gold', 'under-20', 'for-her'], ['pendant'], true, false, false, true, 89],
  ['Mira Ring', 'mira-ring', 'rings', 12.60, null, 'women', 'silver', 'Silver-tone stainless steel', ['silver-essentials', 'under-20', 'everyday'], ['stacking'], false, true, false, false, 84],
  ['Élan Chain', 'elan-chain', 'chains', 19.90, null, 'men', 'silver', 'Silver-tone stainless steel', ['for-him', 'silver-essentials', 'under-20'], ['cuban', 'chain'], false, false, true, false, 87],
  ['Noma Bracelet', 'noma-bracelet', 'bracelets', 10.90, null, 'women', 'silver', 'Silver-tone stainless steel', ['silver-essentials', 'under-20'], ['bangle'], false, true, false, false, 82],
  ['Aster Necklace', 'aster-necklace', 'necklaces', 21.50, null, 'women', 'gold', 'Gold-tone stainless steel', ['minimal-gold', 'date-night', 'for-her'], ['statement', 'pendant'], false, false, false, true, 85],
  ['Céline Band', 'celine-band', 'rings', 8.90, null, 'women', 'gold', 'Gold-tone stainless steel', ['under-20', 'best-value'], ['band'], false, false, true, false, 81],
  ['Onyx Cuff', 'onyx-cuff', 'bracelets', 18.70, null, 'men', 'black', 'Black ion-plated stainless steel', ['for-him', 'quiet-luxury', 'date-night'], ['cuff'], false, false, false, true, 88],
  ['Petite Hoops', 'petite-hoops', 'earrings', 10.40, null, 'women', 'gold', 'Gold-tone stainless steel', ['under-20', 'everyday', 'for-her'], ['hoops'], false, false, false, false, 83],
  ['Chaîne Fine', 'chaine-fine', 'chains', 15.60, null, 'unisex', 'gold', 'Gold-tone stainless steel', ['minimal-gold', 'everyday'], ['chain'], false, true, false, false, 84],
  ['Vela Pendant', 'vela-pendant', 'necklaces', 14.20, null, 'women', 'silver', 'Silver-tone stainless steel', ['silver-essentials', 'under-20'], ['pendant'], false, false, false, false, 80],
  ['Sceau Ring', 'sceau-ring', 'rings', 16.10, null, 'men', 'gold', 'Gold-tone stainless steel', ['for-him', 'quiet-luxury'], ['signet'], false, false, false, false, 83],
  ['Ivoire Studs', 'ivoire-studs', 'earrings', 7.90, null, 'women', 'silver', 'Silver-tone alloy, nickel-free posts', ['under-20', 'best-value', 'silver-essentials'], ['studs'], false, false, true, false, 82],
  ['Rivière Bracelet', 'riviere-bracelet', 'bracelets', 22.90, null, 'women', 'gold', 'Gold-tone stainless steel', ['date-night', 'gift-edit', 'for-her'], ['tennis', 'gift'], false, false, false, true, 86],
  ['Col Sertie', 'col-sertie', 'necklaces', 19.40, null, 'women', 'gold', 'Gold-tone stainless steel', ['date-night', 'minimal-gold'], ['necklace'], false, true, false, false, 85],
  ['Anneau Double', 'anneau-double', 'rings', 13.80, null, 'women', 'gold', 'Gold-tone stainless steel', ['minimal-gold', 'everyday'], ['stacking'], false, false, false, false, 81],
  ['Maillon Chain', 'maillon-chain', 'chains', 24.90, null, 'men', 'gold', 'Gold-tone stainless steel', ['for-him', 'date-night'], ['chain'], false, false, false, false, 84],
  ['Halo Hoops', 'halo-hoops', 'earrings', 12.90, null, 'women', 'silver', 'Silver-tone stainless steel', ['silver-essentials', 'everyday'], ['hoops'], false, false, false, false, 80],
  ['Grain Bracelet', 'grain-bracelet', 'bracelets', 11.90, null, 'unisex', 'gold', 'Gold-tone stainless steel', ['under-20', 'everyday'], ['beaded'], false, false, true, false, 82],
  ['Soleil Pendant', 'soleil-pendant', 'necklaces', 15.20, null, 'women', 'gold', 'Gold-tone stainless steel', ['gift-edit', 'for-her'], ['pendant', 'gift'], false, false, false, false, 83],
  ['Dôme Ring', 'dome-ring', 'rings', 17.90, null, 'women', 'gold', 'Gold-tone stainless steel', ['quiet-luxury', 'date-night'], ['dome'], false, false, false, true, 87],
  ['Lien Cuff', 'lien-cuff', 'bracelets', 16.60, null, 'men', 'silver', 'Silver-tone stainless steel', ['for-him', 'silver-essentials'], ['cuff'], false, true, false, false, 83],
  ['Perle Studs', 'perle-studs', 'earrings', 9.20, null, 'women', 'white', 'Glass pearl, gold-tone posts', ['under-20', 'gift-edit', 'for-her'], ['pearl', 'gift'], false, false, false, false, 81],
  ['Chaîne Gourmette', 'chaine-gourmette', 'chains', 21.90, null, 'unisex', 'silver', 'Silver-tone stainless steel', ['silver-essentials', 'everyday'], ['chain'], false, false, false, false, 82],
  ['Bague Fine', 'bague-fine', 'rings', 9.90, null, 'women', 'gold', 'Gold-tone stainless steel', ['under-20', 'best-value', 'everyday'], ['band', 'gift'], false, false, true, false, 84],
  ['Mock Gold Ring', 'mock-gold-ring', 'rings', 12.00, null, 'unisex', 'gold', 'Gold-tone stainless steel (demo)', ['new-finds', 'under-20'], ['demo', 'test'], false, true, false, false, 75],
];

const desc = {
  'rings': 'A clean silhouette with a comfortable fit — easy to wear alone or stacked.',
  'necklaces': 'A balanced length that sits well on its own and layers without tangling.',
  'bracelets': 'A quiet wrist piece with a smooth finish and easy proportions.',
  'earrings': 'Light on the ear with a neat finish — made for daily wear.',
  'chains': 'An even link with a soft shine — the base of any good stack.',
};

const notes = [
  'We picked it for proportion and finish — it reads far more considered than its price.',
  'Chosen for everyday wear: comfortable, quiet, and easy with everything you own.',
  'A strong look-per-euro: neat edges, even tone, nothing excessive.',
];

const products = rows.map((r, i) => {
  const [title, slug, category, price, original, gender, color, material, collections, tags, featured, isNew, best, pick, score] = r;
  const subtitle = `${color[0].toUpperCase() + color.slice(1)}-tone · ${gender === 'unisex' ? 'Unisex' : gender === 'men' ? "Men's" : "Women's"}`;
  return {
    id: `seed-${String(i + 1).padStart(2, '0')}`,
    slug,
    title: title.toUpperCase(),
    subtitle,
    description: `${title} — ${desc[category]} Designed in a ${color}-tone finish that keeps its look with regular wear.`,
    editor_note: notes[i % notes.length],
    category,
    collection: collections,
    price,
    currency: 'EUR',
    original_price: original,
    image_urls: [img(i + 1), img2(i + 1)],
    thumbnail_url: img(i + 1),
    material,
    color,
    gender,
    tags,
    ali_product_id: '',
    affiliate_url: slug === 'mock-gold-ring' ? 'https://example.com/test-affiliate' : mock(slug),
    source_url: '',
    is_featured: featured,
    is_new: isNew,
    is_best_value: best,
    is_published: true,
    status: 'PUBLISHED',
    editorial_score: score,
    editor_pick: pick,
    seo_title: `${title} — Curated Jewelry | VELORA EDIT`,
    seo_description: `${title}: a curated ${category.slice(0, -1)} with a quiet-luxury point of view. See current price on AliExpress via VELORA EDIT.`,
    og_image: img(i + 1),
    demo: true,
    price_freshness: now,
    created_at: now,
    updated_at: now,
  };
});

fs.mkdirSync('src/content', { recursive: true });
fs.writeFileSync('src/content/products.json', JSON.stringify(products, null, 2));

const articles = [
  {
    slug: 'minimal-jewelry-stack',
    title: 'How to Build a Minimal Jewelry Stack',
    excerpt: 'Three pieces, one logic: proportion first, shine second.',
    body: [
      'Start with a base that disappears: a fine chain, a thin band, a small stud. These are the pieces you never take off, so they should feel like nothing.',
      'Add one piece with intent — a signet, a pendant, a cuff. This is the silhouette-maker. Keep it to one per stack.',
      'Match tones, not sets. All gold-tone or all silver-tone reads calmer than a mixed set trying too hard.',
      'Our rule: if you notice a third piece before the outfit, remove one. Small details, stronger silhouette.',
    ],
    image: '/images/journal-1.svg',
    date: '2026-09-01',
    read_minutes: 4,
    related_slugs: ['aurelia-chain', 'luna-ring', 'serein-earrings'],
  },
  {
    slug: 'five-pieces-everything',
    title: '5 Jewelry Pieces That Work With Everything',
    excerpt: 'The short list we return to every season.',
    body: [
      'A fine chain goes over knitwear and under tailoring. It is the hardest-working piece you own.',
      'A signet gives the hand structure without a single logo.',
      'Small hoops frame the face in every light — day, office, evening.',
      'A thin band stacks with anything and never competes.',
      'A quiet cuff finishes a sleeve. Two pieces maximum with tailoring.',
    ],
    image: '/images/journal-2.svg',
    date: '2026-08-20',
    read_minutes: 5,
    related_slugs: ['noir-signet', 'chaine-fine', 'petite-hoops', 'celine-band'],
  },
  {
    slug: 'affordable-look-expensive',
    title: 'How to Make Affordable Jewelry Look More Expensive',
    excerpt: 'Finish, proportion and restraint do the heavy lifting.',
    body: [
      'Choose smooth over busy. Clean edges and even tone read expensive; texture busy-ness reads cheap.',
      'Keep the scale honest. Thin does not mean flimsy — it means intentional.',
      'One tone at a time. Mixed metals can work, but a single tone is the fastest route to quiet.',
      'Mind the details: secure closures, neat posts, no sharp edges. That is what the eye registers as quality.',
    ],
    image: '/images/journal-3.svg',
    date: '2026-08-08',
    read_minutes: 4,
    related_slugs: ['dome-ring', 'arc-pendant', 'forma-bracelet'],
  },
  {
    slug: 'mens-jewelry-guide',
    title: "Men's Jewelry Without Overdoing It",
    excerpt: 'One strong piece is enough.',
    body: [
      'Start with weight: a signet or a chain with presence. One is a statement; three is a costume.',
      'Black and silver tones sit easiest with most wardrobes.',
      'Match metal to context: silver for day, deeper tones for evening.',
      'Fit matters more than size. A cuff should move slightly; a ring should turn with effort.',
    ],
    image: '/images/journal-4.svg',
    date: '2026-07-28',
    read_minutes: 4,
    related_slugs: ['noir-signet', 'elan-chain', 'onyx-cuff'],
  },
  {
    slug: 'understanding-gold-tone',
    title: 'Understanding Gold-Tone Jewelry',
    excerpt: 'What gold-tone means, and how to wear it well.',
    body: [
      'Gold-tone describes the finish, not solid gold. It gives the warmth of gold at a fraction of the cost.',
      'Stainless-steel bases hold tone well with regular wear; keep pieces dry and store them separately.',
      'Style it softly: gold-tone loves cream, camel, navy and black.',
      'When a listing is vague about materials, we say so — and price expectations accordingly.',
    ],
    image: '/images/journal-5.svg',
    date: '2026-07-15',
    read_minutes: 3,
    related_slugs: ['aurelia-chain', 'soleil-pendant', 'grain-bracelet'],
  },
];
fs.writeFileSync('src/content/articles.json', JSON.stringify(articles, null, 2));
console.log(`seeded ${products.length} products, ${articles.length} articles`);
