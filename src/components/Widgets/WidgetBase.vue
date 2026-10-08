<template>
  <div
    :class="['widget-base', `widget-${widgetType}`, {
      'is-loading': loading,
      'metric-widget': ['clock', 'weather'].includes(widgetType),
      'has-widget-label': !!widgetOptions.label,
      'has-widget-actions': visibleControlCount > 0,
    }]"
    :style="{ '--widget-action-count': visibleControlCount }"
  >
    <!-- Keep widget controls together, inside the frame. -->
    <div class="widget-actions" v-if="visibleControlCount > 0">
      <Button :click="update" :disabled="loading" :aria-busy="loading" class="action-btn update-btn" aria-label="刷新小组件" tooltip="刷新小组件" v-if="supported && !hideControls">
        <UpdateIcon />
      </Button>
      <Button :click="emitEdit" class="action-btn edit-btn" aria-label="编辑小组件" tooltip="编辑小组件" v-if="isEditMode">
        <EditIcon />
      </Button>
      <Button :click="emitRemove" class="action-btn remove-btn" aria-label="删除小组件" tooltip="删除小组件" v-if="isEditMode">
        <BinIcon />
      </Button>
    </div>
    <!-- Loading Spinner -->
    <div v-if="loading" class="loading">
      <LoadingAnimation v-if="loading" class="loader" />
    </div>
    <!-- Error Message Display -->
    <div v-if="error" class="widget-error">
      <p class="error-msg">小组件未能加载，请检查地址或配置。</p>
      <p class="error-output">{{ errorMsg }}</p>
      <button type="button" class="retry-link" @click="update">重试</button>
    </div>
    <!-- Widget Label -->
    <div class="widget-label" v-if="widgetOptions.label">{{ widgetOptions.label }}</div>
    <!-- Widget -->
    <div :class="`widget-wrap ${ error ? 'has-error' : '' }`">
      <p v-if="!supported" class="widget-deferred">{{ widgetType }}：源码与配置已保留，当前 CF 版尚未接入所需数据服务。</p>
      <component v-else
        v-bind:is="component"
        :options="widgetOptions"
        @loading="setLoaderState"
        @error="handleError"
        :ref="widgetRef"
      />
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import { CLOUD_CAPABILITIES } from '../../../cloud/capabilities.mjs';
// Import form elements, icons and utils
import ErrorHandler from '@/utils/logging/ErrorHandler';
import Button from '@/components/FormElements/Button';
import UpdateIcon from '@/assets/interface-icons/widget-update.svg';
import EditIcon from '@/assets/interface-icons/config-edit-json.svg';
import BinIcon from '@/assets/interface-icons/interactive-editor-remove.svg';
import LoadingAnimation from '@/assets/interface-icons/loader.svg';

const widgetModules = import.meta.glob('./*.vue');

const COMPAT = {
  'adguard-dns-info': 'AdGuardDnsInfo',
  'adguard-filter-status': 'AdGuardFilterStatus',
  'adguard-stats': 'AdGuardStats',
  'adguard-top-domains': 'AdGuardTopDomains',
  addy: 'AnonAddy',
  anonaddy: 'AnonAddy',
  apod: 'Apod',
  'blacklist-check': 'BlacklistCheck',
  calendar: 'Calendar',
  chucknorris: 'ChuckNorris',
  clock: 'Clock',
  'code-stats': 'CodeStats',
  'covid-stats': 'CovidStats',
  'crypto-price-chart': 'CryptoPriceChart',
  'crypto-watch-list': 'CryptoWatchList',
  'custom-search': 'CustomSearch',
  'custom-list': 'CustomList',
  customapi: 'CustomApi',
  'custom-api': 'CustomApi',
  'cve-vulnerabilities': 'CveVulnerabilities',
  'domain-monitor': 'DomainMonitor',
  'drone-ci': 'DroneCi',
  embed: 'EmbedWidget',
  'eth-gas-prices': 'EthGasPrices',
  'exchange-rates': 'ExchangeRates',
  filebrowser: 'Filebrowser',
  'flight-data': 'Flights',
  'github-profile-stats': 'GitHubProfile',
  'github-trending-repos': 'GitHubTrending',
  'gl-alerts': 'GlAlerts',
  'gl-current-cores': 'GlCpuCores',
  'gl-current-cpu': 'GlCpuGauge',
  'gl-cpu-speedometer': 'GlCpuSpeedometer',
  'gl-cpu-history': 'GlCpuHistory',
  'gl-disk-io': 'GlDiskIo',
  'gl-disk-space': 'GlDiskSpace',
  'gl-ip-address': 'GlIpAddress',
  'gl-load-history': 'GlLoadHistory',
  'gl-current-mem': 'GlMemGauge',
  'gl-mem-speedometer': 'GlMemSpeedometer',
  'gl-mem-history': 'GlMemHistory',
  'gl-network-interfaces': 'GlNetworkInterfaces',
  'gl-network-traffic': 'GlNetworkTraffic',
  'gl-system-load': 'GlSystemLoad',
  'gl-uptime': 'GlancesUptime',
  'gl-cpu-temp': 'GlCpuTemp',
  'gl-gpu': 'GlGpu',
  'gluetun-status': 'GluetunStatus',
  'health-checks': 'HealthChecks',
  'hackernews-trending': 'HackernewsTrending',
  iframe: 'IframeWidget',
  image: 'ImageWidget',
  joke: 'Jokes',
  linkding: 'Linkding',
  'live-tennis': 'LiveTennis',
  'minecraft-status': 'MinecraftStatus',
  'mullvad-status': 'MullvadStatus',
  mvg: 'Mvg',
  'mvg-connection': 'MvgConnection',
  'nd-cpu-history': 'NdCpuHistory',
  'nd-load-history': 'NdLoadHistory',
  'nd-ram-history': 'NdRamHistory',
  'news-headlines': 'NewsHeadlines',
  'nextcloud-notifications': 'NextcloudNotifications',
  'nextcloud-php-opcache': 'NextcloudPhpOpcache',
  'nextcloud-stats': 'NextcloudStats',
  'nextcloud-system': 'NextcloudSystem',
  'nextcloud-user': 'NextcloudUser',
  'nextcloud-user-status': 'NextcloudUserStatus',
  'ntfy-stream': 'NtfyStream',
  'pi-hole-stats': 'PiHoleStats',
  'pi-hole-stats-v6': 'PiHoleStatsV6',
  'pi-hole-top-queries': 'PiHoleTopQueries',
  'pi-hole-top-queries-v6': 'PiHoleTopQueriesV6',
  'pi-hole-traffic': 'PiHoleTraffic',
  'pi-hole-traffic-v6': 'PiHoleTrafficV6',
  'proxmox-lists': 'Proxmox',
  'public-holidays': 'PublicHolidays',
  'public-ip': 'PublicIp',
  'rescue-time': 'RescueTime',
  'rss-feed': 'RssFeed',
  sabnzbd: 'Sabnzbd',
  'sports-scores': 'SportsScores',
  'stat-ping': 'StatPing',
  'stock-price-chart': 'StockPriceChart',
  'synology-download': 'SynologyDownload',
  'system-info': 'SystemInfo',
  'tfl-status': 'TflStatus',
  trmm: 'TacticalRMM',
  'uptime-kuma': 'UptimeKuma',
  'uptime-kuma-status-page': 'UptimeKumaStatusPage',
  'wallet-balance': 'WalletBalance',
  weather: 'Weather',
  'weather-forecast': 'WeatherForecast',
  'xkcd-comic': 'XkcdComic',
  'gl-compact-metrics': 'GlCompactMetrics',
};

export default {
  name: 'Widget',
  components: {
    // Register form elements
    Button,
    UpdateIcon,
    EditIcon,
    BinIcon,
    LoadingAnimation,
  },
  props: {
    widget: { type: Object, required: true },
    index: { type: Number, required: true },
  },
  emits: ['editWidget', 'removeWidget'],
  data: () => ({
    loading: false,
    error: false,
    errorMsg: null,
  }),
  computed: {
    supported() { return CLOUD_CAPABILITIES.widgets.includes(this.widgetType); },
    appConfig() {
      return this.$store.getters.appConfig;
    },
    isEditMode() {
      return this.$store.state.editMode;
    },
    /* Returns the widget type, shows error if not specified */
    widgetType() {
      if (!this.widget.type) {
        ErrorHandler('Missing type attribute for widget');
        return null;
      }
      return this.widget.type.toLowerCase();
    },
    /* Returns users specified widget options, or empty object */
    widgetOptions() {
      const options = this.widget.options || {};
      const timeout = this.widget.timeout || null;
      const ignoreErrors = this.widget.ignoreErrors || false;
      const label = this.widget.label || null;
      const useProxy = this.appConfig.widgetsAlwaysUseProxy || !!this.widget.useProxy;
      const allowInsecure = !!this.widget.allowInsecure;
      const updateInterval = this.widget.updateInterval !== undefined
        ? this.widget.updateInterval : null;
      return {
        timeout, ignoreErrors, label, useProxy, allowInsecure, updateInterval, ...options,
      };
    },
    /* A unique string to reference the widget by */
    widgetRef() {
      return `widget-${this.widgetType}-${this.index}`;
    },
    hideControls() {
      return this.widget.hideControls;
    },
    visibleControlCount() {
      return (this.supported && !this.hideControls ? 1 : 0) + (this.isEditMode ? 2 : 0);
    },
    component() {
      if (!this.supported) return null;
      const type = COMPAT[this.widgetType] || this.widget.type;
      if (!type) {
        ErrorHandler('Widget type was not found');
        return null;
      }
      const path = `./${type}.vue`;
      const loader = widgetModules[path];
      if (!loader) {
        ErrorHandler(`Widget component not found: ${type}`);
        return defineAsyncComponent(() => import('./Blank.vue'));
      }
      return defineAsyncComponent(() => loader().catch(() => import('./Blank.vue')));
    },
  },
  methods: {
    /* Calls update data method on widget */
    update() {
      this.error = false;
      this.$refs[this.widgetRef]?.update();
    },
    /* Shows message when error occurred */
    handleError(msg) {
      this.error = true;
      this.errorMsg = msg;
    },
    /* Toggles loading state */
    setLoaderState(loading) {
      this.loading = loading;
    },
    emitEdit() { this.$emit('editWidget'); },
    emitRemove() { this.$emit('removeWidget'); },
  },
};
</script>

<style scoped lang="scss">
@import "@/styles/media-queries.scss";

.widget-base {
  --widget-action-size: 1.75rem;
  --widget-controls-space: calc(var(--widget-action-count, 0) * (var(--widget-action-size) + .25rem));
  --widget-controls-row: 0px;
  box-sizing: border-box;
  min-width: 0;
  overflow-wrap: anywhere;
  position: relative;
  padding: .5rem .75rem;
  background: var(--widget-base-background);
  box-shadow: var(--widget-base-shadow, none);
  .widget-deferred { color: var(--widget-text-color); font-size: 0.85rem; line-height: 1.7; }

  &.has-widget-actions {
    --widget-controls-row: var(--widget-action-size);
    &:not(.has-widget-label):not(.widget-clock) {
      padding-top: calc(var(--widget-action-size) + .75rem);
    }
  }
  &.has-widget-label .widget-wrap {
    --widget-controls-space: 0px;
    --widget-controls-row: 0px;
  }

  // Shared value sizing, with content-driven height instead of an empty fixed frame.
  &.metric-widget {
    --metric-value-size: clamp(2rem, 7vw, 2.8rem);
    --metric-value-height: 3.25rem;
    min-height: 0;
    align-self: start;
    padding: .5rem .75rem;
    .widget-wrap { min-width: 0; padding: 0; }
  }

  .widget-actions {
    position: absolute;
    top: .5rem;
    right: .5rem;
    display: flex;
    align-items: center;
    gap: .25rem;
    z-index: 1;
  }
  .widget-actions button.action-btn {
    box-sizing: border-box;
    height: var(--widget-action-size);
    min-width: auto;
    width: var(--widget-action-size);
    margin: 0;
    padding: .375rem;
    position: static;
    border: none;
    opacity: var(--dimming-factor);
    color: var(--widget-text-color);
    background: var(--widget-accent-color);
    svg { width: 1rem; height: 1rem; flex-shrink: 0; }

    &:hover:not(:disabled) {
      opacity: 1;
      color: var(--widget-text-color);
      background: var(--widget-accent-color);
    }
    &:focus-visible { outline: 2px solid currentColor; outline-offset: -2px; }
  }

  // Optional widget label
  .widget-label {
    color: var(--widget-text-color);
    box-sizing: border-box;
    display: flex;
    align-items: center;
    min-height: var(--widget-action-size);
    padding: .125rem calc(var(--widget-controls-space) + .5rem) .125rem .5rem;
    font-size: .85rem;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  @include phone {
    --widget-action-size: 2rem;
    padding: .375rem .5rem;
    .widget-actions { top: .375rem; right: .375rem; }
    &.metric-widget {
      --metric-value-height: 3rem;
      padding: .375rem .5rem;
    }
  }

  // Actual widget container
  .widget-wrap {
    &.has-error {
      cursor: not-allowed;
      opacity: 0.5;
      border-radius: var(--curve-factor);
      background: #ffff0040;

      &:hover { background: none; }
    }
  }

  // Error message output
  .widget-error {
    p.error-msg {
      color: var(--warning);
      font-weight: bold;
      font-size: 1rem;
      margin: 0 auto 0.5rem auto;
    }

    p.error-output {
      font-family: var(--font-monospace);
      color: var(--widget-text-color);
      font-size: 0.85rem;
      margin: 0.5rem auto;
    }

    p.retry-link {
      cursor: pointer;
      text-decoration: underline;
      color: var(--widget-text-color);
      font-size: 0.85rem;
      margin: 0;
    }
  }

  // Loading spinner
  .loading {
    margin: 0.2rem auto;
    text-align: center;

    svg.loader {
      width: 100px;
    }
  }

  // Hide widget contents while loading
  &.is-loading {
    .widget-wrap {
      display: none;
    }
  }
}
</style>
