import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const part = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const jwt = (claims) => `${part({ alg: 'RS256' })}.${part(claims)}.sig`;
const goodToken = () => jwt({ exp: Math.floor(Date.now() / 1000) + 60 });
const expiredToken = () => jwt({ exp: Math.floor(Date.now() / 1000) - 60 });

async function loadRequest({
  oidc = false,
  keycloak = false,
  renew = vi.fn(),
  basic = { headers: { Authorization: 'Basic abc' } },
} = {}) {
  vi.resetModules();
  vi.doMock('@/utils/auth/Auth', () => ({ makeBasicAuthHeaders: vi.fn(() => basic) }));
  vi.doMock('@/utils/auth/OidcAuth', () => ({
    isOidcEnabled: vi.fn(() => oidc),
    getOidcAuth: vi.fn(() => ({ renewForApiRequest: renew })),
  }));
  vi.doMock('@/utils/auth/KeycloakAuth', () => ({
    isKeycloakEnabled: vi.fn(() => keycloak),
    getKeycloakAuth: vi.fn(() => ({ renewForApiRequest: renew })),
  }));
  vi.doMock('@/utils/logging/CoolConsole', () => ({
    statusMsg: vi.fn(),
    statusErrorMsg: vi.fn(),
  }));
  return (await import('@/utils/request')).default;
}

describe('request auth headers', () => {
  beforeEach(() => {
    window.happyDOM.setURL('https://dash.example.com/');
    vi.restoreAllMocks();
    localStorage.getItem.mockReset();
    global.fetch = vi.fn(() => Promise.resolve(new Response('{"ok":true}', { status: 200 })));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock('@/utils/auth/Auth');
    vi.doUnmock('@/utils/auth/OidcAuth');
    vi.doUnmock('@/utils/auth/KeycloakAuth');
    vi.doUnmock('@/utils/logging/CoolConsole');
  });

  it('keeps Basic fallback for non-SSO local requests', async () => {
    localStorage.getItem.mockReturnValue(null);
    const request = await loadRequest();

    await request.get('/status-check');

    expect(fetch).toHaveBeenCalledWith('/status-check', expect.objectContaining({
      headers: { Authorization: 'Basic abc' },
    }));
  });

  it('does not fall back to Basic when OIDC is enabled and bearer is unusable', async () => {
    localStorage.getItem.mockReturnValue(expiredToken());
    const request = await loadRequest({ oidc: true });

    await request.get('/status-check');

    expect(fetch).toHaveBeenCalledWith('/status-check', expect.objectContaining({
      headers: {},
    }));
  });

  it('sends bearer for SSO when a usable token exists', async () => {
    const token = goodToken();
    localStorage.getItem.mockReturnValue(token);
    const request = await loadRequest({ oidc: true });

    await request.get('/status-check');

    expect(fetch).toHaveBeenCalledWith('/status-check', expect.objectContaining({
      headers: { Authorization: `Bearer ${token}` },
    }));
  });

  it('renews once and retries a local SSO request after 401', async () => {
    let token = expiredToken();
    const fresh = goodToken();
    localStorage.getItem.mockImplementation(() => token);
    fetch
      .mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }))
      .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }));
    const renew = vi.fn(async () => {
      token = fresh;
      return true;
    });
    const request = await loadRequest({ oidc: true, renew });

    await request.get('/status-check');

    expect(renew).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenNthCalledWith(1, '/status-check', expect.objectContaining({
      headers: {},
    }));
    expect(fetch).toHaveBeenNthCalledWith(2, '/status-check', expect.objectContaining({
      headers: { Authorization: `Bearer ${fresh}` },
    }));
  });

  it('does not renew again when the retried request still returns 401', async () => {
    localStorage.getItem.mockImplementation(() => expiredToken());
    fetch
      .mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }))
      .mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }));
    const renew = vi.fn(async () => true);
    const request = await loadRequest({ oidc: true, renew });

    await expect(request.get('/status-check')).rejects.toThrow();

    expect(renew).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('does not retry when renewal fails', async () => {
    localStorage.getItem.mockImplementation(() => expiredToken());
    fetch.mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }));
    const renew = vi.fn(async () => false);
    const request = await loadRequest({ oidc: true, renew });

    await expect(request.get('/status-check')).rejects.toThrow();

    expect(renew).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('never attaches a bearer or renews for external requests', async () => {
    localStorage.getItem.mockReturnValue(goodToken());
    const renew = vi.fn();
    fetch.mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }));
    const request = await loadRequest({ oidc: true, renew });

    await expect(request.get('https://api.example.com/data')).rejects.toThrow();

    expect(renew).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/data', expect.objectContaining({
      headers: {},
    }));
  });

  it('sends auth to absolute URLs on the same origin', async () => {
    localStorage.getItem.mockReturnValue(null);
    const request = await loadRequest();

    await request.get('https://dash.example.com/conf.yml');

    expect(fetch).toHaveBeenCalledWith('https://dash.example.com/conf.yml', expect.objectContaining({
      headers: { Authorization: 'Basic abc' },
    }));
  });

  it.each([
    'https://dash.example.com.evil.tld/conf.yml',
    'https://dash.example.com:8443/conf.yml',
    '/\\evil.tld/conf.yml',
  ])('does not send auth to %s, which is a different origin', async (url) => {
    localStorage.getItem.mockReturnValue(null);
    const request = await loadRequest();

    await request.get(url);

    expect(fetch).toHaveBeenCalledWith(url, expect.objectContaining({ headers: {} }));
  });

  it('matches VITE_APP_DOMAIN by origin, not prefix', async () => {
    vi.stubEnv('VITE_APP_DOMAIN', 'https://api.example.com');
    localStorage.getItem.mockReturnValue(null);
    const request = await loadRequest();

    await request.get('https://api.example.com/status-check');
    await request.get('https://api.example.com.evil.tld/status-check');

    expect(fetch.mock.calls.map(([, options]) => options.headers)).toEqual([
      { Authorization: 'Basic abc' },
      {},
    ]);
  });
});
