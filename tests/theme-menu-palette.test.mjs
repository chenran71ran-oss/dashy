import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import * as sass from 'sass';
import {themeLabels} from '../src/utils/ThemeCatalog.js';
import {themeMenuPalette} from '../src/utils/ThemeMenuPalette.js';
import {contrastRatio} from '../src/utils/ThemeContrast.js';
import {themeAuditDom} from '../scripts/lib/theme-audit-dom.mjs';

test('all 54 real Sass palettes produce opaque, readable normal, hover and selected menus', async () => {
  const css = sass.compileString("@import 'src/styles/media-queries.scss';@import 'src/styles/color-palette.scss';@import 'src/styles/dimensions.scss';@import 'src/styles/color-themes.scss';", {
    silenceDeprecations: ['import','global-builtin','color-functions'],
    loadPaths: [fileURLToPath(new URL('../', import.meta.url)), fileURLToPath(new URL('../src/styles', import.meta.url))],
    importers: [{findFileUrl: url => url.startsWith('@/') ? new URL(`../src/${url.slice(2)}`, import.meta.url) : null}],
  }).css;
  const page = themeAuditDom(css);
  const previous = {document: globalThis.document, getComputedStyle: globalThis.getComputedStyle};
  globalThis.document = page.document; globalThis.getComputedStyle = page.getComputedStyle;
  const backgrounds = new Set();
  const rgb = value => value.match(/[\d.]+/g).map(Number);
  const ratio = (colors, fg, bg) => contrastRatio(rgb(colors[`--theme-menu-${fg}`]), rgb(colors[`--theme-menu-${bg}`]));
  try {
    assert.equal(Object.keys(themeLabels).length, 54);
    for (const theme of Object.keys(themeLabels)) {
      if (theme === 'default') page.document.documentElement.removeAttribute('data-theme');
      else page.document.documentElement.dataset.theme = theme;
      const colors = themeMenuPalette(); backgrounds.add(colors['--theme-menu-background']);
      for (const [foreground, background, minimum] of [
        ['color','background',4.45], ['muted','background',4.45], ['accent','background',4.45],
        ['hover-color','highlight',4.45], ['selected-color','selected',4.45], ['border','background',2.95],
      ]) assert.ok(ratio(colors, foreground, background) >= minimum, `${theme}: ${foreground} on ${background}`);
      assert.match(colors['--theme-menu-background'], /^rgb\(/, `${theme}: opaque menu`);
    }
    assert.ok(backgrounds.size > 15, 'menus must follow their theme rather than a fixed light palette');
    page.document.documentElement.style.setProperty('--settings-background', 'none');
    page.document.documentElement.style.setProperty('--background', '#ffffff');
    assert.equal(themeMenuPalette()['--theme-menu-background'], 'rgb(255, 255, 255)');
  } finally {
    globalThis.document = previous.document; globalThis.getComputedStyle = previous.getComputedStyle;
    await page.happyDOM.close();
  }
});
