# AliExpress affiliate API setup — VELORA EDIT

Status: **not configured**. The storefront runs in `AFFILIATE_MODE=mock`
with direct retailer links clearly marked pending conversion. Nothing here
is connected until you complete the steps below.

## What you need (from your approved AliExpress affiliate account)

1. An approved AliExpress affiliate account (the program that issued the
   50 product URLs in `data/aliexpress-input.txt`).
2. Developer/API access on that account: an **app key** and **app secret**
   (sometimes called client ID / client secret).
3. At least one **tracking ID** (sometimes called tracking code / promotion
   channel) to attribute commissions.
4. The **current API base URL and method names** for:
   - promotion-link generation (source URL → tracking affiliate URL), and
   - product query (ID → title/image/price) if you want automated enrichment.

> API base URLs and method names change over time. Confirm the exact values
> in the developer documentation linked from your affiliate account — do not
> rely on remembered or third-party endpoint names. (The example method name
> in `src/lib/affiliate/aliexpress.ts` comments is illustrative only.)

## Where credentials go

Server-side environment variables only — never in client code, never in git:

```bash
ALIPRESS_APP_KEY=...
ALIPRESS_APP_SECRET=...
ALIPRESS_TRACKING_ID=...
# Optional override; otherwise confirm the current base URL in your docs:
ALIPRESS_API_BASE_URL=...
AFFILIATE_MODE=production
```

(`ALIEXPRESS_*` spellings are accepted as aliases by the provider.)

Locally, put these in `.env` (git-ignored). On Cloudflare Pages, add them
under the project's **Settings → Environment variables** (production
environment). `SUPABASE_SERVICE_ROLE_KEY`-style secrecy applies: these values
must never appear in built frontend assets.

## Wiring the code (one place)

`src/lib/affiliate/aliexpress.ts` — `AliExpressAffiliateProvider`:

- `isConfigured()` returns true once key + secret + tracking ID are present.
- `generateAffiliateLink(sourceUrl)` — implement the official signed
  promotion-link call here; return `{ affiliate_url, tracking_id, checked_at }`.
- `getProductById(id)` / `getProductByUrl(url)` — implement the official
  product-query call here for automated enrichment.
- `getProvider()` (`src/lib/affiliate/provider.ts`) already routes to this
  class in production mode and falls back to mock otherwise — no other
  storefront code needs to change.

## Testing before going live

1. With credentials set locally, run a server-side-only check that calls
   `generateAffiliateLink()` for one approved URL from
   `data/aliexpress-input.txt` and prints the returned tracking link.
   Confirm the link resolves to the same product.
2. Attach returned links via `/admin/affiliate-links` (validate → attach),
   which flips products from `affiliate_verified: false` to verified and
   switches their CTA to `rel="sponsored noopener"` with the commission
   disclosure automatically.
3. Re-run `npm test && npm run build`, redeploy, and spot-check a converted
   product page.

Until then, the honest state remains: direct retailer links, pending notice,
`rel="noopener"`, no commission claims.
