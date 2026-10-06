<template>
  <div @click="itemClicked()" @keydown.enter="itemClicked()" @keydown.space.prevent="itemClicked()" role="button" tabindex="0" :aria-label="title"
    :class="`side-bar-item ${icon ? 'w-icon' : 'text-only'}`" v-tooltip="tooltip">
    <Icon v-if="icon || url" :icon="icon" size="small" :url="url" :title="title" />
    <p class="small-title" v-else>{{ title }}</p>
  </div>
</template>

<script>

import Icon from '@/components/LinkItems/ItemIcon.vue';

export default {
  name: 'SideBarItem',
  props: {
    icon: { type: String, default: '' },
    title: { type: String, default: '' },
    url: { type: String, default: '' },
    target: { type: String, default: '' },
    click: { type: Function, default: () => {} },
  },
  emits: ['launch-app'],
  components: {
    Icon,
  },
  methods: {
    itemClicked() {
      if (this.url) this.$emit('launch-app', { url: this.url, target: this.target });
    },
  },
  data() {
    return {
      tooltip: {
        disabled: !this.title,
        content: this.title,
        
        placement: 'bottom-end',
      },
    };
  },
};
</script>

<style lang="scss" scoped>

div.side-bar-item {
  min-height: 44px;
  display: grid;
  place-items: center;
  cursor: pointer;
  &:focus-visible { outline: 2px solid currentColor; outline-offset: -2px; }
  color: var(--side-bar-item-color);
  background: var(--side-bar-item-background);
  text-align: center;
  &.text-only {
    background: none;
    border: none;
    box-shadow: none;
    p.small-title {
      margin: 0.1rem 0 0 -0.5rem;
      font-size: 0.6rem;
      transform: rotate(-25deg);
      padding: 0.5rem 0;
    }
  }
}
</style>
