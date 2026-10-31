/**
 * A Vue directive to trigger an event when the user
 * clicks anywhere other than the specified elements
 * Used to close context menus popup modals and tips
 * Dashy: Licensed under MIT - (C) Alicia Sykes 2024
 */

// Keyed by element, so removing one instance can never detach another's listener,
// and an unmounted element (with its closure) is released with it.
const handlers = new WeakMap();

/* Trigger action when click anywhere, except target elem */
function onDocumentClick(event, elem, action) {
  const { target } = event;
  if (elem !== target && !elem.contains(target)) {
    action(event);
  }
}

export default {
  /* Add event listeners */
  mounted(elem, binding) {
    const state = { action: binding.value };
    state.click = (event) => {
      if (typeof state.action === 'function') onDocumentClick(event, elem, state.action);
    };
    document.addEventListener('click', state.click);
    document.addEventListener('touchstart', state.click, { passive: true });
    handlers.set(elem, state);
  },
  /* Keep the latest handler without re-registering document listeners */
  updated(elem, binding) {
    const state = handlers.get(elem);
    if (state) state.action = binding.value;
  },
  /* Remove event listeners */
  unmounted(elem) {
    const state = handlers.get(elem);
    if (!state) return;
    document.removeEventListener('click', state.click);
    document.removeEventListener('touchstart', state.click);
    handlers.delete(elem);
  },
};
