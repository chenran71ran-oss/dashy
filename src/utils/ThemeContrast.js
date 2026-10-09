/* Resolve theme surfaces, then keep local controls readable without changing the theme. */
export const compositeColor = (color, background) => {
  const alpha = color[3] ?? 1;
  return color.slice(0, 3).map((channel, i) => channel * alpha + background[i] * (1 - alpha));
};

export function contrastRatio(first, second) {
  const luminance = (rgb) => rgb.slice(0, 3).map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, channel, i) => sum + channel * [0.2126, 0.7152, 0.0722][i], 0);
  const a = luminance(first); const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function readableColor(background, preferred = [], minimum = 4.5) {
  const candidates = [...preferred, [18, 24, 32], [255, 255, 255], [0, 0, 0]];
  return candidates.find(color => contrastRatio(compositeColor(color, background), background) >= minimum)
    || candidates.reduce((best, color) => contrastRatio(color, background) > contrastRatio(best, background) ? color : best);
}

export const cssColor = rgb => `rgb(${rgb.slice(0, 3).map(Math.round).join(', ')})`;

export function readThemeColor(variable, fallback = '#121820') {
  const probe = document.createElement('span');
  probe.style.cssText = `position:absolute;visibility:hidden;color:var(${variable}, ${fallback})`;
  document.body.appendChild(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  if (/^rgba?\(/.test(value)) {
    const channels = value.match(/[\d.]+/g)?.map(Number);
    if (channels?.length >= 3) return channels;
  }
  // Canvas resolves modern CSS color spaces (e.g. custom oklch themes) to sRGB.
  const canvas = document.createElement('canvas'); canvas.width = 1; canvas.height = 1;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = fallback; context.fillStyle = value; context.fillRect(0, 0, 1, 1);
    const [r, g, b, alpha] = context.getImageData(0, 0, 1, 1).data;
    return [r, g, b, alpha / 255];
  }
  return [18, 24, 32, 1];
}

export function themeSurface(variable) {
  const page = compositeColor(readThemeColor('--background', '#ffffff'), [255, 255, 255]);
  return compositeColor(readThemeColor(variable, '#ffffff'), page);
}
