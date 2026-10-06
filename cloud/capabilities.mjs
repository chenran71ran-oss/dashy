// One capability list for the Worker adapter and the browser UI.
// Keep upstream settings and components, but do not execute unconnected services.
export const CLOUD_CAPABILITIES = Object.freeze({
  statusChecks: false,
  pingChecks: false,
  localUrlChecks: false,
  widgets: Object.freeze(['clock', 'image', 'iframe']),
});
