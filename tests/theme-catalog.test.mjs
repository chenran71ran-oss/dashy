import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { orderThemes, themeLabels, readThemeFavorites } from '../src/utils/ThemeCatalog.js';
test('current and favorite themes stay at the top with Chinese and English search', () => {
  const names = ['default', 'material', 'matrix-red', 'adventure-basic', 'custom'];
  assert.deepEqual(orderThemes(names, 'adventure-basic', ['matrix-red', 'material', 'deleted']), ['adventure-basic', 'matrix-red', 'material', 'default', 'custom']);
  assert.deepEqual(orderThemes(names, 'material', ['material', 'matrix-red'], '矩阵'), ['matrix-red']);
  assert.deepEqual(orderThemes(names, 'material', [], 'adventure'), ['adventure-basic']);
  const defaults = fs.readFileSync(new URL('../src/utils/config/defaults.js', import.meta.url), 'utf8').match(/builtInThemes: \[([\s\S]*?)\]/)[1];
  for (const [,name] of defaults.matchAll(/'([^']+)'/g)) assert.ok(themeLabels[name], name);
});
test('favorite preferences tolerate disabled storage, invalid data and duplicates', () => {
  assert.deepEqual(readThemeFavorites({getItem(){throw new Error('disabled')}}), []);
  assert.deepEqual(readThemeFavorites({getItem:()=>'{invalid'}), []);
  assert.deepEqual(readThemeFavorites({getItem:()=>'["matrix","matrix",12,null]'}), ['matrix']);
});
test('all bundled SVG assets exist, stay local and preserve source licenses', () => {
  const entries = JSON.parse(fs.readFileSync(new URL('../src/utils/builtin-icons.json', import.meta.url), 'utf8'));
  assert.ok(entries.length > 1900);
  assert.equal(new Set(entries.map(e=>e.value)).size, entries.length);
  for (const entry of entries) {
    assert.ok(entry.src.startsWith('/portal-icons/'));
    const svg = fs.readFileSync(new URL('../public'+entry.src, import.meta.url), 'utf8');
    assert.ok(svg.includes('<svg') && svg.includes('</svg>'), entry.value);
    assert.ok(!/<script|(?:href|src)\s*=\s*["']https?:/i.test(svg), entry.value);
    if(entry.pack==='Fluent Emoji') assert.ok(!/<filter|feDropShadow/i.test(svg), entry.value);
  }
  for(const pack of ['lucide','fluent']) assert.ok(fs.readFileSync(new URL(`../public/portal-icons/${pack}/LICENSE`, import.meta.url),'utf8').includes('Copyright'));
});
