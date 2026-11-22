// @vitest-environment node
import { describe, it, expect } from 'vitest';

const isTrustedProxy = require('../../services/utils/trusted-proxy');

describe('isTrustedProxy', () => {
  it('matches IPv4 proxies on a dual-stack socket', () => {
    expect(isTrustedProxy(['172.18.0.2'], '::ffff:172.18.0.2')).toBe(true);
    expect(isTrustedProxy(['::ffff:172.18.0.2'], '::ffff:172.18.0.2')).toBe(true);
    expect(isTrustedProxy(['127.0.0.1'], '::1')).toBe(true);
  });

  it('rejects anything not on the list', () => {
    expect(isTrustedProxy(['172.18.0.2'], '::ffff:172.18.0.3')).toBe(false);
    expect(isTrustedProxy(['127.0.0.1'], '127.0.0.2')).toBe(false);
    expect(isTrustedProxy([null], undefined)).toBe(false);
  });
});
