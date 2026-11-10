import { createApp } from 'vue';
import CloudLogin from './CloudLogin.vue';
import './styles/typography.scss';
// Reuse the portal palettes before authentication.
import './styles/login-palettes.scss';
import { configChanged, primeRootConfig } from './utils/BootConfig.js';

const SIGNED_IN_KEY = 'home-lab:signed-in';
const remember = (signedIn) => { try { if (signedIn) localStorage.setItem(SIGNED_IN_KEY, '1'); else localStorage.removeItem(SIGNED_IN_KEY); } catch { /* storage optional */ } };

async function start() {
  let gate;
  const enter = async () => {
    if (gate) gate.unmount();
    window.__KH_CLOUD_AUTH = true;
    remember(true);
    await import('./main.js');
    const { default: store } = await import('./store.js');
    let refreshing=false, lastRefresh=0;
    const refreshConfig=async () => {
      if(document.hidden||refreshing||store.state.editMode||store.state.modalOpen||Date.now()-lastRefresh<5000)return;
      refreshing=true;lastRefresh=Date.now();
      try {
        const response=await fetch('/api/config',{credentials:'same-origin',cache:'no-store'});
        if(!response.ok)return;
        const text=await response.text();
        // An unchanged configuration must not rebuild the store and re-render every card.
        if(!configChanged(text))return;
        const {config}=JSON.parse(text);
        // Never replace edits that were opened while the request was in flight.
        if(store.state.editMode||store.state.modalOpen)return;
        store.commit('SET_ROOT_CONFIG',config);await store.dispatch('INITIALIZE_CONFIG',store.state.currentConfigInfo.confId);
      } catch { /* Keep the last successful configuration while offline. */ }
      finally { refreshing=false; }
    };
    window.addEventListener('focus',refreshConfig);
    document.addEventListener('visibilitychange',refreshConfig);
    // Open desktop/mobile sessions converge after another device saves a theme.
    setInterval(refreshConfig,30000);
  };
  // The configuration request doubles as the session check, and returning visitors
  // download the app code at the same time instead of after it.
  const first = fetch('/conf.yml', { credentials: 'same-origin', cache: 'no-store' });
  let returning = false;
  try { returning = localStorage.getItem(SIGNED_IN_KEY) === '1'; } catch { /* storage optional */ }
  if (returning) Promise.all([import('./store.js'), import('./router.js'), import('./App.vue')]).catch(() => {});
  try {
    const response = await first;
    if (response.ok) {
      const text = await response.text();
      configChanged(JSON.stringify({ config: JSON.parse(text) }));
      primeRootConfig(Promise.resolve(JSON.parse(text)));
      return await enter();
    }
    // Any failure other than "not signed in" is shown by the app's own error screen.
    if (response.status !== 401) return await enter();
  } catch { /* Display the password form and a retryable error on submit. */ }
  remember(false);
  gate = createApp(CloudLogin, { onAuthenticated: enter });
  gate.mount('#app');
}
start();
