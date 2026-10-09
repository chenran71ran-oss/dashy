<template>
  <div class="minimal-home focus-home" :style="getBackgroundImage()">
    <!-- Page title and search bar -->
    <div class="title-and-search">
      <PageTitle :title="pageInfo.title" :logo="pageInfo.logo" class="minimal-title" />
      <SettingsContainer compact forceSearch minimalSearch
        @user-is-searchin="(s) => { searchValue = s; }"
        :active="!modalOpen" ref="filterComp" />
    </div>
    <div v-if="checkTheresData(sections)"
      :class="`item-group-container ${!tabbedView ? 'showing-all' : ''}`">
      <!-- Section heading tabs. Equal-width, scroll horizontally with arrows when they overflow -->
      <div class="minimal-headings-wrap">
        <button v-if="canScrollTabs" class="tab-scroll-btn"
          :disabled="!canScrollLeft" @click="scrollTabs(-1)" aria-label="Previous tabs">‹</button>
        <div ref="tabsStrip" class="minimal-headings-row" @scroll="updateTabScroll">
          <MinimalHeading
            v-for="(section, index) in sections"
            :key="`heading-${index}`"
            :index="index"
            :title="section.name"
            :icon="section.icon"
            :selected="selectedSection === index"
            @sectionSelected="sectionSelected"
            class="headings"
            :hideTitleText="sections.length > 8"
          />
        </div>
        <button v-if="canScrollTabs" class="tab-scroll-btn"
          :disabled="!canScrollRight" @click="scrollTabs(1)" aria-label="Next tabs">›</button>
      </div>
      <!-- Section item groups -->
      <MinimalSection
        v-for="(section, index) in filteredSections"
        :key="makeSectionId(section)"
        :index="index"
        :title="section.name"
        :icon="section.icon || undefined"
        :groupId="makeSectionId(section)"
        :items="section.filteredItems"
        :widgets="section.widgets"
        :displayData="section.displayData || {}"
        :selected="selectedSection === index"
        :showAll="!tabbedView"
        class="focus-category"
        @sectionSelected="sectionSelected"
        @itemClicked="finishedSearching()"
        @change-modal-visibility="updateModalVisibility"
      />
      <div v-if="searchValue && checkIfResults(filteredSections)" class="no-data">
        {{searchValue ? $t('home.no-results') : $t('home.no-data')}}
      </div>
    </div>
    <div v-else class="no-data">
      <template v-if="isBootstrap">
        {{ $t('home.session-expired-line1') }}
        <p class="hint">{{ $t('home.session-expired-line2') }}</p>
        <Button :click="reAuth">{{ $t('home.sign-in-again') }}</Button>
      </template>
      <template v-else>{{ $t('home.no-data') }}</template>
    </div>
  </div>
  <!-- Interactive editor save options bottom banner  -->
  <EditModeSaveMenu v-if="isEditMode" />
</template>

<script>
import HomeMixin from '@/mixins/HomeMixin';
import MinimalSection from '@/components/MinimalView/MinimalSection.vue';
import MinimalHeading from '@/components/MinimalView/MinimalHeading.vue';
import SettingsContainer from '@/components/Settings/SettingsContainer.vue';
import PageTitle from '@/components/PageStrcture/PageTitle.vue';
import EditModeSaveMenu from '@/components/InteractiveEditor/EditModeSaveMenu.vue';
import Button from '@/components/FormElements/Button';
import { makePageName, resolveRouteIntent } from '@/utils/config/ConfigHelpers';
import ErrorHandler from '@/utils/logging/ErrorHandler';

export default {
  name: 'Minimal',
  mixins: [HomeMixin],
  components: {
    MinimalSection,
    MinimalHeading,
    SettingsContainer,
    PageTitle,
    EditModeSaveMenu,
    Button,
  },
  data: () => ({
    layout: '',
    selectedSection: 0, // The index of currently selected section
    tabbedView: true, // By default use tabs, when searching then show all instead
    canScrollTabs: false, // Tabs strip is wider than its container
    canScrollLeft: false,
    canScrollRight: false,
    tabResizeObserver: null,
  }),
  computed: {
    /* Just the items to display, filtered by search term */
    filteredSections() {
      const showHidden = this.isEditMode || !!this.searchValue;
      return (this.sections || []).map((section) => ({
        ...section,
        filteredItems: this.filterTiles(section.items, section.name, { showHidden }),
      }));
    },
  },
  watch: {
    searchValue() {
      this.tabbedView = !this.searchValue || this.searchValue.length === 0;
    },
    /* Keep the selected section in sync with the URL (/minimal/:page/:section) */
    '$route.params.section': {
      handler() { this.syncSelectedFromRoute(); },
      immediate: true,
    },
    sections() { this.syncSelectedFromRoute(); },
  },
  methods: {
    sectionSelected(index) {
      this.selectedSection = index;
      try { localStorage.setItem(`minimal-category:${this.pageId || 'home'}`, this.sections[index].name); } catch { /* storage optional */ }
    },
    /* If section slug present in the URL, then auto-select it if it exists */
    syncSelectedFromRoute() {
      if (!this.sections || !this.sections.length) return;
      const { sectionSlug } = resolveRouteIntent(this.$route, this.$store);
      if (!sectionSlug) {
        const saved = localStorage.getItem(`minimal-category:${this.pageId || 'home'}`);
        const index = this.sections.findIndex(s => s.name === saved);
        this.selectedSection = index >= 0 ? index : 0; return;
      }
      const idx = this.sections.findIndex((s) => makePageName(s.name || '') === sectionSlug);
      if (idx >= 0) { this.selectedSection = idx; return; }
      ErrorHandler(`No section named '${sectionSlug}' was found in the current config`);
    },
    /* Clears input field, once a searched item is opened */
    finishedSearching() {
      if (this.$refs.filterComp) this.$refs.filterComp.clearFilterInput();
    },
    /* Make CSS styles to apply the users custom background image */
    getBackgroundImage() {
      if (this.appConfig && this.appConfig.backgroundImg) {
        return `background: url('${this.appConfig.backgroundImg}') no-repeat center fixed;background-size:cover;`;
      }
      return '';
    },
    /* Scroll the tab strip by ~one visible page; leaves a small overlap so
     * the user can see where they came from */
    scrollTabs(direction) {
      const strip = this.$refs.tabsStrip;
      if (!strip) return;
      const amount = Math.max(strip.clientWidth - 64, 120);
      strip.scrollBy({ left: amount * direction, behavior: 'smooth' });
    },
    updateTabScroll() {
      const strip = this.$refs.tabsStrip;
      if (!strip) return;
      this.canScrollTabs = strip.scrollWidth > strip.clientWidth + 1;
      this.canScrollLeft = strip.scrollLeft > 0;
      this.canScrollRight = strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1;
    },
  },
  mounted() {
    this.initiateFontAwesome();
    this.initiateMaterialDesignIcons();
    this.$nextTick(() => {
      this.updateTabScroll();
      if (typeof ResizeObserver !== 'undefined' && this.$refs.tabsStrip) {
        this.tabResizeObserver = new ResizeObserver(this.updateTabScroll);
        this.tabResizeObserver.observe(this.$refs.tabsStrip);
      }
    });
  },
  beforeUnmount() {
    if (this.tabResizeObserver) {
      this.tabResizeObserver.disconnect();
      this.tabResizeObserver = null;
    }
  },
};
</script>

<style lang="scss" scoped>
@import '@/styles/media-queries.scss';
@import '@/styles/style-helpers.scss';

.minimal-home {
  --minimal-card-min: 9.5rem;
  display: block;
  margin: 1rem auto;
  padding-bottom: 1px;
  padding-top: clamp(1rem, 4vh, 3rem);
  min-height: calc(99vh - var(--footer-height));
  width: 90%;
  max-width: 1000px;
  position: relative;
  background: var(--minimal-view-background-color);
}

.title-and-search {
  width: 90%; margin-inline: auto; min-width: 0;
  .minimal-title { justify-content: center; margin: 0 auto 1rem; }
  text-align: center;
  h1 {
    color: var(--minimal-view-title-color);
    margin: 0;
    font-size: 3rem;
  }
  a {
    text-decoration: none;
  }
}

/* Outside container wrapping the item groups*/
.item-group-container {
  display: block;
  margin: 1.25rem auto;
  width: 90%;
  @extend .scroll-bar;

  &.showing-all .minimal-headings-wrap {
    display: none;
  }
}

.minimal-headings-wrap {
  display: flex;
  align-items: stretch;
  gap: 0.25rem;
}
.minimal-headings-row {
  flex: 1 1 auto;
  display: flex;
  gap: 0.25rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  .headings {
    flex: 1 0 8rem;
    max-width: 14rem;
    min-width: 0;
    &.center {
      flex: 1 0 3rem;
      max-width: 4rem;
    }
  }
}
.tab-scroll-btn {
  flex: 0 0 auto;
  padding: 0 0.5rem;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  background: var(--minimal-view-section-heading-background);
  color: var(--minimal-view-section-heading-color);
  border: 1px solid var(--minimal-view-section-heading-color);
  border-radius: var(--curve-factor);
  &:disabled { opacity: 0.3; cursor: default; }
}

.no-data {
    font-size: 2rem;
    color: var(--minimal-view-background-color);
    background: #ffffffeb;
    width: fit-content;
    margin: 2rem auto;
    padding: 0.5rem 1rem;
    border-radius: var(--curve-factor);
}

.minimal-buttons {
    position: absolute;
    top: 0.5rem;
    right: 1rem;
    display: flex;
    .home-page-icon {
      color: var(--minimal-view-settings-color);
      width: 1.5rem;
      height: 1.5rem;
      @extend .svg-button;
    }
}
.focus-category { min-width: 0; }
.focus-category :deep(.section-items) {
  grid-template-columns: repeat(auto-fit, minmax(min(var(--minimal-card-min), 100%), 1fr));
  gap: .75rem; padding: .75rem; box-sizing: border-box;
  align-items: start; align-content: start; grid-auto-rows: max-content;
}
.focus-home:has(.item.size-small) { --minimal-card-min: 8rem; }
.focus-home:has(.item.size-large) { --minimal-card-min: 14rem; }
.focus-category { min-height: 0 !important; height: auto !important; }
@media (max-width: 600px) {
  .minimal-home { width: calc(100% - 1rem); padding-top: 2rem; }
  .title-and-search { width: 100%; }
  .item-group-container { width: 100%; margin: 1.5rem auto; }
  .minimal-buttons { top: 0; right: 0; }
}
</style>

<style lang="scss">
.minimal-home .minimal-buttons {
  .config-launcher span.config-label { display: none; }
  svg { opacity: var(--dimming-factor); border: none; }
  &:hover svg { opacity: 1; }
  .view-switcher {
    margin-top: 2rem;
    right: 0;
  }
}
</style>
