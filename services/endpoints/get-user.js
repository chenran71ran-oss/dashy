const isTrustedProxy = require('../utils/trusted-proxy');

module.exports = (config, req) => {
  try {
    if (config.appConfig?.auth?.enableHeaderAuth) {
      const { userHeader = 'Remote-User' } = config.appConfig.auth.headerAuth;
      const { proxyWhitelist } = config.appConfig.auth.headerAuth;
      if (isTrustedProxy(proxyWhitelist, req.socket.remoteAddress)) {
        return { success: true, user: req.headers[userHeader.toLowerCase()] };
      }
    }
    return {};
  } catch (e) {
    console.warn('Error get-user: ', e);
    return { success: false };
  }
};
