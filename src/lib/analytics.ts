/** Minimal privacy-respecting analytics. No personal data, no payment data. */
export type EventName = 'product_view' | 'affiliate_click' | 'search' | 'collection_view' | 'newsletter_signup';
export interface AnalyticsEvent {
  event: EventName;
  product_id?: string;
  timestamp: string;
  anonymous_session_id: string;
  referrer?: string;
  page_url?: string;
  device?: string;
  query?: string;
  collection?: string;
}

const KEY = 'velora-events-v1';
const SESSION_KEY = 'velora-sid';

function sessionId(): string {
  try {
    let s = localStorage.getItem(SESSION_KEY);
    if (!s) {
      s = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch { return 'server'; }
}

function deviceClass(): string {
  try {
    const ua = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone/.test(ua)) return 'mobile';
    if (/tablet|ipad/.test(ua)) return 'tablet';
    return 'desktop';
  } catch { return 'unknown'; }
}

function consented(): boolean {
  try {
    const v = localStorage.getItem('velora-consent');
    if (!v) return false;
    const c = JSON.parse(v);
    return c.analytics === true;
  } catch { return false; }
}

export function track(event: EventName, data: Partial<AnalyticsEvent> = {}): void {
  try {
    // Necessary-only default: product_view/affiliate_click stored locally even
    // without consent (no PII); search/newsletter require no PII either.
    // Optional Supabase sync happens only with analytics consent.
    const e: AnalyticsEvent = {
      event,
      timestamp: new Date().toISOString(),
      anonymous_session_id: sessionId(),
      page_url: location.href,
      referrer: document.referrer || undefined,
      device: deviceClass(),
      ...data,
    };
    const raw = localStorage.getItem(KEY);
    const arr: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
    arr.push(e);
    localStorage.setItem(KEY, JSON.stringify(arr.slice(-2000)));
    if (consented()) void syncToSupabase(e);
  } catch { /* never break the site for analytics */ }
}

async function syncToSupabase(e: AnalyticsEvent): Promise<void> {
  try {
    const url = (import.meta as unknown as { env: Record<string, string> }).env?.PUBLIC_SUPABASE_URL;
    const key = (import.meta as unknown as { env: Record<string, string> }).env?.PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;
    await fetch(`${url}/rest/v1/click_events`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: e.event,
        product_id: e.product_id ?? null,
        session_id: e.anonymous_session_id,
        referrer: e.referrer ?? null,
        page_url: e.page_url ?? null,
        device: e.device ?? null,
        metadata: { query: e.query ?? null, collection: e.collection ?? null },
      }),
    });
  } catch { /* silent */ }
}

export function readLocalEvents(): AnalyticsEvent[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch { return []; }
}

export function summarize(events: AnalyticsEvent[]) {
  const views = events.filter((e) => e.event === 'product_view').length;
  const clicks = events.filter((e) => e.event === 'affiliate_click').length;
  const ctr = views ? (clicks / views) * 100 : 0;
  const byProduct: Record<string, { views: number; clicks: number }> = {};
  for (const e of events) {
    if (!e.product_id) continue;
    byProduct[e.product_id] = byProduct[e.product_id] || { views: 0, clicks: 0 };
    if (e.event === 'product_view') byProduct[e.product_id].views++;
    if (e.event === 'affiliate_click') byProduct[e.product_id].clicks++;
  }
  const top = Object.entries(byProduct).sort((a, b) => b[1].clicks - a[1].clicks || b[1].views - a[1].views).slice(0, 10);
  const byDay: Record<string, number> = {};
  for (const e of events.filter((e) => e.event === 'affiliate_click')) {
    const d = e.timestamp.slice(0, 10);
    byDay[d] = (byDay[d] || 0) + 1;
  }
  return { views, clicks, ctr, top, byDay };
}
