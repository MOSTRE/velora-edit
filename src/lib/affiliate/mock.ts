import type { AffiliateProvider } from './provider';
import type { Product } from '../types';

/** MockAffiliateProvider — development/demo. Clearly-marked mock destinations. */
export class MockAffiliateProvider implements AffiliateProvider {
  readonly name = 'mock';
  readonly mode = 'mock' as const;

  async generateAffiliateUrl(sourceUrlOrId: string): Promise<string> {
    const id = encodeURIComponent(sourceUrlOrId.trim().slice(0, 120) || 'demo');
    return `https://example.com/mock-affiliate?to=${id}&utm_source=velora-edit&utm_medium=affiliate`;
  }

  async validateAffiliateUrl(url: string): Promise<{ valid: boolean; reason?: string; destination?: string }> {
    try {
      const u = new URL(url);
      if (!['http:', 'https:'].includes(u.protocol)) return { valid: false, reason: 'URL must use http(s).' };
      return { valid: true, destination: u.hostname };
    } catch {
      return { valid: false, reason: 'Not a valid URL.' };
    }
  }

  async searchProducts(keyword: string, limit = 12): Promise<Partial<Product>[]> {
    // Deterministic demo results derived from local seed scale — never presented as live API data.
    const { default: seed } = await import('../../content/products.json');
    const k = keyword.toLowerCase();
    return (seed as Product[])
      .filter((p) => (p.title + ' ' + p.category + ' ' + p.tags.join(' ')).toLowerCase().includes(k))
      .slice(0, limit)
      .map((p) => ({ ...p, status: 'DRAFT' as const, is_published: false }));
  }

  async getProduct(id: string): Promise<Partial<Product> | null> {
    const { default: seed } = await import('../../content/products.json');
    return ((seed as Product[]).find((p) => p.id === id || p.slug === id) as Partial<Product>) ?? null;
  }
}
