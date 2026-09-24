import products from '../content/products.json';
import articles from '../content/articles.json';
import founders from '../content/founders.json';
import type { Product, Article, Collection, Founder } from './types';
import { COLLECTIONS } from './types';

const all = products as unknown as Product[];
const arts = articles as unknown as Article[];

export function getPublishedProducts(): Product[] {
  return all.filter((p) => p.is_published && p.status === 'PUBLISHED' && p.affiliate_url);
}

export function getProductBySlug(slug: string): Product | undefined {
  return all.find((p) => p.slug === slug);
}

export function getRelated(product: Product, n = 4): Product[] {
  const pub = getPublishedProducts().filter((p) => p.slug !== product.slug);
  const scored = pub.map((p) => ({
    p,
    s: (p.category === product.category ? 3 : 0) +
      p.collection.filter((c) => product.collection.includes(c)).length * 2 +
      (p.gender === product.gender ? 1 : 0),
  }));
  return scored.sort((x, y) => y.s - x.s).slice(0, n).map((x) => x.p);
}

export function getByCollection(slug: string): Product[] {
  return getPublishedProducts().filter((p) => p.collection.includes(slug));
}

export function getByCategory(slug: string): Product[] {
  return getPublishedProducts().filter((p) => p.category === slug);
}

export function getCollection(slug: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}

export function searchAll(q: string, limit = 12): { products: Product[]; collections: Collection[]; categories: { slug: string; title: string }[] } {
  const query = q.trim().toLowerCase();
  if (!query) return { products: [], collections: [], categories: [] };
  const words = query.split(/\s+/);
  const match = (t: string) => words.every((w) => t.toLowerCase().includes(w));
  const productsFound = getPublishedProducts()
    .filter((p) => match(`${p.title} ${p.category} ${p.tags.join(' ')} ${p.description}`))
    .slice(0, limit);
  const collections = COLLECTIONS.filter((c) => match(`${c.title} ${c.description}`)).slice(0, 4);
  const cats = [
    { slug: 'rings', title: 'Rings' },
    { slug: 'necklaces', title: 'Necklaces' },
    { slug: 'bracelets', title: 'Bracelets' },
    { slug: 'earrings', title: 'Earrings' },
    { slug: 'chains', title: 'Chains' },
  ].filter((c) => match(c.title)).slice(0, 5);
  return { products: productsFound, collections, categories: cats };
}

export function getArticles(): Article[] { return arts; }
export function getArticle(slug: string): Article | undefined { return arts.find((a) => a.slug === slug); }

const foundersAll = founders as unknown as Founder[];

export function getFounders(): Founder[] {
  return foundersAll.filter((f) => f.published).sort((a, b) => a.order - b.order);
}

export function getFounder(id: string): Founder | undefined {
  return foundersAll.find((f) => f.id === id);
}
