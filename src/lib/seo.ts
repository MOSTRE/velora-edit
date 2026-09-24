/** SEO helpers — no fake review/rating structured data, ever. */
const SITE = 'https://velora-edit.pages.dev';

export function canonical(path: string): string {
  return SITE + (path === '/' ? '/' : path);
}

export function productJsonLd(p: { title: string; description: string; image_urls: string[]; price: number | null; currency: string; slug: string }): string {
  // Product schema only for supported data (no reviews/offers fabrication).
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    description: p.description.slice(0, 300),
    image: p.image_urls.map((u) => (u.startsWith('http') ? u : SITE + u)),
    url: `${SITE}/product/${p.slug}`,
  };
  if (p.price != null) {
    data.offers = {
      '@type': 'Offer',
      priceCurrency: p.currency || 'EUR',
      price: p.price,
      availability: 'https://schema.org/InStock',
    };
  }
  return JSON.stringify(data);
}

export function orgJsonLd(): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'VELORA EDIT',
    url: SITE,
    slogan: 'Curated jewelry that looks more expensive than it is.',
    sameAs: ['https://instagram.com/', 'https://tiktok.com/', 'https://pinterest.com/'],
  });
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: SITE + it.url,
    })),
  });
}

export function articleJsonLd(a: { title: string; excerpt: string; image: string; slug: string; date: string }): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.excerpt,
    image: [a.image.startsWith('http') ? a.image : SITE + a.image],
    datePublished: a.date,
    author: { '@type': 'Organization', name: 'VELORA EDIT' },
    mainEntityOfPage: `${SITE}/journal/${a.slug}`,
  });
}
