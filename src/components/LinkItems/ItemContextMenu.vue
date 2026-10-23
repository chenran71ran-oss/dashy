<template>
  <ContextMenuSurface :show="show" :posX="posX" :posY="posY" @close="$emit('close')">
      <!-- Open Options -->
      <ul class="menu-section">
        <li class="section-title">
          {{ $t('context-menus.item.open-section-title') }}
        </li>
        <li @click="launch('sametab')">
          <SameTabOpenIcon />
          <span>{{ $t('context-menus.item.sametab') }}</span>
        </li>
        <li @click="launch('newtab')">
          <NewTabOpenIcon />
          <span>{{ $t('context-menus.item.newtab') }}</span>
        </li>
        <li @click="launch('modal')">
          <IframeOpenIcon />
          <span>{{ $t('context-menus.item.modal') }}</span>
        </li>
        <li @click="launch('workspace')">
          <WorkspaceOpenIcon />
          <span>{{ $t('context-menus.item.workspace') }}</span>
        </li>
        <li @click="launch('clipboard')">
          <ClipboardOpenIcon />
          <span>{{ $t('context-menus.item.clipboard') }}</span>
        </li>
        <li @click="launch('newwindow')">
          <NewWindowOpenIcon />
          <span>{{ $t('context-menus.item.newwindow') }}</span>
        </li>
      </ul>
      <!-- Edit Options -->
      <ul class="menu-section" v-bind:class="{ disabled: !isEditAllowed }">
        <li class="section-title">
          {{ $t('context-menus.item.options-section-title') }}
        </li>
        <li @click="openSettings()">
          <EditIcon />
          <span>{{ $t('context-menus.item.edit-item') }}</span>
        </li>
        <li v-if="isEditMode" @click="openMoveMenu()">
          <MoveIcon />
          <span>{{ $t('context-menus.item.move-item') }}</span>
        </li>
        <li v-if="isEditMode" @click="openDeleteItem()">
          <BinIcon />
          <span>{{ $t('context-menus.item.remove-item') }}</span>
        </li>
      </ul>
  </ContextMenuSurface>
</template>

<script>
import ContextMenuSurface from '@/components/FormElements/ContextMenu.vue';
// Import icons for each element
import EditIcon from '@/assets/interface-icons/config-edit-json.svg';
import BinIcon from '@/assets/interface-icons/interactive-editor-remove.svg';
import MoveIcon from '@/assets/interface-icons/interactive-editor-move-to.svg';
import SameTabOpenIcon from '@/assets/interface-icons/open-current-tab.svg';
import NewTabOpenIcon from '@/assets/interface-icons/open-new-tab.svg';
import IframeOpenIcon from '@/assets/interface-icons/open-iframe.svg';
import WorkspaceOpenIcon from '@/assets/interface-icons/open-workspace.svg';
import ClipboardOpenIcon from '@/assets/interface-icons/open-clipboard.svg';
import NewWindowOpenIcon from '@/assets/interface-icons/open-new-window.svg';

export default {
  name: 'ContextMenu',
  components: {
    ContextMenuSurface,
    EditIcon,
    MoveIcon,
    BinIcon,
    SameTabOpenIcon,
    NewTabOpenIcon,
    IframeOpenIcon,
    WorkspaceOpenIcon,
    ClipboardOpenIcon,
    NewWindowOpenIcon,
  },
  props: {
    posX: { type: Number, default: 0 }, // The X coordinate for positioning
    posY: { type: Number, default: 0 }, // The Y coordinate for positioning
    show: Boolean, // Should show or hide the menu
    disableEdit: Boolean, // Disable editing for certain items
  },
  emits: ['launchItem', 'openItemSettings', 'openMoveItemMenu', 'openDeleteItem', 'close'],
  computed: {
    isEditMode() {
      return this.$store.state.editMode;
    },
    isEditAllowed() {
      if (this.disableEdit) return false;
      return this.$store.getters.permissions.allowViewConfig;
    },
  },
  methods: {
    /* Called on item click, emits an event up to Item */
    /* in order to launch the current app to a given target */
    launch(target) {
      this.$emit('launchItem', target);
    },
    openSettings() {
      if (this.isEditAllowed) {
        this.$emit('openItemSettings');
      }
    },
    openMoveMenu() {
      if (this.isEditAllowed) {
        this.$emit('openMoveItemMenu');
      }
    },
    openDeleteItem() {
      if (this.isEditAllowed) {
        this.$emit('openDeleteItem');
      }
    },
  },
};
</script>
