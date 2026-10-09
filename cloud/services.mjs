// Dashy-compatible services for Workers. Auth is enforced by worker.mjs.
import { isPublicAddress } from './icon-discovery.mjs';

const REDIRECTS = new Set([301, 302, 303, 307, 308]);
const blockedHost = /(^|\.)(localhost|local|internal|home|lan|invalid)$/i;
const failure = (message, status = 400) => Object.assign(new Error(message), { status });

export function substituteEnv(value, env) {
  if (typeof value === 'string') return value.replace(/\b(?:DASHY_|VITE_APP_|VUE_APP_)\w+/g, name => typeof env[name] === 'string' ? env[name] : name);
  if (Array.isArray(value)) return value.map(v => substituteEnv(v, env));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, substituteEnv(v, env)]));
  return value;
}

export async function publicServiceUrl(value, fetcher = fetch, signal) {
  let u;
  try { u = new URL(value); } catch { throw failure('请填写完整的 HTTP/HTTPS 接口地址'); }
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || blockedHost.test(u.hostname)) throw failure('接口地址无效或属于私有网络', 403);
  const host = u.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (/^[\d.]+$/.test(host) || host.includes(':')) {
    if (!isPublicAddress(host)) throw failure('不能从公共 Worker 请求私有 IP', 403);
  } else {
    if (!host.includes('.')) throw failure('请使用公共域名', 403);
    const addresses = (await Promise.all(['A', 'AAAA'].map(async type => {
      const response = await fetcher(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`, { redirect: 'manual', signal, headers: { Accept: 'application/dns-json' } });
      if (!response.ok) throw failure('无法解析接口域名', 502);
      const data = await response.json();
      if (data.Status !== 0) throw failure('无法解析接口域名', 502);
      return (data.Answer || []).filter(a => a.type === 1 || a.type === 28).map(a => a.data);
    }))).flat();
    if (!addresses.length || addresses.some(a => !isPublicAddress(a))) throw failure('接口域名没有公共网络地址', 403);
  }
  u.hash = '';
  return u;
}

export async function readLimited(response, maxBytes = 10 * 1024 * 1024) {
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.length;
      if (size > maxBytes) throw failure('接口响应过大', 413);
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  const result = new Uint8Array(size); let at = 0;
  for (const chunk of chunks) { result.set(chunk, at); at += chunk.length; }
  return result;
}

async function publicFetch(url, options, fetcher, redirects = 5) {
  let target = await publicServiceUrl(url, fetcher, options.signal);
  let method = options.method || 'GET', body = options.body, headers = new Headers(options.headers);
  for (let count = 0; ; count++) {
    const response = await fetcher(target.href, { ...options, method, body, headers, redirect: 'manual', credentials: 'omit' });
    if (!REDIRECTS.has(response.status) || count >= redirects) return response;
    const location = response.headers.get('location');
    if (!location) return response;
    await response.body?.cancel();
    const next = await publicServiceUrl(new URL(location, target).href, fetcher, options.signal);
    if (next.origin !== target.origin) headers = new Headers({ Accept: headers.get('accept') || '*/*' });
    if (response.status === 303 || ([301, 302].includes(response.status) && method === 'POST')) { method = 'GET'; body = undefined; headers.delete('content-type'); }
    target = next;
  }
}

function customHeaders(value, env) {
  let data;
  try { data = (value ? substituteEnv(JSON.parse(value), env) : {}) ?? {}; } catch { throw failure('自定义请求头需要有效 JSON 对象'); }
  if (!data || Array.isArray(data) || typeof data !== 'object' || Object.values(data).some(v => typeof v !== 'string')) throw failure('自定义请求头需要字符串键值');
  const headers = new Headers(data);
  // Never forward the Home Lab session or transport-controlled headers.
  for (const key of ['host', 'content-length', 'connection', 'transfer-encoding', 'target-url', 'customheaders']) headers.delete(key);
  return headers;
}

export async function backendService(path, params, env, fetcher = fetch) {
  if (!env.DASHY_BACKEND_URL) return null;
  const base = new URL(env.DASHY_BACKEND_URL);
  const target = new URL(base.href.replace(/\/$/, '') + path);
  target.search = params.toString();
  const headers = env.DASHY_BACKEND_AUTH ? { Authorization: env.DASHY_BACKEND_AUTH } : env.DASHY_BACKEND_TOKEN ? { Authorization: `Bearer ${env.DASHY_BACKEND_TOKEN}` } : {};
  const response = await publicFetch(target.href, { signal: AbortSignal.timeout(30000), headers }, fetcher, 0);
  if (!response.ok) throw failure('主机探针服务未能返回数据，请检查后端地址和认证', 502);
  const bytes = await readLimited(response);
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw failure('主机探针服务返回无效 JSON', 502); }
}

export async function statusCheck(params, env, fetcher = fetch) {
  const started = Date.now();
  if (params.get('enableInsecure') === 'true' && env.DASHY_BACKEND_URL) {
    const forwarded = new URLSearchParams(params);
    forwarded.set('url', substituteEnv(params.get('url'), env));
    forwarded.set('headers', JSON.stringify(Object.fromEntries(customHeaders(params.get('headers'), env))));
    return backendService('/status-check', forwarded, env, fetcher);
  }
  if (params.get('enableInsecure') === 'true') return { successStatus: null, message: '忽略 TLS 证书验证需要配置 DASHY_BACKEND_URL；普通 HTTPS 检测无需此选项。' };
  try {
    const url = substituteEnv(params.get('url'), env);
    const headers = customHeaders(params.get('headers'), env);
    const rawRedirects = params.get('maxRedirects');
    const redirects = rawRedirects === null ? 5 : Math.max(0, Math.min(20, Number(rawRedirects) || 0));
    const response = await publicFetch(url, { headers, signal: AbortSignal.timeout(10000) }, fetcher, redirects);
    await response.body?.cancel();
    const accepted = (params.get('acceptCodes') || '').split(',').map(v => Number(v.trim())).filter(Number.isFinite);
    const successStatus = response.status >= 200 && response.status <= 302 || accepted.includes(response.status);
    return { successStatus, statusCode: response.status, statusText: response.statusText, timeTaken: Date.now() - started, message: `${successStatus ? '✅' : '⚠️'} HTTP ${response.status} ${response.statusText} · ${Date.now() - started} ms` };
  } catch (e) { return { successStatus: false, timeTaken: Date.now() - started, message: e.status ? e.message : '检测请求超时或无法连接' }; }
}

export async function pingCheck(params, env, fetcher = fetch) {
  const host = params.get('host');
  if (!host || !/^[\w.:[\]-]+$/.test(host) || host.length > 253) throw failure('Ping 主机地址无效');
  const normalized = new URLSearchParams({ host, count: String(Math.max(1, Math.min(5, Number(params.get('count')) || 2))), timeout: String(Math.max(100, Math.min(30000, Number(params.get('timeout')) || 2000))) });
  return await backendService('/ping-check', normalized, env, fetcher) || { successStatus: null, available: false, message: 'ICMP Ping 已保留，需要在 CF 设置 DASHY_BACKEND_URL 接入主机探针。HTTP 在线检测可以直接使用。' };
}

export async function corsProxy(req, env, fetcher = fetch) {
  const target = substituteEnv(req.headers.get('Target-URL'), env);
  const headers = customHeaders(req.headers.get('CustomHeaders'), env);
  const type = req.headers.get('content-type'); if (type && !headers.has('content-type')) headers.set('content-type', type);
  let body;
  if (!['GET', 'HEAD'].includes(req.method)) {
    const bytes = await readLimited(req, 3 * 1024 * 1024);
    const raw = new TextDecoder().decode(bytes);
    try { body = JSON.stringify(substituteEnv(JSON.parse(raw), env)); } catch { body = substituteEnv(raw, env); }
  }
  let response;
  if (req.headers.get('Allow-Insecure') === 'true') {
    if (!env.DASHY_BACKEND_URL) throw failure('忽略 TLS 证书验证需要配置 DASHY_BACKEND_URL', 422);
    await publicServiceUrl(target, fetcher);
    const proxyHeaders = new Headers({ 'Target-URL': target, CustomHeaders: JSON.stringify(Object.fromEntries(headers)), 'Allow-Insecure': 'true', ...(type ? { 'content-type': type } : {}) });
    if (env.DASHY_BACKEND_AUTH) proxyHeaders.set('authorization', env.DASHY_BACKEND_AUTH);
    else if (env.DASHY_BACKEND_TOKEN) proxyHeaders.set('authorization', `Bearer ${env.DASHY_BACKEND_TOKEN}`);
    const endpoint = env.DASHY_BACKEND_URL.replace(/\/$/, '') + '/cors-proxy';
    response = await publicFetch(endpoint, { method: req.method, headers: proxyHeaders, body, signal: AbortSignal.timeout(30000) }, fetcher, 0);
  } else response = await publicFetch(target, { method: req.method, headers, body, signal: AbortSignal.timeout(30000) }, fetcher);
  const bytes = await readLimited(response);
  return new Response(response.status === 304 ? null : bytes, { status: response.ok ? 200 : response.status, headers: { 'content-type': response.headers.get('content-type') || 'application/json', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; sandbox" } });
}
