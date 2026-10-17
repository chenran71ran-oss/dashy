import { themeLabels } from '../src/utils/ThemeCatalog.js';
const themes=new Set(Object.keys(themeLabels));
export const loginColorKeys=Object.freeze(['primary','background','background-darker','foreground','heading-text-color','item-text-color','widget-text-color','widget-background-color','interactive-editor-background','interactive-editor-color','error','danger']);
const color=value=>typeof value==='string' && value.length<=100 && (/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value) || /^(?:rgb|rgba|hsl|hsla|oklch|oklab)\([\d.,%+\- /deg]+\)$/i.test(value) || /^(?:transparent|black|white|red|green|blue|orange|purple|pink|yellow|cyan|teal|navy|gray|grey|rebeccapurple)$/i.test(value));
export function publicLoginAppearance(config={}) {
  const result={theme:themes.has(config.theme)?config.theme:'nord-frost'};
  for(const key of ['dayTheme','nightTheme'])if(themes.has(config[key]))result[key]=config[key];
  const colors={};
  for(const [theme,values] of Object.entries(config.customColors||{}).slice(0,60)) {
    if(!themes.has(theme) || !values || typeof values!=='object')continue;
    const safe=Object.fromEntries(loginColorKeys.filter(key=>color(values[key])).map(key=>[key,values[key]]));
    if(Object.keys(safe).length)colors[theme]=safe;
  }
  if(Object.keys(colors).length)result.customColors=colors;
  return result;
}
