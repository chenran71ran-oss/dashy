// One capability list for the Worker adapter and the browser UI.
// Feature choices belong to the user's Dashy config. Data services report their own errors.
export const CLOUD_CAPABILITIES = Object.freeze({
  statusChecks: true,
  pingChecks: true,
  localUrlChecks: true,
  widgets: 'all',
});
