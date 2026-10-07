<template>
  <div class="options-panel" aria-label="导航显示和管理工具栏">
    <div class="toolbar-group theme-group"><ThemeSelector /></div>
    <div class="toolbar-group"><LayoutSelector /></div>
    <div class="toolbar-group"><ItemSizeSelector /></div>
    <div class="toolbar-group">
      <span class="options-label">管理</span>
      <div class="toolbar-buttons">
        <button v-if="canEdit" type="button" class="action-btn" @click="openConfig" aria-label="配置" title="配置"><IconConfig /></button>
        <button v-if="canEdit" type="button" class="action-btn" @click="startEdit" :disabled="isEditMode" aria-label="编辑网站" title="编辑网站"><IconEdit /></button>
        <AuthButtons :userType="userState" iconOnly />
      </div>
    </div>
    <div class="toolbar-group">
      <span class="options-label">视图</span>
      <div class="toolbar-buttons">
        <router-link v-for="view in views" :key="view.id" :to="pathFor(view.id)" class="view-btn"
          :class="{ active: currentView === view.id }" :aria-label="view.label" :title="view.label">
          <component :is="view.icon" /><span>{{ view.label }}</span>
        </router-link>
      </div>
    </div>
    <button type="button" class="toolbar-close" @click="$emit('close')" aria-label="收起工具栏" title="收起工具栏"><IconClose /></button>
  </div>
</template>
<script>
import ThemeSelector from './ThemeSelector';
import LayoutSelector from './LayoutSelector';
import ItemSizeSelector from './ItemSizeSelector';
import AuthButtons from './AuthButtons';
import Keys from '@/utils/StoreMutations';
import { modalNames } from '@/utils/config/defaults';
import { getUserState } from '@/utils/auth/Auth';
import { makeRoutePath, resolveRouteIntent, viewFromPath } from '@/utils/config/ConfigHelpers';
import IconClose from '@/assets/interface-icons/config-close.svg';
import IconEdit from '@/assets/interface-icons/interactive-editor-edit-mode.svg';
import IconConfig from '@/assets/interface-icons/config-editor.svg';
import IconHome from '@/assets/interface-icons/application-home.svg';
import IconMinimalView from '@/assets/interface-icons/application-minimal.svg';
import IconWorkspaceView from '@/assets/interface-icons/open-workspace.svg';
export default {
  components: { ThemeSelector, LayoutSelector, ItemSizeSelector, AuthButtons, IconClose, IconEdit, IconConfig, IconHome, IconMinimalView, IconWorkspaceView },
  emits: ['close'],
  computed: {
    isEditMode() { return this.$store.state.editMode; },
    canEdit() { return this.$store.getters.permissions.allowViewConfig; },
    userState() { return getUserState(); },
    currentView() { return viewFromPath(this.$route.path); },
    views() { return [{ id: 'home', label: '总站', icon: 'IconHome' }, { id: 'minimal', label: '专注', icon: 'IconMinimalView' }, { id: 'workspace', label: '工作台', icon: 'IconWorkspaceView' }]; },
  },
  methods: {
    openConfig() { this.$modal.show(modalNames.CONF_EDITOR); this.$store.commit(Keys.SET_MODAL_OPEN, true); },
    startEdit() { this.$store.commit(Keys.SET_EDIT_MODE, true); },
    pathFor(view) { const { pageId, sectionSlug } = resolveRouteIntent(this.$route, this.$store); return makeRoutePath(view, pageId, sectionSlug); },
  },
};
</script>
<style scoped lang="scss">
.options-panel { position: relative; display: flex; flex-wrap: wrap; align-items: flex-end; gap: .65rem 1rem; color: var(--settings-text-color); min-width: 0; width: 100%; padding-right: 2.8rem; box-sizing: border-box; --toolbar-control-height: 44px; }
.toolbar-group { flex: 0 0 auto; min-width: 0; }
.theme-group { flex: 1 1 11rem; max-width: 15rem; }
.options-panel :deep(.options-label), .options-panel :deep(.theme-label) { display: block; font-size: .8rem; line-height: 1.2; height: 1rem; margin: 0 0 .35rem; }
.toolbar-buttons, .options-panel :deep(.display-options) { display: flex; align-items: center; gap: .3rem; margin: 0; }
.action-btn, .view-btn, .toolbar-close, .options-panel :deep(.auth-btn), .options-panel :deep(.display-options svg), .options-panel :deep(svg.color-button) { display: inline-flex; align-items: center; justify-content: center; gap: .3rem; padding: .55rem; width: 44px; height: var(--toolbar-control-height); min-width: 44px; min-height: var(--toolbar-control-height); flex: 0 0 auto; box-sizing: border-box; border-radius: var(--curve-factor-small); }
.action-btn, .view-btn, .toolbar-close { color: var(--settings-text-color); background: transparent; border: 1px solid currentColor; cursor: pointer; text-decoration: none; font-size: .8rem; }
.view-btn { width: auto; white-space: nowrap; }
.options-panel :deep(.theme-trigger) { height: var(--toolbar-control-height); min-height: var(--toolbar-control-height); }
.options-panel :deep(.theme-trigger small) { display: none; }
svg { width: 1.25rem; height: 1.25rem; fill: currentColor; }
.active, .action-btn:hover, .view-btn:hover { color: var(--background); background: var(--settings-text-color); }
button:disabled { opacity: .4; cursor: default; }
.toolbar-close { position: absolute; top: 0; right: 0; border: none; }
@media(max-width:599px) {
 .options-panel { display: grid; grid-template-columns: minmax(0, 4fr) minmax(0, 3fr); gap: .65rem .5rem; padding-right: 0; }
 .theme-group { grid-column: 1 / -1; max-width: none; padding-right: 3rem; }
 .toolbar-group:last-of-type { grid-column: 1 / -1; }
 .options-panel :deep(.display-options svg) { flex: 1 1 0; min-width: 0; width: 0; }
 .view-btn { flex: 1; min-width: 0; }
}
</style>
