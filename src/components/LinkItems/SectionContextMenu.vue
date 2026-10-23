<template>
  <ContextMenuSurface :show="show" :posX="posX" :posY="posY" @close="$emit('close')">
      <!-- Open Options -->
      <ul class="menu-section">
        <li @click="openSection()">
          <SameTabOpenIcon />
          <span>{{ $t('context-menus.section.open-section') }}</span>
        </li>
        <li @click="expandCollapseSection">
          <ExpandCollapseIcon />
          <span>{{ $t('context-menus.section.expand-collapse') }}</span>
        </li>
      </ul>
      <!-- Edit Options -->
      <ul class="menu-section" :class="{ disabled: !isEditAllowed }">
        <li @click="openEditSectionMenu">
          <EditIcon />
          <span>{{ $t('context-menus.section.edit-section') }}</span>
        </li>
        <li v-if="isEditMode" @click="removeSection">
          <BinIcon />
          <span>{{ $t('context-menus.section.remove-section') }}</span>
        </li>
      </ul>
  </ContextMenuSurface>
</template>

<script>
import ContextMenuSurface from '@/components/FormElements/ContextMenu.vue';
// Import icons for each element
import EditIcon from '@/assets/interface-icons/config-edit-json.svg';
import BinIcon from '@/assets/interface-icons/interactive-editor-remove.svg';
import SameTabOpenIcon from '@/assets/interface-icons/open-current-tab.svg';
import ExpandCollapseIcon from '@/assets/interface-icons/section-expand-collapse.svg';

export default {
  name: 'ContextMenu',
  components: {
    ContextMenuSurface,
    EditIcon,
    BinIcon,
    SameTabOpenIcon,
    ExpandCollapseIcon,
  },
  props: {
    posX: { type: Number, default: 0 }, // The X coordinate for positioning
    posY: { type: Number, default: 0 }, // The Y coordinate for positioning
    show: Boolean, // Should show or hide the menu
  },
  emits: ['navigateToSection', 'openEditSection', 'expandCollapseSection', 'removeSection', 'close'],
  computed: {
    isEditMode() {
      return this.$store.state.editMode;
    },
    isEditAllowed() {
      return this.$store.getters.permissions.allowViewConfig;
    },
  },
  methods: {
    /* Called on item click, emits an event up to Item */
    /* in order to launch the current app to a given target */
    openSection() {
      this.$emit('navigateToSection');
    },
    openEditSectionMenu() {
      if (this.isEditAllowed) this.$emit('openEditSection');
    },
    expandCollapseSection() {
      this.$emit('expandCollapseSection');
    },
    removeSection() {
      if (this.isEditAllowed) this.$emit('removeSection');
    },
  },
};
</script>
