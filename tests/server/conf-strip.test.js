// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { load as yamlLoad } from 'js-yaml';
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

const FULL_CONF = `appConfig:
  enableServiceWorker: true
  theme: dark
  customCss: '.secret { color: red }'
  auth:
    enableOidc: true
    oidc:
      endpoint: https://example.test/
      clientId: dashy-test
      adminGroup: admins
pageInfo:
  title: My Dashboard
sections:
  - name: Internal Services
    items:
      - title: secret-host
        url: http://10.0.0.5
`;

let app;
let tmpDir;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dashy-strip-test-'));
  fs.writeFileSync(path.join(tmpDir, 'conf.yml'), FULL_CONF);
  fs.writeFileSync(path.join(tmpDir, 'sub.yml'), 'pageInfo:\n  title: Sub\n');
  fs.writeFileSync(path.join(tmpDir, 'sub.yaml'), 'pageInfo:\n  title: Sub\n');
  process.env.USER_DATA_DIR = tmpDir;
  delete require.cache[require.resolve('../../services/app')];
  delete require.cache[require.resolve('../../services/utils/auth-oidc')];
  app = require('../../services/app');
});

describe('OIDC strip behaviour for /conf.yml', () => {
  it('returns only auth + minimal pageInfo when unauthenticated', async () => {
    const res = await request(app).get('/conf.yml');
    expect(res.status).toBe(200);
    const body = yamlLoad(res.text);
    expect(body._bootstrap.authenticated).toBe(false);
    expect(body._bootstrap.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(body.appConfig.auth.enableOidc).toBe(true);
    expect(body.appConfig.auth.oidc.clientId).toBe('dashy-test');
    expect(body.appConfig.enableServiceWorker).toBe(true);
    expect(body.pageInfo.title).toBe('Login | My Dashboard');
    expect(body.sections).toBeUndefined();
    expect(body.appConfig.customCss).toBeUndefined();
    expect(body.appConfig.theme).toBeUndefined();
  });

  it('sets cache headers to prevent cross-auth-state caching', async () => {
    const res = await request(app).get('/conf.yml');
    expect(res.headers['cache-control']).toContain('no-store');
    expect(res.headers['vary']).toContain('Authorization');
  });

  it('requires valid auth for non-root yml files', async () => {
    const res = await request(app).get('/sub.yml');
    expect(res.status).toBe(401);
  });

  it('also rejects sub-yml requests with invalid Bearer', async () => {
    const res = await request(app)
      .get('/sub.yml')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('requires valid auth for non-root yaml files (not bypassed via static)', async () => {
    const res = await request(app).get('/sub.yaml');
    expect(res.status).toBe(401);
  });

  it.each(['/sub%2Eyml', '/sub.ya%6Dl', '/sub.yml%2F.'])('requires auth for encoded path %s', async (url) => {
    expect((await request(app).get(url)).status).toBe(401);
  });

  it('strips conf.yml requested via an encoded path', async () => {
    const body = yamlLoad((await request(app).get('/conf%2Eyml')).text);
    expect(body._bootstrap.authenticated).toBe(false);
    expect(body.sections).toBeUndefined();
  });

  it('falls through to bootstrap on conf.yml when Bearer fails to verify', async () => {
    const res = await request(app)
      .get('/conf.yml')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(200);
    const body = yamlLoad(res.text);
    expect(body._bootstrap.authenticated).toBe(false);
  });

  it('strict middleware still rejects invalid Bearer on protected API routes', async () => {
    const res = await request(app)
      .get('/status-check')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});
