import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { DEFAULT_CONFIG } from '../cloud/worker.mjs';
import { discoverDescription, englishDescription } from '../cloud/icon-discovery.mjs';

const dns = () => Response.json({ Status: 0, Answer: [{ type: 1, data: '8.8.8.8' }] });
const page = (head, init = {}) => new Response(`<!doctype html><html><head>${head}</head><body><meta name="description" content="Body text is ignored"></body></html>`, { headers: { 'content-type': 'text/html; charset=utf-8' }, ...init });

test('only the site\'s own English description is offered, never translated text', () => {
  assert.equal(englishDescription('Self-hosted photo &amp; video management.'), 'Self-hosted photo & video management.');
  assert.equal(englishDescription('一个开源的自托管媒体服务器'), '');
  assert.equal(englishDescription('Emby 媒体服务器 Media server'), '');
  assert.equal(englishDescription('Home'), '');
  const long = englishDescription('Jellyfin is the volunteer-built media solution that puts you in control of your media. Stream to any device from your own server, with no strings attached, no premium tiers and no hidden agendas whatsoever.');
  assert.equal(long, 'Jellyfin is the volunteer-built media solution that puts you in control of your media.');
  assert.ok(englishDescription('word '.repeat(60)).length <= 160);
});

test('reads og:description first, falls back to description, and reports non-English text', async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('/dns-query?')) return dns();
    if (String(url).startsWith('https://og.example')) return page('<meta property="og:description" content="Open source password manager for teams."><meta name="description" content="Fallback">');
    if (String(url).startsWith('https://zh.example')) return page('<meta name="description" content="中文网站说明">');
    if (String(url).startsWith('https://none.example')) return page('<title>None</title>');
    return page('<meta name="description" content="A lightweight, self-hosted dashboard for your homelab.">');
  };
  assert.deepEqual(await discoverDescription('https://og.example/app?token=secret', fetcher), { description: 'Open source password manager for teams.', source: 'og:description' });
  assert.ok(calls.every(c => !c.url.includes('secret')));
  assert.ok(calls.filter(c => !c.url.includes('/dns-query?')).every(c => c.options.credentials === 'omit'));
  assert.equal((await discoverDescription('https://plain.example/', fetcher)).source, 'description');
  assert.deepEqual(await discoverDescription('https://zh.example/', fetcher), { description: '', reason: 'not-english' });
  assert.deepEqual(await discoverDescription('https://none.example/', fetcher), { description: '', reason: 'no-description' });
  await assert.rejects(discoverDescription('http://insecure.example/', fetcher));
  await assert.rejects(discoverDescription('https://127.0.0.1/', fetcher));
});

test('site description endpoint requires login and same origin', async () => {
  const values = new Map([['kenneth-home:dashy:v1', JSON.stringify(DEFAULT_CONFIG)]]);
  const env = { ADMIN_TOKEN: 'test-only', HOME_KV: { get: async k => values.get(k) ?? null, put: async (k, v) => values.set(k, v) }, ASSETS: { fetch: async () => new Response('') } };
  const root = 'http://127.0.0.1';
  const call = (headers) => worker.fetch(new Request(`${root}/api/site-description`, { method: 'POST', headers: { 'content-type': 'application/json', origin: root, ...headers }, body: JSON.stringify({ page: 'http://localhost/' }) }), env);
  assert.equal((await call({})).status, 401);
  const login = await worker.fetch(new Request(`${root}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: 'test-only' }) }), env);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  assert.equal((await call({ cookie, origin: 'https://other.example' })).status, 403);
  const result = await call({ cookie });
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { description: '', reason: 'public-site-required' });
});
