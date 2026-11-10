// Resolves a built-in icon value (lucide-*, fluent-*, flat-color-*) to its file.
// Generated index only: the searchable catalog is loaded by the icon picker on demand.
import index from './builtin-icon-index.json';

const packs = new Map(Object.entries(index).map(([pack, { names, files }]) => [pack, { names: new Set(names.split('|')), files }]));
export function builtinIconPath(value) {
  const [, pack, slug] = typeof value === 'string' ? value.match(/^(lucide|fluent|flat-color)-(.+)$/) || [] : [];
  const entry = packs.get(pack);
  if (!entry?.names.has(slug)) return '';
  return `/portal-icons/${pack}/${entry.files[slug] || slug}.svg`;
}
