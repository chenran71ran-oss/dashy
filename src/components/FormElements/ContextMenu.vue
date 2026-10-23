<template>
  <Teleport to="body">
    <Transition name="context-menu-fade">
      <div v-if="show" ref="menu" v-bind="$attrs" class="context-menu"
        :style="{ ...palette, left: `${left}px`, top: `${top}px`, visibility: ready ? 'visible' : 'hidden' }"
        v-click-outside="closeMenu" @contextmenu.prevent.stop>
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { contextMenuPalette } from '@/utils/ThemeMenuPalette';
export default {
  name: 'ContextMenuSurface',
  inheritAttrs: false,
  props: {
    show: Boolean,
    posX: { type: Number, default: 0 },
    posY: { type: Number, default: 0 },
  },
  emits: ['close'],
  data: () => ({ left: 8, top: 8, ready: false, palette: {} }),
  watch: {
    show: 'syncMenu',
    posX: 'syncMenu',
    posY: 'syncMenu',
  },
  mounted() {
    if (typeof ResizeObserver !== 'undefined') this.sizeObserver = new ResizeObserver(this.placeMenu);
    window.addEventListener('resize', this.placeMenu);
    window.addEventListener('scroll', this.closeMenu);
    this.themeObserver = new MutationObserver(this.refreshPalette);
    this.syncMenu();
  },
  beforeUnmount() {
    this.sizeObserver?.disconnect();
    this.themeObserver?.disconnect();
    window.removeEventListener('resize', this.placeMenu);
    window.removeEventListener('scroll', this.closeMenu);
  },
  methods: {
    refreshPalette() { if (this.show) this.palette = contextMenuPalette(); },
    syncMenu() {
      this.themeObserver?.disconnect();
      this.ready = false;
      this.sizeObserver?.disconnect();
      this.$nextTick(() => {
        if (!this.show || !this.$refs.menu) return;
        this.refreshPalette();
        this.themeObserver?.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] });
        this.placeMenu();
        this.sizeObserver?.observe(this.$refs.menu);
      });
    },
    placeMenu() {
      if (!this.show || !this.$refs.menu) return;
      const { width, height } = this.$refs.menu.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
      const viewportHeight = window.innerHeight;
      this.left = Math.max(8, Math.min(this.posX, viewportWidth - width - 8));
      this.top = Math.max(8, Math.min(this.posY, viewportHeight - height - 8));
      this.ready = true;
    },
    closeMenu() { if (this.show) this.$emit('close'); },
  },
};
</script>

<style lang="scss">
div.context-menu {
  position: fixed;
  width: max-content;
  min-width: min(14rem, calc(100vw - 1rem));
  max-width: calc(100vw - 1rem);
  max-height: calc(100dvh - 1rem);
  box-sizing: border-box;
  overflow: auto;
  overscroll-behavior: contain;
  margin: 0;
  padding: 0;
  z-index: 60;
  background: var(--context-menu-background);
  color: var(--context-menu-color);
  border: 1px solid var(--context-menu-secondary-color);
  border-radius: var(--curve-factor);
  box-shadow: var(--context-menu-shadow);
  opacity: 1;

  ul.menu-section {
    list-style: none;
    margin: 0;
    padding: 0;
    &:not(:last-child) { border-bottom: 1px solid var(--context-menu-color); }
    li {
      display: flex;
      align-items: center;
      gap: .5rem;
      padding: .5rem 1rem;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1.4;
      text-align: left;
      &:not(:last-child) { border-bottom: 1px solid var(--context-menu-secondary-color); }
      &:hover:not(.section-title) {
        background: var(--context-menu-highlight);
        color: var(--context-menu-hover-color);
      }
      &.section-title { cursor: default; font-weight: bold; justify-content: center; }
      svg { width: 1rem; height: 1rem; flex: 0 0 1rem; path { fill: currentColor; } }
      span { color: inherit; min-width: 0; overflow-wrap: break-word; }
    }
    &.disabled li:not(.section-title) {
      cursor: not-allowed;
      opacity: var(--dimming-factor);
      &:hover { background: var(--context-menu-background); color: var(--context-menu-color); }
    }
  }
}
.context-menu-fade-enter-active, .context-menu-fade-leave-active { transition: opacity .1s; }
.context-menu-fade-enter-from, .context-menu-fade-leave-to { opacity: 0; }
@media(prefers-reduced-motion: reduce) {
  .context-menu-fade-enter-active, .context-menu-fade-leave-active { transition: none; }
}
</style>
