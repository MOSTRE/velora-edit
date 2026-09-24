import type { APIRoute } from 'astro';
import { getPublishedProducts, getArticles } from '../lib/store';
import { COLLECTIONS, CATEGORIES } from '../lib/types';

const SITE = 'https://velora-edit.pages.dev';

export const GET: APIRoute = async () => {
  const urls = [
    '', '/jewelry', '/edits', '/journal', '/new', '/about', '/contact',
    '/privacy', '/terms', '/affiliate-disclosure',
    ...CATEGORIES.map((c) => `/jewelry/${c.slug}`),
    ...COLLECTIONS.map((c) => `/edit/${c.slug}`),
    ...getPublishedProducts().map((p) => `/product/${p.slug}`),
    ...getArticles().map((a) => `/journal/${a.slug}`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}${u === '' ? '/' : u}</loc><changefreq>weekly</changefreq></url>`).join('\n')}\n</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
