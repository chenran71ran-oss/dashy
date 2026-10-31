// Warms icons of categories that are not on screen yet, while the browser is idle.
// Discovery shares SiteIcons' bounded cache, and image warming uses the same
// address as the card, so a later category switch renders from cache.
import { discoverSiteIcon } from './SiteIcons.js';
import { matchPortalIcon, websiteIcon } from './PortalIcons.js';
import { iconCrossOrigin, iconImageSource } from './IconImagePolicy.js';

const WARMED_LIMIT = 512;
const warmed = new Set(); // Image addresses already requested in this tab

export function scheduleIdle(task, timeout = 1500) {
  if (typeof window === 'undefined') return () => {};
  if (window.requestIdleCallback) {
    const id = window.requestIdleCallback(task, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(task, 200);
  return () => clearTimeout(id);
}

// Load one image without keeping the element alive afterwards.
export function preloadImage(path, { timeout = 8000 } = {}) {
  if (typeof Image === 'undefined' || !path || warmed.has(path)) return Promise.resolve(false);
  if (warmed.size >= WARMED_LIMIT) warmed.delete(warmed.values().next().value);
  warmed.add(path);
  return new Promise((resolve) => {
    let image = new Image();
    const finish = (loaded) => {
      clearTimeout(timer);
      if (!image) return;
      image.onload = null; image.onerror = null; image = null;
      if (!loaded) warmed.delete(path);
      resolve(loaded);
    };
    const timer = setTimeout(() => finish(false), timeout);
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    const mode = iconCrossOrigin(path); if (mode) image.crossOrigin = mode;
    image.onload = () => finish(true);
    image.onerror = () => finish(false);
    image.src = path;
  });
}

function flatten(items = []) {
  return items.flatMap(item => (Array.isArray(item?.subItems) ? flatten(item.subItems) : [item]));
}

// Warm the discovery result and image address that this item's card will load.
async function warmItem(item, defaultIcon, { discover, preload }) {
  if (!item?.url) return;
  const icon = websiteIcon(item, defaultIcon);
  if (icon === 'auto') {
    if (matchPortalIcon(item.url, item.title)) return;
    const result = await discover(item.url, { page: true });
    if (result?.verified && result.icon) await preload(iconImageSource(result.icon));
  } else if (/^https:\/\//i.test(icon)) {
    await preload(iconImageSource(icon));
  }
}

/**
 * Warm icons for the given items with a small concurrency limit.
 * Returns a cancel function; cancelled work stops before its next item.
 */
export function prefetchItemIcons(items, {
  defaultIcon = '', concurrency = 3, discover = discoverSiteIcon, preload = preloadImage,
} = {}) {
  const queue = flatten(items).filter(item => item?.url);
  let cancelled = false;
  const worker = async () => {
    while (!cancelled && queue.length) {
      const item = queue.shift();
      try { await warmItem(item, defaultIcon, { discover, preload }); } catch { /* Cards keep their own fallbacks. */ }
    }
  };
  const done = Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
  const cancel = () => { cancelled = true; queue.length = 0; };
  cancel.done = done;
  return cancel;
}
