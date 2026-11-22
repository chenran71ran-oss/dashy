/* Dual-stack sockets see IPv4 peers as ::ffff:a.b.c.d, and proxies using localhost may arrive on ::1 */
module.exports = (proxyWhitelist, ip) => {
  const ipv4 = ip === '::1' ? '127.0.0.1' : ip?.replace(/^::ffff:/, '');
  return proxyWhitelist.includes(ip) || proxyWhitelist.includes(ipv4);
};
