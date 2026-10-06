<template>
  <div class="theme-selector-section" v-click-outside="closePopovers" @keydown.esc="closePopovers">
    <div class="theme-control">
      <span class="theme-label">{{ $t('settings.theme-label') }}</span>
      <div class="theme-dropdown">
        <button class="theme-trigger" type="button" aria-label="选择主题" :aria-expanded="dropdownOpen" @click="toggleDropdown">
          <span>{{ chineseLabel(selectedTheme) }} <small>{{ selectedTheme }}</small></span><span aria-hidden="true">▾</span>
        </button>
        <div v-if="dropdownOpen" class="theme-popover">
          <input ref="themeSearch" v-model="query" aria-label="搜索主题" placeholder="搜索中文或英文主题" @keydown.down.prevent="focusFirstTheme" />
          <p>当前主题优先 · 点击 ☆ 收藏置顶</p>
          <div ref="themeList" class="theme-list" role="group" aria-label="主题列表">
            <div v-for="name in orderedThemes" :key="name" class="theme-row" :class="{active: name === selectedTheme}">
              <button type="button" class="theme-choice" :aria-pressed="name === selectedTheme" @click="chooseTheme(name)">
                <span>{{ chineseLabel(name) }}<small>{{ name }}</small></span><span v-if="name === selectedTheme" class="current-label">当前</span>
              </button>
              <button type="button" class="theme-favorite" :aria-label="(favorites.includes(name) ? '取消收藏 ' : '收藏 ') + name" :aria-pressed="favorites.includes(name)" @click="toggleFavorite(name)">{{ favorites.includes(name) ? '★' : '☆' }}</button>
            </div>
            <p v-if="!orderedThemes.length">没有匹配的主题</p>
          </div>
          <small class="favorite-note">收藏保存在当前浏览器</small>
        </div>
      </div>
    </div>
    <IconPalette v-if="!hidePallete" class="color-button" @click="openThemeConfigurator" @keydown.enter="openThemeConfigurator" @keydown.space.prevent="openThemeConfigurator" role="button" aria-hidden="false" tabindex="0" :aria-label="$t('theme-maker.title')" v-tooltip="$t('theme-maker.title')" />
    <CustomThemeMaker v-if="themeConfiguratorOpen" :themeToEdit="selectedTheme" @closeThemeConfigurator="closeThemeConfigurator()" />
  </div>
</template>
<script>
import CustomThemeMaker from '@/components/Settings/CustomThemeMaker';
import Keys from '@/utils/StoreMutations';
import IconPalette from '@/assets/interface-icons/config-color-palette.svg';
import ThemingMixin from '@/mixins/ThemingMixin';
import { themeLabel, orderThemes, readThemeFavorites, favoriteThemesKey } from '@/utils/ThemeCatalog';
export default {
  name: 'ThemeSelector', mixins: [ThemingMixin], props: { hidePallete: Boolean }, components: { CustomThemeMaker, IconPalette },
  data: () => ({ themeConfiguratorOpen: false, dropdownOpen: false, query: '', favorites: [] }),
  computed: { orderedThemes() { return orderThemes(this.themeNames, this.selectedTheme, this.favorites, this.query); } },
  mounted() { this.syncFavorites(); window.addEventListener('storage', this.syncFavorites); window.addEventListener('home-lab-theme-favorites', this.syncFavorites); window.addEventListener('keydown', this.closeWithEscape); },
  beforeUnmount() { window.removeEventListener('storage', this.syncFavorites); window.removeEventListener('home-lab-theme-favorites', this.syncFavorites); window.removeEventListener('keydown', this.closeWithEscape); },
  methods: {
    chineseLabel: themeLabel,
    closeWithEscape(event) { if (event.key === 'Escape' && this.dropdownOpen) this.dropdownOpen = false; },
    syncFavorites() { try { this.favorites = readThemeFavorites(window.localStorage); } catch { this.favorites = []; } },
    toggleFavorite(name) {
      this.favorites = this.favorites.includes(name) ? this.favorites.filter(x => x !== name) : [...this.favorites, name];
      try { window.localStorage.setItem(favoriteThemesKey, JSON.stringify(this.favorites)); window.dispatchEvent(new Event('home-lab-theme-favorites')); } catch { /* Session favorites still work if storage is disabled. */ }
    },
    async toggleDropdown() { this.dropdownOpen = !this.dropdownOpen; this.query = ''; if (this.dropdownOpen) { await this.$nextTick(); this.$refs.themeSearch?.focus(); } },
    focusFirstTheme() { this.$refs.themeList?.querySelector('.theme-choice')?.focus(); },
    chooseTheme(name) { this.selectedTheme = name; this.themeChangedInUI(); this.dropdownOpen = false; },
    openThemeConfigurator() { this.dropdownOpen = false; this.$store.commit(Keys.SET_MODAL_OPEN, true); this.themeConfiguratorOpen = true; },
    closeThemeConfigurator() { if (this.themeConfiguratorOpen) { this.$store.commit(Keys.SET_MODAL_OPEN, false); this.themeConfiguratorOpen = false; } },
    closePopovers() { this.dropdownOpen = false; this.closeThemeConfigurator(); },
  },
};
</script>
<style lang="scss">
@import 'vue-select/dist/vue-select.css';
.theme-selector-section { display: flex; align-items: flex-end; gap: 0.5rem; width: 100%; color: var(--settings-text-color); }
.theme-control { flex: 1; min-width: 0; }
.theme-dropdown { position: relative; }
.theme-dropdown button, .theme-dropdown input { font: inherit; color: inherit; background: var(--background); border: 1px solid var(--outline-color); }
.theme-trigger { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; width: 100%; min-height: 44px; padding: 0.35rem 0.6rem; border-radius: var(--curve-factor-small); text-align: left; cursor: pointer; }
.theme-dropdown small { display: block; font-size: 0.7rem; opacity: 0.8; overflow-wrap: anywhere; }
.theme-popover { position: absolute; inset: calc(100% + 0.35rem) auto auto 0; width: max(100%, 17rem); max-width: calc(100vw - 2rem); z-index: 50; background: var(--background); border: 1px solid var(--settings-text-color); border-radius: 10px; padding: 0.5rem; box-sizing: border-box; box-shadow: 0 8px 24px #0003; }
.theme-popover input { padding: 0.6rem; min-height: 44px; width: 100%; box-sizing: border-box; border-radius: 6px; }
.theme-popover p { font-size: 0.75rem; margin: 0.6rem 0.35rem; }
.theme-list { max-height: min(320px, 45dvh); overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; scrollbar-width: thin; touch-action: pan-y; }
.theme-row { display: flex; border-radius: 6px; }
.theme-row.active { background: var(--primary-transparent-60); }
.theme-row button { border: 0; background: transparent; min-height: 48px; cursor: pointer; }
.theme-choice { display: flex; flex: 1; min-width: 0; align-items: center; justify-content: space-between; text-align: left; padding: 0.4rem 0.5rem; gap: 0.4rem; }
.theme-choice > span:first-child { min-width: 0; overflow-wrap: anywhere; }
.current-label { font-size: 0.65rem; flex-shrink: 0; opacity: 0.8; }
.theme-favorite { flex: 0 0 44px; width: 44px; font-size: 1.4rem !important; }
.theme-favorite[aria-pressed='true'] { color: var(--primary); }
.theme-dropdown button:hover { background: var(--primary-transparent-60); }
.theme-dropdown button:focus-visible, .theme-dropdown input:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; }
.favorite-note { padding: 0.6rem 0.35rem 0; }
svg.color-button { width: 44px; height: 44px; padding: 0.6rem; box-sizing: border-box; flex-shrink: 0; background: var(--background); border: 1px solid var(--settings-text-color); border-radius: var(--curve-factor); cursor: pointer; path { fill: var(--settings-text-color); } &:hover, &.selected { background: var(--settings-text-color); path { fill: var(--background); } } }
</style>
