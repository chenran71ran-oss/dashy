// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { describe, it, expect, afterAll } from 'vitest';

// Auth strategy is chosen when the app module loads, so env must be set first
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dashy-api-auth-'));
process.env.USER_DATA_DIR = tmpDir;
process.env.ENABLE_API = 'true';
process.env.BASIC_AUTH_USERNAME = 'admin';
process.env.BASIC_AUTH_PASSWORD = 'test-pass';
fs.writeFileSync(path.join(tmpDir, 'conf.yml'), 'pageInfo:\n  title: Test\nsections: []\n');

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.ENABLE_API;
  delete process.env.BASIC_AUTH_USERNAME;
  delete process.env.BASIC_AUTH_PASSWORD;
});

const app = require('../../services/app');

describe('API auth', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(401);
  });

  it('rejects incorrect credentials', async () => {
    const res = await request(app).get('/api/config').auth('admin', 'wrong');
    expect(res.status).toBe(401);
  });

  it('allows authenticated reads', async () => {
    const res = await request(app).get('/api/config').auth('admin', 'test-pass');
    expect(res.status).toBe(200);
    expect(res.body.files).toContain('conf.yml');
  });

  it('allows authenticated writes', async () => {
    const res = await request(app).put('/api/config/conf.yml')
      .auth('admin', 'test-pass')
      .send({ pageInfo: { title: 'Updated' }, sections: [] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('responds with the disabled message before any auth challenge', async () => {
    process.env.ENABLE_API = 'false';
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(404);
    expect(res.headers['www-authenticate']).toBeUndefined();
    process.env.ENABLE_API = 'true';
  });
});
