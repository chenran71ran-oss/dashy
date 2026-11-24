// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import * as yaml from 'js-yaml';

// Isolate writes to a temp dir so the real user-data/conf.yml is never touched
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dashy-api-'));
process.env.USER_DATA_DIR = tmpDir;
process.env.ENABLE_API = 'true';
afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.ENABLE_API;
});

const app = require('../../services/app');

const seedConf = `pageInfo:
  title: Test Dashboard
sections:
  - name: Section One
    items:
      - title: Item A
        url: https://example.com/a
      - title: Item B
  - name: Section Two
`;

const readDisk = (file) => yaml.load(fs.readFileSync(path.join(tmpDir, file), 'utf8'));

beforeEach(() => {
  fs.writeFileSync(path.join(tmpDir, 'conf.yml'), seedConf);
  fs.writeFileSync(path.join(tmpDir, 'page2.yml'), 'pageInfo:\n  title: Page Two\n');
});

describe('API enablement gate', () => {
  it('returns 404 when ENABLE_API is not true', async () => {
    process.env.ENABLE_API = 'false';
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(404);
    expect(res.body.message).toContain('API not enabled');
    process.env.ENABLE_API = 'true';
  });

  it('returns 404 when ENABLE_API is unset', async () => {
    delete process.env.ENABLE_API;
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(404);
    process.env.ENABLE_API = 'true';
  });

  it('returns 404 for unknown API routes', async () => {
    const res = await request(app).get('/api/nonsense');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Not found');
  });
});

describe('List and read config', () => {
  it('lists config files, excluding backups', async () => {
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(200);
    expect(res.body.files).toContain('conf.yml');
    expect(res.body.files).toContain('page2.yml');
    expect(res.body.files).not.toContain('config-backups');
  });

  it('returns a config file as JSON', async () => {
    const res = await request(app).get('/api/config/conf.yml');
    expect(res.status).toBe(200);
    expect(res.body.pageInfo.title).toBe('Test Dashboard');
    expect(res.body.sections).toHaveLength(2);
  });

  it('404s for a missing file', async () => {
    const res = await request(app).get('/api/config/nope.yml');
    expect(res.status).toBe(404);
  });

  it('rejects path traversal', async () => {
    const res = await request(app).get('/api/config/..%2F..%2Fetc%2Fpasswd');
    expect(res.status).toBe(400);
  });

  it('rejects non-yaml filenames', async () => {
    const res = await request(app).get('/api/config/evil.txt');
    expect(res.status).toBe(400);
  });

  it('returns a top-level key', async () => {
    const res = await request(app).get('/api/config/conf.yml/pageInfo');
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Test Dashboard');
  });

  it('rejects a non-whitelisted key', async () => {
    const res = await request(app).get('/api/config/conf.yml/banana');
    expect(res.status).toBe(400);
  });

  it('404s for an absent key', async () => {
    const res = await request(app).get('/api/config/conf.yml/appConfig');
    expect(res.status).toBe(404);
  });

  it('500s for unparseable YAML', async () => {
    fs.writeFileSync(path.join(tmpDir, 'broken.yml'), 'foo: [unclosed');
    const res = await request(app).get('/api/config/broken.yml');
    expect(res.status).toBe(500);
  });
});

describe('Replace config and keys', () => {
  it('replaces a whole config file and makes a backup', async () => {
    const res = await request(app).put('/api/config/conf.yml')
      .send({ pageInfo: { title: 'Replaced' }, sections: [] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(readDisk('conf.yml').pageInfo.title).toBe('Replaced');
    const backups = fs.readdirSync(path.join(tmpDir, 'config-backups'));
    expect(backups.some((f) => f.startsWith('conf-'))).toBe(true);
  });

  it('rejects schema-invalid conf.yml writes', async () => {
    const res = await request(app).put('/api/config/conf.yml')
      .send({ sections: 'not-a-list' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('schema');
    expect(readDisk('conf.yml').sections).toHaveLength(2);
  });

  it('accepts a pageInfo-only sub-page write', async () => {
    const res = await request(app).put('/api/config/page2.yml')
      .send({ pageInfo: { title: 'Updated Page' } });
    expect(res.status).toBe(200);
    expect(readDisk('page2.yml').pageInfo.title).toBe('Updated Page');
  });

  it('rejects oversized configs', async () => {
    const res = await request(app).put('/api/config/conf.yml')
      .send({ sections: [{ name: 'x'.repeat(300 * 1024) }] });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('256');
  });

  it('replaces a top-level key', async () => {
    const res = await request(app).put('/api/config/conf.yml/pageInfo')
      .send({ title: 'New Title' });
    expect(res.status).toBe(200);
    expect(readDisk('conf.yml').pageInfo.title).toBe('New Title');
  });
});

describe('Sections CRUD', () => {
  it('adds a section', async () => {
    const res = await request(app).post('/api/config/conf.yml/sections')
      .send({ name: 'Section Three' });
    expect(res.status).toBe(201);
    expect(res.body.index).toBe(2);
    expect(readDisk('conf.yml').sections).toHaveLength(3);
  });

  it('rejects a section without a name', async () => {
    const res = await request(app).post('/api/config/conf.yml/sections').send({});
    expect(res.status).toBe(400);
  });

  it('gets a section by index', async () => {
    const res = await request(app).get('/api/config/conf.yml/sections/0');
    expect(res.body.name).toBe('Section One');
  });

  it('gets a section by name', async () => {
    const res = await request(app).get('/api/config/conf.yml/sections/Section%20Two');
    expect(res.body.name).toBe('Section Two');
  });

  it('patches a section, leaving other fields untouched', async () => {
    const res = await request(app).patch('/api/config/conf.yml/sections/0')
      .send({ icon: 'fas fa-rocket' });
    expect(res.status).toBe(200);
    const section = readDisk('conf.yml').sections[0];
    expect(section.icon).toBe('fas fa-rocket');
    expect(section.items).toHaveLength(2);
  });

  it('deletes a section', async () => {
    const res = await request(app).delete('/api/config/conf.yml/sections/1');
    expect(res.status).toBe(200);
    expect(readDisk('conf.yml').sections).toHaveLength(1);
  });

  it('404s for an unknown section', async () => {
    expect((await request(app).get('/api/config/conf.yml/sections/99')).status).toBe(404);
    expect((await request(app).get('/api/config/conf.yml/sections/Nope')).status).toBe(404);
  });

  it('400s when sections is not a list', async () => {
    fs.writeFileSync(path.join(tmpDir, 'scalar.yml'), 'sections: just-a-string\n');
    const res = await request(app).get('/api/config/scalar.yml/sections/0');
    expect(res.status).toBe(400);
  });
});

describe('Items CRUD', () => {
  it('lists items, defaulting to empty for a section without any', async () => {
    expect((await request(app).get('/api/config/conf.yml/sections/0/items')).body).toHaveLength(2);
    expect((await request(app).get('/api/config/conf.yml/sections/1/items')).body).toEqual([]);
  });

  it('adds an item, creating the items array if missing', async () => {
    const res = await request(app).post('/api/config/conf.yml/sections/1/items')
      .send({ title: 'New Item' });
    expect(res.status).toBe(201);
    expect(readDisk('conf.yml').sections[1].items[0].title).toBe('New Item');
  });

  it('rejects an item without a title', async () => {
    const res = await request(app).post('/api/config/conf.yml/sections/0/items').send({});
    expect(res.status).toBe(400);
  });

  it('gets an item by index and by title', async () => {
    expect((await request(app).get('/api/config/conf.yml/sections/0/items/1')).body.title).toBe('Item B');
    expect((await request(app).get('/api/config/conf.yml/sections/0/items/Item%20A')).body.title).toBe('Item A');
  });

  it('patches an item', async () => {
    const res = await request(app).patch('/api/config/conf.yml/sections/0/items/0')
      .send({ url: 'https://example.com/new' });
    expect(res.status).toBe(200);
    const item = readDisk('conf.yml').sections[0].items[0];
    expect(item.url).toBe('https://example.com/new');
    expect(item.title).toBe('Item A');
  });

  it('deletes an item', async () => {
    const res = await request(app).delete('/api/config/conf.yml/sections/0/items/0');
    expect(res.status).toBe(200);
    expect(readDisk('conf.yml').sections[0].items).toHaveLength(1);
  });

  it('404s for an unknown item', async () => {
    const res = await request(app).get('/api/config/conf.yml/sections/0/items/99');
    expect(res.status).toBe(404);
  });
});

describe('Robustness', () => {
  it('returns JSON for malformed request bodies', async () => {
    const res = await request(app).post('/api/config/conf.yml/sections')
      .set('Content-Type', 'application/json').send('{not json');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns JSON for bodies over the 1mb parser limit', async () => {
    const res = await request(app).put('/api/config/conf.yml')
      .set('Content-Type', 'application/json')
      .send(`{"sections": [{"name": "${'x'.repeat(1100 * 1024)}"}]}`);
    expect(res.status).toBe(413);
    expect(res.body.success).toBe(false);
  });


  it('does not write when the existing file is unparseable', async () => {
    fs.writeFileSync(path.join(tmpDir, 'broken.yml'), 'foo: [unclosed');
    const res = await request(app).patch('/api/config/broken.yml/sections/0').send({ name: 'x' });
    expect(res.status).toBe(500);
    expect(fs.readFileSync(path.join(tmpDir, 'broken.yml'), 'utf8')).toBe('foo: [unclosed');
  });

  it('handles concurrent writes without corrupting the file', async () => {
    const patch = (icon) => request(app)
      .patch('/api/config/conf.yml/sections/0').send({ icon });
    const results = await Promise.all(['a', 'b', 'c', 'd', 'e'].map(patch));
    results.forEach((res) => expect(res.status).toBe(200));
    expect(() => readDisk('conf.yml')).not.toThrow();
  });
});
