import type { AffiliateProvider } from './provider';
import type { Product } from '../types';

/**
 * AliExpressAffiliateProvider — OFFICIAL API ONLY.
 *
 * Uses the official AliExpress Affiliate / Portals API (server-side only).
 * Never expose APP_KEY / APP_SECRET / TRACKING_ID to the browser.
 * Never scrape product pages; never bypass anti-bot systems.
 *
 * If credentials are unavailable the app falls back to MockAffiliateProvider
 * and the admin can paste affiliate URLs manually.
 */
export class AliExpressAffiliateProvider implements AffiliateProvider {
  readonly name = 'aliexpress';
  readonly mode = 'production' as const;
  private appKey: string;
  private appSecret: string;
  private trackingId: string;
  private baseUrl: string;

  constructor(env: Record<string, string | undefined> = {}) {
    this.appKey = env.ALIPRESS_APP_KEY || env.ALIEXPRESS_APP_KEY || '';
    this.appSecret = env.ALIPRESS_APP_SECRET || env.ALIEXPRESS_APP_SECRET || '';
    this.trackingId = env.ALIPRESS_TRACKING_ID || env.ALIEXPRESS_TRACKING_ID || '';
    this.baseUrl = env.ALIPRESS_API_BASE_URL || 'https://api-sg.aliexpress.com/sync';
  }

  isConfigured(): boolean {
    return Boolean(this.appKey && this.appSecret && this.trackingId);
  }

  /** Extract the retailer product ID from an /item/ URL, or '' when absent. */
  static productIdFromUrl(url: string): string {
    try {
      const u = new URL(url);
      const m = u.pathname.match(/(\d+)\.html/);
      return m ? m[1] : '';
    } catch { return ''; }
  }

  async getProductByUrl(url: string): Promise<Partial<Product> | null> {
    const id = AliExpressAffiliateProvider.productIdFromUrl(url);
    if (!id) return null;
    return this.getProductById(id);
  }

  async getProductById(_id: string): Promise<Partial<Product> | null> {
    if (!this.isConfigured()) throw new Error('AliExpress affiliate credentials are not configured.');
    // Wire the official product-query endpoint here once credentials are granted
    // (see docs/ALIEXPRESS_SETUP.md). Never scrape product pages as a substitute.
    throw new Error('Official AliExpress product endpoint not wired — see docs/ALIEXPRESS_SETUP.md.');
  }

  /**
   * Generate a REAL tracking affiliate link via the official API.
   * Throws when unconfigured. Never synthesizes a link locally.
   */
  async generateAffiliateLink(_sourceUrl: string): Promise<{ affiliate_url: string; tracking_id: string; checked_at: string }> {
    if (!this.isConfigured()) {
      throw new Error('AliExpress affiliate credentials are not configured — product stays on its direct retailer link (pending conversion).');
    }
    // Wire the official promotion-link generation call here once credentials
    // are granted (see docs/ALIEXPRESS_SETUP.md). Do NOT invent endpoint shapes.
    throw new Error('Official AliExpress link-generation endpoint not wired — see docs/ALIEXPRESS_SETUP.md.');
  }

  async generateAffiliateUrl(_sourceUrlOrId: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('AliExpress affiliate credentials are not configured. Paste an affiliate URL manually or stay in AFFILIATE_MODE=mock.');
    }
    // NOTE: real implementation calls the official promotion-link generation endpoint
    // server-side (e.g. aliexpress.affiliate.link.generate) with signed params.
    // We deliberately do NOT invent endpoint shapes here; wire your approved
    // endpoint in this method when credentials are granted.
    throw new Error(`Official AliExpress link-generation endpoint not wired (base: ${this.baseUrl}): add your approved API call in AliExpressAffiliateProvider.generateAffiliateUrl() (server-side only).`);
  }

  async validateAffiliateUrl(url: string): Promise<{ valid: boolean; reason?: string; destination?: string }> {
    try {
      const u = new URL(url);
      if (!['http:', 'https:'].includes(u.protocol)) return { valid: false, reason: 'URL must use http(s).' };
      const host = u.hostname.toLowerCase();
      const allowed = ['aliexpress.com', 'aliexpress.us', 'a.aliexpress.com', 's.click.aliexpress.com', 'example.com'];
      const ok = allowed.some((h) => host === h || host.endsWith('.' + h));
      if (!ok) return { valid: false, reason: 'Destination should be an AliExpress (or approved test) URL. No cloaking or unrelated domains.', destination: host };
      return { valid: true, destination: host };
    } catch {
      return { valid: false, reason: 'Not a valid URL.' };
    }
  }

  async searchProducts(_keyword: string, _limit = 20): Promise<Partial<Product>[]> {
    if (!this.isConfigured()) throw new Error('Source unavailable. Try again.');
    throw new Error('Official AliExpress product-search endpoint not wired yet — use manual/CSV import until credentials are approved.');
  }

  async getProduct(_id: string): Promise<Partial<Product> | null> {
    if (!this.isConfigured()) throw new Error('Source unavailable. Try again.');
    return null;
  }
}
