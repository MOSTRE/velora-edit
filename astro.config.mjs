import { defineConfig } from 'astro/config';

// Static-first for Cloudflare Pages (free tier).
// https://docs.astro.build/en/guides/deploy/cloudflare/
export default defineConfig({
  site: 'https://velora-edit.pages.dev',
  output: 'static',
  trailingSlash: 'never',
  build: {
    inlineStylesheets: 'auto'
  },
  vite: {
    build: {
      cssMinify: true
    }
  }
});
