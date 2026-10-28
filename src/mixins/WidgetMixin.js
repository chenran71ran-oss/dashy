/**
 * Mixin that all pre-built and custom widgets extend from.
 * Manages loading state, error handling, data updates and user options
 */
import { Progress } from 'rsup-progress';
import { markRaw } from 'vue';
import request from '@/utils/request';
import ErrorHandler from '@/utils/logging/ErrorHandler';
import { serviceEndpoints } from '@/utils/config/defaults';

const WidgetMixin = {
  props: {
    options: {
      type: Object,
      default: {},
    },
  },
  data: () => ({
    progress: markRaw(new Progress({ color: 'var(--progress-bar)' })),
    overrideProxyChoice: false,
    overrideUpdateInterval: null,
    disableLoader: false, // Prevent ever showing the loader
    updater: null, // Stores interval
    progressEndTimer: null,
    widgetDisposed: false,
    defaultTimeout: 50000,
  }),
  /* When component mounted, fetch initial data */
  mounted() {
    this.fetchData();
    if (this.updateInterval) {
      this.continuousUpdates();
      this.disableLoader = true;
    }
  },
  beforeUnmount() {
    this.widgetDisposed = true;
    clearTimeout(this.progressEndTimer);
    this.progress.end(true);
    if (this.updater) {
      clearInterval(this.updater);
    }
  },
  computed: {
    proxyReqEndpoint() {
      const baseUrl = import.meta.env.VITE_APP_DOMAIN || window.location.origin;
      return `${baseUrl}${serviceEndpoints.corsProxy}`;
    },
    useProxy() {
      return this.options.useProxy || this.overrideProxyChoice;
    },
    /* Skip TLS verification on proxied requests, for self-signed or mismatched certs */
    allowInsecure() {
      return !!this.options.allowInsecure;
    },
    requestTimeout() {
      return this.options.timeout || this.defaultTimeout;
    },
    /* Returns either a number in ms to continuously update widget data. Or 0 for no updates */
    updateInterval() {
      const usersInterval = this.options.updateInterval;
      if (usersInterval === null && this.overrideUpdateInterval) {
        return this.overrideUpdateInterval * 1000;
      }
      if (!usersInterval) return 0;
      // If set to `true`, then default to 30 seconds
      if (typeof usersInterval === 'boolean') return 30 * 1000;
      // If set to a number, and within valid range, return user choice
      if (typeof usersInterval === 'number'
        && usersInterval >= 2
        && usersInterval <= 7200) {
        return usersInterval * 1000;
      }
      return 0;
    },
  },
  methods: {
    /* Re-fetches external data, called by parent. Usually overridden by widget */
    update() {
      this.startLoading();
      this.fetchData();
    },
    /* If continuous updates enabled, create interval */
    continuousUpdates() {
      if (this.updater) clearInterval(this.updater);
      if (this.widgetDisposed || !this.updateInterval) return;
      this.updater = setInterval(() => { this.update(); }, this.updateInterval);
    },
    /* Called when an error occurs. Logs to handler, and passes to parent component */
    error(msg, stackTrace, quite = false) {
      ErrorHandler(msg, stackTrace);
      if (!this.options.ignoreErrors && !quite) {
        this.$emit('error', msg);
      }
    },
    /* When a data request update starts, show loader */
    startLoading() {
      if (this.widgetDisposed) return;
      if (!this.disableLoader) {
        this.$emit('loading', true);
        this.progress.start();
      }
    },
    /* When a data request finishes, hide loader */
    finishLoading() {
      if (this.widgetDisposed) return;
      this.$emit('loading', false);
      clearTimeout(this.progressEndTimer);
      this.progressEndTimer = setTimeout(() => { this.progress.end(); this.progressEndTimer = null; }, 500);
    },
    /* Overridden by child component. Will make network request, then end loader */
    fetchData() {
      this.finishLoading();
    },
    /* Used as v-tooltip, pass text content in, and will show on hover */
    tooltip(content, html = false) {
      return {
        content, html,
      };
    },
    /* Builds the headers which tell the CORS proxy where, and how, to make the request */
    proxyHeaders(endpoint, customHeaders = null) {
      return {
        'Target-URL': endpoint,
        CustomHeaders: JSON.stringify(customHeaders),
        'Content-Type': 'application/json',
        ...(this.allowInsecure ? { 'Allow-Insecure': 'true' } : {}),
      };
    },
    /* Makes data request, returns promise */
    makeRequest(endpoint, options, protocol, body) {
      // Request Options
      const method = protocol || 'GET';
      const url = this.useProxy ? this.proxyReqEndpoint : endpoint;
      const data = JSON.stringify(body || {});
      const CustomHeaders = options || null;
      const headers = this.useProxy
        ? this.proxyHeaders(endpoint, CustomHeaders) : CustomHeaders;
      const requestConfig = {
        method, url, headers, data, timeout: this.requestTimeout,
      };
      // Make request
      return new Promise((resolve, reject) => {
        request(requestConfig)
          .then((response) => {
            if (response.data.success === false) {
              this.error('Proxy returned error from target server', response.data.message);
            }
            resolve(response.data);
          })
          .catch((dataFetchError) => {
            const errorMessage = this.formatRequestError(dataFetchError);
            this.error(errorMessage, dataFetchError);
            reject(dataFetchError);
          })
          .finally(() => {
            this.finishLoading();
          });
      });
    },
    /* Get user-facing error message from certain failed request types */
    formatRequestError(err) {
      if (!err) return 'Unable to fetch data';
      // Client-side timeout: request never produced a response
      if (err.timeout && !err.response) {
        return `Request timed out after ${this.requestTimeout}ms. `
          + 'Check the target is reachable, or increase the widget\'s `timeout` option';
      }
      // Errors surfaced by the cors-proxy carry classification + upstream detail
      const upstream = err.response && err.response.data && err.response.data.error;
      if (upstream) {
        if (upstream.timeout) {
          return 'Upstream server timed out. The target API is slow or unreachable.';
        }
        if (upstream.type === 'upstream_status' && upstream.status) {
          const tail = upstream.statusText ? ` ${upstream.statusText}` : '';
          return `Upstream returned ${upstream.status}${tail}.`;
        }
        if (upstream.type === 'upstream_error') {
          // Node TLS failures which the user can opt out of, with `allowInsecure`
          const TLS_ERROR_CODE = /^(?:ERR_TLS_|UNABLE_TO_|SELF_SIGNED_|DEPTH_ZERO_|CERT_)/;
          if (!this.allowInsecure && TLS_ERROR_CODE.test(upstream.code || '')) {
            return `TLS certificate could not be verified (${upstream.code}). `
              + 'If you trust this host, set `allowInsecure: true` on the widget.';
          }
          return `Could not reach target server${upstream.code ? ` (${upstream.code})` : ''}.`;
        }
      }
      // Likely CORS error, need useProxy
      if (!err.response && !this.useProxy) {
        return 'Failed to reach target from this context. Possibly a CORS error.';
      }
      return 'Unable to fetch data';
    },
    /* If the string is a build-time env-var placeholder, return its value
     * Otherwise, will pass it through to the proxy for it to resolve server-side */
    parseAsEnvVar(str) {
      if (typeof str !== 'string') return str;
      if (!/^(?:VITE_APP_|VUE_APP_|DASHY_)/.test(str)) return str;
      const envKey = str.replace(/^VUE_APP_/, 'VITE_APP_');
      return import.meta.env[envKey] ?? str;
    },
  },
};

export default WidgetMixin;
