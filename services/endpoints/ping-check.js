/**
 * This file contains the Node.js code, used for the optional ping check feature
 * It accepts many parameters (host, count, timeout) and will make a system ping icmp
 * request and then resolve the average response time.
 */
const net = require('net');
const ping = require('pingman');

// Max ICMP packets per check, matching the documented pingCheckCount limit
const MAX_COUNT = 5;

/* Bounds a numeric param, falling back to the default when absent or out of range */
const boundedParam = (value, fallback, max) => {
  const num = Math.floor(Number(value));
  if (!Number.isFinite(num) || num < 1) return fallback;
  return Math.min(num, max);
};

/* Returned if the URL params are not present or correct */
const immediateError = (render, error) => {
  render(JSON.stringify({
    successStatus: false,
    message: error || 'Ping check failed for unknown reason.',
  }));
};

/* Main function, will check if a URL present, and call function */
module.exports = (paramStr, render) => {
  if (!paramStr || !paramStr.includes('=')) {
    immediateError(render);
  } else {
    // Get the url to check from query params
    const params = new URLSearchParams(paramStr.slice(paramStr.indexOf('?') + 1));
    const host = params.get('host') || '';
    const count = boundedParam(params.get('count'), 2, MAX_COUNT);
    const timeout = boundedParam(params.get('timeout'), 2000, count * 1000);
    if (!host || typeof host !== 'string') {
      immediateError(render, 'Invalid host given for ping check.');
      return;
    }
    (async () => {
      try {
        const configuration = {
          timeout: Math.max(1, Math.round(timeout / 1000)),
          numberOfEchos: count,
          IPV4: net.isIPv4(host),
          IPV6: net.isIPv6(host),
        };
        const response = await ping(host, configuration);
        const results = {
          successStatus: response.alive,
          message: `${response.host} ${response.numericHost == response.host ? '' : `(${response.numericHost}) `} is ${response.alive ? `UP (${response.avg} ms)` : 'DOWN'}`,
          timeTaken: response.time,
        };
        render(JSON.stringify(results));
      } catch (error) {
        immediateError(render, 'Ping check failed : ' + (error.message || 'Unknown error'));
      }
    })();
  }
};
