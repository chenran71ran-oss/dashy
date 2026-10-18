/* Expand the existing link in place while its grid cell retains its resting size. */
export default {
  data: () => ({ focusExpanded: false, focusClosing: false, focusRestHeight: 0, focusAvailableHeight: 0 }),
  created() { this.focusAnimation = null; this.focusRevision = 0; },
  beforeUnmount() { this.focusRevision += 1; this.focusAnimation?.cancel(); },
  methods: {
    focusPointerEntered() {
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) this.expandFocusCard();
    },
    focusPointerLeft() {
      if (!this.$el.contains(document.activeElement)) this.collapseFocusCard();
    },
    focusLeft(event) {
      if (!this.$el.contains(event.relatedTarget)
        && !(window.matchMedia('(hover: hover) and (pointer: fine)').matches && this.$el.matches(':hover'))) {
        this.collapseFocusCard();
      }
    },
    async expandFocusCard() {
      if (!this.focusCard || this.isEditMode || (this.focusExpanded && !this.focusClosing)) return;
      const link = this.$refs.itemLink;
      const from = link.offsetHeight;
      if (!this.focusExpanded) {
        this.focusRestHeight = this.$el.offsetHeight;
        this.focusAvailableHeight = Math.max(this.focusRestHeight, window.innerHeight - this.$el.getBoundingClientRect().top - 16);
      }
      const revision = ++this.focusRevision;
      this.focusAnimation?.cancel();
      this.focusClosing = false;
      this.focusExpanded = true;
      await this.$nextTick();
      if (revision !== this.focusRevision) return;
      this.animateFocusHeight(link, from, link.offsetHeight);
    },
    collapseFocusCard() {
      if (!this.focusExpanded || this.focusClosing) return;
      ++this.focusRevision;
      const link = this.$refs.itemLink;
      const from = link.offsetHeight;
      this.focusAnimation?.cancel();
      this.focusClosing = true;
      const finish = () => { this.focusExpanded = false; this.focusClosing = false; this.focusAnimation = null; };
      this.animateFocusHeight(link, from, this.focusRestHeight, finish);
    },
    animateFocusHeight(link, from, to, finish) {
      if (!link.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        finish?.(); return;
      }
      const animation = link.animate([{ height: `${from}px` }, { height: `${to}px` }], {
        duration: 180, easing: 'cubic-bezier(.2,.75,.25,1)',
      });
      this.focusAnimation = animation;
      animation.onfinish = () => {
        if (this.focusAnimation !== animation) return;
        this.focusAnimation = null;
        finish?.();
      };
    },
  },
};
