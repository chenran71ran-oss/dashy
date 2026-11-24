// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { describe, it, expect, afterAll } from 'vitest';

// Both Dashy basic-auth AND an API_TOKEN configured — either should work
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dashy-api-coexist-'));
process.env.USER_DATA_DIR = tmpDir;
process.env.ENABLE_API = 'true';
process.env.API_TOKEN = 'token-value';
process.env.BASIC_AUTH_USERNAME = 'admin';
process.env.BASIC_AUTH_PASSWORD = 'pass';
fs.writeFileSync(path.join(tmpDir, 'conf.yml'), 'pageInfo:\n  title: Test\nsections: []\n');

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.ENABLE_API;
  delete process.env.API_TOKEN;
  delete process.env.BASIC_AUTH_USERNAME;
  delete process.env.BASIC_AUTH_PASSWORD;
});

const app = require('../../services/app');

describe('API token coexisting with Dashy auth', () => {
  it('accepts a valid API token', async () => {
    const res = await request(app).get('/api/config').set({ Authorization: 'Bearer token-value' });
    expect(res.status).toBe(200);
  });

  it('accepts valid basic-auth credentials', async () => {
    const res = await request(app).get('/api/config').auth('admin', 'pass');
    expect(res.status).toBe(200);
  });

  it('allows token-authenticated writes', async () => {
    const res = await request(app).put('/api/config/conf.yml')
      .set({ Authorization: 'Bearer token-value' })
      .send({ pageInfo: { title: 'Via token' }, sections: [] });
    expect(res.status).toBe(200);
  });

  it('rejects when neither credential is supplied', async () => {
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(401);
  });

  it('rejects an invalid token without falling through to open access', async () => {
    const res = await request(app).get('/api/config').set({ Authorization: 'Bearer nope' });
    expect(res.status).toBe(401);
  });
});
