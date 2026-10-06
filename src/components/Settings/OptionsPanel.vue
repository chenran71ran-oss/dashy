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
.options-panel { position: relative; display: flex; flex-wrap: wrap; align-items: flex-end; gap: 0.8rem; color: var(--settings-text-color); min-width: 0; width: 100%; padding-right: 2rem; box-sizing: border-box; }
.toolbar-group { flex: 0 0 auto; min-width: 0; }
.theme-group { flex: 1 1 10rem; max-width: 15rem; }
.options-label { display: block; font-size: 0.85rem; margin-bottom: 0.25rem; }
.toolbar-buttons { display: flex; align-items: center; gap: 0.3rem; }
.action-btn, .view-btn, .toolbar-close { display: inline-flex; align-items: center; justify-content: center; gap: 0.3rem; padding: 0.3rem; min-width: 1.9rem; min-height: 1.9rem; box-sizing: border-box; color: var(--settings-text-color); background: transparent; border: 1px solid currentColor; border-radius: var(--curve-factor-small); cursor: pointer; text-decoration: none; font-size: 0.75rem; }
svg { width: 1.2rem; height: 1.2rem; fill: currentColor; }
.active, .action-btn:hover, .view-btn:hover { color: var(--background); background: var(--settings-text-color); }
button:disabled { opacity: 0.4; cursor: default; }
.toolbar-close { position: absolute; top: 0; right: 0; border: none; }
@media(max-width:600px) { .options-panel { gap: 0.75rem; padding-right: 0; } .toolbar-group { flex: 1 1 auto; } .theme-group { flex-basis: 100%; max-width: none; padding-right: 2.7rem; box-sizing: border-box; } .action-btn, .view-btn, .toolbar-close { min-height: 2.5rem; min-width: 2.5rem; } }
</style>
