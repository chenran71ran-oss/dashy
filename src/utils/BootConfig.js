// The cloud entry fetches the root configuration while app code downloads.
// The store takes that response once, instead of asking the server again.
let primed = null;
let lastText = '';

export function primeRootConfig(promise) { primed = promise; }
export function takeRootConfig() { const value = primed; primed = null; return value; }

/* True when a fetched configuration differs from the last one seen in this tab */
export function configChanged(text) {
  if (text === lastText) return false;
  lastText = text;
  return true;
}
