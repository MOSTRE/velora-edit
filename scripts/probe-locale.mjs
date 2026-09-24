const base = 'https://www.aliexpress.com/item/1005012514368804.html';
const variants = [
  base,
  base + '?gatewayAdapt=glo2en4itemAdapt',
  'https://www.aliexpress.us/item/1005012514368804.html',
];
for (const url of variants) {
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=1.0',
      },
      redirect: 'follow',
    });
    const t = await r.text();
    const m = t.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/);
    const title = m ? m[1] : 'NONE';
    const price = t.match(/"salePrice"[^}]*?"value":\s*"?([\d.]+)/) || t.match(/property="og:price:amount"[^>]+content="([^"]+)"/) || t.match(/"minPrice":"([\d.]+)"/);
    console.log('---', url);
    console.log('status:', r.status, '| title:', title.slice(0, 90));
    console.log('price:', price ? price[1] : 'NONE', '| currency:', (t.match(/property="og:price:currency"[^>]+content="([^"]+)"/) || [])[1] || 'NONE');
  } catch (e) { console.log('---', url, 'FAIL:', e.message); }
}
