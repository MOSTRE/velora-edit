import fs from 'node:fs';
import path from 'node:path';

// Link + affiliate + SEO audit over dist/. Exit 1 on failure.
const dist = 'dist';
const htmlFiles = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f);
    else if (e.name.endsWith('.html')) htmlFiles.push(f);
  }
})('dist');

const exists = (p) => {
  const normalized = p.split('?')[0].split('#')[0];
  if (!normalized || normalized === '/') return fs.existsSync(path.join(dist, 'index.html'));
  const rel = normalized.replace(/^\//, '');
  return fs.existsSync(path.join(dist, rel, 'index.html')) || fs.existsSync(path.join(dist, rel)) || fs.existsSync(path.join(dist, rel + '.html')) || normalized === '/404';
};

let broken = [];
let noSponsored = [];
let noDisclosure = [];
let noCanonical = [];
let noOg = [];
for (const f of htmlFiles) {
  const html = fs.readFileSync(f, 'utf-8');
  // internal links
  const hrefs = [...html.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]);
  for (const h of hrefs) {
    if (h.startsWith('/admin')) continue; // admin pages exist as static files too — checked below
    if (!exists(h) && !h.match(/\.(svg|json|xml|txt)$/) ) {
      // allow known asset endpoints
      const asset = path.join(dist, h.replace(/^\//, ''));
      if (!fs.existsSync(asset)) broken.push(`${f} -> ${h}`);
    }
  }
  // product pages: affiliate state must be honest —
  // affiliate links carry sponsored rel + commission disclosure;
  // pending-conversion pages link the verified source with a pending notice.
  if (f.includes(`${path.sep}product${path.sep}`)) {
    const pending = html.includes('affiliate conversion pending');
    const sponsored = html.includes('rel="sponsored noopener"');
    const disclosure = html.includes('Affiliate disclosure');
    if (sponsored && !disclosure) noSponsored.push(f + ' (sponsored without disclosure)');
    if (!sponsored && !pending) noSponsored.push(f + ' (no sponsored rel, no pending notice)');
    if (!disclosure && !pending) noDisclosure.push(f);
  }
  if (!html.includes('rel="canonical"')) noCanonical.push(f);
  if (!html.includes('og:title')) noOg.push(f);
}
// admin files exist?
for (const a of ['admin/index.html', 'admin/founders/index.html', 'founders/index.html', 'journal/index.html', 'sitemap.xml', 'robots.txt', 'search-index.json', 'favicon.svg']) {
  if (!fs.existsSync(path.join(dist, a))) broken.push(`missing dist/${a}`);
}
// secrets in built assets?
const secretRe = /SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET|CJ_ACCESS_TOKEN|sk-live/;
const leaked = htmlFiles.filter((f) => secretRe.test(fs.readFileSync(f, 'utf-8')));

console.log(`pages audited: ${htmlFiles.length}`);
console.log(`broken internal links: ${broken.length}`, broken.slice(0, 20));
console.log(`product pages missing sponsored rel: ${noSponsored.length}`);
console.log(`product pages missing disclosure: ${noDisclosure.length}`);
console.log(`pages missing canonical: ${noCanonical.length}`);
console.log(`pages missing OG: ${noOg.length}`);
console.log(`files leaking secrets: ${leaked.length}`);
const fail = broken.length || noSponsored.length || noDisclosure.length || noCanonical.length || noOg.length || leaked.length;
process.exit(fail ? 1 : 0);
