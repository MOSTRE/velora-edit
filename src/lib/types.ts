export type ProductStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';

export interface Product {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  editor_note: string;
  category: string; // rings | necklaces | bracelets | earrings | chains
  collection: string[]; // e.g. under-20, quiet-luxury
  price: number | null;
  currency: string; // EUR
  original_price: number | null; // only when verified
  image_urls: string[];
  thumbnail_url: string;
  material?: string;
  color?: string;
  gender: 'women' | 'men' | 'unisex';
  tags: string[];
  ali_product_id?: string;
  affiliate_url: string | null; // must be valid before publish
  source_url?: string;
  is_featured: boolean;
  is_new: boolean;
  is_best_value: boolean;
  is_published: boolean;
  status: ProductStatus;
  editorial_score: number; // 0-100 internal only
  editor_pick?: boolean;
  seo_title?: string;
  seo_description?: string;
  og_image?: string;
  demo?: boolean; // true for clearly-marked seed/demo products
  price_freshness?: string; // ISO date of last price verification
  created_at: string;
  updated_at: string;
}

export interface Collection {
  slug: string;
  title: string;
  description: string;
  image: string;
  editorial: string;
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  image: string;
  date: string;
  read_minutes: number;
  related_slugs: string[];
}

export const CATEGORIES = [
  { slug: 'rings', title: 'Rings', description: 'Signets, bands and sculptural forms.' },
  { slug: 'necklaces', title: 'Necklaces', description: 'Pendants, chains and everyday layers.' },
  { slug: 'bracelets', title: 'Bracelets', description: 'Cuffs, bangles and quiet links.' },
  { slug: 'earrings', title: 'Earrings', description: 'Studs, hoops and small statements.' },
  { slug: 'chains', title: 'Chains', description: 'The foundation of every stack.' },
] as const;

export const COLLECTIONS: Collection[] = [
  { slug: 'under-20', title: 'The Under €20 Edit', description: 'Proof that proportion matters more than price.', image: '/images/edit-under20.svg', editorial: 'Every piece here costs less than a lunch in Paris — chosen for finish, weight of look, and ease with everything you own.' },
  { slug: 'quiet-luxury', title: 'Quiet Luxury', description: 'No logos. No noise. Just form.', image: '/images/edit-quiet.svg', editorial: 'Small details, stronger silhouette. These are the pieces that work without asking for attention.' },
  { slug: 'minimal-gold', title: 'Minimal Gold', description: 'Warm gold tones, edited to essentials.', image: '/images/edit-gold.svg', editorial: 'Chosen for proportion, finish and ease. Thin bands, soft shine, nothing excessive.' },
  { slug: 'silver-essentials', title: 'Silver Essentials', description: 'Cool-toned staples for daily wear.', image: '/images/edit-silver.svg', editorial: 'Silver keeps everything honest. Start here if you are building a first stack.' },
  { slug: 'for-him', title: 'For Him', description: 'Signets, chains and cuffs with weight.', image: '/images/edit-him.svg', editorial: "Men's jewelry without overdoing it — one strong piece is enough." },
  { slug: 'for-her', title: 'For Her', description: 'Everyday pieces with a soft finish.', image: '/images/edit-her.svg', editorial: 'The kind of pieces that work with everything, from knitwear to evening.' },
  { slug: 'everyday', title: 'Everyday Pieces', description: 'Chosen for comfort and repetition.', image: '/images/edit-everyday.svg', editorial: 'If you will wear it four days a week, it belongs here.' },
  { slug: 'date-night', title: 'Date Night', description: 'A little more polish, still quiet.', image: '/images/edit-date.svg', editorial: 'Low light loves soft metal. Keep it to two pieces.' },
  { slug: 'gift-edit', title: 'Gift Edit', description: 'Easy to give, hard to get wrong.', image: '/images/edit-gift.svg', editorial: 'Simple forms, adjustable where it matters, and always under control.' },
  { slug: 'new-finds', title: 'New Finds', description: 'The latest additions to the edit.', image: '/images/edit-new.svg', editorial: 'A rotating selection of pieces chosen for proportion, finish and everyday wear.' },
  { slug: 'best-value', title: 'Best Value', description: 'The strongest look per euro.', image: '/images/edit-value.svg', editorial: 'Not the cheapest — the most considered for what they cost.' },
];

export function formatPrice(product: Pick<Product, 'price' | 'currency'>, _mode: string = 'cached'): string {
  if (product.price == null) return 'See current price on AliExpress';
  try {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: product.currency || 'EUR' }).format(product.price);
  } catch {
    return `€${product.price.toFixed(2)}`;
  }
}

export function badgesFor(p: Product): string[] {
  const b: string[] = [];
  if (p.is_new) b.push('NEW');
  if (p.editor_pick) b.push("EDITOR'S PICK");
  if (p.is_best_value) b.push('BEST VALUE');
  if (p.price != null && p.price < 20) b.push('UNDER €20');
  return b;
}

export function isPublishable(p: Partial<Product>): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!p.title) reasons.push('missing title');
  if (!p.slug) reasons.push('missing slug');
  if (!p.affiliate_url) reasons.push('missing affiliate_url — a product must not be published without a valid affiliate destination');
  else {
    try {
      const u = new URL(p.affiliate_url);
      if (!['http:', 'https:'].includes(u.protocol)) reasons.push('affiliate_url must be http(s)');
    } catch { reasons.push('affiliate_url is not a valid URL'); }
  }
  if (!p.thumbnail_url && !(p.image_urls && p.image_urls.length)) reasons.push('missing image');
  if (p.price == null) reasons.push('missing price (or configure price mode = redirect)');
  return { ok: reasons.length === 0, reasons };
}
