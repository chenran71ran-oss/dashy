<template>
  <nav class="side-bar" :class="{ expanded }">
    <div class="side-bar-tools">
      <input
        v-if="expanded && searchEnabled"
        ref="search"
        v-model="search"
        type="search"
        class="side-bar-search"
        :placeholder="$t('search.search-placeholder')"
        :aria-label="$t('search.search-label')"
        @keydown.esc="search = ''"
        @keydown.enter="launchFirstResult"
      />
      <button
        class="side-bar-toggle"
        :aria-expanded="expanded"
        :aria-label="toggleLabel"
        v-tooltip="toggleLabel"
        @click="toggleExpanded"
      >
        <IconMenu />
      </button>
    </div>
    <div class="side-bar-sections">
      <div v-for="(section, index) in visibleSections" :key="index" class="side-bar-section">
        <div class="side-bar-item-container">
          <SideBarItem
            :item="{ title: section.name, icon: section.icon }"
            :aria-expanded="isOpen(section)"
            @click="toggleSection(section)"
          />
        </div>
        <Transition
          name="section-slide"
          @enter="(el, done) => slide(el, done)"
          @leave="(el, done) => slide(el, done, true)"
        >
          <div v-if="isOpen(section) && section.items.length" class="sub-side-bar">
            <template v-for="(item, itemIndex) in section.items" :key="item.id || itemIndex">
              <div v-if="item.subItems" class="sub-item-group">
                <SideBarItem
                  v-for="(subItem, subIndex) in item.subItems"
                  :key="subIndex"
                  :item="subItem"
                  :active="isActive(subItem)"
                  @launch-app="launchApp"
                />
              </div>
              <SideBarItem v-else :item="item" :active="isActive(item)" @launch-app="launchApp" />
            </template>
          </div>
        </Transition>
      </div>
    </div>
    <!-- Apps opened this session, for quick switching -->
    <div v-if="openApps.length" class="open-apps">
      <span class="side-bar-label">{{ $t('workspace.open-apps') }}</span>
      <div v-for="app in openApps" :key="app.url" class="open-app">
        <SideBarItem :item="app" :active="isActive(app)" @launch-app="launchApp" />
        <button
          class="close-app"
          :aria-label="$t('workspace.close-app', { app: app.title })"
          v-tooltip="$t('workspace.close-app', { app: app.title })"
          @click="$emit('close-app', app.url)"
        >
          <IconClose />
        </button>
      </div>
    </div>
    <!-- Links for switching back to Home / Minimal views, preserving sub-page -->
    <div class="switch-view-buttons">
      <router-link
        :to="pathFor('home')"
        :aria-label="$t('alternate-views.default')"
        v-tooltip="$t('alternate-views.default')"
      >
        <IconHome />
      </router-link>
      <router-link
        :to="pathFor('minimal')"
        :aria-label="$t('alternate-views.minimal')"
        v-tooltip="$t('alternate-views.minimal')"
      >
        <IconMinimalView />
      </router-link>
    </div>
  </nav>
</template>

<script>
import SideBarItem from '@/components/Workspace/SideBarItem.vue';
import IconHome from '@/assets/interface-icons/application-home.svg';
import IconMinimalView from '@/assets/interface-icons/application-minimal.svg';
import IconMenu from '@/assets/interface-icons/burger-menu.svg';
import IconClose from '@/assets/interface-icons/config-close.svg';
import { getCurrentUser, isLoggedInAsGuest } from '@/utils/auth/Auth';
import { isVisibleToUser } from '@/utils/IsVisibleToUser';
import { searchTiles } from '@/utils/Search';
import { localStorageKeys } from '@/utils/config/defaults';
import { makeRoutePath, resolveRouteIntent } from '@/utils/config/ConfigHelpers';
import { sameUrl } from '@/utils/MiscHelpers';

export default {
  name: 'SideBar',
  props: {
    sections: { type: Array, default: () => [] },
    activeUrl: { type: String, default: '' },
    openUrls: { type: Array, default: () => [] },
  },
  emits: ['launch-app', 'launch-widget', 'close-app'],
  components: {
    SideBarItem,
    IconHome,
    IconMinimalView,
    IconMenu,
    IconClose,
  },
  data() {
    return {
      openSection: null,
      expanded: localStorage.getItem(localStorageKeys.WORKSPACE_SIDEBAR_EXPANDED) === 'true',
      search: '',
    };
  },
  computed: {
    /* Sections and items that the current user can see, and aren't hidden from workspace */
    workspaceSections() {
      const currentUser = getCurrentUser();
      const isGuest = isLoggedInAsGuest();
      const isShown = (item) => !item.displayData?.hideFromWorkspace
        && isVisibleToUser(item.displayData || {}, currentUser, isGuest);
      return this.sections.filter((section) => !section.displayData?.hideFromWorkspace)
        .map((section) => ({ ...section, items: (section.items || []).filter(isShown) }));
    },
    /* Sections with only the items matching the search term */
    visibleSections() {
      if (!this.search) return this.workspaceSections;
      return this.workspaceSections
        .map((section) => ({ ...section, items: this.matchingItems(section) }))
        .filter((section) => section.items.length);
    },
    /* Open apps, with title and icon from their item, if there is one */
    openApps() {
      const items = this.workspaceSections.flatMap((section) => section.items)
        .flatMap((item) => item.subItems || [item]);
      return this.openUrls.map((url) => {
        const { title, icon, iconColor } = items.find((item) => sameUrl(item.url, url)) || { title: new URL(url).host };
        return { title, icon, iconColor, url };
      });
    },
    searchEnabled() {
      return this.$store.getters.visibleComponents.searchBar;
    },
    toggleLabel() {
      return this.$t(`workspace.${this.expanded ? 'collapse' : 'expand'}-sidebar`);
    },
  },
  watch: {
    activeUrl: { handler: 'openActiveSection', immediate: true },
    sections: 'openActiveSection',
  },
  methods: {
    isActive(item) {
      return sameUrl(item.url, this.activeUrl);
    },
    sectionHasActive(section) {
      return !!section && section.items.some((item) => [item, ...(item.subItems || [])].some(this.isActive));
    },
    /* Items matching the search, with groups trimmed to their matching sub-items */
    matchingItems(section) {
      return searchTiles(section.items, this.search, section.name).map((item) => {
        if (!item.subItems) return item;
        const subItems = searchTiles(item.subItems, this.search, `${section.name} ${item.title || ''}`);
        return { ...item, subItems: subItems.length ? subItems : item.subItems };
      });
    },
    isOpen(section) {
      return !!this.search || this.visibleSections.length === 1 || this.openSection === section.name;
    },
    /* Toggles the section clicked (closing all others), and shows its widgets */
    toggleSection(section) {
      this.openSection = this.openSection === section.name ? null : section.name;
      if (section.widgets && this.isOpen(section)) this.$emit('launch-widget', section.widgets);
    },
    /* Expands the section containing the active app, unless it's already open */
    openActiveSection() {
      const sections = this.workspaceSections;
      if (this.sectionHasActive(sections.find((section) => section.name === this.openSection))) return;
      const activeSection = sections.find(this.sectionHasActive);
      if (activeSection) this.openSection = activeSection.name;
    },
    toggleExpanded() {
      this.expanded = !this.expanded;
      this.search = '';
      localStorage.setItem(localStorageKeys.WORKSPACE_SIDEBAR_EXPANDED, this.expanded);
      if (this.expanded) this.$nextTick(() => this.$refs.search?.focus());
    },
    /* Slides a section's items open or closed */
    slide(el, done, closing) {
      const closed = { height: 0, paddingBlock: 0, marginBlock: 0 };
      const open = { height: `${el.offsetHeight}px` };
      const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200;
      el.animate(closing ? [open, closed] : [closed, open], { duration, easing: 'ease-out' }).onfinish = done;
    },
    launchApp(url) {
      this.$emit('launch-app', url);
    },
    launchFirstResult() {
      this.$el.querySelector('.sub-side-bar .side-bar-item')?.click();
    },
    /* Build a URL for the given view, preserving the current sub-page and section */
    pathFor(view) {
      const { pageId, sectionSlug } = resolveRouteIntent(this.$route, this.$store);
      return makeRoutePath(view, pageId, sectionSlug);
    },
  },
};
</script>

<style lang="scss" scoped>
@import '@/styles/media-queries.scss';
@import '@/styles/style-helpers.scss';

$divider: color-mix(in srgb, var(--side-bar-color) 25%, transparent);

nav.side-bar {
  display: flex;
  flex-direction: column;
  flex: 0 0 var(--side-bar-width);
  min-width: 0;
  gap: 0.25rem;
  padding: 0.25rem;
  box-sizing: border-box;
  background: var(--side-bar-background);
  color: var(--side-bar-color);
  &.expanded {
    flex-basis: var(--side-bar-width-expanded);
    :deep(.side-bar-item) {
      justify-content: flex-start;
      padding: 0.25rem 0.5rem;
      .title { display: block; }
    }
  }
  .side-bar-toggle, .close-app {
    border: none;
    background: none;
    color: inherit;
    &:focus-visible { outline: 2px solid currentColor; }
  }
}

.side-bar-tools {
  display: flex;
  gap: 0.25rem;
  .side-bar-toggle {
    flex: 1 0 auto;
    min-height: 2.5rem;
    border-radius: var(--curve-factor);
    &:hover { background: var(--side-bar-background-lighter); }
  }
  .side-bar-search {
    flex: 1;
    min-width: 0;
    padding: 0.4rem 0.5rem;
    border: 1px solid var(--outline-color);
    border-radius: var(--curve-factor);
    background: var(--side-bar-background-lighter);
    color: var(--side-bar-color);
    font: inherit;
    outline: none;
    &:focus { border-color: var(--side-bar-color); }
  }
  .expanded & .side-bar-toggle { flex-grow: 0; margin-left: auto; padding: 0 0.6rem; }
}

.open-apps {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding-top: 0.25rem;
  border-top: 1px solid $divider;
  .side-bar-label {
    display: none;
    padding: 0.25rem 0.5rem 0;
    font-size: 0.7rem;
    font-weight: bold;
    text-transform: uppercase;
    opacity: var(--dimming-factor);
    .expanded & { display: block; }
  }
  .open-app {
    position: relative;
    display: flex;
    align-items: center;
  }
  .close-app {
    position: absolute;
    top: 0;
    right: 0;
    padding: 0.1rem;
    line-height: 0;
    clip-path: inset(50%); // Hidden until hovered, but still reachable by keyboard
    svg { width: 0.8rem; height: 0.8rem; }
  }
  .open-app:hover .close-app, .close-app:focus-visible { clip-path: none; }
  .expanded & .close-app { position: static; clip-path: none; padding: 0.4rem; }
}

.side-bar-sections {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  @extend .scroll-bar;
}

.side-bar-section:not(:last-child) {
  border-bottom: 1px dashed $divider;
}

/* Chevron on section headers, so they read as expandable */
.side-bar-item-container > .side-bar-item {
  position: relative;
  &::after {
    content: '';
    position: absolute;
    right: 0.25rem;
    width: 0.25rem;
    height: 0.25rem;
    border: solid currentColor;
    border-width: 0 2px 2px 0;
    opacity: 0.7;
    transform: rotate(-45deg);
    transition: transform 0.2s ease-out;
  }
  &[aria-expanded="true"]::after { transform: rotate(45deg); }
  .expanded &::after { position: static; margin-right: 0.25rem; }
}

.sub-side-bar {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  margin: 0.2rem 0;
  padding: 0.2rem;
  box-sizing: border-box;
  border-radius: var(--curve-factor);
  background: var(--side-bar-background-lighter);
  .sub-item-group {
    display: flex;
    flex-direction: column;
    border-radius: var(--curve-factor);
    background: var(--side-bar-background);
  }
  .expanded & { padding-left: 0.5rem; }
  &.section-slide-enter-active, &.section-slide-leave-active { overflow: hidden; }
}

.switch-view-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.25rem;
  a {
    display: flex;
    padding: 0.25rem;
    color: var(--side-bar-color);
    border-radius: var(--curve-factor);
    &:hover, &:focus-visible { background: var(--side-bar-background-lighter); }
  }
}

/* On small screens, the collapsed sidebar is a scrollable row above the content */
@include phone {
  nav.side-bar {
    flex-basis: auto;
    max-height: 50%;
    &.expanded { flex-basis: auto; }
    &:not(.expanded) {
      flex-direction: row;
      align-items: center;
      overflow: auto hidden;
      .side-bar-sections, .side-bar-section, .sub-side-bar, .sub-item-group, .open-apps {
        display: flex;
        flex-direction: row;
      }
      .side-bar-sections { flex: none; overflow: visible; }
      .side-bar-section:not(:last-child) { border: none; }
      .open-apps { padding: 0 0 0 0.25rem; border: none; border-left: 1px solid $divider; }
      .sub-side-bar { margin: 0 0.2rem; }
      :deep(.side-bar-item) { width: 2.5rem; }
    }
  }
}
</style>
