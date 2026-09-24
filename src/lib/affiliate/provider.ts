import type { Product } from '../types';

/** Affiliate provider abstraction — all affiliate logic lives under src/lib/affiliate/. */
export interface AffiliateProvider {
  readonly name: string;
  readonly mode: 'mock' | 'production';
  /** Resolve an approved product record by its retailer URL. */
  getProductByUrl(url: string): Promise<Partial<Product> | null>;
  /** Resolve an approved product record by retailer product ID. */
  getProductById(id: string): Promise<Partial<Product> | null>;
  searchProducts(keyword: string, limit?: number): Promise<Partial<Product>[]>;
  /** Generate a real tracking affiliate link. Never invent one. */
  generateAffiliateLink(sourceUrl: string): Promise<{ affiliate_url: string; tracking_id: string; checked_at: string }>;
  /** Legacy alias — prefer generateAffiliateLink for new code. */
  generateAffiliateUrl(sourceUrlOrId: string): Promise<string>;
  validateAffiliateUrl(url: string): Promise<{ valid: boolean; reason?: string; destination?: string }>;
  getProduct(id: string): Promise<Partial<Product> | null>;
}

function envVar(key: string): string | undefined {
  try {
    const meta = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    if (meta && meta[key]) return meta[key];
  } catch { /* ignore */ }
  try {
    const g = globalThis as unknown as { process?: { env?: Record<string, string | undefined> } };
    return g.process?.env?.[key];
  } catch { return undefined; }
}

export function getAffiliateMode(): 'mock' | 'production' {
  const m = (envVar('AFFILIATE_MODE') || 'mock').toLowerCase();
  return m === 'production' ? 'production' : 'mock';
}

export async function getProvider(): Promise<AffiliateProvider> {
  const mode = getAffiliateMode();
  if (mode === 'production') {
    const { AliExpressAffiliateProvider } = await import('./aliexpress');
    const p = new AliExpressAffiliateProvider();
    if (p.isConfigured()) return p;
    // Fall back to mock rather than failing the entire site.
    console.warn('[affiliate] production mode requested but credentials missing — falling back to mock provider');
  }
  const { MockAffiliateProvider } = await import('./mock');
  return new MockAffiliateProvider();
}

// Sync helper for static pages (no async import at build for mock).
export function affiliateModeSync(): 'mock' | 'production' {
  return getAffiliateMode();
}
