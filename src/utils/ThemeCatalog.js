/* Chinese labels are descriptive names; original Dashy theme identifiers stay unchanged. */
export const themeLabels = {
  default: '经典默认', glass: '磨砂玻璃', callisto: '木卫四', material: '质感浅色', 'material-dark': '质感深色',
  'dashy-docs': '文档蓝', colorful: '缤纷色彩', dracula: '德古拉', 'one-dark': '暗色编辑器', lissy: '莉西',
  'cherry-blossom': '樱花', 'nord-frost': '北境霜蓝', nord: '北境', argon: '氩光', fallout: '废土终端',
  whimsy: '奇趣', oblivion: '遗忘之境', adventure: '冒险', crayola: '蜡笔', 'deep-ocean': '深海',
  'minimal-dark': '极简深色', 'minimal-light': '极简浅色', thebe: '木卫十四', matrix: '矩阵绿', 'matrix-red': '矩阵红',
  'color-block': '色块', 'raspberry-jam': '覆盆子果酱', bee: '蜜蜂', tiger: '猛虎', glow: '辉光', 'glow-dark': '暗夜辉光',
  vaporware: '蒸汽波', cyberpunk: '赛博朋克', 'material-original': '原版质感浅色', 'material-dark-original': '原版质感深色',
  'high-contrast-dark': '高对比深色', 'high-contrast-light': '高对比浅色', 'adventure-basic': '基础冒险', basic: '简洁',
  tama: '塔玛', neomorphic: '新拟态', 'glass-2': '透明玻璃', 'night-bat': '夜蝠', 'tokyo-night': '东京之夜',
  gruvbox: '复古暖色', 'rose-pine': '玫瑰松林', parchment: '羊皮纸', aurora: '极光', zinc: '锌灰',
  'solarized-dark': '日光深色', 'solarized-light': '日光浅色', brutalist: '粗野主义', midnight: '午夜', catppuccin: '奶油猫',
};
export const favoriteThemesKey = 'home-lab:favorite-themes:v1';
export function themeLabel(name) { return themeLabels[name] || '自定义主题'; }
export function orderThemes(names, selected, favorites = [], query = '') {
  const unique = [...new Set(names)];
  const ordered = [selected, ...favorites, ...unique].filter((name, i, all) => unique.includes(name) && all.indexOf(name) === i);
  const q = query.trim().toLowerCase();
  return ordered.filter(name => !q || `${themeLabel(name)} ${name}`.toLowerCase().includes(q));
}
export function readThemeFavorites(storage) {
  try { const saved = JSON.parse(storage.getItem(favoriteThemesKey)); return Array.isArray(saved) ? [...new Set(saved.filter(x => typeof x === 'string'))].slice(0, 200) : []; }
  catch { return []; }
}
