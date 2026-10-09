import test from 'node:test';
import assert from 'node:assert/strict';
import { compositeColor, contrastRatio, readableColor, cssColor } from '../src/utils/ThemeContrast.js';

test('same-color theme controls and white titles on light pages receive a readable fallback', () => {
  for (const [background, preferred] of [
    [[1, 87, 155], [[1, 87, 155]]],
    [[241, 241, 241], [[255, 255, 255], [41, 182, 246], [1, 87, 155]]],
    [[41, 182, 246], [[1, 87, 155]]],
    [[5, 7, 14], [[5, 7, 14]]],
  ]) {
    assert.ok(contrastRatio(readableColor(background, preferred), background) >= 4.5);
  }
  assert.deepEqual(readableColor([241, 241, 241], [[255, 255, 255], [1, 87, 155]]), [1, 87, 155]);
});

test('adequate theme colors are retained while arbitrary RGB surfaces meet text contrast', () => {
  assert.deepEqual(readableColor([11, 16, 33], [[92, 171, 202]]), [92, 171, 202]);
  for (let r = 0; r <= 255; r += 17) for (let g = 0; g <= 255; g += 17) for (let b = 0; b <= 255; b += 17) {
    const surface = [r, g, b];
    assert.ok(contrastRatio(readableColor(surface, [surface]), surface) >= 4.5);
  }
});

test('translucent theme surfaces are composited against the page before selecting text', () => {
  const surface = compositeColor([0, 0, 0, 0.2], [255, 255, 255]);
  assert.deepEqual(surface, [204, 204, 204]);
  assert.ok(contrastRatio(readableColor(surface, [[255, 255, 255]]), surface) >= 4.5);
  assert.equal(cssColor([1, 87, 155]), 'rgb(1, 87, 155)');
});
