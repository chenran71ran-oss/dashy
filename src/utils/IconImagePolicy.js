// A cross-origin icon must never initiate browser HTTP authentication.
// The Worker proxy stays first; its direct-image fallback is anonymous/CORS-only.
export function iconCrossOrigin(source) {
  if (typeof window === 'undefined' || !window.__KH_CLOUD_AUTH || !source) return undefined;
  try {
    const url = new URL(source, window.location.href);
    if (['http:', 'https:'].includes(url.protocol) && url.origin !== window.location.origin) return 'anonymous';
  } catch { /* Invalid images are handled by the normal broken-image fallback. */ }
  return undefined;
}
// The address a card actually loads, so prefetches warm the same browser cache entry.
export function iconImageSource(path, { fallback = false } = {}) {
  if (typeof window === 'undefined') return path;
  return window.__KH_CLOUD_AUTH && !fallback && /^https:\/\//i.test(path || '') ? `/api/icon-image?url=${encodeURIComponent(path)}` : path;
}
