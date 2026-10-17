import { publicLoginAppearance,loginColorKeys } from '../../cloud/login-appearance.mjs';
import { compositeColor,readThemeColor,themeSurface,readableColor,cssColor,contrastRatio } from './ThemeContrast';
// The saved portal theme is authoritative across devices, including old browsers.
export function resolveLoginAppearance(remote={}) {
  return publicLoginAppearance(remote);
}
export function applyLoginAppearance(config) {
  const root=document.documentElement;
  if(config.theme==='default')root.removeAttribute('data-theme');else root.dataset.theme=config.theme;
  for(const key of loginColorKeys)root.style.removeProperty(`--${key}`);
  for(const [key,value] of Object.entries(config.customColors?.[config.theme]||{}))root.style.setProperty(`--${key}`,value);
  const page=themeSurface('--background');
  // Content cards, rather than the navigation bar, supply the form surface.
  const panel=themeSurface('--item-background');
  const foreground=readThemeColor('--item-text-color');
  const accent=compositeColor(readThemeColor('--primary'),panel);
  const text=readableColor(panel,[foreground]);
  let pageText,glow=0;
  for(const strength of [.22,.12,.06,0]) {
    const tinted=page.map((v,i)=>v*(1-strength)+accent[i]*strength);
    pageText=[foreground,[18,24,32],[255,255,255],[0,0,0]].find(color=>[page,tinted].every(surface=>contrastRatio(color,surface)>=4.5));
    if(pageText){glow=strength;break;}
  }
  const field=panel.map((v,i)=>v*.65+page[i]*.35);
  const muted=readableColor(panel,[text.map((v,i)=>v*.72+panel[i]*.28)]);
  const font=getComputedStyle(root).getPropertyValue('--font-body').split(',')[0].trim()||'system-ui';
  return {'--login-page':cssColor(page),'--login-panel':cssColor(panel),'--login-field':cssColor(field),'--login-text':cssColor(text),'--login-field-text':cssColor(readableColor(field,[text])),'--login-field-muted':cssColor(readableColor(field,[muted])),'--login-page-text':cssColor(pageText),'--login-muted':cssColor(muted),'--login-accent':cssColor(accent),'--login-glow-start':`${glow*64}%`,'--login-glow-end':`${glow*41}%`,'--login-on-accent':cssColor(readableColor(accent,[panel])),'--login-focus':cssColor(readableColor(panel,[accent],3)),'--login-error':cssColor(readableColor(panel,[readThemeColor('--danger','#f80363')])),'--login-font':`${font}, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`};
}
