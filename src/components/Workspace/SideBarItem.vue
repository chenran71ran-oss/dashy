<template>
  <component
    :is="item.url ? 'a' : 'button'"
    :href="item.url"
    :class="{ 'side-bar-item': true, active }"
    :aria-label="item.title"
    v-tooltip="{ content: item.title, disabled: !item.title, placement: 'right' }"
    @click.exact="launch"
  >
    <Icon v-if="item.icon || item.url" :icon="item.icon" :url="item.url" :title="item.title" size="small"
      :style="{ color: item.iconColor }" />
    <span v-else class="initials">{{ initials }}</span>
    <span class="title">{{ item.title }}</span>
  </component>
</template>

<script>
import Icon from '@/components/LinkItems/ItemIcon.vue';
import ItemMixin from '@/mixins/ItemMixin';

export default {
  name: 'SideBarItem',
  mixins: [ItemMixin],
  props: {
    active: Boolean,
  },
  emits: ['launch-app'],
  components: {
    Icon,
  },
  computed: {
    /* Up to two letters, shown in place of a missing icon */
    initials() {
      return (this.item.title || '').split(/\s+/).filter(Boolean)
        .slice(0, 2).map((word) => [...word][0]).join('');
    },
  },
  methods: {
    /* Opens in the workspace, unless the item targets a new tab, window or clipboard */
    launch(e) {
      if (!this.item.url) return;
      e.preventDefault();
      const { target } = this.item;
      if (target === 'newtab') window.open(this.effectiveUrl, '_blank', 'noopener,noreferrer');
      else if (['newwindow', 'clipboard'].includes(target)) this.launchItem(target);
      else this.$emit('launch-app', this.effectiveUrl);
    },
  },
};
</script>

<style lang="scss" scoped>
.side-bar-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 0.25rem;
  box-sizing: border-box;
  border: none;
  border-radius: var(--curve-factor);
  background: var(--side-bar-item-background);
  color: var(--side-bar-item-color);
  font: inherit;
  text-align: left;
  text-decoration: none;
  &:hover, &.active {
    background: color-mix(in srgb, var(--side-bar-item-color) 15%, transparent);
  }
  &.active {
    box-shadow: inset 3px 0 0 var(--side-bar-item-color);
  }
  &:focus-visible {
    outline: 2px solid var(--side-bar-item-color);
    outline-offset: -2px;
  }
  .item-icon, .initials {
    flex: 0 0 2rem;
    text-align: center;
  }
  .initials {
    font-weight: bold;
    text-transform: uppercase;
  }
  .title {
    display: none;
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}
</style>
