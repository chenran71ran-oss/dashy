import { createApp } from 'vue';
import CloudLogin from './CloudLogin.vue';
import './styles/typography.scss';

async function start() {
  // Remove upstream PWA caches before touching any private data.
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
  }
  if ('caches' in window) await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
  let gate;
  const enter = async () => {
    if (gate) gate.unmount();
    window.__KH_CLOUD_AUTH = true;
    // Clear Dashy's browser-only config; HOME_KV is the source of truth.
    for (const key of Object.keys(localStorage)) {
      if (/^(confSections|confPages|appConfig|pageInfo)(:|$)/.test(key)) localStorage.removeItem(key);
    }
    await import('./main.js');
  };
  try {
    const response = await fetch('/api/session', { credentials: 'same-origin', cache: 'no-store' });
    if (response.ok) return await enter();
  } catch { /* Display the password form and a retryable error on submit. */ }
  gate = createApp(CloudLogin, { onAuthenticated: enter });
  gate.mount('#app');
}
start();
