// Public brand assets only. Website lists and credentials stay in the user's KV.
import { officialSiteIcons } from '../../cloud/icon-catalog.mjs';
const qx = (id, title, file, hosts = [], aliases = []) => ({ id, title, src: `/portal-icons/qx/${file}.png`, hosts, aliases, source: 'QX' });
const local = (id, title, hosts = [], aliases = []) => ({ id, title, src: `/portal-icons/${id}.svg`, hosts, aliases, source: 'Simple Icons' });
export const portalIcons = [
  { id: 'aistudio', title: 'Google AI Studio / Gemini API', src: officialSiteIcons['aistudio.google.com'], hosts: ['aistudio.google.com'], aliases: ['google api', 'google ai studio', 'gemini api'], source: 'Official AI Studio product icon' },
  { id: 'deepseek', title: 'DeepSeek / DeepSeek API', src: officialSiteIcons['platform.deepseek.com'], hosts: ['deepseek.com'], aliases: ['deepseek', 'deepseek api', '深度求索'], source: 'Official platform favicon' },
  { id: 'nodeseek', title: 'NodeSeek', src: officialSiteIcons['nodeseek.com'], hosts: ['nodeseek.com'], aliases: ['nodeseek', 'node seek'], source: 'Official favicon' },
  { id: 'awsconsole', title: 'AWS Management Console', src: officialSiteIcons['console.aws.amazon.com'], hosts: ['console.aws.amazon.com'], aliases: ['aws', 'aws控制面板'], source: 'AWS Architecture Icons' },
  { id: 'linuxdo', title: 'LINUX DO', src: officialSiteIcons['linux.do'], hosts: ['linux.do'], aliases: ['linux do', 'linuxdo'], source: 'Official favicon' },
  qx('chatgpt', 'ChatGPT / GPT', 'ChatGPT', ['chatgpt.com', 'chat.openai.com'], ['chatgpt', 'gpt']),
  qx('claude', 'Claude', 'Claude', ['claude.ai'], ['claude']),
  qx('gemini', 'Google Gemini', 'Gemini', ['gemini.google.com'], ['google gemini', 'gemini']),
  qx('emby', 'Emby', 'Emby', ['app.emby.media'], ['emby']),
  qx('github', 'GitHub', 'GitHub', ['github.com'], ['github', '总站源码']),
  qx('speedtest', 'Speedtest', 'Speedtest', ['speedtest.net'], ['speedtest']),
  qx('netflix', 'Netflix', 'Netflix', ['netflix.com']),
  { ...qx('google', 'Google', 'Google', ['google.com', 'www.google.com']), exactHosts: true },
  qx('spotify', 'Spotify', 'Spotify', ['spotify.com']),
  qx('telegram', 'Telegram', 'Telegram', ['telegram.org', 'web.telegram.org', 't.me']),
  qx('tiktok', 'TikTok / 抖音', 'TikTok', ['tiktok.com', 'douyin.com'], ['抖音', 'tiktok']),
  qx('instagram', 'Instagram', 'Instagram', ['instagram.com']),
  qx('reddit', 'Reddit', 'Reddit', ['reddit.com']),
  qx('x', 'X / Twitter', 'X', ['x.com', 'twitter.com']),
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
];
export function matchPortalIcon(url = '', title = '') {
  let host = '';
  try { host = new URL(url).hostname.toLowerCase().replace(/^www\./, ''); } catch { /* Name-only matching in the picker. */ }
  // Longer host entries (Gemini, Cloudflare speed) precede broad brand matches.
  const byHost = portalIcons.find(e => e.hosts.some(domain => host === domain || (!e.exactHosts && host.endsWith(`.${domain}`))));
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
