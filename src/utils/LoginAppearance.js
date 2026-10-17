import { publicLoginAppearance,loginColorKeys } from '../../cloud/login-appearance.mjs';
import { themeLabels } from './ThemeCatalog';
import { compositeColor,readThemeColor,themeSurface,readableColor,cssColor } from './ThemeContrast';
export function resolveLoginAppearance(remote={},storage,preferDark=false) {
  let local='',colors={};
  try {local=storage?.getItem('theme')||'';colors=JSON.parse(storage?.getItem('customColors')||'{}');}catch{}
  const config=publicLoginAppearance(remote);
  const name=Object.hasOwn(themeLabels,local)?local:(preferDark?config.nightTheme:config.dayTheme)||config.theme;
  const localConfig=publicLoginAppearance({theme:name,customColors:colors});
  return {...config,theme:name,customColors:{...config.customColors,...localConfig.customColors}};
}
export function applyLoginAppearance(config) {
  const root=document.documentElement;
  if(config.theme==='default')root.removeAttribute('data-theme');else root.dataset.theme=config.theme;
  for(const key of loginColorKeys)root.style.removeProperty(`--${key}`);
  for(const [key,value] of Object.entries(config.customColors?.[config.theme]||{}))root.style.setProperty(`--${key}`,value);
  const page=themeSurface('--background');const panel=themeSurface('--background-darker');
  const foreground=readThemeColor('--foreground');const accent=compositeColor(readThemeColor('--primary'),panel);
  const text=readableColor(panel,[foreground]);const pageText=readableColor(page,[foreground]);
  const muted=readableColor(panel,[text.map((v,i)=>v*.72+panel[i]*.28)]);
  return {'--login-page':cssColor(page),'--login-panel':cssColor(panel),'--login-text':cssColor(text),'--login-page-text':cssColor(pageText),'--login-muted':cssColor(muted),'--login-accent':cssColor(accent),'--login-on-accent':cssColor(readableColor(accent,[panel])),'--login-focus':cssColor(readableColor(panel,[accent],3)),'--login-error':cssColor(readableColor(panel,[readThemeColor('--danger','#f80363')]))};
}
