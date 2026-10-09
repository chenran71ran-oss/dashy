/* Themes can arrive asynchronously or be edited live; update only this component's colors. */
export default {
  data: () => ({ themeContrastStyles: {}, contrastObserver: null, contrastFrame: null }),
  mounted() {
    this.contrastObserver = new MutationObserver(this.scheduleContrast);
    this.contrastObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] });
    document.addEventListener('load', this.contrastStylesheetLoaded, true);
    this.scheduleContrast();
  },
  beforeUnmount() {
    this.contrastObserver?.disconnect();
    if (this.contrastFrame != null) cancelAnimationFrame(this.contrastFrame);
    document.removeEventListener('load', this.contrastStylesheetLoaded, true);
  },
  methods: {
    contrastStylesheetLoaded(event) {
      if (event.target?.tagName === 'LINK' && event.target.rel === 'stylesheet') this.scheduleContrast();
    },
    scheduleContrast() {
      if (this.contrastFrame != null) cancelAnimationFrame(this.contrastFrame);
      this.contrastFrame = requestAnimationFrame(() => {
        this.contrastFrame = null;
        this.themeContrastStyles = this.getThemeContrastStyles();
      });
    },
  },
};
