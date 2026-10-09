import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { DEFAULT_CONFIG, validateConfig } from '../cloud/worker.mjs';
import { statusCheck, pingCheck, corsProxy, publicServiceUrl } from '../cloud/services.mjs';
import { readWeather } from '../cloud/weather.mjs';
import { configPath } from '../cloud/config-storage.mjs';

const dns = () => Response.json({ Status: 0, Answer: [{ type: 1, data: '8.8.8.8' }] });
const fixture = async () => {
  const values = new Map([['kenneth-home:dashy:v1', JSON.stringify(DEFAULT_CONFIG)]]);
  const env = { ADMIN_TOKEN: 'test-password', HOME_KV: { get: async k => values.get(k) ?? null, put: async (k, v) => values.set(k, v) }, ASSETS: { fetch: async () => new Response('shell') } };
  const root = 'http://127.0.0.1';
  const response = await worker.fetch(new Request(root + '/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: env.ADMIN_TOKEN }) }), env);
  const cookie = response.headers.get('set-cookie').split(';')[0];
  const call = (path, method = 'GET', body, headers = {}) => worker.fetch(new Request(root + path, { method, headers: { cookie, origin: root, 'content-type': 'application/json', ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) }), env);
  return { values, env, call, root };
};

test('original feature preferences survive read and write instead of being forced off', () => {
  const raw = { sections: [], pages: [{ name: 'Lab', path: 'lab.yml' }], appConfig: { statusCheck: true, pingCheckEnabled: true, enableServiceWorker: true, enableErrorReporting: true, enableFontAwesome: true, enableMaterialDesignIcons: true, disableUpdateChecks: false, faviconApi: 'faviconkit', webSearch: { disableWebSearch: false }, preventWriteToDisk: true } };
  const result = validateConfig(raw);
  assert.deepEqual(result.appConfig, raw.appConfig);
  assert.deepEqual(result.pages, raw.pages);
  assert.deepEqual(raw.pageInfo, undefined);
});

test('all upstream widget configurations and large bookmark sets are accepted', () => {
  const types = ['rss', 'calendar', 'custom-api', 'weather-forecast', 'system-info', 'uptime-kuma', 'crypto-watch-list', 'pihole'];
  const raw = { sections: [{ name: 'Lab', widgets: types.map(type => ({ type, options: { hostname: 'https://service.example', token: 'DASHY_TOKEN' } })), items: Array.from({ length: 205 }, (_, i) => ({ title: 'Site ' + i, url: 'https://site.example/' + i })) }] };
  assert.deepEqual(validateConfig(raw).sections, raw.sections);
});

test('multi-page saves do not replace root, and config history is authenticated', async () => {
  const { values, env, call, root } = await fixture();
  const config = { ...DEFAULT_CONFIG, pages: [{ name: 'Work', path: 'work.yml' }] };
  assert.equal((await call('/api/config', 'POST', { config })).status, 200);
  assert.equal((await call('/work.yml')).status, 200);
  const sub = { pageInfo: { title: 'Work' }, sections: [{ name: 'Tools', items: [{ title: 'Tool', url: 'https://tool.example' }] }] };
  assert.equal((await call('/api/config', 'POST', { filename: '/work.yml', config: sub })).status, 200);
  assert.equal(JSON.parse(values.get('kenneth-home:dashy:v1')).pageInfo.title, 'Home Lab');
  assert.equal((await (await call('/work.yml')).json()).sections[0].items[0].title, 'Tool');
  const backups = (await (await call('/api/config-backups?filename=work.yml')).json()).backups;
  assert.equal(backups.length, 1);
  const old = await (await call('/api/config-backups?filename=work.yml&id=' + backups[0].id)).json();
  assert.deepEqual(old.config.sections, []);
  for (const path of ['/work.yml', '/api/config-backups', '/status-check?url=https://site.example', '/ping-check?host=site.example', '/cors-proxy', '/system-info']) assert.equal((await worker.fetch(new Request(root + path), env)).status, 401);
  assert.equal((await call('/api/config', 'POST', { filename: '../bad.yml', config: sub })).status, 400);
  assert.throws(() => configPath('../conf.yml'));
});

test('HTTP status checks execute, honor extra accepted codes and validate every redirect', async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    if (url.includes('/dns-query?')) return dns();
    return new Response('login', { status: 401, statusText: 'Unauthorized' });
  };
  const params = new URLSearchParams({ url: 'https://service.example/health', acceptCodes: '401', headers: '{"X-Token":"DASHY_HEALTH_TOKEN"}' });
  const data = await statusCheck(params, { DASHY_HEALTH_TOKEN: 'server-only' }, fetcher);
  assert.equal(data.successStatus, true); assert.equal(data.statusCode, 401);
  assert.equal(calls.at(-1).options.headers.get('x-token'), 'server-only');
  assert.ok(!JSON.stringify(data).includes('server-only'));
  const blocked = await statusCheck(new URLSearchParams({ url: 'https://service.example' }), {}, async url => url.includes('/dns-query?') ? dns() : new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/latest/meta-data' } }));
  assert.equal(blocked.successStatus, false);
  await assert.rejects(publicServiceUrl('https://127.0.0.1', fetcher));
});

test('widget proxy resolves Secrets in headers/body and never copies the portal session', async () => {
  let outbound;
  const fetcher = async (url, options) => {
    if (url.includes('/dns-query?')) return dns();
    outbound = { url, options };
    return Response.json({ result: 'data' });
  };
  const req = new Request('https://home.example/cors-proxy', { method: 'POST', headers: { cookie: 'private-portal-cookie', 'Target-URL': 'https://service.example/api', CustomHeaders: '{"Authorization":"Bearer DASHY_TEST_TOKEN"}', 'content-type': 'application/json' }, body: '{"token":"DASHY_TEST_TOKEN"}' });
  const response = await corsProxy(req, { DASHY_TEST_TOKEN: 'secret-value' }, fetcher);
  assert.deepEqual(await response.json(), { result: 'data' });
  assert.equal(outbound.options.headers.get('cookie'), null);
  assert.equal(outbound.options.headers.get('authorization'), 'Bearer secret-value');
  assert.equal(JSON.parse(outbound.options.body).token, 'secret-value');
  assert.equal(outbound.options.credentials, 'omit');
});

test('the widget mixin default null CustomHeaders works for public API widgets', async () => {
  const request = new Request('https://home.example/cors-proxy', { headers: { 'Target-URL': 'https://service.example/public', CustomHeaders: 'null', 'Content-Type': 'application/json' } });
  const response = await corsProxy(request, {}, async (url, options) => {
    if (url.includes('/dns-query?')) return dns();
    assert.equal(options.headers.get('authorization'), null);
    return Response.json({ public: true });
  });
  assert.deepEqual(await response.json(), { public: true });
});

test('cross-origin redirects cannot receive API authentication headers', async () => {
  let finalHeaders;
  const req = new Request('https://home.example/cors-proxy', { headers: { 'Target-URL': 'https://service.example/api', CustomHeaders: '{"Authorization":"Bearer private","X-Api-Key":"private"}' } });
  await corsProxy(req, {}, async (url, options) => {
    if (url.includes('/dns-query?')) return dns();
    if (url.includes('service.example')) return new Response(null, { status: 302, headers: { location: 'https://other.example/api' } });
    finalHeaders = options.headers; return Response.json({});
  });
  assert.equal(finalHeaders.get('authorization'), null);
  assert.equal(finalHeaders.get('x-api-key'), null);
});

test('the legacy YAML save API and schema route work behind the same administrator session', async () => {
  const { call } = await fixture();
  const saved = await call('/config-manager/save', 'POST', { config: 'pageInfo:\n  title: Home Lab\nsections: []\nappConfig:\n  enableFontAwesome: true\n' });
  assert.equal(saved.status, 200);
  assert.equal((await saved.json()).config.appConfig.enableFontAwesome, true);
  assert.equal((await call('/schema.json')).status, 200);
  assert.equal((await call('/config-manager/save', 'POST', { config: 'sections: [invalid' })).status, 400);
});

test('insecure TLS proxy requests use the configured backend rather than silently ignoring the option', async () => {
  let forwarded;
  const req = new Request('https://home.example/cors-proxy', { method: 'POST', headers: { 'Target-URL': 'https://service.example/api', 'Allow-Insecure': 'true', CustomHeaders: '{"Authorization":"Bearer DASHY_SERVICE_TOKEN"}', 'content-type': 'application/json' }, body: '{}' });
  const response = await corsProxy(req, { DASHY_BACKEND_URL: 'https://probe.example', DASHY_BACKEND_AUTH: 'Basic probe-auth', DASHY_SERVICE_TOKEN: 'service-auth' }, async (url, options) => {
    if (url.includes('/dns-query?')) return dns();
    forwarded = { url, options }; return Response.json({ ok: true });
  });
  assert.equal(response.status, 200);
  assert.equal(forwarded.url, 'https://probe.example/cors-proxy');
  assert.equal(forwarded.options.headers.get('authorization'), 'Basic probe-auth');
  assert.equal(JSON.parse(forwarded.options.headers.get('customheaders')).authorization, 'Bearer service-auth');
});

test('delegated HTTP checks resolve CF Secrets and the proxy supports bodyless 304 responses', async () => {
  const params = new URLSearchParams({ url: 'https://service.example', enableInsecure: 'true', headers: '{"X-Token":"DASHY_CHECK_TOKEN"}' });
  const checked = await statusCheck(params, { DASHY_BACKEND_URL: 'https://probe.example', DASHY_CHECK_TOKEN: 'check-secret' }, async url => {
    if (url.includes('/dns-query?')) return dns();
    assert.equal(JSON.parse(new URL(url).searchParams.get('headers'))['x-token'], 'check-secret');
    return Response.json({ successStatus: true });
  });
  assert.equal(checked.successStatus, true);
  const response = await corsProxy(new Request('https://home.example/cors-proxy', { headers: { 'Target-URL': 'https://service.example' } }), {}, async url => url.includes('/dns-query?') ? dns() : new Response(null, { status: 304 }));
  assert.equal(response.status, 304); assert.equal(response.body, null);
});

test('ICMP has an actionable state without fabricating a result, and supports a real backend', async () => {
  const params = new URLSearchParams({ host: 'example.com' });
  const notConnected = await pingCheck(params, {});
  assert.equal(notConnected.successStatus, null); assert.match(notConnected.message, /DASHY_BACKEND_URL/);
  const actual = await pingCheck(params, { DASHY_BACKEND_URL: 'https://probe.example', DASHY_BACKEND_TOKEN: 'probe-secret' }, async (url, options) => {
    if (url.includes('/dns-query?')) return dns();
    assert.match(url, /\/ping-check\?host=example.com/);
    assert.equal(options.headers.get('authorization'), 'Bearer probe-secret');
    return Response.json({ successStatus: true, timeTaken: 23, message: 'UP 23ms' });
  });
  assert.equal(actual.timeTaken, 23);
});

test('weather accepts original coordinates and arbitrary cities while retaining the district presets', async () => {
  const fetched = [];
  const fetcher = async url => { fetched.push(new URL(url)); return Response.json({ coord: { lat: 0, lon: 0 }, name: 'Test', dt: 1, weather: [{ icon: '01d', description: 'clear' }], main: { temp: 19.37 } }); };
  await readWeather(new URLSearchParams({ city: 'London,GB' }), { OPENWEATHER_API_KEY: 'test-weather-a' }, fetcher);
  assert.equal(fetched.at(-1).searchParams.get('q'), 'London,GB');
  await readWeather(new URLSearchParams({ lat: '0', lon: '0', apiKey: 'DASHY_WEATHER_TOKEN' }), { DASHY_WEATHER_TOKEN: 'test-weather-b' }, fetcher);
  assert.equal(fetched.at(-1).searchParams.get('lat'), '0');
  assert.equal(fetched.at(-1).searchParams.get('appid'), 'test-weather-b');
  const district = await readWeather(new URLSearchParams({ city: 'wuchang' }), { OPENWEATHER_API_KEY: 'test-weather-c' }, fetcher);
  assert.equal(district.coord.lat, 30.5563); assert.equal(district.main.temp, 19.37);
  await assert.rejects(readWeather(new URLSearchParams({ lat: '91', lon: '0' }), { OPENWEATHER_API_KEY: 'test' }, fetcher));
});
