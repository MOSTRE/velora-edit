# VELORA EDIT

**Curated jewelry that looks more expensive than it is.**

VELORA EDIT is a premium jewelry discovery and editorial platform — not a store.
There is no cart, no checkout, no fulfillment. Visitors discover pieces, open the
product page, and continue to AliExpress through a clearly-marked affiliate link
(`rel="sponsored noopener"`). AliExpress handles the purchase; VELORA EDIT may
earn a commission at no extra cost to the buyer.

## Production URL

> **Status: not yet deployed.** Intended address: `https://velora-edit.pages.dev`
> (fallbacks: `velora-edit-jewelry`, `velora-jewelry-edit`). This section will be
> updated with the actual URL after a successful Cloudflare Pages deployment.
> Deployment was **not** performed in this environment (no Cloudflare credentials).

## Screenshots

> Add real screenshots after first run (homepage, product page, collection, admin).
> - `docs/screenshots/home.png` — homepage hero + The Edit
> - `docs/screenshots/product.png` — product page with affiliate CTA
> - `docs/screenshots/edit.png` — collection page
> - `docs/screenshots/admin.png` — admin dashboard

## Features

- Editorial homepage (full-width cinematic hero, New Edit, Quiet Luxury, Under €20 band, Signature Collection, Editor's Picks, For Him / For Her, Founders, journal, newsletter)
- 19 verified real AliExpress products (retailer titles kept as `source_title`, local retailer-supplied imagery, prices via “See current price” fallback, outbound links marked pending affiliate conversion until approved links exist). Pipeline: `data/aliexpress-input.txt` → `scripts/resolve-products.mjs` → `scripts/fetch-images.mjs` → `data/curation.json` → `scripts/build-real-catalog.mjs`. 29 input URLs are currently unresolvable (retailer anti-bot block) — see `data/import-report.json`; never invent data to fill gaps.
- Product pages (`/product/[slug]`) with snap gallery + thumbs, sticky info, editor note, honest pricing, premium affiliate CTA + “See current price & availability” + adjacent disclosure, related pieces
- 18 collections (`/edit/[slug]`: New Arrivals, Quiet Luxury, Under €20, Minimal Essentials, Gold/Silver Edits, For Him/Her, Unisex, Statement, Best Value, Gift Edit, Signature + 5 legacy aliases), categories (`/jewelry/[category]`) with gender/price filters, 4 sort orders and load-more pagination, journal (`/journal/[slug]`, 5 guides)
- Mega-menu navigation (Jewelry / Edits / Journal / About / Founders), upgraded footer with newsletter + social columns
- `/founders` split-screen page (Sanae & Salma, editable placeholder bios, quotes) + `/admin/founders` CMS editor (exports `founders.json`; Supabase `founders` table in migration 002)
- Real client-side search overlay (title/category/collection/tags/material/color, weighted title matches, popular searches, suggested categories, recent searches), no-result state
- Wishlist (device-local), newsletter (consented, abstracted provider), cookie consent (necessary/analytics/marketing)
- Affiliate provider abstraction (`src/lib/affiliate/`): `AffiliateProvider`, `AliExpressAffiliateProvider` (official-API-only, server-side), `MockAffiliateProvider`
- `AFFILIATE_MODE=mock|production` — site never breaks without credentials
- Curation engine: filtering + 0–100 editorial score (internal only), DRAFT → REVIEW → PUBLISHED → ARCHIVED, never auto-publish
- Admin (`/admin`): dashboard (real events only), products CRUD + preview, affiliate-link manager, CSV/JSON import validator, analytics, settings
- Analytics events: `product_view`, `affiliate_click`, `search`, `collection_view`, `newsletter_signup` (anonymous session id, no PII, no payment data)
- SEO: sitemap.xml, robots.txt, canonicals, OG/Twitter, Product (no fake reviews), Organization, Breadcrumb, Article schemas
- Legal: `/privacy`, `/terms`, `/affiliate-disclosure`, footer disclosure, contact form with honeypot + rate limit
- Accessibility: semantic HTML, skip link, focus states, alt text, `prefers-reduced-motion`
- Performance: Astro static output, zero framework JS on public pages, lazy images, preloaded hero

## Tech stack

Astro 4 (static) · TypeScript · Supabase (Postgres + Auth, optional) · Cloudflare Pages · GitHub Actions. No cart, no Docker, no Redis, no Shopify.

## Architecture

```
src/
  pages/            # /, /jewelry, /jewelry/[category], /edit/[slug], /journal, /product/[slug], /admin/*
  layouts/Base.astro
  components/       # Header, Footer, ProductCard, SearchOverlay, Newsletter, CookieConsent
  lib/
    affiliate/      # provider.ts, aliexpress.ts, mock.ts  (ALL affiliate logic here)
    types.ts        # Product model + price/badge/publishable helpers
    curation.ts     # filter engine + editorial score + DRAFT pipeline
    store.ts        # static data access (Supabase-ready)
    analytics.ts    # privacy-respecting event tracking
    validation.ts   # forms + CSV import validation
    seo.ts          # JSON-LD helpers (no fake reviews)
    db.ts           # Supabase client (optional)
  content/          # products.json (100 demo), articles.json, founders.json
  styles/global.css
supabase/migrations/001_init.sql
supabase/seed/seed.sql
scripts/            # seed.mjs, gen-images.mjs, validate-seed.mjs, daily-refresh.mjs
```

## Local development

```bash
npm install
npm run dev        # http://localhost:4321
npm test           # seed integrity tests
npm run seed:check # publishability validation
npm run build
npm run preview
```

## Supabase setup

1. Create a free project at https://supabase.com
2. Run `supabase/migrations/001_init.sql`, then `supabase/seed/seed.sql` in the SQL editor
3. Enable Email auth; create your user; set `profiles.role='admin'`:
   `update profiles set role='admin' where email='you@example.com';`
4. Copy `.env.example` → `.env` and set `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`
5. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. Admin role is checked server-side via RLS.

## Affiliate configuration

```bash
AFFILIATE_MODE=mock        # development: mock destinations on example.com
AFFILIATE_MODE=production  # requires ALI* credentials (server-side only)
```

- Mock mode: everything works (catalog, clicks, analytics, admin). Demo products are marked “Demo piece”.
- Production: fill `ALIPRESS_APP_KEY / ALIPRESS_APP_SECRET / ALIPRESS_TRACKING_ID` (env only), wire the official link-generation endpoint in `src/lib/affiliate/aliexpress.ts`, or paste affiliate URLs manually in `/admin/affiliate-links`. No scraping, no credential exposure, no cloaking.
- Dev test product: **Mock Gold Ring** → `https://example.com/test-affiliate`. Clicking “Shop on AliExpress” navigates to the configured URL (mock banner shown in mock mode).

## Cloudflare deployment

See `DEPLOYMENT.md`. Build: `npm run build`, output: `dist/`.

## Environment variables

See `.env.example`: `AFFILIATE_MODE`, `PUBLIC_SITE_URL`, `PUBLIC_CURRENCY`, `PUBLIC_PRICE_MODE`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only), `ADMIN_EMAILS`, `ALIPRESS_*` (server only), `NEWSLETTER_PROVIDER`, `CONTACT_PROVIDER`.

## Admin setup

- Dev: open `/admin`, default PIN `1234` (change in Settings; stored on device only).
- Production: Supabase Auth + `profiles.role='admin'` enforced by RLS; the static PIN gate must be replaced by server routes before handling real data.

## Security

Validated inputs, sanitized text, parameterized Supabase queries, RLS (public reads published only), honeypot + rate limits on forms, `rel="sponsored noopener"` on affiliate links, no secrets in repo (`.env` gitignored).

## SEO

`sitemap.xml` + `robots.txt` generated at build, canonical URLs, OG/Twitter images, Product/Organization/Breadcrumb/Article JSON-LD. No review/rating structured data (we show none).

## Analytics

Local-first events + optional Supabase `click_events` sync (with analytics consent). Dashboard aggregates real events only. No fake seeding.

## Production checklist

- [ ] Cloudflare Pages project created; actual URL recorded above
- [ ] `AFFILIATE_MODE` set correctly; real affiliate URLs attached; mock demo flag removed from live products
- [ ] Supabase connected; admin role assigned; RLS verified
- [ ] Legal placeholders (company, address, contact email) filled in `/privacy`, `/terms`
- [ ] Social URLs replaced (Instagram/TikTok/Pinterest)
- [ ] Screenshots added under `docs/screenshots/`
- [ ] `npm run build` green; Lighthouse checked on mobile + desktop
