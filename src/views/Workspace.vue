<template>
  <div class="work-space">
    <SideBar
      :sections="sections"
      :activeUrl="activeUrl"
      :openUrls="openUrls"
      @launch-app="launchApp"
      @launch-widget="launchWidgets"
      @close-app="closeApp"
    />
    <main class="workspace-main">
      <SettingsContainer compact hideSearch />
      <WidgetView v-if="widgets" :widgets="widgets" :title="widgetSection.name" :item-size="widgetSection.displayData?.itemSize" />
      <WebContent v-show="!widgets" :urls="frameUrls" :activeUrl="activeUrl" />
    </main>
  </div>
</template>

<script>
import SettingsContainer from '@/components/Settings/SettingsContainer.vue';
import HomeMixin from '@/mixins/HomeMixin';
import SideBar from '@/components/Workspace/SideBar';
import WebContent from '@/components/Workspace/WebContent';
import WidgetView from '@/components/Workspace/WidgetView';
import { sanitizeUrl } from '@/utils/Sanitizer';
import { sameUrl } from '@/utils/MiscHelpers';

export default {
  name: 'Workspace',
  mixins: [HomeMixin],
  components: {
    SettingsContainer,
    SideBar,
    WebContent,
    WidgetView,
  },
  data: () => ({
    openUrls: [], // Apps opened this session, most recent last
    widgets: null,
    widgetSection: {},
  }),
  computed: {
    /* The visible app is kept in the URL, so it can be linked to or reloaded */
    activeUrl() {
      return sanitizeUrl(this.$route.query.url) || '';
    },
    /* Apps to render, or all open apps when multi-tasking, to keep them running */
    frameUrls() {
      if (this.appConfig.enableMultiTasking) return this.openUrls;
      return this.activeUrl ? [this.activeUrl] : [];
    },
    /* The page's landing app, once its config has loaded */
    landingUrl() {
      const loadedPage = this.$store.state.currentConfigInfo?.confId || null;
      if (loadedPage !== (this.determineConfigFile() || null)) return null;
      return sanitizeUrl(this.appConfig.workspaceLandingUrl);
    },
  },
  watch: {
    activeUrl: {
      immediate: true,
      handler(url) {
        if (!url) return;
        this.widgets = null;
        if (!this.openUrls.includes(url)) this.openUrls.push(url);
      },
    },
    landingUrl: {
      immediate: true,
      handler(url) {
        if (url && !this.$route.query.url) this.launchApp(url);
      },
    },
    /* Widgets belong to the page they were opened on */
    '$route.path'() {
      this.widgets = null;
    },
  },
  methods: {
    /* Opens an app, reusing its open copy if a variant of the URL is already open */
    launchApp(url) {
      const appUrl = this.openUrls.find((openUrl) => sameUrl(openUrl, url)) || url;
      this.$router.replace({ query: appUrl ? { url: appUrl } : {} });
    },
    /* Shows a section's widgets in place of the current app */
    launchWidgets(widgets) {
      this.widgetSection = this.sections?.find(section => section.widgets === widgets) || {};
      this.widgets = widgets;
      this.$router.replace({ query: {} });
    },
    /* Closes an app, and switches to the last opened one if the visible app was closed */
    closeApp(url) {
      this.openUrls = this.openUrls.filter((openUrl) => openUrl !== url);
      const { activeUrl, openUrls } = this;
      if (activeUrl && !openUrls.includes(activeUrl)) this.launchApp(openUrls.at(-1));
    },
  },
  mounted() {
    this.initiateFontAwesome();
    this.initiateMaterialDesignIcons();
  },
};
</script>

<style scoped lang="scss">
@import '@/styles/media-queries.scss';

:global(#dashy.view-workspace) {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
}

/* Collapse the header when it's empty, or only holds the floating nav */
:global(#dashy.view-workspace > header:not(:has(> :not(.floating)))) {
  padding: 0;
}

.workspace-main { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; }

.work-space {
  flex: 1;
  display: flex;
  min-height: 0;
  @include phone {
    flex-direction: column;
  }
}
</style>
