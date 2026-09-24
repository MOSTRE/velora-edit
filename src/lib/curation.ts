import type { Product } from './types';

export interface FilterInput {
  maxPrice?: number;
  minPrice?: number;
  category?: string;
  requireImages?: boolean;
  requireDescription?: boolean;
  requireAffiliateUrl?: boolean;
  requireShipping?: boolean; // informational only — never fabricated
}

export interface ScoreBreakdown {
  image_quality_score: number; // 0-25
  price_score: number; // 0-25
  description_score: number; // 0-25
  product_completeness_score: number; // 0-25
  total: number; // 0-100
}

/** Editorial score — internal sorting only, never shown as customer rating. */
export function scoreProduct(p: Partial<Product>): ScoreBreakdown {
  const images = p.image_urls?.length ?? 0;
  const image_quality_score = images >= 3 ? 25 : images === 2 ? 20 : images === 1 ? 14 : 0;

  const price = p.price ?? null;
  let price_score = 0;
  if (price != null) {
    if (price < 20) price_score = 25;
    else if (price < 35) price_score = 20;
    else if (price < 60) price_score = 14;
    else price_score = 8;
  }

  const descLen = (p.description || '').length;
  const description_score = descLen > 220 ? 25 : descLen > 120 ? 20 : descLen > 40 ? 12 : 0;

  let completeness = 0;
  if (p.title) completeness += 5;
  if (p.slug) completeness += 5;
  if (p.category) completeness += 4;
  if (p.material) completeness += 4;
  if (p.affiliate_url) completeness += 7;
  const product_completeness_score = Math.min(25, completeness);

  const total = image_quality_score + price_score + description_score + product_completeness_score;
  return { image_quality_score, price_score, description_score, product_completeness_score, total };
}

export interface FilterVerdict { pass: boolean; reasons: string[] }

/** Automatic filtering engine — never fabricates missing data. */
export function filterProduct(p: Partial<Product>, f: FilterInput = {}): { pass: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (f.requireAffiliateUrl !== false && !p.affiliate_url) reasons.push('missing affiliate_url');
  if (f.requireImages !== false && !(p.image_urls?.length || p.thumbnail_url)) reasons.push('missing image');
  if (f.requireDescription !== false && !(p.description && p.description.length >= 40)) reasons.push('weak description');
  if (f.maxPrice != null && p.price != null && p.price > f.maxPrice) reasons.push(`price ${p.price} above max ${f.maxPrice}`);
  if (f.minPrice != null && p.price != null && p.price < f.minPrice) reasons.push(`price ${p.price} below min ${f.minPrice}`);
  if (f.category && p.category !== f.category) reasons.push(`category ${p.category} != ${f.category}`);
  return { pass: reasons.length === 0, reasons };
}

/** Discovery pipeline: validate → normalize → dedupe → filter → score → DRAFT. Never auto-publish. */
export function toDraft(input: Partial<Product>, existingSlugs: Set<string>): { draft: Partial<Product>; verdict: { pass: boolean; reasons: string[] }; score: ScoreBreakdown } {
  const slug = (input.slug || input.title || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
  let unique = slug;
  let n = 2;
  while (existingSlugs.has(unique)) unique = `${slug}-${n++}`;
  const draft: Partial<Product> = {
    ...input,
    slug: unique,
    status: 'DRAFT',
    is_published: false,
    currency: input.currency || 'EUR',
    tags: input.tags || [],
    collection: (input.collection as string[]) || [],
    updated_at: new Date().toISOString(),
    created_at: (input.created_at as string) || new Date().toISOString(),
  };
  const score = scoreProduct(draft);
  draft.editorial_score = score.total;
  const verdict = filterProduct(draft);
  return { draft, verdict, score };
}
