import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AliExpressAffiliateProvider, md5Hex, gatewayTimestamp, signParams, configFromEnv } from '../src/lib/affiliate/aliexpress.ts';
import { presence, verifyAffiliateResult } from '../scripts/convert-affiliate.mjs';

test('gateway: md5 matches known vector', () => {
  assert.equal(md5Hex('abc'), '900150983cd24fb0d6963f7d28e17f72');
});

test('gateway: timestamp is GMT+8 yyyy-MM-dd HH:mm:ss', () => {
  const ts = gatewayTimestamp(new Date('2026-01-01T00:00:00Z'));
  assert.equal(ts, '2026-01-01 08:00:00');
  assert.match(gatewayTimestamp(), /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
});

test('gateway: signature is deterministic 32-char uppercase hex, ignores sign key', () => {
  const p = { method: 'x', app_key: 'k', b: '2', a: '1' };
  const s1 = signParams(p, 'secret');
  const s2 = signParams({ ...p, sign: 'OLD' }, 'secret');
  assert.equal(s1, s2);
  assert.match(s1, /^[0-9A-F]{32}$/);
  assert.notEqual(signParams(p, 'other'), s1, 'secret matters');
});

test('provider: productIdFromUrl extracts /item/ ids only', () => {
  assert.equal(AliExpressAffiliateProvider.productIdFromUrl('https://www.aliexpress.com/item/1005012514368804.html'), '1005012514368804');
  assert.equal(AliExpressAffiliateProvider.productIdFromUrl('https://www.aliexpress.com/store/123.html'), '');
  assert.equal(AliExpressAffiliateProvider.productIdFromUrl('not a url'), '');
});

test('provider: isConfigured false without credentials, reads aliases', () => {
  assert.equal(new AliExpressAffiliateProvider({}).isConfigured(), false);
  assert.equal(new AliExpressAffiliateProvider({ ALIPRESS_APP_KEY: 'k', ALIPRESS_APP_SECRET: 's', ALIPRESS_TRACKING_ID: 't' }).isConfigured(), true);
  assert.equal(new AliExpressAffiliateProvider({ ALIEXPRESS_APP_KEY: 'k', ALIEXPRESS_APP_SECRET: 's', ALIEXPRESS_TRACKING_ID: 't' }).isConfigured(), true);
  const cfg = configFromEnv({});
  assert.equal(cfg.baseUrl, 'https://api-sg.aliexpress.com/sync');
});

test('provider: network methods throw honestly when unconfigured', async () => {
  const p = new AliExpressAffiliateProvider({});
  await assert.rejects(() => p.getProductById('123'), /not configured/);
  await assert.rejects(() => p.generateAffiliateLink('https://www.aliexpress.com/item/123.html'), /not configured/);
});

test('converter: presence() reports names only, never values', () => {
  const out = presence({ ALIPRESS_APP_KEY: 'supersecret-value', FOO: 'x' });
  assert.equal(out.ALIPRESS_APP_KEY, 'SET');
  assert.ok(!Object.values(out).includes('supersecret-value'));
});

test('converter: verifyAffiliateResult enforces https + affiliate hosts', () => {
  assert.ok(verifyAffiliateResult('https://s.click.aliexpress.com/e/_abc123', 't', 'https://www.aliexpress.com/item/1.html').ok);
  assert.ok(!verifyAffiliateResult('http://s.click.aliexpress.com/e/x', 't', 'https://www.aliexpress.com/item/1.html').ok, 'http rejected');
  const bad = verifyAffiliateResult('https://evil.example.com/click', 't', 'https://www.aliexpress.com/item/1.html');
  assert.ok(!bad.ok && /unexpected host/.test(bad.reasons.join(' ')));
  assert.ok(!verifyAffiliateResult('not a url', 't', 'https://www.aliexpress.com/item/1.html').ok);
});
