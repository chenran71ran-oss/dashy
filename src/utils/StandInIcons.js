// When a website's own icon cannot be loaded (the site blocks server-side requests and
// does not allow anonymous cross-origin images), show a theme-coloured glyph that says
// what kind of site it is, rather than a bare initial. Rules are checked in order
// against the card's title and address.
const rules = [
  [/测速|speed ?test|bandwidth|testmy|fast\.com/i, 'gauge'],
  [/监控|status|uptime|monitor|komari|探针/i, 'activity'],
  [/webrtc|dns|leak|ip ?(地址|查询|quality|check)|scam|fraud|risk|ping0|安全/i, 'shield-check'],
  [/mail|邮/i, 'mail'],
  [/订阅|subscri|proxy|代理|节点|x-?ui|v2ray|xray/i, 'network'],
  [/vps|服务器|server|idc|hosting|cloud|云|dmit|racknerd|xtom|vmiss/i, 'server'],
  [/小店|商店|shop|store|购买|buy|gift ?card|充值|卡密/i, 'shopping-bag'],
  [/学术|scholar|论文|journal|letpub|paper|期刊/i, 'graduation-cap'],
  [/大学|学院|校园|教育|研究生|\.edu(\.|$)/i, 'landmark'],
  [/党建|组工|政务|\.gov(\.|$)/i, 'landmark'],
  [/教程|文档|docs?\b|wiki|guide|notion|笔记|博客|blog/i, 'book-open'],
  [/论坛|社区|forum|community|bbs|discuss/i, 'messages-square'],
  [/音乐|music|歌/i, 'music'],
  [/视频|影视|电影|video|movie|emby|jellyfin|plex|tv\b/i, 'clapperboard'],
  [/\bai\b|gpt|llm|agent|模型|智能/i, 'sparkles'],
  [/网盘|文件|file|drive|storage|list|存储/i, 'folder-open'],
  [/github|gitlab|code|代码|开发|dev\b/i, 'code'],
  [/游戏|game|oyun/i, 'gamepad-2'],
  [/news|新闻|资讯/i, 'newspaper'],
  [/pay|支付|银行|bank|card/i, 'credit-card'],
];

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

/* Path of a bundled glyph for a website card; '' for anything without a web address
   (section headings reuse the icon component with their name in place of a URL). */
export function standInIcon(title = '', url = '') {
  const host = hostOf(url);
  if (!host) return '';
  const text = `${title} ${host}`;
  const match = rules.find(([pattern]) => pattern.test(text));
  return `/portal-icons/lucide/${match ? match[1] : 'globe'}.svg`;
}
