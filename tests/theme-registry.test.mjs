import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import defaults from '../src/utils/config/defaults.js';
import { themeLabels } from '../src/utils/ThemeCatalog.js';
import schema from '../src/utils/config/ConfigSchema.json' with { type: 'json' };

// Selectors kept from upstream Dashy, but deliberately not offered in the theme menu.
const unlisted = ['blue-purple', 'glow-colorful', 'hacker-girl', 'oblivion-blue', 'oblivion-lemon', 'oblivion-mint', 'oblivion-scotch'];
const cssThemes = () => {
  const dir = new URL('../src/styles/', import.meta.url).pathname;
  const files = fs.readdirSync(dir, { recursive: true }).filter(f => f.endsWith('.scss'));
  const names = new Set();
  for (const file of files) {
    for (const [, name] of fs.readFileSync(path.join(dir, file), 'utf8').matchAll(/data-theme=['"]?([a-z0-9-]+)/g)) names.add(name);
  }
  return names;
};

test('menu labels, built-in list and config schema name the same themes', () => {
  const builtIn = defaults.builtInThemes;
  assert.equal(new Set(builtIn).size, builtIn.length);
  assert.deepEqual([...builtIn].sort(), Object.keys(themeLabels).sort());
  assert.deepEqual(schema.properties.appConfig.properties.theme.examples, builtIn);
});

test('every built-in theme has styles, and no other selector is silently unreachable', () => {
  const css = cssThemes();
  css.delete('my-theme'); // Documented example in user-defined-themes.scss
  const builtIn = new Set(defaults.builtInThemes);
  assert.deepEqual(defaults.builtInThemes.filter(name => name !== 'default' && !css.has(name)), []);
  assert.deepEqual([...css].filter(name => !builtIn.has(name)).sort(), unlisted);
});
