// Public brand assets only. Website lists and credentials stay in the user's KV.
import { officialSiteIcons } from '../../cloud/icon-catalog.mjs';
const qx = (id, title, file, hosts = [], aliases = []) => ({ id, title, src: `/portal-icons/qx/${file}.png`, hosts, aliases, source: 'QX' });
// Transparent marks from simple-icons (scripts/sync-brand-icons.mjs); QX artwork stays in the repository.
const brand = (entry, file, extra = {}) => ({ ...entry, src: `/portal-icons/brand/${file}.svg`, source: 'simple-icons (CC0) official mark', ...extra });
const local = (id, title, hosts = [], aliases = []) => ({ id, title, src: `/portal-icons/${id}.svg`, hosts, aliases, source: 'Simple Icons' });
export const portalIcons = [
  { id: 'notebooklm', title: 'NotebookLM / Gemini Notebook', src: '/portal-icons/notebooklm-official.svg', hosts: ['notebooklm.google.com', 'notebooklm.google', 'notebook.google'], exactHosts: true, aliases: ['notebooklm', 'notebook lm', 'gemini notebook'], source: 'Google official v6 favicon' },
  { id: 'brog-hub', title: 'Brog Hub', src: '/portal-icons/brog-hub.svg', hosts: ['aileader.chenran71ran.cc'], exactHosts: true, aliases: ['brog hub'], source: 'Owner-provided artwork' },
  { id: 'aistudio', title: 'Google AI Studio / Gemini API', src: officialSiteIcons['aistudio.google.com'], hosts: ['aistudio.google.com'], aliases: ['google api', 'google ai studio', 'gemini api'], source: 'Official AI Studio product icon' },
  { id: 'deepseek', title: 'DeepSeek / DeepSeek API', src: officialSiteIcons['platform.deepseek.com'], hosts: ['deepseek.com'], aliases: ['deepseek', 'deepseek api', '深度求索'], source: 'Official platform favicon' },
  { id: 'nodeseek', title: 'NodeSeek', src: officialSiteIcons['nodeseek.com'], hosts: ['nodeseek.com'], aliases: ['nodeseek', 'node seek'], source: 'Official favicon' },
  { id: 'awsconsole', title: 'AWS Management Console', src: officialSiteIcons['console.aws.amazon.com'], hosts: ['console.aws.amazon.com'], aliases: ['aws', 'aws控制面板'], source: 'AWS Architecture Icons' },
  { id: 'linuxdo', title: 'LINUX DO', src: officialSiteIcons['linux.do'], hosts: ['linux.do'], aliases: ['linux do', 'linuxdo'], source: 'Official favicon' },
  { ...qx('chatgpt', 'ChatGPT / GPT', 'ChatGPT', ['chatgpt.com', 'chat.openai.com'], ['chatgpt', 'gpt']), src: '/portal-icons/chatgpt-official.svg', mono: true, source: 'OpenAI official cookbook logomark' },
  { ...qx('claude', 'Claude', 'Claude', ['claude.ai'], ['claude']), src: '/portal-icons/claude-hq.svg', source: 'Simple Icons / Claude' },
  { ...qx('gemini', 'Google Gemini', 'Gemini', ['gemini.google.com'], ['google gemini', 'gemini']), src: '/portal-icons/gemini-hq.svg', source: 'Lobe Icons / Gemini' },
  brand(qx('emby', 'Emby', 'Emby', ['app.emby.media'], ['emby']), 'emby'),
  brand(qx('github', 'GitHub', 'GitHub', ['github.com'], ['github', '总站源码']), 'github', { mono: true }),
  brand(qx('speedtest', 'Speedtest', 'Speedtest', ['speedtest.net'], ['speedtest']), 'speedtest', { mono: true }),
  brand(qx('netflix', 'Netflix', 'Netflix', ['netflix.com']), 'netflix'),
  { ...brand(qx('google', 'Google', 'Google', ['google.com', 'www.google.com']), 'google'), exactHosts: true },
  brand(qx('spotify', 'Spotify', 'Spotify', ['spotify.com']), 'spotify'),
  brand(qx('telegram', 'Telegram', 'Telegram', ['telegram.org', 'web.telegram.org', 't.me']), 'telegram'),
  brand(qx('tiktok', 'TikTok / 抖音', 'TikTok', ['tiktok.com', 'douyin.com'], ['抖音', 'tiktok']), 'tiktok', { mono: true, under: '/portal-icons/brand/tiktok-under.svg' }),
  brand(qx('instagram', 'Instagram', 'Instagram', ['instagram.com']), 'instagram'),
  brand(qx('reddit', 'Reddit', 'Reddit', ['reddit.com']), 'reddit'),
  brand(qx('x', 'X / Twitter', 'X', ['x.com', 'twitter.com']), 'x', { mono: true }),
  qx('globalspeed', 'GlobalSpeed', 'GlobalSpeed', [], ['globalspeed']),
  qx('dmit', 'DMIT', 'DMIT', ['dmit.io'], ['dmit', 'dmit 官网']),
  qx('racknerd', 'RackNerd / RN-VPS', 'RN-VPS', ['racknerd.com'], ['racknerd', 'rn-vps']),
  qx('haita', '海獭', 'Haita', [], ['海獭']), { ...qx('liangxin', '良心云', 'Liangxin', [], ['良心云']), src: '/portal-icons/liangxin-transparent.png', source: 'Official logo, background removed' }, qx('yuetutu', '月兔', 'Yuetutu', [], ['月兔']),
  local('cloudflare', 'Cloudflare', ['dash.cloudflare.com', 'speed.cloudflare.com', 'cloudflare.com']),
  local('fast', 'Fast.com', ['fast.com']), local('bilibili', '哔哩哔哩 / Bilibili', ['bilibili.com']),
  local('xiaohongshu', '小红书', ['xiaohongshu.com']), { ...local('dashy', 'Dashy', ['demo.dashy.to'], ['dashy 演示']), src: '/portal-icons/dashy.png', source: 'Dashy' },
  local('jellyfin', 'Jellyfin', [], ['jellyfin']), local('docker', 'Docker', [], ['docker']),
  local('homeassistant', 'Home Assistant', [], ['home assistant']), local('nextcloud', 'Nextcloud', [], ['nextcloud']),
  local('bitwarden', 'Bitwarden', [], ['bitwarden']), local('notion', 'Notion', ['notion.so']), local('youtube', 'YouTube', ['youtube.com', 'youtu.be']),
  { ...local('paperless-gpt', 'Paperless-GPT / Paper-LLM', [], ['paper-llm', 'paperless-llm', 'paperless-gpt']), source: 'Paperless-GPT upstream logo' },
];
export function matchPortalIcon(url = '', title = '') {
  let host = '';
  try { host = new URL(url).hostname.toLowerCase().replace(/^www\./, ''); } catch { /* Name-only matching in the picker. */ }
  // Longer host entries (Gemini, Cloudflare speed) precede broad brand matches.
  const byHost = portalIcons.find(e => e.hosts.some(domain => host === domain || (!e.exactHosts && host.endsWith(`.${domain}`))));
  if (byHost) return byHost;
  if (host.split('.')[0] === 'paperless-gpt') return portalIcons.find(e => e.id === 'paperless-gpt');
  if (host.split('.')[0] === 'emby') return portalIcons.find(e => e.id === 'emby');
  const name = title.trim().toLowerCase();
  return portalIcons.find(e => e.aliases?.includes(name));
}
// Single-colour marks follow the theme text colour; `under` is drawn beneath the mask.
export function portalIconStyle(src = '') {
  const entry = portalIcons.find(e => e.src === src);
  return { mono: !!entry?.mono, under: entry?.under || '' };
}
export function portalIconPath(value) { return portalIcons.find(e => `portal-${e.id}` === value)?.src; }
export function websiteFavicon(url = '') {
  try { const u = new URL(url); if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password) return ''; return `${u.origin}/favicon.ico`; } catch { return ''; }
}
const legacyPlaceholders = new Set(['🧠', '🌐', '🔗', '🖥️', '☁️', '📐', '✋', 'si-claude', 'si-googlegemini', 'si-github', 'si-tiktok', 'si-netflix', 'si-speedtest', 'si-cloudflare', 'si-bilibili', 'si-xiaohongshu']);
export function websiteIcon(item = {}, defaultIcon = '') {
  const configured = item.icon || defaultIcon;
  const match = matchPortalIcon(item.url, item.title);
  if (match?.id==='chatgpt' && configured==='/portal-icons/chatgpt-hq.svg') return 'portal-chatgpt';
  if (match?.id==='deepseek' && configured==='si-deepseek') return 'portal-deepseek';
  if (match?.id==='notebooklm' && ['si-notebooklm','portal-notebooklm'].includes(configured)) return 'portal-notebooklm';
  if (match?.id==='chatgpt' && ['si-openai','si-chatgpt'].includes(configured)) return 'portal-chatgpt';
  // Saved official favicons should not bypass the bundled AI brand assets.
  if (['chatgpt', 'claude', 'gemini', 'notebooklm', 'deepseek'].includes(match?.id)) {
    try {
      const image=new URL(configured);
      const official=match.hosts.some(host=>image.hostname===host || image.hostname.endsWith(`.${host}`));
      if (official && /(?:^|\/)(?:favicon[^/]*|apple-touch-icon[^/]*)$/i.test(image.pathname)) return `portal-${match.id}`;
    } catch { /* Keep manual icons and local paths. */ }
  }
  // Replace only the temporary book placeholder used for Brog Hub.
  if (match?.id === 'brog-hub' && ['lucide-book', '/portal-icons/lucide/book.svg'].includes(configured)) return 'portal-brog-hub';
  if (match && (!configured || legacyPlaceholders.has(configured))) return `portal-${match.id}`;
  if (configured === '✋' && /(^|\.)manus\.im$/.test((() => { try { return new URL(item.url).hostname; } catch { return ''; } })())) return 'auto';
  return configured || 'auto';
}
