<template>
  <img :src="`/mech/${mode === 'red' ? 'red' : 'blue'}.png`" :alt="alt"
    class="mech-logo" :data-mech-mode="mode" :style="{ filter: tint }" width="80" height="80" />
</template>
<script>
export default {
  props: { alt: { type: String, default: 'Home Lab 像素高达标识' } },
  data: () => ({ mode: 'blue', tint: 'none', themeObserver: null }),
  mounted() {
    this.themeObserver = new MutationObserver(() => this.$nextTick(this.updatePalette));
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] });
    this.updatePalette();
  },
  beforeUnmount() { this.themeObserver?.disconnect(); },
  methods: {
    updatePalette() {
      const probe = document.createElement('span');
      probe.style.color = 'var(--primary, #88c0d0)';
      probe.style.display = 'none';
      document.body.appendChild(probe);
      const rgb = getComputedStyle(probe).color.match(/[\d.]+/g)?.map(Number) || [136, 192, 208];
      probe.remove();
      const [r, g, b] = rgb;
      const theme = document.documentElement.dataset.theme || '';
      if ((r > g * 1.3 && r > b * 1.1) || /raspberry|red|cherry|rose|oblivion/.test(theme)) {
        this.mode = 'red'; this.tint = 'none';
      } else if (g > r * 1.25 && g > b * 1.2 || /matrix|fallout|hacker/.test(theme)) {
        this.mode = 'green'; this.tint = 'hue-rotate(-85deg)';
      } else if ((b > g * 1.25 && r > g * 1.2) || /purple|dracula|argon|catppuccin/.test(theme)) {
        this.mode = 'purple'; this.tint = 'hue-rotate(50deg)';
      } else {
        this.mode = 'blue'; this.tint = 'none';
      }
    },
  },
};
</script>
<style scoped>
.mech-logo { display: block; object-fit: contain; image-rendering: pixelated; flex-shrink: 0; }
</style>
