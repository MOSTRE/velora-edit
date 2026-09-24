import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const body = `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: https://velora-edit.pages.dev/sitemap.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
};
