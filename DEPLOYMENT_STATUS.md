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
https://9320d320.velora-edit.pages.dev

Branch:
main

Build:
PASS (`npm run build`, 148 static pages, output `dist/`)

Tests:
PASS (lint 0 issues, typecheck 0 errors, 8/8 tests, seed check 100 products 0 errors)

Products:
100

Founders:
PASS (`/founders` live, `/admin/founders` present behind dev gate)

Affiliate mode:
MOCK (`AFFILIATE_MODE=mock`; mock destinations on example.com only, no fabricated retailer URLs)

Supabase:
NOT CONFIGURED (migrations 001 + 002 verified in repo, not applied to a live project)

Deployment:
VERIFIED LIVE (Production environment, branch main, commit 01ab0ef, HTTP 200 on all checked routes)

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
