<template>
  <div class="work-space" :class="{ 'showing-landing': !url && !widgets }">
    <SideBar
      :sections="sections"
      @launch-app="launchApp"
      @launch-widget="launchWidget"
      :initUrl="getInitialUrl()"
    />
    <Minimal v-if="!url && !widgets" class="workspace-landing" />
    <WebContent :url="url" v-else-if="!isMultiTaskingEnabled" />
    <MultiTaskingWebComtent :url="url" v-else />
    <WidgetView :widgets="widgets" v-if="widgets" />
  </div>
</template>

<script>
import Minimal from './Minimal.vue';
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
    Minimal,
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
.workspace-landing { margin-left: var(--side-bar-width); }
@media(max-width:600px) {
  .workspace-landing { margin-left: 0; }
  .showing-landing :deep(.side-bar) { display: none; }
}
.work-space {
  min-height: fit-content;
}
</style>
