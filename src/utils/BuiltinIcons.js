import entries from './builtin-icons.json';
import colorEntries from './flat-color-icons.json';
export const builtinIcons = [...colorEntries, ...entries];
export function isColoredIcon(entry) { return ['Fluent Emoji', 'Icons8 Flat Color'].includes(entry.pack); }
const paths = new Map(builtinIcons.map(entry => [entry.value, entry.src]));
export function builtinIconPath(value) { return paths.get(value) || ''; }
export const iconCategories = [
  { id: 'all', label: '全部' }, { id: 'color', label: '彩色图标' }, { id: 'brand', label: 'QX 与品牌' },
  { id: 'infra', label: '服务器与网络' }, { id: 'security', label: '安全与隐私' },
  { id: 'dev', label: '开发与代码' }, { id: 'media', label: '影音与游戏' },
  { id: 'productivity', label: '办公与阅读' }, { id: 'mood', label: '心情与表情' },
  { id: 'nature', label: '自然与动物' }, { id: 'hobby', label: '兴趣与生活' }, { id: 'tools', label: '工具与界面' },
];
