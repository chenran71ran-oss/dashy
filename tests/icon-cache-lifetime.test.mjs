import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloud/worker.mjs';
import { cacheIconAsset, ICON_CACHE_SECONDS, ICON_BROWSER_SECONDS } from '../cloud/icon-cache.mjs';

const THREE_DAYS = 3 * 24 * 60 * 60;
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

test('website icons stay in KV for three days and in the browser for one day', async (t) => {
  assert.equal(ICON_CACHE_SECONDS, THREE_DAYS);
  assert.equal(ICON_BROWSER_SECONDS, 86400);
  const writes = [];
  const values = new Map();
  const env = { ADMIN_TOKEN: 'test-only', HOME_KV: { get: async key => values.get(key) || null, put: async (key, value, options) => { values.set(key, value); writes.push({ key, options }); } } };
  const login = await worker.fetch(new Request('https://home.example/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: 'test-only' }) }), env);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (String(url).includes('/dns-query?')) return Response.json({ Status: 0, Answer: [{ type: 1, data: '8.8.8.8' }] });
    return new Response(png, { headers: { 'content-type': 'image/png' } });
  });
  const shown = await worker.fetch(new Request('https://home.example/api/icon-image?url=' + encodeURIComponent('https://site.example/favicon.ico'), { headers: { origin: 'https://home.example', cookie } }), env);
  assert.equal(shown.status, 200);
  assert.equal(shown.headers.get('cache-control'), 'private, max-age=86400');
  const iconWrites = writes.filter(w => w.key.startsWith('kenneth-home:icon:'));
  assert.equal(iconWrites.length, 1);
  assert.equal(iconWrites[0].options.expirationTtl, THREE_DAYS);
  // Icons verified during discovery are cached for the same time
  await cacheIconAsset(env.HOME_KV, 'https://other.example/icon.png', { bytes: png, mime: 'image/png' });
  assert.equal(writes.at(-1).options.expirationTtl, THREE_DAYS);
});

test('a website that refuses the icon request is logged with its host and reason', async (t) => {
  const env = { ADMIN_TOKEN: 'test-only', HOME_KV: { get: async () => null, put: async () => {} } };
  const login = await worker.fetch(new Request('https://home.example/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: 'test-only' }) }), env);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (String(url).includes('/dns-query?')) return Response.json({ Status: 0, Answer: [{ type: 1, data: '8.8.8.8' }] });
    return new Response('Forbidden', { status: 403 });
  });
  const warn = t.mock.method(console, 'warn', () => {});
  const shown = await worker.fetch(new Request('https://home.example/api/icon-image?url=' + encodeURIComponent('https://blocked.example/logo.png?v=2'), { headers: { origin: 'https://home.example', cookie } }), env);
  assert.notEqual(shown.status, 200);
  const logged = warn.mock.calls.map(call => call.arguments[0]).find(entry => entry.event === 'icon-fetch-failed');
  assert.deepEqual(logged, { event: 'icon-fetch-failed', host: 'blocked.example', path: '/logo.png', reason: 'Image unavailable' });
});
