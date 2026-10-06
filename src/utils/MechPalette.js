// Shared CSS color transform for the pixel mascot and its browser-tab icon.
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
export function rgbToHsl(rgb) {
  const [r, g, b] = rgb.map(v => clamp(v, 0, 255) / 255);
  const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max-min, light = (max+min)/2;
  if (!d) return { hue: 0, saturation: 0, light };
  const hue = max === r ? (g-b)/d + (g<b ? 6 : 0) : max === g ? (b-r)/d + 2 : (r-g)/d + 4;
  return { hue: hue*60, saturation: d/(1-Math.abs(2*light-1)), light };
}
export function mechPalette(primary, background = [59,66,82], theme = '') {
  const nord = { 'nord-frost': [136,192,208], nord: [191,97,106] };
  if (Math.max(...primary)-Math.min(...primary) < 30 && nord[theme]) primary = nord[theme];
  const { hue, saturation } = rgbToHsl(primary);
  const red = saturation > .2 && (hue < 25 || hue > 315);
  const rotation = Math.round((hue-(red ? 350 : 215)+540)%360-180);
  const sat = saturation < .12 ? 0 : Math.round(clamp(saturation*1.3,.35,1.3)*100)/100;
  const brightness = rgbToHsl(background).light < .4 ? 1.04 : 1;
  const mode = saturation < .12 ? 'silver' : red ? 'red' : hue < 65 ? 'gold' : hue < 165 ? 'green' : hue < 205 ? 'cyan' : hue < 260 ? 'blue' : 'purple';
  return { source: `/mech/${red ? 'red' : 'blue'}.png`, hue: rotation, saturation: sat, brightness, mode,
    color: '#'+primary.map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join(''),
    filter: `hue-rotate(${rotation}deg) saturate(${sat}) brightness(${brightness})` };
}
// Match CSS filter math, including browsers that do not implement Canvas.filter.
export function paletteMatrix({ hue, saturation: s, brightness: bright }) {
  const a=hue*Math.PI/180, c=Math.cos(a), n=Math.sin(a);
  const h=[[.213+.787*c-.213*n,.715-.715*c-.715*n,.072-.072*c+.928*n],
    [.213-.213*c+.143*n,.715+.285*c+.140*n,.072-.072*c-.283*n],
    [.213-.213*c-.787*n,.715-.715*c+.715*n,.072+.928*c+.072*n]];
  const sat=[[.213*(1-s)+s,.715*(1-s),.072*(1-s)],[.213*(1-s),.715*(1-s)+s,.072*(1-s)],[.213*(1-s),.715*(1-s),.072*(1-s)+s]];
  return sat.map(row=>[0,1,2].map(col=>row.reduce((sum,v,k)=>sum+v*h[k][col],0)*bright));
}
export function themedTabIcon(image, palette) {
  const canvas=document.createElement('canvas'); canvas.width=64; canvas.height=64;
  const ctx=canvas.getContext('2d',{willReadFrequently:true}); if(!ctx)return '';
  ctx.imageSmoothingEnabled=false; ctx.drawImage(image,0,0,64,64);
  const bitmap=ctx.getImageData(0,0,64,64), m=paletteMatrix(palette);
  for(let i=0;i<bitmap.data.length;i+=4){
    const rgb=[bitmap.data[i],bitmap.data[i+1],bitmap.data[i+2]];
    for(let ch=0;ch<3;ch++)bitmap.data[i+ch]=clamp(m[ch].reduce((sum,v,k)=>sum+v*rgb[k],0),0,255);
  }
  ctx.putImageData(bitmap,0,0); return canvas.toDataURL('image/png');
}
