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

Ready-made runner (server-side only, secrets never printed):

```bash
node scripts/convert-affiliate.mjs --dry-run            # plan, no API calls
node scripts/convert-affiliate.mjs --test-url <url>     # getProductByUrl + generateAffiliateLink on ONE approved URL
node scripts/convert-affiliate.mjs                      # convert published links + resolve blocked URLs via API
```

The `--test-url` run verifies ID match, title/images present, link host
allowlist, and tracking-ID echo — printing booleans only, never the link or
credentials. Only proceed to the full run after it passes.

Until then, the honest state remains: direct retailer links, pending notice,
`rel="noopener"`, no commission claims.
