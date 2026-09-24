# Deployment status — VELORA EDIT

Project:
VELORA EDIT

GitHub:
https://github.com/MOSTRE/velora-edit

Cloudflare project:
velora-edit

Production URL:
https://velora-edit.pages.dev

Preview deployment:
https://33be48df.velora-edit.pages.dev

Branch:
main

Build:
PASS (`npm run build`, 148 static pages, output `dist/`)

Tests:
PASS (lint 0 issues, typecheck 0 errors, 26/26 tests, seed check 19 products 0 errors)

Products:
19 verified published · 0 draft · 2 invalid (multi-piece sets, no fitting category) · 29 blocked (retailer anti-bot, no bypass) · 0 duplicates. Evidence: data/import-report.json, data/pending.json (admin-visible).

Founders:
PASS (`/founders` live, `/admin/founders` present behind dev gate)

Affiliate mode:
MOCK (`AFFILIATE_MODE=mock`; mock destinations on example.com only, no fabricated retailer URLs)

Supabase:
NOT CONFIGURED (migrations 001 + 002 verified in repo, not applied to a live project)

Deployment:
VERIFIED LIVE (Production environment, branch main, HTTP 200 on all checked routes; real catalog + pending-affiliate flow live)

Build command:
npm run build

Build output:
dist

Deployment method:
Direct upload (`wrangler pages deploy`). GitHub auto-deploy NOT connected — see DEPLOYMENT.md for the Connect-to-Git steps.

Verified live:
- / → 200, title "VELORA EDIT — Jewelry Worth Discovering"
- /founders/ → 200
- /journal/ → 200
- /edit/new-arrivals/ → 200
- /edit/quiet-luxury/ → 200
- /product/heart-moissanite-ring/ → 200, Shop CTA → verified AliExpress source URL, pending-conversion notice, rel="noopener", local imagery, price fallback, canonical + OpenGraph present
- /product/o-link-collar-chain/ → 200
- /robots.txt → 200, /sitemap.xml → 200
- /search-index.json → 19 products, 0 mock records
