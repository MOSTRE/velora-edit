import imagery from '../content/imagery.json';

export interface EditorialImage {
  src: string;
  alt: string;
  credit: string;
  source_page: string;
  placeholder: boolean;
}

const pool = (imagery as unknown as { images: Record<string, EditorialImage>; collections: Record<string, string> });

/** Sized image URL for an editorial slot. Unsplash params keep files light. */
export function editorialImage(slot: string, width = 1600): EditorialImage & { url: string } {
  const base = pool.images[slot] || pool.images.campaign;
  const url = base.src.startsWith('https://images.unsplash.com')
    ? `${base.src}?q=80&w=${width}&auto=format&fit=crop`
    : base.src;
  return { ...base, url };
}

/** Editorial hero for a collection slug (falls back to campaign). */
export function collectionImage(slug: string, width = 1600): EditorialImage & { url: string } {
  return editorialImage(pool.collections[slug] || 'campaign', width);
}

/** True while the slot still uses temporary development photography. */
export function isPlaceholder(slot: string): boolean {
  return (pool.images[slot] || pool.images.campaign).placeholder === true;
}
