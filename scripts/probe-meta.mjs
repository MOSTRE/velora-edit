const url = process.argv[2];
const r = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=1.0',
  },
  redirect: 'follow',
});
const t = await r.text();
console.log('bytes:', t.length);
// breadcrumbs
const bc = [...t.matchAll(/"name":"([^"]{3,60})","url":"([^"]{0,120})"/g)].slice(0, 12);
console.log('--- breadcrumb-ish:', JSON.stringify(bc.map((m) => m[1])));
// category ids
const cat = t.match(/"categoryId":\s*"?(\d+)/) || t.match(/categoryId[=:](\d+)/);
console.log('categoryId:', cat ? cat[1] : 'NONE');
// image urls (ae-pic / alicdn kf)
const imgs = [...new Set([...t.matchAll(/https:\/\/ae-pic-a?\d?\.aliexpress-media\.com\/kf\/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)/g)].map((m) => m[0]))].slice(0, 8);
console.log('--- ae-pic images:', imgs.length);
imgs.forEach((u) => console.log('  ', u.slice(0, 100)));
const kf = [...new Set([...t.matchAll(/https:\/\/alicdn\.com\/kf\/[A-Za-z0-9_.-]+\.(?:jpg|jpeg|png|webp)/g)].map((m) => m[0]))].slice(0, 4);
console.log('--- alicdn images:', kf.length);
// store name
const store = t.match(/"storeName":"([^"]+)"/) || t.match(/og:site_name"[^>]+content="([^"]+)"/);
console.log('store:', store ? store[1].slice(0, 60) : 'NONE');
// ratings/sales (do NOT use for display, just checking presence)
console.log('has tradeCount:', /tradeCount|orders?["']?\s*:\s*["']?\d/i.test(t));
