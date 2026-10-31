import test from 'node:test';
import assert from 'node:assert/strict';
import { removeLightBackground } from '../src/utils/IconPixels.js';
import { discoverIcon } from '../cloud/icon-discovery.mjs';

const image = (size, paint) => {
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) data.set(paint(x, y), (y * size + x) * 4);
  return data;
};
const alphaAt = (result, x, y) => result.data[(y * result.width + x) * 4 + 3];

test('a white favicon background is removed and a dark single-colour logo follows the theme colour', () => {
  const data = image(32, (x, y) => (x >= 10 && x < 22 && y >= 10 && y < 22 ? [34, 34, 34, 255] : [255, 255, 255, 255]));
  const result = removeLightBackground(data, 32, 32);
  assert.ok(result);
  assert.equal(result.mono, true);
  assert.equal(result.width, 14); // 12 px mark, cropped, with a small margin
  assert.equal(alphaAt(result, 0, 0), 0);
  assert.equal(alphaAt(result, 7, 7), 255);
});

test('colour logos stay in colour and white details inside the mark are kept', () => {
  const data = image(40, (x, y) => {
    if (x >= 16 && x < 24 && y >= 16 && y < 24) return [255, 255, 255, 255]; // white inner detail
    if (x >= 8 && x < 32 && y >= 8 && y < 32) return [220, 30, 60, 255];
    return [250, 250, 250, 255];
  });
  const result = removeLightBackground(data, 40, 40);
  assert.equal(result.mono, false);
  const centre = Math.floor(result.width / 2);
  assert.equal(alphaAt(result, centre, centre), 255);
  assert.deepEqual([...result.data.slice((centre * result.width + centre) * 4, (centre * result.width + centre) * 4 + 3)], [255, 255, 255]);
});

test('photos, dark app tiles and already transparent icons are left unchanged', () => {
  let seed = 7; const noise = () => (seed = (seed * 1103515245 + 12345) % 2147483648) % 256;
  assert.equal(removeLightBackground(image(32, () => [noise(), noise(), noise(), 255]), 32, 32), null);
  assert.equal(removeLightBackground(image(32, (x, y) => (x > 8 && x < 24 && y > 8 && y < 24 ? [255, 255, 255, 255] : [0, 0, 0, 255])), 32, 32), null);
  assert.equal(removeLightBackground(image(32, (x, y) => (x > 8 && x < 24 && y > 8 && y < 24 ? [200, 0, 0, 255] : [0, 0, 0, 0])), 32, 32), null);
  assert.equal(removeLightBackground(image(32, () => [255, 255, 255, 255]), 32, 32), null); // nothing would remain
});

test('icon discovery picks the sharpest declared icon instead of a small rel=icon favicon', async () => {
  const png = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8R8AAAAASUVORK5CYII=', 'base64'));
  const page = (head) => async (url) => {
    const href = String(url);
    if (href.includes('/dns-query?')) return Response.json({ Status: 0, Answer: [{ type: 1, data: '8.8.8.8' }] });
    if (href.endsWith('.png') || href.endsWith('.svg')) return new Response(href.endsWith('.svg') ? '<svg xmlns="http://www.w3.org/2000/svg"/>' : png, { headers: { 'content-type': href.endsWith('.svg') ? 'image/svg+xml' : 'image/png' } });
    return new Response(`<html><head>${head}</head></html>`, { headers: { 'content-type': 'text/html' } });
  };
  const touch = await discoverIcon('https://sharp.example/', page('<link rel="icon" href="/favicon-32.png" sizes="32x32"><link rel="apple-touch-icon" href="/touch.png">'));
  assert.equal(touch.icon, 'https://sharp.example/touch.png');
  const large = await discoverIcon('https://sharp.example/', page('<link rel="apple-touch-icon" href="/touch.png"><link rel="icon" href="/big.png" sizes="16x16 256x256">'));
  assert.equal(large.icon, 'https://sharp.example/big.png');
  const vector = await discoverIcon('https://sharp.example/', page('<link rel="icon" href="/big.png" sizes="512x512"><link rel="icon" href="/logo.svg" type="image/svg+xml">'));
  assert.equal(vector.icon, 'https://sharp.example/logo.svg');
});
