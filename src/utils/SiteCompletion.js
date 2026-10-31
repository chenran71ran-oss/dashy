// Finds websites without an icon or description, and applies the values the
// user accepted in the editor. Descriptions come only from the site's own
// English metadata; nothing is translated or generated.
import { matchPortalIcon, websiteIcon } from './PortalIcons.js';

const isLink = item => !Array.isArray(item?.subItems) && typeof item?.url === 'string' && /^https?:\/\//i.test(item.url);

/* Entries are addressed by index path: [section, item, subItem, ...] */
export function findIncompleteItems(sections = [], defaultIcon = '') {
  const found = [];
  const visit = (items, path, sectionName) => (items || []).forEach((item, index) => {
    const at = [...path, index];
    if (Array.isArray(item?.subItems)) { visit(item.subItems, at, sectionName); return; }
    if (!isLink(item)) return;
    const needsIcon = websiteIcon(item, defaultIcon) === 'auto' && !matchPortalIcon(item.url, item.title);
    const needsDescription = !String(item.description || '').trim();
    if (needsIcon || needsDescription) {
      found.push({ key: at.join('.'), path: at, sectionName, title: item.title || '', url: item.url, needsIcon, needsDescription });
    }
  });
  sections.forEach((section, index) => visit(section?.items, [index], section?.name || ''));
  return found;
}

/* Returns new sections; untouched sections and items keep their identity */
export function applyCompletions(sections = [], changes = []) {
  const next = [...sections];
  changes.forEach(({ path, icon, description }) => {
    const [sectionIndex, ...itemPath] = path;
    if (!next[sectionIndex]) return;
    const section = { ...next[sectionIndex] };
    const update = (items, [index, ...rest]) => {
      if (!Array.isArray(items) || !items[index]) return items;
      const copy = [...items];
      const item = { ...copy[index] };
      if (rest.length) item.subItems = update(item.subItems, rest);
      else {
        if (icon) item.icon = icon;
        if (description && !String(item.description || '').trim()) item.description = description;
      }
      copy[index] = item;
      return copy;
    };
    section.items = update(section.items, itemPath);
    next[sectionIndex] = section;
  });
  return next;
}

export async function readSiteDescription(url, { fetcher = fetch } = {}) {
  let page;
  try { const target = new URL(url); target.search = ''; target.hash = ''; page = target.href; } catch { return { description: '', reason: 'public-site-required' }; }
  try {
    const response = await fetcher('/api/site-description', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page }), signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) return { description: '', reason: response.status === 401 ? 'login-required' : `http-${response.status}` };
    const data = await response.json();
    return { description: typeof data.description === 'string' ? data.description.trim().slice(0, 300) : '', source: typeof data.source === 'string' ? data.source : '', reason: data.reason || '' };
  } catch { return { description: '', reason: 'request' }; }
}
