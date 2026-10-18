import { compositeColor, cssColor, readThemeColor, readableColor, themeSurface } from './ThemeContrast.js';

// Menus remain opaque even when their source theme uses translucent panels.
export function themeMenuPalette() {
  const page = themeSurface('--background');
  const panelToken = getComputedStyle(document.documentElement).getPropertyValue('--settings-background').trim();
  const surface = !panelToken || panelToken === 'none' || panelToken === 'transparent'
    ? page : compositeColor(readThemeColor('--settings-background'), page);
  const primary = readThemeColor('--primary');
  const preferred = [readThemeColor('--settings-text-color'), readThemeColor('--foreground')];
  const text = readableColor(surface, preferred);
  const hover = compositeColor([...primary.slice(0, 3), .14], surface);
  const selected = compositeColor([...primary.slice(0, 3), .24], surface);
  return {
    '--theme-menu-background': cssColor(surface),
    '--theme-menu-color': cssColor(text),
    '--theme-menu-muted': cssColor(readableColor(surface, [compositeColor([...text, .75], surface)])),
    '--theme-menu-highlight': cssColor(hover),
    '--theme-menu-hover-color': cssColor(readableColor(hover, preferred)),
    '--theme-menu-selected': cssColor(selected),
    '--theme-menu-selected-color': cssColor(readableColor(selected, preferred)),
    '--theme-menu-accent': cssColor(readableColor(surface, [primary, ...preferred])),
    '--theme-menu-border': cssColor(readableColor(surface, [compositeColor([...text, .35], surface)], 3)),
  };
}
