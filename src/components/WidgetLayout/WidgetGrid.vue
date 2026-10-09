<template>
  <div class="view-widget-grid" :data-widget-size="effectiveSize" :data-widget-layout="layout">
    <WidgetBase v-for="(widget, index) in widgets" :key="`${index}-${widget.type}`"
      :widget="widget" :index="index" :item-size="effectiveSize"
      @navigateToSection="$emit('navigateToSection')" />
  </div>
</template>
<script>
import WidgetBase from '@/components/Widgets/WidgetBase.vue';
export default {
  components: { WidgetBase },
  props: { widgets: { type: Array, default: () => [] }, itemSize: String },
  emits: ['navigateToSection'],
  computed: {
    effectiveSize() { return this.itemSize || this.$store.getters.iconSize || 'medium'; },
    layout() { return this.$store.getters.layout || 'auto'; },
  },
};
</script>
<style scoped lang="scss">
.view-widget-grid {
  --view-widget-min: 20rem;
  display: grid; grid-template-columns: repeat(auto-fit, minmax(min(var(--view-widget-min), 100%), 1fr));
  grid-auto-rows: max-content; gap: .75rem; align-content: start; align-items: start;
  min-width: 0; width: 100%; box-sizing: border-box;
  &[data-widget-size='small'] { --view-widget-min: 16rem; }
  &[data-widget-size='large'] { --view-widget-min: 24rem; }
  &[data-widget-layout='vertical'] { grid-template-columns: minmax(0, 1fr); }
  > :deep(.widget-base) { min-width: 0; max-width: 100%; margin: 0; align-self: start; }
}
@media(max-width:599px) { .view-widget-grid { grid-template-columns: minmax(0, 1fr); gap: .5rem; } }
</style>
