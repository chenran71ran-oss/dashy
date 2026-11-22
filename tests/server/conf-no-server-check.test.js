// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { load as yamlLoad } from 'js-yaml';
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

const CONF = `appConfig:
  auth:
    enableOidc: true
    oidc:
      endpoint: https://example.test/
      clientId: dashy-test
      disableServerSideCheck: true
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
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dashy-no-check-test-'));
  fs.writeFileSync(path.join(tmpDir, 'conf.yml'), CONF);
  fs.writeFileSync(path.join(tmpDir, 'sub.yml'), 'pageInfo:\n  title: Sub\n');
  fs.writeFileSync(path.join(tmpDir, 'my page.yml'), 'pageInfo:\n  title: Sub\n');
  process.env.USER_DATA_DIR = tmpDir;
  delete require.cache[require.resolve('../../services/app')];
  delete require.cache[require.resolve('../../services/utils/auth-oidc')];
  app = require('../../services/app');
});

describe('OIDC with disableServerSideCheck', () => {
  it('serves the full, unstripped conf.yml without auth', async () => {
    const res = await request(app).get('/conf.yml');
    expect(res.status).toBe(200);
    const body = yamlLoad(res.text);
    expect(body._bootstrap).toBeUndefined();
    expect(body.sections).toHaveLength(1);
    expect(body.pageInfo.title).toBe('My Dashboard');
  });

  it('serves non-root yml files without auth', async () => {
    const res = await request(app).get('/sub.yml');
    expect(res.status).toBe(200);
  });

  it('serves yml files with encoded characters in the name', async () => {
    expect((await request(app).get('/my%20page.yml')).status).toBe(200);
  });

  it('does not reject API routes on an invalid Bearer token', async () => {
    const res = await request(app)
      .get('/status-check')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).not.toBe(401);
  });
});
