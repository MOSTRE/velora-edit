const url = process.argv[2];
try {
  const r = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
  });
  const t = await r.text();
  console.log('status:', r.status, '| bytes:', t.length);
  const og = (p) => {
    const m = t.match(new RegExp('<meta[^>]+property="' + p + '"[^>]+content="([^"]+)"'));
    return m ? m[1] : 'NONE';
  };
  console.log('og:title:', og('og:title').slice(0, 100));
  console.log('og:image:', og('og:image').slice(0, 100));
  console.log('captcha:', /captcha|slide.*verify|antibot/i.test(t.slice(0, 5000)));
} catch (e) { console.log('FETCH FAIL:', e.message); }
