<template ref="container">
  <div class="sub-item-wrapper">
    <a @click="itemClicked"
      @contextmenu="preventNativeContextMenu"
      @long-press="openContextMenu"
      @mouseup.right="openContextMenu"
      v-longPress="true"
      :href="hyperLinkHref"
      :aria-label="item.title"
      :target="anchorTarget"
      v-tooltip="subItemTooltip"
      rel="noopener noreferrer" tabindex="0"
      :id="`link-${id}`"
      class="sub-item-link item"
    >
      <!-- Item Icon (shows title as fallback when no icon) -->
      <Icon :icon="websiteIcon(item)" :url="item.url"
      :title="item.title" size="small" v-bind:style="customStyles" class="sub-icon-img bounce" />
      <span class="sub-item-text">{{ item.title }}</span>
    </a>
    <!-- Right-click context menu -->
    <ContextMenu
      :show="contextMenuOpen && !isAddNew"
      v-click-outside="closeContextMenu"
      :posX="contextPos.posX"
      :posY="contextPos.posY"
      :id="`context-menu-${id}`"
      :disableEdit="true"
      @launchItem="launchItem"
    />
  </div>
</template>

<script>
import { websiteIcon } from '@/utils/PortalIcons';
import Icon from '@/components/LinkItems/ItemIcon.vue';
import ContextMenu from '@/components/LinkItems/ItemContextMenu';
import ItemMixin from '@/mixins/ItemMixin';

export default {
  name: 'Item',
  mixins: [ItemMixin],
  props: {
    id: { type: String, required: true }, // The unique ID of a tile (e.g. 001)
    item: { type: Object, required: true },
    url: { type: String, default: '' }, // Optional override for ItemMixin.hyperLinkHref
  },
  components: {
    Icon,
    ContextMenu,
  },
  computed: {
    subItemTooltip() {
      return this.item.title;
    },
  },
  data() {
    return {};
  },
  methods: { websiteIcon },
};
</script>

<style lang="scss">
.sub-item-wrapper {
  min-width: 0;
  flex-grow: 1;
  flex-basis: 6rem;
  display: flex;
  a.sub-item-link {
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin: 0.2rem;
    .sub-icon-img {
      margin: 0;
    }
    .sub-item-text {
      display: block;
      padding: 0.3rem 0.5rem;
      font-size: 0.75rem;
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: normal;
      overflow-wrap: anywhere;
      color: var(--item-text-color);
    }
  }
  &.wrap-size-large {
    flex-basis: 12rem;
  }
}
</style>
