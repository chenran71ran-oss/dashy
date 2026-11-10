// Builds the small value→path index that cards load at start-up.
// The full catalogs (titles, tags, categories) stay in the icon picker's lazy chunk.
import fs from 'node:fs';

const read = name => JSON.parse(fs.readFileSync(new URL(`../src/utils/${name}`, import.meta.url), 'utf8'));
const index = {};
for (const { value, src } of [...read('flat-color-icons.json'), ...read('builtin-icons.json')]) {
  const [, pack, slug] = value.match(/^(lucide|fluent|flat-color)-(.+)$/) || [];
  if (!pack) throw new Error(`Unexpected built-in icon value: ${value}`);
  const file = src.match(new RegExp(`^/portal-icons/${pack}/(.+)\\.svg$`))?.[1];
  if (!file) throw new Error(`Unexpected built-in icon path: ${src}`);
  index[pack] ||= { names: [], files: {} };
  index[pack].names.push(slug);
  if (file !== slug) index[pack].files[slug] = file; // e.g. graduation-cap → graduation_cap
}
const out = Object.fromEntries(Object.entries(index).map(([pack, { names, files }]) => [pack, { names: names.join('|'), files }]));
fs.writeFileSync(new URL('../src/utils/builtin-icon-index.json', import.meta.url), `${JSON.stringify(out)}\n`);
console.log(Object.entries(index).map(([pack, { names }]) => `${pack}: ${names.length}`).join(', '));
