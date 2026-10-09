<template>
  <div class="work-space">
    <SideBar
      :sections="sections"
      @launch-app="launchApp"
      @launch-widget="launchWidget"
      :initUrl="getInitialUrl()"
    />
    <main class="workspace-main">
      <div v-if="!url && !widgets" class="workspace-empty">
        <h2>工作台</h2><p>从左侧选择网站或小组件，在这里打开。</p>
        <p>网站设为“工作台内打开”后可嵌入当前窗口；设为“新标签页”时会按你的设置跳转。</p>
        <SettingsContainer compact hideSearch />
      </div>
      <WidgetView v-if="widgets" :widgets="widgets" />
      <WebContent v-else-if="url && !isMultiTaskingEnabled" :url="url" />
      <MultiTaskingWebComtent v-else-if="isMultiTaskingEnabled" :url="url || ''" />
    </main>
  </div>
</template>

<script>
import SettingsContainer from '@/components/Settings/SettingsContainer.vue';
import HomeMixin from '@/mixins/HomeMixin';
import SideBar from '@/components/Workspace/SideBar';
import WebContent from '@/components/Workspace/WebContent';
import WidgetView from '@/components/Workspace/WidgetView';
import MultiTaskingWebComtent from '@/components/Workspace/MultiTaskingWebComtent';
import Defaults from '@/utils/config/defaults';
import ErrorHandler from '@/utils/logging/ErrorHandler';
import { sanitizeUrl } from '@/utils/Sanitizer';

export default {
  name: 'Workspace',
  mixins: [HomeMixin],
  data: () => ({
    url: '',
    widgets: null,
  }),
  computed: {
    sections() {
      return this.$store.getters.sections;
    },
    appConfig() {
      return this.$store.getters.appConfig;
    },
    isMultiTaskingEnabled() {
      return this.appConfig.enableMultiTasking || false;
    },
  },
  components: {
    SettingsContainer,
    SideBar,
    WebContent,
    WidgetView,
    MultiTaskingWebComtent,
  },
  methods: {
    launchApp(options) {
      if (options.target === 'newtab') {
        window.open(options.url, '_blank', 'noopener,noreferrer');
      } else if (options.target === 'newwindow') {
        const { width, height } = window.screen;
        window.open(options.url, '_blank', `width=${width},height=${height},noopener,noreferrer`);
      } else if (options.target === 'clipboard') {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(options.url);
          this.$toast.success(this.$t('context-menus.item.copied-toast'));
        } else {
          ErrorHandler('Clipboard access requires HTTPS. See: https://bit.ly/3N5WuAA');
          this.$toast.error('Unable to copy, see log');
        }
        return;
      } else {
        this.url = options.url;
      }
      this.widgets = null;
    },
    launchWidget(widgets) {
      this.url = '';
      this.widgets = widgets;
    },
    initiateFontAwesome() {
      const fontAwesomeScript = document.createElement('script');
      const faKey = this.appConfig.fontAwesomeKey || Defaults.fontAwesomeKey;
      fontAwesomeScript.setAttribute('src', `https://kit.fontawesome.com/${faKey}.js`);
      document.head.appendChild(fontAwesomeScript);
    },
    /* Returns a service URL, if set as a URL param, or if user has specified landing URL */
    getInitialUrl() {
      const route = this.$route;
      if (route.query && route.query.url) {
        return sanitizeUrl(decodeURI(route.query.url)) || undefined;
      } else if (this.appConfig.workspaceLandingUrl) {
        return this.appConfig.workspaceLandingUrl;
      }
      return undefined;
    },
  },
  mounted() {
    HomeMixin.methods.initiateFontAwesome.call(this);
    this.initiateMaterialDesignIcons();
    this.url = this.getInitialUrl();
  },
};

</script>

<style scoped lang="scss">
.work-space { min-height: calc(100dvh - var(--header-height)); }
.workspace-main { margin-left: var(--side-bar-width); min-width: 0; position: relative; min-height: calc(100dvh - var(--header-height)); }
.workspace-empty { text-align: center; padding: clamp(1rem, 5vw, 3rem); color: var(--primary); }
.workspace-empty p { line-height: 1.6; }
.workspace-empty :deep(.portal-toolbar) { justify-content: center; }
.workspace-main :deep(.web-content iframe) { position: relative; left: auto; width: 100%; height: calc(100dvh - var(--header-height)); }
.workspace-main :deep(.workspace-widget-view) { position: relative; left: auto; width: 100%; height: auto; min-height: 0; padding: .75rem; box-sizing: border-box; }
</style>
