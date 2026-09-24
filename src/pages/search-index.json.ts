import type { APIRoute } from 'astro';
import { getPublishedProducts } from '../lib/store';

export const GET: APIRoute = async () => {
  const products = getPublishedProducts().map((p) => ({
    id: p.id, slug: p.slug, title: p.title, category: p.category,
    price: p.price, tags: p.tags, image: p.thumbnail_url,
    gender: p.gender, color: p.color, material: p.material,
    collection: p.collection, subtitle: p.subtitle,
  }));
  return new Response(JSON.stringify({ products }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
  });
};
