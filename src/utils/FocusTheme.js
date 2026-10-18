import { compositeColor,cssColor,readThemeColor,readableColor,themeSurface } from './ThemeContrast.js';

// Some built-in palettes use `none` for transparent surfaces, not a CSS color.
export function focusSurface(variable,backdrop) {
  const token=getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return !token || token==='none' || token==='transparent' ? backdrop : compositeColor(readThemeColor(variable),backdrop);
}
export function focusThemeStyles() {
  const surfaceToken=variable=>{
    const value=getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
    return !value || value==='none' ? 'transparent' : value;
  };
  const page=themeSurface('--background');
  const group=focusSurface('--minimal-view-group-background',page);
  const card=focusSurface('--item-background',group);
  const hover=focusSurface('--item-background-hover',group);
  const tooltip=focusSurface('--description-tooltip-background',page);
  const preferred=[readThemeColor('--item-text-color'),readThemeColor('--foreground')];
  const normal=readableColor(card,preferred),active=readableColor(hover,[readThemeColor('--item-text-color-hover'),...preferred]);
  const muted=normal.map((v,i)=>v*.78+card[i]*.22);
  const heading=focusSurface('--minimal-view-section-heading-background',page);
  const selected=focusSurface('--minimal-view-section-heading-color',page);
  return {
    '--focus-card-background':surfaceToken('--item-background'),
    '--focus-card-hover-background':surfaceToken('--item-background-hover'),
    '--focus-button-background':cssColor(card),
    '--focus-card-text':cssColor(normal),'--focus-card-hover-text':cssColor(active),
    '--focus-description-text':cssColor(readableColor(card,[muted])),
    '--focus-description-hover-text':cssColor(readableColor(hover,[active])),
    '--focus-ring':cssColor(readableColor(group,[readThemeColor('--primary')],3)),
    '--focus-tooltip-background':cssColor(tooltip),
    '--focus-tooltip-text':cssColor(readableColor(tooltip,[readThemeColor('--description-tooltip-color'),...preferred])),
    '--focus-tab-background':cssColor(heading),'--focus-tab-text':cssColor(readableColor(heading,[selected,...preferred])),
    '--focus-tab-selected-background':cssColor(selected),'--focus-tab-selected-text':cssColor(readableColor(selected,[heading,...preferred])),
  };
}
