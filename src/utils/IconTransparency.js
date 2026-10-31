// Makes light-background website icons transparent, once per image per tab.
// Work runs in one shared Web Worker that is created on demand and terminated
// when idle; results are kept in a bounded in-memory map of small data URLs
// (nothing is written to browser storage, and no object URLs need revoking).
import { processIconBlob } from './IconPixels.js';

const LIMIT = 256;
const IDLE_MS = 20000;
const results = new Map(); // source -> { src, mono } | null
const pending = new Map(); // source -> Promise
let worker = null; let idleTimer = null; let nextId = 0;
const waiting = new Map(); // message id -> resolve

function remember(source, result) {
  if (results.has(source)) results.delete(source);
  else if (results.size >= LIMIT) results.delete(results.keys().next().value);
  results.set(source, result);
}

function stopWorker() {
  clearTimeout(idleTimer); idleTimer = null;
  if (worker) worker.terminate();
  worker = null;
  for (const resolve of waiting.values()) resolve(null);
  waiting.clear();
}

function getWorker() {
  if (worker) return worker;
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') return null;
  try {
    worker = new Worker(new URL('./IconTransparency.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => { const resolve = waiting.get(data.id); waiting.delete(data.id); resolve?.(data.result); scheduleIdle(); };
    worker.onerror = stopWorker;
  } catch { worker = null; }
  return worker;
}

function scheduleIdle() {
  clearTimeout(idleTimer);
  if (!waiting.size) idleTimer = setTimeout(stopWorker, IDLE_MS);
}

function inWorker(blob) {
  const target = getWorker();
  if (!target) {
    const makeCanvas = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
    return processIconBlob(blob, makeCanvas).catch(() => null);
  }
  clearTimeout(idleTimer);
  return new Promise((resolve) => { const id = ++nextId; waiting.set(id, resolve); target.postMessage({ id, blob }); });
}

/* Only same-origin raster images can be read; bundled and vector artwork is curated already */
export function canMakeTransparent(source) {
  if (!source || typeof window === 'undefined' || /^data:/i.test(source)) return false;
  let url;
  try { url = new URL(source, window.location.href); } catch { return false; }
  if (url.origin !== window.location.origin || url.pathname.startsWith('/portal-icons/')) return false;
  const target = url.pathname === '/api/icon-image' ? url.searchParams.get('url') || '' : url.pathname;
  return !/\.svg(?:$|[?#])/i.test(target);
}

/* undefined: not processed yet; null: show unchanged; { src, mono }: transparent version */
export function transparentIcon(source) { return results.has(source) ? results.get(source) : undefined; }

export function makeTransparent(source, { fetcher = fetch } = {}) {
  if (!canMakeTransparent(source)) return Promise.resolve(null);
  if (results.has(source)) return Promise.resolve(results.get(source));
  if (pending.has(source)) return pending.get(source);
  const task = (async () => {
    let response;
    try { response = await fetcher(source, { credentials: 'same-origin' }); } catch { return null; }
    // Network and HTTP failures are retried on a later mount; decoded results are kept.
    if (!response.ok) return null;
    const result = (await inWorker(await response.blob()).catch(() => null)) || null;
    remember(source, result);
    return result;
  })().finally(() => pending.delete(source));
  pending.set(source, task);
  return task;
}

export function releaseIconWorker() { stopWorker(); }
