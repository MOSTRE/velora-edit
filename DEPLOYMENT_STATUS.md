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
https://bafacb33.velora-edit.pages.dev

Branch:
main

Build:
PASS (`npm run build`, 148 static pages, output `dist/`)

Tests:
PASS (lint 0 issues, typecheck 0 errors, 15/15 tests, seed check 100 products 0 errors)

Products:
100 demo-marked development records (real-product pipeline ready; awaiting 50 approved AliExpress URLs — see data/aliexpress-input.txt)

Founders:
PASS (`/founders` live, `/admin/founders` present behind dev gate)

Affiliate mode:
MOCK (`AFFILIATE_MODE=mock`; mock destinations on example.com only, no fabricated retailer URLs)

Supabase:
NOT CONFIGURED (migrations 001 + 002 verified in repo, not applied to a live project)

Deployment:
VERIFIED LIVE (Production environment, branch main, commit fb6e465, HTTP 200 on all checked routes; redesign + real-photo config + importer pipeline live)

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
- /product/noir-signet/ → 200, affiliate CTA + disclosure + rel="sponsored noopener" + canonical + OpenGraph present
- /robots.txt → 200, /sitemap.xml → 200
- /search-index.json → 100 products
