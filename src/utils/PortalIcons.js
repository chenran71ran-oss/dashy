// Public brand assets only. Website lists and credentials stay in the user's KV.
const qx = (id, title, file, hosts = [], aliases = []) => ({ id, title, src: `/portal-icons/qx/${file}.png`, hosts, aliases, source: 'QX' });
const local = (id, title, hosts = [], aliases = []) => ({ id, title, src: `/portal-icons/${id}.svg`, hosts, aliases, source: 'Simple Icons' });
export const portalIcons = [
  qx('chatgpt', 'ChatGPT / GPT', 'ChatGPT', ['chatgpt.com', 'chat.openai.com'], ['chatgpt', 'gpt']),
  qx('claude', 'Claude', 'Claude', ['claude.ai'], ['claude']),
  qx('gemini', 'Google Gemini', 'Gemini', ['gemini.google.com'], ['google gemini', 'gemini']),
  qx('emby', 'Emby', 'Emby', ['app.emby.media'], ['emby']),
  qx('github', 'GitHub', 'GitHub', ['github.com'], ['github', '总站源码']),
  qx('speedtest', 'Speedtest', 'Speedtest', ['speedtest.net'], ['speedtest']),
  qx('netflix', 'Netflix', 'Netflix', ['netflix.com']),
  qx('google', 'Google', 'Google', ['google.com', 'www.google.com']),
  qx('spotify', 'Spotify', 'Spotify', ['spotify.com']),
  qx('telegram', 'Telegram', 'Telegram', ['telegram.org', 'web.telegram.org', 't.me']),
  qx('tiktok', 'TikTok / 抖音', 'TikTok', ['tiktok.com', 'douyin.com'], ['抖音', 'tiktok']),
  qx('instagram', 'Instagram', 'Instagram', ['instagram.com']),
  qx('reddit', 'Reddit', 'Reddit', ['reddit.com']),
  qx('x', 'X / Twitter', 'X', ['x.com', 'twitter.com']),
  qx('globalspeed', 'GlobalSpeed', 'GlobalSpeed', [], ['globalspeed']),
  qx('dmit', 'DMIT', 'DMIT', ['dmit.io'], ['dmit', 'dmit 官网']),
  qx('racknerd', 'RackNerd / RN-VPS', 'RN-VPS', ['racknerd.com'], ['racknerd', 'rn-vps']),
  qx('haita', '海獭', 'Haita', [], ['海獭']), qx('liangxin', '良心云', 'Liangxin', [], ['良心云']), qx('yuetutu', '月兔', 'Yuetutu', [], ['月兔']),
  local('cloudflare', 'Cloudflare', ['dash.cloudflare.com', 'speed.cloudflare.com', 'cloudflare.com']),
  local('fast', 'Fast.com', ['fast.com']), local('bilibili', '哔哩哔哩 / Bilibili', ['bilibili.com']),
  local('xiaohongshu', '小红书', ['xiaohongshu.com']), { ...local('dashy', 'Dashy', ['demo.dashy.to'], ['dashy 演示']), src: '/portal-icons/dashy.png', source: 'Dashy' },
  local('jellyfin', 'Jellyfin', [], ['jellyfin']), local('docker', 'Docker', [], ['docker']),
  local('homeassistant', 'Home Assistant', [], ['home assistant']), local('nextcloud', 'Nextcloud', [], ['nextcloud']),
  local('bitwarden', 'Bitwarden', [], ['bitwarden']), local('notion', 'Notion', ['notion.so']), local('youtube', 'YouTube', ['youtube.com', 'youtu.be']),
];
export function matchPortalIcon(url = '', title = '') {
  let host = '';
  try { host = new URL(url).hostname.toLowerCase().replace(/^www\./, ''); } catch { /* Name-only matching in the picker. */ }
  // Longer host entries (Gemini, Cloudflare speed) precede broad brand matches.
  const byHost = portalIcons.find(e => e.hosts.some(domain => host === domain || host.endsWith(`.${domain}`)));
  if (byHost) return byHost;
  if (host.split('.')[0] === 'emby') return portalIcons.find(e => e.id === 'emby');
  const name = title.trim().toLowerCase();
  return portalIcons.find(e => e.aliases?.includes(name));
}
export function portalIconPath(value) { return portalIcons.find(e => `portal-${e.id}` === value)?.src; }
export function websiteFavicon(url = '') {
  try { const u = new URL(url); if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password) return ''; return `${u.origin}/favicon.ico`; } catch { return ''; }
}
const legacyPlaceholders = new Set(['🧠', '🌐', '🔗', '🖥️', '☁️', '📐', '✋', 'si-claude', 'si-googlegemini', 'si-github', 'si-tiktok', 'si-netflix', 'si-speedtest', 'si-cloudflare', 'si-bilibili', 'si-xiaohongshu']);
export function websiteIcon(item = {}, defaultIcon = '') {
  const configured = item.icon || defaultIcon;
  const match = matchPortalIcon(item.url, item.title);
  if (match && (!configured || legacyPlaceholders.has(configured))) return `portal-${match.id}`;
  if (configured === '✋' && /(^|\.)manus\.im$/.test((() => { try { return new URL(item.url).hostname; } catch { return ''; } })())) return 'auto';
  return configured || 'auto';
}
