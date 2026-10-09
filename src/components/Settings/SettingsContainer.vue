<template>
  <section class="portal-toolbar" :class="{ compact, 'has-search': searchVisible }">
    <SearchBar
      v-if="searchVisible"
      ref="SearchBar"
      :minimal-search="minimalSearch"
      @user-is-searchin="userIsTypingSomething"
    />
    <div class="options-outer" :class="{ expanded: panelOpen }">
      <button
        type="button"
        class="options-trigger"
        :class="{ open: panelOpen }"
        @click.stop="togglePanel"
        v-tooltip="$t('settings.options-tooltip')"
        :aria-label="$t('settings.options-tooltip')"
        :aria-expanded="panelOpen"
        tabindex="0"
      >
        <IconOptions />
      </button>
      <transition name="panel-fade">
        <OptionsPanel v-if="panelOpen" @close="closePanel" />
      </transition>
    </div>

    <modal
      :name="modalNames.CONF_EDITOR"
      :resizable="true"
      width="80%"
      height="85%"
      classes="dashy-modal"
      @closed="onConfigClosed"
    >
      <ConfigContainer :config="combinedConfig" />
    </modal>
    <modal
      :name="modalNames.LANG_SWITCHER"
      :resizable="true"
      width="35%"
      height="60%"
      classes="dashy-modal"
    >
      <LanguageSwitcher />
    </modal>

    <AppInfoModal />
  </section>
</template>

<script>
import SearchBar from '@/components/Settings/SearchBar';
import OptionsPanel from '@/components/Settings/OptionsPanel';
import AppInfoModal from '@/components/Configuration/AppInfoModal';
import ConfigContainer from '@/components/Configuration/ConfigContainer';
import LanguageSwitcher from '@/components/Settings/LanguageSwitcher';
import Keys from '@/utils/StoreMutations';
import { topLevelConfKeys, localStorageKeys, modalNames } from '@/utils/config/defaults';
import IconOptions from '@/assets/interface-icons/config-open-settings.svg';

export default {
  name: 'SettingsContainer',
  components: {
    SearchBar,
    OptionsPanel,
    AppInfoModal,
    ConfigContainer,
    LanguageSwitcher,
    IconOptions,
  },
  props: { forceSearch: Boolean, compact: Boolean, hideSearch: Boolean, minimalSearch: Boolean },
  emits: ['user-is-searchin'],
  data() { return { panelOpen: !this.compact, modalNames }; },
  computed: {
    searchVisible() {
      return !this.hideSearch && (this.forceSearch || this.$store.getters.visibleComponents.searchBar);
    },
    combinedConfig() {
      const app = this.$store.getters.appConfig;
      return {
        [topLevelConfKeys.APP_CONFIG]: {
          ...app,
          theme: localStorage[localStorageKeys.THEME] || app.theme,
        },
        [topLevelConfKeys.PAGE_INFO]: this.$store.getters.pageInfo,
        [topLevelConfKeys.SECTIONS]: this.$store.getters.sections,
      };
    },
  },
  methods: {
    userIsTypingSomething(q) { this.$emit('user-is-searchin', q); },
    clearFilterInput() {
      if (this.$refs.SearchBar) this.$refs.SearchBar.clearFilterInput();
    },
    togglePanel() { this.panelOpen = !this.panelOpen; },
    closePanel() { this.panelOpen = false; },
    onConfigClosed() { this.$store.commit(Keys.SET_MODAL_OPEN, false); },
  },
};
</script>

<style scoped lang="scss">
section.portal-toolbar {
  position: relative;
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem;
  background: linear-gradient(0deg, var(--background) 0%, var(--background-darker) 100%);
  box-shadow: var(--settings-container-shadow);
}

.options-outer {
  position: static;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 1 1 48rem;
  padding: 0.5rem;
  gap: 0.75rem;
  background: var(--settings-background);
  border-radius: var(--curve-factor-navbar) 0 0;
}
.options-outer.expanded .options-trigger { display: none; }
.portal-toolbar.compact {
  background: transparent; box-shadow: none; padding: 0;
  display: grid; grid-template-columns: minmax(0, 1fr) 44px;
  width: 100%; min-width: 0; box-sizing: border-box; align-items: center;
  .options-outer { display: contents; }
  .options-trigger { grid-column: 2; grid-row: 1; }
  .options-outer.expanded .options-trigger { display: inline-flex; }
  :deep(form) { grid-column: 1; grid-row: 1; width: 100%; max-width: none; min-width: 0; margin: 0; box-sizing: border-box; }
  :deep(.options-panel) { grid-column: 1 / -1; grid-row: 2; padding: .8rem 3.2rem .8rem .8rem; background: var(--settings-background); border-radius: var(--curve-factor); }
  :deep(.toolbar-close) { top: .8rem; right: .5rem; }
  .options-trigger { width: 44px; height: 44px; }
}
@media(max-width: 1100px) {
  .options-outer { flex-basis: 100%; justify-content: flex-start; min-width: 0; }
}

/* A column flex layout must not inherit desktop flex bases or end alignment. */
@media(max-width:599px) {
  section.portal-toolbar {
    display: grid; grid-template-columns: minmax(0, 1fr) 44px;
    align-items: stretch; gap: .35rem; padding: .35rem .5rem;
    width: 100%; min-width: 0; box-sizing: border-box;
  }
  .options-outer {
    display: contents;
  }
  .options-trigger { grid-column: 2; grid-row: 1; width: 44px; height: 44px; }
  .options-outer.expanded .options-trigger { display: inline-flex; }
  section.portal-toolbar :deep(.options-panel) { grid-column: 1 / -1; grid-row: 2; padding: .4rem; background: var(--settings-background); }
  section.portal-toolbar.compact :deep(.options-panel) { padding: .75rem; }
  section.portal-toolbar.compact :deep(.theme-group) { padding-right: 3rem; }
  section.portal-toolbar :deep(form.normal) {
    grid-column: 1; grid-row: 1;
    width: 100%; max-width: none; min-width: 0; flex: none;
    margin: 0 auto;
  }
}

.options-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0.3rem;
  background: var(--background-darker);
  border: 1px solid transparent;
  border-radius: var(--curve-factor);
  color: var(--settings-text-color);
  cursor: pointer;
  opacity: var(--dimming-factor);

  svg {
    width: 100%;
    height: 100%;
    fill: currentColor;
  }

  &:hover, &.open, &:focus-visible {
    opacity: 1;
    background: var(--primary);
    color: var(--background);
    outline: none;
  }
}

.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}

@media (prefers-reduced-motion: reduce) {
  .panel-fade-enter-active,
  .panel-fade-leave-active { transition: none; }
}
</style>
