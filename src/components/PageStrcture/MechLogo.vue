<template>
  <img ref="mascot" :src="palette.source" :alt="alt" class="mech-logo"
    :data-mech-mode="palette.mode" :data-mech-palette="palette.color" :data-mech-theme="theme"
    :style="{ filter: palette.filter }" width="80" height="80" @load="updateTabIcon" />
</template>
<script>
import { mechPalette, themedTabIcon } from '@/utils/MechPalette';
const cssRgb = (variable, fallback) => {
  const probe=document.createElement('span'); probe.style.color=`var(${variable}, ${fallback})`; probe.style.display='none';
  document.body.appendChild(probe); const color=getComputedStyle(probe).color; probe.remove();
  const values=color.match(/[\d.]+/g)?.slice(0,3).map(Number)||[136,192,208];
  return color.startsWith('color(') ? values.map(v=>v*255) : values;
};
export default {
  props: { alt: { type: String, default: 'Home Lab 像素高达标识' }, syncFavicon: Boolean },
  data: () => ({ palette: mechPalette([136,192,208]), theme: '', themeObserver: null, paletteFrame: 0 }),
  mounted() {
    this.themeObserver = new MutationObserver(this.schedulePalette);
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] });
    document.addEventListener('load',this.stylesheetLoaded,true); this.schedulePalette();
  },
  beforeUnmount() { this.themeObserver?.disconnect(); cancelAnimationFrame(this.paletteFrame); document.removeEventListener('load',this.stylesheetLoaded,true); },
  methods: {
    stylesheetLoaded(e) { if(e.target?.tagName==='LINK' && e.target.rel==='stylesheet')this.schedulePalette(); },
    schedulePalette() { cancelAnimationFrame(this.paletteFrame); this.paletteFrame=requestAnimationFrame(this.updatePalette); },
    updatePalette() {
      this.theme=document.documentElement.dataset.theme||'nord-frost';
      this.palette=mechPalette(cssRgb('--primary','#88c0d0'),cssRgb('--background','#3b4252'),this.theme);
      this.$nextTick(this.updateTabIcon);
    },
    updateTabIcon() {
      const img=this.$refs.mascot;
      if(!this.syncFavicon || !img?.complete || !img.naturalWidth || new URL(img.currentSrc||img.src).pathname!==this.palette.source)return;
      try {
        const href=themedTabIcon(img,this.palette); if(!href)return;
        let icon=document.querySelector('link[rel="icon"]');
        if(!icon){icon=document.createElement('link');icon.rel='icon';document.head.appendChild(icon);}
        icon.type='image/png';icon.sizes='64x64';icon.href=href;icon.dataset.mechPalette=this.palette.color;
      } catch { /* Retain the bundled icon if canvas is unavailable. */ }
    },
  },
};
</script>
<style scoped>
.mech-logo { display: block; object-fit: contain; image-rendering: pixelated; flex-shrink: 0; }
</style>
