// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { describe, it, expect, afterAll } from 'vitest';

// No Dashy auth configured here — only an API_TOKEN. Set before requiring app.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dashy-api-token-'));
process.env.USER_DATA_DIR = tmpDir;
process.env.ENABLE_API = 'true';
process.env.API_TOKEN = 'super-secret-token';
fs.writeFileSync(path.join(tmpDir, 'conf.yml'), 'pageInfo:\n  title: Test\nsections: []\n');

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.ENABLE_API;
  delete process.env.API_TOKEN;
});

const app = require('../../services/app');

const bearer = (token) => ({ Authorization: `Bearer ${token}` });

describe('API token auth (no other auth configured)', () => {
  it('closes the open gate — anonymous reads are rejected', async () => {
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(401);
  });

  it('rejects an incorrect token', async () => {
    const res = await request(app).get('/api/config').set(bearer('wrong-token'));
    expect(res.status).toBe(401);
  });

  it('rejects a token of a different length', async () => {
    const res = await request(app).get('/api/config').set(bearer('short'));
    expect(res.status).toBe(401);
  });

  it('rejects a non-bearer authorization header', async () => {
    const res = await request(app).get('/api/config').set({ Authorization: 'super-secret-token' });
    expect(res.status).toBe(401);
  });

  it('allows reads with a valid token', async () => {
    const res = await request(app).get('/api/config').set(bearer('super-secret-token'));
    expect(res.status).toBe(200);
    expect(res.body.files).toContain('conf.yml');
  });

  it('grants admin (write) access with a valid token', async () => {
    const res = await request(app).post('/api/config/conf.yml/sections')
      .set(bearer('super-secret-token')).send({ name: 'Added via token' });
    expect(res.status).toBe(201);
  });

  it('rejects writes without a token', async () => {
    const res = await request(app).post('/api/config/conf.yml/sections')
      .send({ name: 'Should fail' });
    expect(res.status).toBe(401);
  });
});
