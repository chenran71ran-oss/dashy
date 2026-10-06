<template>
  <Collapsable
    :title="title"
    :icon="icon"
    :uniqueKey="groupId"
    :collapsed="displayData.collapsed"
    :cols="effectiveColsSpan"
    :rows="displayData.rows"
    :color="displayData.color"
    :customStyles="displayData.customStyles"
    :cutToHeight="displayData.cutToHeight"
    @openEditSection="openEditSection"
    @openContextMenu="openContextMenu"
    @navigateToSection="navigateToSection"
    :id="sectionRef"
    :ref="sectionRef"
  >
    <!-- If no items, show message -->
    <div v-if="isEmpty" class="no-items">
      {{ $t('home.no-items-section') }}
    </div>
    <!-- Item Container -->
    <div v-if="hasItems"
      :class="`there-are-items ${isGridLayout? 'item-group-grid': ''} inner-size-${itemSize}`"
      :style="gridStyle" :id="`section-${groupId}`" v-drag-sort="itemDragConfig"
    > <!-- Show for each item -->
      <template v-for="(item) in sortedItems" :key="item.id">
        <SubItemGroup
          v-if="item.subItems"
          :itemId="item.id"
          :title="item.title"
          :subItems="item.subItems"
          @triggerModal="triggerModal"
        />
        <Item
          v-else
          :item="item"
          :itemSize="itemSize"
          :parentSectionTitle="title"
          @itemClicked="$emit('itemClicked')"
          @triggerModal="triggerModal"
          :isAddNew="false"
          :sectionWidth="sectionWidth"
          :sectionDisplayData="displayData"
        />
      </template>
      <!-- When in edit mode, show additional item, for Add New item -->
      <button v-if="isEditMode" type="button" class="add-new-item add-site-launcher" @click="openAddItem">
        <AddIcon aria-hidden="true" /><span>添加网站</span>
      </button>
    </div>
    <div v-if="hasWidgets || isEditMode" class="widget-list" v-drag-sort="widgetDragConfig">
      <WidgetBase v-for="(widget, widgetIndex) in widgets" :key="`${widgetIndex}-${widget.type}`" :widget="widget" :index="widgetIndex" @editWidget="openEditWidget(widgetIndex)" @removeWidget="confirmRemoveWidget(widgetIndex)" />
      <button v-if="isEditMode" type="button" class="add-widget-launcher" @click="openAddWidget"><AddIcon /> 添加小组件</button>
    </div>
    <!-- Modal for opening in modal view -->
    <IframeModal
      :ref="`iframeModal-${groupId}`"
      :name="`iframeModal-${groupId}`"
      @closed="$emit('itemClicked')"
    />
    <!-- Edit item menu -->
    <EditItem v-if="addItemMenuOpen" :isNew="true" :parentSectionTitle="title" @closeEditMenu="addItemMenuOpen = false" />
    <EditSection
      v-if="editMenuOpen"
      @closeEditSection="closeEditSection"
      :sectionName="title"
      :isAddNew="false"
    />
    <!-- Right-click item options context menu -->
    <ContextMenu
      :show="contextMenuOpen"
      :posX="contextPos.posX"
      :posY="contextPos.posY"
      :id="`context-menu-${groupId}`"
      v-click-outside="closeContextMenu"
      @openEditSection="openEditSection"
      @navigateToSection="navigateToSection"
      @expandCollapseSection="expandCollapseSection"
      @removeSection="removeSection"
    />
    <ConfirmDialog
      v-model:open="showRemoveConfirm"
      danger
      :title="$t('context-menus.section.remove-section')"
      :message="$t('interactive-editor.edit-section.remove-confirm')"
      @confirm="confirmRemoveSection"
    />
    <!-- Edit widget menu -->
    <EditWidget v-if="editWidgetMenuOpen"
      :sectionName="title"
      :widgetIndex="editingWidgetIndex"
      :isAddNew="addingWidget"
      @closeEditWidget="closeEditWidget"
    />
    <ConfirmDialog
      v-model:open="showRemoveWidgetConfirm"
      danger
      :title="$t('interactive-editor.edit-widget.remove-widget')"
      :message="$t('interactive-editor.edit-widget.remove-confirm')"
      @confirm="doRemoveWidget"
    />
  </Collapsable>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import router from '@/router';
import Item from '@/components/LinkItems/Item.vue';
import SubItemGroup from '@/components/LinkItems/SubItemGroup.vue';
import WidgetBase from '@/components/Widgets/WidgetBase';
import Collapsable from '@/components/LinkItems/Collapsable.vue';
import IframeModal from '@/components/LinkItems/IframeModal.vue';
import ContextMenu from '@/components/LinkItems/SectionContextMenu.vue';
import ConfirmDialog from '@/components/FormElements/ConfirmDialog.vue';
import AddIcon from '@/assets/interface-icons/interactive-editor-add.svg';

const EditSection = defineAsyncComponent(() => import('@/components/InteractiveEditor/EditSection.vue'));
const EditItem = defineAsyncComponent(() => import('@/components/InteractiveEditor/EditItem.vue'));
const EditWidget = defineAsyncComponent(() => import('@/components/InteractiveEditor/EditWidget.vue'));
import ErrorHandler from '@/utils/logging/ErrorHandler';
import sortItems from '@/utils/SortItems';
import { reorder } from '@/directives/DragSort';
import { makeRoutePath, viewFromPath } from '@/utils/config/ConfigHelpers';
import StoreKeys from '@/utils/StoreMutations';
import { sortOrder as defaultSortOrder } from '@/utils/config/defaults';

/* True if both lists contain the same elements, in the same order (compared by runtime id) */
const sameIdOrder = (a, b) => a.length === b.length && a.every((el, i) => el.id === b[i].id);

export default {
  name: 'Section',
  props: {
    groupId: { type: String, required: true },
    title: { type: String, default: '' },
    icon: { type: String, default: '' },
    displayData: { type: Object, required: true },
    items: { type: Array, default: () => [] },
    widgets: { type: Array, default: () => [] },
    index: { type: Number, required: true },
    isWide: Boolean,
    activeColCount: { type: Number, required: true },
  },
  emits: ['itemClicked'],
  components: {
    Collapsable,
    ContextMenu,
    Item,
    SubItemGroup,
    WidgetBase,
    IframeModal,
    EditSection,
    EditItem,
    EditWidget,
    ConfirmDialog,
    AddIcon,
  },
  data() {
    return {
      editMenuOpen: false,
      addItemMenuOpen: false,
      contextMenuOpen: false,
      contextPos: {
        posX: undefined,
        posY: undefined,
      },
      sectionWidth: 0,
      resizeObserver: null,
      showRemoveConfirm: false,
      editWidgetMenuOpen: false,
      editingWidgetIndex: -1,
      addingWidget: false,
      showRemoveWidgetConfirm: false,
      pendingRemoveWidgetIndex: -1,
    };
  },
  computed: {
    appConfig() {
      return this.$store.getters.appConfig;
    },
    isEditMode() {
      return this.$store.state.editMode;
    },
    itemSize() {
      return this.displayData.itemSize || this.$store.getters.iconSize;
    },
    sortOrder() {
      return this.displayData.sortBy || defaultSortOrder;
    },
    hasItems() {
      if (this.isEditMode) return true;
      return this.items && this.items.length > 0;
    },
    hasWidgets() {
      return this.widgets && this.widgets.length > 0;
    },
    isEmpty() {
      return !this.hasItems && !this.hasWidgets;
    },
    sectionRef() {
      return `section-outer-${this.groupId}`;
    },
    /* If the sortBy attribute is specified, then return sorted data */
    sortedItems() {
      if (this.appConfig.disableSmartSort) return [...this.items];
      return sortItems(this.items, this.sortOrder, this.title);
    },
    isGridLayout() {
      return this.displayData.sectionLayout === 'grid'
        || !!(this.displayData.itemCountX || this.displayData.itemCountY);
    },
    gridStyle() {
      const minWidth = this.itemSize === 'large' ? 184 : (this.itemSize === 'small' ? 128 : 152);
      const fitting = Math.max(1, Math.floor((this.sectionWidth - 24 + 12) / (minWidth + 12)));
      let styles = this.displayData.itemCountX
        ? `grid-template-columns: repeat(${Math.min(this.displayData.itemCountX, fitting)}, minmax(0, 1fr));` : '';
      styles += this.displayData.itemCountY
        ? `grid-template-rows: repeat(${this.displayData.itemCountY}, auto);` : '';
      return styles;
    },
    effectiveColsSpan() {
      const { cols } = this.displayData;
      if (!cols) return cols;
      return Math.min(this.activeColCount, cols);
    },
    /* The section from the config, for the source of truth for drag-sorting
     * Rendered list needs to match exact (not filtered/sorted/etc) for drag to work */
    storeSection() {
      return this.$store.getters.getSectionByIndex(this.index) || {};
    },
    itemDragConfig() {
      return {
        enabled: this.isEditMode && sameIdOrder(this.storeSection.items || [], this.sortedItems),
        group: 'section-items',
        draggable: '.item-wrapper:not(.add-new-item), .sub-items-group',
        meta: { sectionIndex: this.index },
        onSorted: (e) => this.handleMoved('items', e),
      };
    },
    widgetDragConfig() {
      return {
        enabled: this.isEditMode && sameIdOrder(this.storeSection.widgets || [], this.widgets),
        group: 'section-widgets',
        draggable: '.widget-base',
        filter: 'a, button, input, textarea, select',
        meta: { sectionIndex: this.index },
        onSorted: (e) => this.handleMoved('widgets', e),
      };
    },
  },
  methods: {
    openAddItem() { this.addItemMenuOpen = true; this.$store.commit(StoreKeys.SET_MODAL_OPEN, true); },
    /* Opens the iframe modal */
    triggerModal(url) {
      this.$refs[`iframeModal-${this.groupId}`].show(url);
    },
    /* Navigate to the section's single-section view */
    navigateToSection() {
      if (!this.title) {
        ErrorHandler('Cannot open section without a valid name');
        return;
      }
      const view = viewFromPath(this.$route.path);
      const confId = this.$store.state.currentConfigInfo?.confId || null;
      router.push({ path: makeRoutePath(view, confId, this.title) });
      this.closeContextMenu();
    },
    /* Toggle sections collapse state */
    expandCollapseSection() {
      const secElem = this.$refs[this.sectionRef];
      if (secElem) secElem.toggle();
      this.closeContextMenu();
    },
    /* Open the Section Edit Menu */
    openEditSection() {
      this.editMenuOpen = true;
      this.$store.commit(StoreKeys.SET_MODAL_OPEN, true);
      this.closeContextMenu();
    },
    /* Close the section edit menu */
    closeEditSection() {
      this.editMenuOpen = false;
    },
    /* Deletes current section, in local state */
    removeSection() {
      this.closeContextMenu();
      this.showRemoveConfirm = true;
    },
    confirmRemoveSection() {
      this.$store.commit(StoreKeys.REMOVE_SECTION, { sectionName: this.title });
    },
    /* Open custom context menu, and set position */
    openContextMenu(e) {
      this.contextMenuOpen = true; // Open context menu
      // If mouse position not set, use section coordinates
      const sectionOuterId = `section-outer-${this.groupId}`;
      const sectionEl = document.getElementById(sectionOuterId);
      const sectionPosition = sectionEl ? sectionEl.getBoundingClientRect() : { right: 0, top: 0 };
      this.contextPos = {
        posX: (e.clientX || sectionPosition.right - 10) + window.pageXOffset,
        posY: (e.clientY || sectionPosition.top + 30) + window.pageYOffset,
      };
    },
    /* Hide the right-click context menu */
    closeContextMenu() {
      this.contextMenuOpen = false;
    },
    /* Open edit modal for an existing widget */
    openEditWidget(widgetIndx) {
      this.editingWidgetIndex = widgetIndx;
      this.addingWidget = false;
      this.editWidgetMenuOpen = true;
      this.$store.commit(StoreKeys.SET_MODAL_OPEN, true);
    },
    /* Open edit modal for a new widget */
    openAddWidget() {
      this.editingWidgetIndex = -1;
      this.addingWidget = true;
      this.editWidgetMenuOpen = true;
      this.$store.commit(StoreKeys.SET_MODAL_OPEN, true);
    },
    closeEditWidget() {
      this.editWidgetMenuOpen = false;
      this.editingWidgetIndex = -1;
      this.addingWidget = false;
    },
    confirmRemoveWidget(widgetIndx) {
      this.pendingRemoveWidgetIndex = widgetIndx;
      this.showRemoveWidgetConfirm = true;
    },
    doRemoveWidget() {
      this.$store.commit(StoreKeys.REMOVE_WIDGET, {
        sectionName: this.title,
        widgetIndex: this.pendingRemoveWidgetIndex,
      });
      this.pendingRemoveWidgetIndex = -1;
    },
    /* Commits a drag-and-drop move of items or widgets, within or between sections */
    handleMoved(key, { oldIndex, newIndex, from, to }) {
      const { sections } = this.$store.state.config;
      const fromSection = sections[from?.sectionIndex];
      const toSection = sections[to?.sectionIndex];
      if (!fromSection || !toSection) {
        ErrorHandler('Unable to move, section not found');
        return;
      }
      if (fromSection === toSection) {
        this.$store.commit(StoreKeys.UPDATE_SECTION, {
          sectionName: fromSection.name,
          sectionData: { ...fromSection, [key]: reorder(fromSection[key] || [], oldIndex, newIndex) },
        });
        return;
      }
      const fromEntries = [...(fromSection[key] || [])];
      const [moved] = fromEntries.splice(oldIndex, 1);
      const toEntries = [...(toSection[key] || [])];
      toEntries.splice(newIndex, 0, moved);
      this.$store.commit(StoreKeys.SET_SECTIONS, sections.map((section, i) => {
        if (i === from.sectionIndex) return { ...section, [key]: fromEntries };
        if (i === to.sectionIndex) return { ...section, [key]: toEntries };
        return section;
      }));
    },
    /* Calculate width of section, used to dynamically set number of columns */
    calculateSectionWidth() {
      const secElem = this.$refs[this.sectionRef];
      if (secElem && secElem.$el.clientWidth) this.sectionWidth = secElem.$el.clientWidth;
    },
  },
  mounted() {
    // Set the section width, and recalculate when section resized
    if (this.$refs[this.sectionRef]) {
      this.resizeObserver = new ResizeObserver(this.calculateSectionWidth);
      this.resizeObserver.observe(this.$refs[this.sectionRef].$el);
    }
  },
  beforeUnmount() {
    // If resize observer set, and element still present, then de-register
    if (this.resizeObserver && this.$refs[this.sectionRef]) {
      this.resizeObserver.unobserve(this.$refs[this.sectionRef].$el);
    }
  },
};
</script>

<style scoped lang="scss">
@import '@/styles/media-queries.scss';
@import '@/styles/style-helpers.scss';

.no-items {
    width: 100px;
    margin: 0 auto;
    padding: 0.8rem;
    text-align: center;
    cursor: default;
    color: var(--primary);
    background: var(--item-background);
    border-radius: var(--curve-factor);
    box-shadow: var(--item-shadow);
}

.there-are-items {
  display: grid;
  height: auto;
  min-width: 0;
  gap: 0.75rem;
  align-items: stretch;
  --portal-card-min: 9.5rem;
  grid-template-columns: repeat(auto-fill, minmax(min(var(--portal-card-min), 100%), 1fr));
  &.inner-size-small { --portal-card-min: 8rem; }
  &.inner-size-large { --portal-card-min: 11.5rem; }
}

.add-new-item {
  display: flex;
  a {
    border-style: dashed;
  }
}

/* Drag-and-drop things for when sorting is enabled, for drop slot */
.drag-sort-active {
  :deep(.item), :deep(.sub-items-group), :deep(.widget-base) {
    cursor: grab;
  }
  :deep(.drag-sort-ghost) {
    opacity: 0.4;
    outline: 2px dashed var(--primary);
    outline-offset: -2px;
    border-radius: var(--curve-factor);
    background: var(--item-background);
    transition: none !important;
    transform: none !important;
    > * {
      visibility: hidden;
      transition: none !important;
    }
  }
  :deep(.sortable-fallback) {
    min-width: 0 !important;
  }
}

.widget-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
  gap: 0.75rem;
  margin-top: 0.75rem;
  min-width: 0;
  .widget-base { min-width: 0; }
  &.wide {
    display: flex;
    align-items: flex-start;
    justify-content: space-around;
    .widget-base  {
      min-width: 10rem;
      width: stretch;
      width: -webkit-fill-available;
      width: -moz-available;
    }
  }
  .add-widget-launcher {
    display: inline-flex;
    align-items: center;
    margin: 0.5rem 0;
    padding: 0.3rem 0.75rem;
    cursor: pointer;
    color: var(--primary);
    border: 1px dashed var(--primary);
    border-radius: var(--curve-factor);
    &:hover {
      background: var(--primary);
      color: var(--background);
      svg path { fill: var(--background); }
    }
    svg {
      width: 1rem;
      height: 1rem;
      margin-right: 0.35rem;
      path { fill: var(--primary); }
    }
  }
}

</style>
