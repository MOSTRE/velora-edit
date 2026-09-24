import type { AffiliateProvider } from './provider';
import type { Product } from '../types';

/**
 * AliExpressAffiliateProvider — OFFICIAL gateway API only.
 *
 * Talks to the AliExpress Open Platform gateway (TOP-style signed requests):
 *   POST {baseUrl}  (api-sg.aliexpress.com/sync unless overridden)
 *   methods: aliexpress.affiliate.productdetail.get,
 *            aliexpress.affiliate.link.generate
 *   signing: sort params, concat key+value, wrap with app secret,
 *            MD5 hex UPPERCASE, timestamp in GMT+8 (yyyy-MM-dd HH:mm:ss).
 *
 * Server-side only. Never expose APP_KEY / APP_SECRET / TRACKING_ID to the
 * browser. Never scrape product pages; never bypass anti-bot systems.
 * Without credentials every network method throws and callers keep the
 * direct retailer link (pending conversion).
 */

// Compact MD5 (public-domain style implementation) so this module stays
// dependency-free and isomorphic (WebCrypto has no MD5).
function md5cycle(x: number[], k: number[]): void {
  const [a0, b0, c0, d0] = x;
  const s = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
  const K = [0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821, 0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x2441453, 0xd8a1e681, 0xe7d3fbc8, 0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x4881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665, 0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391];
  let [a, b, c, d] = [a0, b0, c0, d0];
  for (let i = 0; i < 64; i++) {
    let f: number; let g: number;
    if (i < 16) { f = (b & c) | (~b & d); g = i; }
    else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
    else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; }
    else { f = c ^ (b | ~d); g = (7 * i) % 16; }
    f = (f + a + K[i] + k[g]) | 0;
    a = d; d = c; c = b;
    b = (b + (((f << s[i]) | (f >>> (32 - s[i]))) | 0)) | 0;
  }
  x[0] = (x[0] + a) | 0; x[1] = (x[1] + b) | 0; x[2] = (x[2] + c) | 0; x[3] = (x[3] + d) | 0;
}

export function md5Hex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const bitLen = bytes.length * 8;
  const withOne = new Uint8Array(bytes.length + 1);
  withOne.set(bytes); withOne[bytes.length] = 0x80;
  let len = withOne.length;
  while (len % 64 !== 56) len++;
  const padded = new Uint8Array(len + 8);
  padded.set(withOne);
  const view = new DataView(padded.buffer);
  view.setUint32(len, bitLen >>> 0, true);
  view.setUint32(len + 4, Math.floor(bitLen / 0x100000000), true);
  const state = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
  for (let off = 0; off < len; off += 64) {
    const block = new Array<number>(16);
    for (let i = 0; i < 16; i++) block[i] = view.getUint32(off + i * 4, true) | 0;
    md5cycle(state, block);
  }
  // MD5 digest is little-endian per word: emit low byte first.
  const le = (n: number): string => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]
    .map((b) => b.toString(16).padStart(2, '0')).join('');
  return state.map(le).join('');
}

/** GMT+8 timestamp in yyyy-MM-dd HH:mm:ss (gateway allows ±10 min skew). */
export function gatewayTimestamp(d = new Date()): string {
  const gmt8 = new Date(d.getTime() + 8 * 3600 * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${gmt8.getUTCFullYear()}-${p(gmt8.getUTCMonth() + 1)}-${p(gmt8.getUTCDate())} ${p(gmt8.getUTCHours())}:${p(gmt8.getUTCMinutes())}:${p(gmt8.getUTCSeconds())}`;
}

/** TOP MD5 signature: sort keys, concat key+value (skip empties), wrap with secret, uppercase hex. */
export function signParams(params: Record<string, string>, secret: string): string {
  const str = Object.keys(params).sort().filter((k) => k !== 'sign' && params[k] !== '' && params[k] != null)
    .map((k) => `${k}${params[k]}`).join('');
  return md5Hex(`${secret}${str}${secret}`).toUpperCase();
}

export interface GatewayConfig {
  appKey: string;
  appSecret: string;
  trackingId: string;
  baseUrl: string;
}

export function configFromEnv(env: Record<string, string | undefined>): GatewayConfig {
  return {
    appKey: env.ALIPRESS_APP_KEY || env.ALIEXPRESS_APP_KEY || '',
    appSecret: env.ALIPRESS_APP_SECRET || env.ALIEXPRESS_APP_SECRET || '',
    trackingId: env.ALIPRESS_TRACKING_ID || env.ALIEXPRESS_TRACKING_ID || '',
    baseUrl: env.ALIPRESS_API_BASE_URL || env.ALIEXPRESS_API_URL || 'https://api-sg.aliexpress.com/sync',
  };
}

async function gatewayPost(cfg: GatewayConfig, method: string, biz: Record<string, string>): Promise<unknown> {
  const params: Record<string, string> = {
    method, app_key: cfg.appKey, sign_method: 'md5',
    timestamp: gatewayTimestamp(), format: 'json', v: '2.0', ...biz,
  };
  const body = new URLSearchParams({ ...params, sign: signParams(params, cfg.appSecret) });
  const r = await fetch(cfg.baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body,
  });
  if (!r.ok) throw new Error(`Gateway HTTP ${r.status}`);
  return r.json() as Promise<unknown>;
}

interface BizProduct {
  product_id?: number | string;
  product_title?: string;
  product_detail_url?: string;
  product_main_image_url?: string;
  product_small_image_urls?: { string?: string[] } | string[];
  target_sale_price?: string;
  target_sale_price_currency?: string;
  promotion_link?: string;
  first_level_category_name?: string;
}

function firstProducts(json: unknown, method: string): BizProduct[] {
  const root = (json as Record<string, unknown>)[`${method}_response`] as Record<string, unknown> | undefined;
  const resp = (root?.resp_result ?? root) as Record<string, unknown> | undefined;
  if (!resp || (resp.resp_code !== undefined && Number(resp.resp_code) !== 200)) {
    const msg = typeof resp?.resp_msg === 'string' ? resp.resp_msg : 'gateway error';
    throw new Error(`Gateway rejected request (${String(resp?.resp_code ?? 'no-code')}): ${msg}`);
  }
  const result = (resp.result ?? {}) as Record<string, unknown>;
  const holder = (result.products ?? result) as Record<string, unknown>;
  const list = (holder.product ?? []) as BizProduct[] | BizProduct;
  return (Array.isArray(list) ? list : [list]).filter(Boolean);
}

export class AliExpressAffiliateProvider implements AffiliateProvider {
  readonly name = 'aliexpress';
  readonly mode = 'production' as const;
  private cfg: GatewayConfig;

  constructor(env: Record<string, string | undefined> = {}) {
    this.cfg = configFromEnv(env);
  }

  isConfigured(): boolean {
    return Boolean(this.cfg.appKey && this.cfg.appSecret && this.cfg.trackingId);
  }

  /** Extract the retailer product ID from an /item/ URL, or '' when absent. */
  static productIdFromUrl(url: string): string {
    try {
      const u = new URL(url);
      if (!u.pathname.includes('/item/')) return '';
      const m = u.pathname.match(/(\d+)\.html/);
      return m ? m[1] : '';
    } catch { return ''; }
  }

  async getProductByUrl(url: string): Promise<Partial<Product> | null> {
    const id = AliExpressAffiliateProvider.productIdFromUrl(url);
    if (!id) return null;
    const p = await this.getProductById(id);
    if (p && !p.source_url) p.source_url = url;
    return p;
  }

  async getProductById(id: string): Promise<Partial<Product> | null> {
    if (!this.isConfigured()) throw new Error('AliExpress affiliate credentials are not configured.');
    const json = await gatewayPost(this.cfg, 'aliexpress.affiliate.productdetail.get', {
      product_ids: id, target_currency: 'EUR', target_language: 'EN',
    });
    const found = firstProducts(json, 'aliexpress.affiliate.productdetail.get')
      .find((p) => String(p.product_id) === String(id));
    if (!found) return null;
    const smallsRaw = found.product_small_image_urls;
    const smalls: string[] = [];
    if (Array.isArray(smallsRaw)) {
      for (const s of smallsRaw) {
        if (typeof s === 'string') smalls.push(s);
        else if (s && Array.isArray((s as { string?: unknown }).string)) smalls.push(...((s as { string: string[] }).string));
      }
    }
    const images = [found.product_main_image_url, ...smalls].filter((u): u is string => Boolean(u));
    const price = found.target_sale_price ? Number(found.target_sale_price) : null;
    return {
      title: found.product_title || '',
      source_title: found.product_title || '',
      source_name: 'AliExpress',
      source_product_id: String(found.product_id || id),
      source_url: found.product_detail_url || '',
      ali_product_id: String(found.product_id || id),
      image_urls: images,
      thumbnail_url: images[0] || '',
      price: price != null && !Number.isNaN(price) ? price : null,
      currency: found.target_sale_price_currency || 'EUR',
    };
  }

  /**
   * Generate a REAL tracking affiliate link via the official API.
   * Throws when unconfigured. Never synthesizes a link locally.
   */
  async generateAffiliateLink(sourceUrl: string): Promise<{ affiliate_url: string; tracking_id: string; checked_at: string }> {
    if (!this.isConfigured()) {
      throw new Error('AliExpress affiliate credentials are not configured — product stays on its direct retailer link (pending conversion).');
    }
    const json = await gatewayPost(this.cfg, 'aliexpress.affiliate.link.generate', {
      promotion_link_type: '0', source_values: sourceUrl, tracking_id: this.cfg.trackingId,
    });
    const root = (json as Record<string, unknown>)['aliexpress_affiliate_link_generate_response'] as Record<string, unknown> | undefined;
    const resp = (root?.resp_result ?? {}) as Record<string, unknown>;
    if (Number(resp.resp_code) !== 200) throw new Error(`Link generation rejected (${String(resp.resp_code ?? 'no-code')}): ${String(resp.resp_msg ?? 'gateway error')}`);
    const result = (resp.result ?? {}) as Record<string, unknown>;
    const holder = (result.promotion_links ?? {}) as Record<string, unknown>;
    const list = (holder.promotion_link ?? []) as { promotion_link?: string; source_value?: string }[] | { promotion_link?: string; source_value?: string };
    const arr = Array.isArray(list) ? list : [list];
    const link = arr.find((l) => l.promotion_link)?.promotion_link || '';
    if (!link) throw new Error('Gateway returned no promotion link.');
    return { affiliate_url: link, tracking_id: this.cfg.trackingId, checked_at: new Date().toISOString() };
  }

  async generateAffiliateUrl(sourceUrlOrId: string): Promise<string> {
    return (await this.generateAffiliateLink(sourceUrlOrId)).affiliate_url;
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
    throw new Error('Keyword search is intentionally unwired — catalog grows only from approved source URLs. See docs/ALIEXPRESS_SETUP.md.');
  }

  async getProduct(_id: string): Promise<Partial<Product> | null> {
    return this.getProductById(_id);
  }
}
