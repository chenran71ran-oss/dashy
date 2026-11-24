// After a deployment, an open tab still refers to the previous build's chunk files,
// which no longer exist. Loading one then fails, and a button that opens a lazily
// loaded dialog (such as 添加网站) appears to do nothing.
import { toast } from '@/utils/Toast';

const RELOAD_KEY = 'home-lab:stale-build-reload';
const RELOAD_GUARD_MS = 30000;
const ROUTE_WAIT_MS = 1000;
let notified = false;
let pendingReload = null;

const reloadPage = (destination) => { if (destination) window.location.assign(destination); else window.location.reload(); };

/* A route that failed to load is where the reload should land, not the page the user was leaving */
export function rememberDestination(path) {
  if (!pendingReload || !path) return;
  const { timer, reload } = pendingReload;
  clearTimeout(timer);
  pendingReload = null;
  reload(path);
}

/* Vite fires vite:preloadError when a lazily imported chunk cannot be loaded */
export function handleStaleBuild(event, { isEditing = () => false, reload = reloadPage } = {}) {
  event?.preventDefault?.();
  // Unsaved edits live only in memory: never reload them away without asking.
  if (isEditing()) {
    if (notified) return;
    notified = true;
    toast('网站刚刚更新，这个功能需要刷新页面才能使用。请先点「保存到云端」保存修改，再刷新。', {
      type: 'error',
      dismissible: true,
      duration: 0,
      action: { text: '刷新', onClick: () => reload() },
    });
    return;
  }
  // One automatic reload per tab; if the new build fails as well, show the error instead of looping.
  let last = 0;
  try { last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0; } catch { /* storage optional */ }
  if (Date.now() - last < RELOAD_GUARD_MS) return;
  try { sessionStorage.setItem(RELOAD_KEY, String(Date.now())); } catch { /* storage optional */ }
  // Vite retries the import after this event, and the router reports a failed route only after
  // that; give it a moment to say where it was going, then reload in place.
  if (pendingReload) return;
  pendingReload = { reload, timer: setTimeout(() => { pendingReload = null; reload(); }, ROUTE_WAIT_MS) };
}

export function watchForStaleBuild(store) {
  window.addEventListener('vite:preloadError', event => handleStaleBuild(event, { isEditing: () => !!store.state.editMode }));
}
