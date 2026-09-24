# Deployment — Cloudflare Pages (free-first)

Target: **`velora-edit`** → `https://velora-edit.pages.dev`
Fallbacks if taken: `velora-edit-jewelry` → `velora-jewelry-edit` → nearest clean alternative.

## Prerequisites

- Cloudflare account (free)
- GitHub repo `velora-edit` connected to Cloudflare Pages
- No paid services required. Supabase free tier optional.

## Steps

1. Create a Cloudflare account at https://dash.cloudflare.com/sign-up
2. Go to **Workers & Pages → Create → Pages → Connect to Git**
3. Select repository `velora-edit`
4. Set build configuration:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Node version: `20` (env `NODE_VERSION=20`)
5. Add environment variables:
   - `AFFILIATE_MODE=mock` (or `production` when affiliate credentials exist)
   - `PUBLIC_SITE_URL=https://velora-edit.pages.dev`
   - `PUBLIC_PRICE_MODE=cached`
   - `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` (optional)
6. Deploy. Cloudflare builds and publishes automatically on every push to `main`.

## Local commands

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output → dist/
npm run preview  # preview the production build
npm test         # seed integrity tests
npm run seed:check
```

## After deployment

Record the actual URL in `README.md` (Production URL section). Do not claim
`https://velora-edit.pages.dev` is live until the Pages project confirms it.
