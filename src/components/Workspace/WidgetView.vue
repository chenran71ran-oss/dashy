<template>
  <section class="workspace-widget-view" v-if="widgets.length" :aria-label="`${title || '工作台'}小组件`">
    <h2 v-if="title">{{ title }}</h2>
    <WidgetGrid :widgets="widgets" :item-size="itemSize" />
  </section>
</template>

<script>
import WidgetGrid from '@/components/WidgetLayout/WidgetGrid.vue';

export default {
  components: {
    WidgetGrid,
  },
  props: {
    widgets: { type: Array, default: () => [] },
    title: { type: String, default: '' },
    itemSize: String,
  },
};
</script>

<style lang="scss" scoped>
.workspace-widget-view {
  padding: .75rem; margin: .75rem auto; max-width: 1200px;
  background: var(--minimal-view-group-background); color: var(--minimal-view-group-color);
  border-radius: var(--curve-factor); box-sizing: border-box; min-width: 0;
  h2 { font-size: 1.1rem; margin: 0 0 .75rem; color: inherit; overflow-wrap: anywhere; }
}
</style>
