import { createApp } from 'vue';
import CloudLogin from './CloudLogin.vue';
import './styles/typography.scss';

async function start() {
  let gate;
  const enter = async () => {
    if (gate) gate.unmount();
    window.__KH_CLOUD_AUTH = true;
    await import('./main.js');
    const { default: store } = await import('./store.js');
    let refreshing=false, lastRefresh=0;
    const refreshConfig=async () => {
      if(document.hidden||refreshing||store.state.editMode||store.state.modalOpen||Date.now()-lastRefresh<5000)return;
      refreshing=true;lastRefresh=Date.now();
      try {
        const response=await fetch('/api/config',{credentials:'same-origin',cache:'no-store'});
        if(!response.ok)return;
        const {config}=await response.json();
        // Never replace edits that were opened while the request was in flight.
        if(store.state.editMode||store.state.modalOpen)return;
        store.commit('SET_ROOT_CONFIG',config);await store.dispatch('INITIALIZE_CONFIG',store.state.currentConfigInfo.confId);
      } catch { /* Keep the last successful configuration while offline. */ }
      finally { refreshing=false; }
    };
    window.addEventListener('focus',refreshConfig);
    document.addEventListener('visibilitychange',refreshConfig);
  };
  try {
    const response = await fetch('/api/session', { credentials: 'same-origin', cache: 'no-store' });
    if (response.ok) return await enter();
  } catch { /* Display the password form and a retryable error on submit. */ }
  gate = createApp(CloudLogin, { onAuthenticated: enter });
  gate.mount('#app');
}
start();
