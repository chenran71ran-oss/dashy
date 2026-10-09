<template>
  <div
    :class="['widget-base', `widget-${widgetType}`, {
      'is-loading': loading,
      'metric-widget': ['clock', 'weather'].includes(widgetType),
      'has-widget-label': !!widgetOptions.label,
      'has-widget-actions': visibleControlCount > 0,
    }]"
    :style="{ '--widget-action-count': visibleControlCount }"
    :data-widget-size="widgetSize"
    :data-widget-layout="widgetLayout"
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
      <p v-if="!supported" class="widget-deferred">未知小组件类型：{{ widgetType }}。请检查类型名称或选择内置组件。</p>
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
import { WIDGET_COMPONENTS as COMPAT } from '@/utils/WidgetCatalog';
// Import form elements, icons and utils
import ErrorHandler from '@/utils/logging/ErrorHandler';
import Button from '@/components/FormElements/Button';
import UpdateIcon from '@/assets/interface-icons/widget-update.svg';
import EditIcon from '@/assets/interface-icons/config-edit-json.svg';
import BinIcon from '@/assets/interface-icons/interactive-editor-remove.svg';
import LoadingAnimation from '@/assets/interface-icons/loader.svg';

const widgetModules = import.meta.glob('./*.vue');



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
    itemSize: { type: String, default: '' },
  },
  emits: ['editWidget', 'removeWidget'],
  data: () => ({
    loading: false,
    error: false,
    errorMsg: null,
  }),
  computed: {
    supported() { return !!widgetModules[`./${COMPAT[this.widgetType] || this.widget.type}.vue`]; },
    appConfig() {
      return this.$store.getters.appConfig;
    },
    widgetSize() {
      const size = this.itemSize || this.$store.getters.iconSize;
      return ['small', 'medium', 'large'].includes(size) ? size : 'medium';
    },
    widgetLayout() {
      const layout = this.$store.getters.layout;
      return ['auto', 'horizontal', 'vertical', 'masonry'].includes(layout) ? layout : 'auto';
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
  background: var(--widget-base-background);
  box-shadow: var(--widget-base-shadow, none);
  border-radius: var(--curve-factor);
}

// Keep theme colors and decoration, while one frame controls geometry for every theme.
.widget-base[data-widget-size] {
  --widget-action-size: 1.75rem;
  --widget-pad-block: .5rem;
  --widget-pad-inline: .75rem;
  --widget-heading-size: .85rem;
  --widget-meta-size: .65rem;
  --widget-detail-size: .85rem;
  --widget-value-min: 1.85rem;
  --widget-value-max: 2.8rem;
  --widget-value-scale: 11;
  --metric-value-size: var(--widget-value-max);
  --metric-value-height: calc(var(--metric-value-size) + .5rem);
  --metric-gap: .75rem;
  --metric-body-columns: minmax(0, 1fr);
  --metric-body-gap: .25rem;
  --metric-meta-align: center;
  --metric-meta-justify: center;
  --widget-controls-space: calc(var(--widget-action-count, 0) * (var(--widget-action-size) + .25rem));
  --widget-controls-row: 0px;
  container: widget-frame / inline-size;
  box-sizing: border-box;
  min-width: 0;
  min-height: 0;
  width: 100%;
  overflow-wrap: anywhere;
  position: relative;
  padding: var(--widget-pad-block) var(--widget-pad-inline);
  color: var(--widget-text-color, var(--foreground));
  .widget-deferred { color: var(--widget-text-color); font-size: 0.85rem; line-height: 1.7; }

  &[data-widget-size='small'] {
    --widget-pad-block: .375rem;
    --widget-pad-inline: .5rem;
    --widget-heading-size: .8rem;
    --widget-detail-size: .8rem;
    --widget-value-min: 1.5rem;
    --widget-value-max: 2rem;
    --widget-value-scale: 9;
    --metric-gap: .5rem;
  }
  &[data-widget-size='large'] {
    --widget-pad-block: .65rem;
    --widget-pad-inline: .85rem;
    --widget-action-size: 2rem;
    --widget-heading-size: .95rem;
    --widget-meta-size: .75rem;
    --widget-detail-size: .95rem;
    --widget-value-min: 2.1rem;
    --widget-value-max: 3.4rem;
    --widget-value-scale: 13;
    --metric-gap: 1rem;
  }
  @supports (font-size: 1cqi) {
    --metric-value-size: clamp(var(--widget-value-min), calc(var(--widget-value-scale) * 1cqi), var(--widget-value-max));
  }

  &.has-widget-actions {
    --widget-controls-row: var(--widget-action-size);
    &:not(.has-widget-label):not(.widget-clock) {
      padding-top: calc(var(--widget-action-size) + var(--widget-pad-block) + .25rem);
    }
  }
  &.has-widget-label .widget-wrap {
    --widget-controls-space: 0px;
    --widget-controls-row: 0px;
  }

  // Shared value sizing, with content-driven height instead of an empty fixed frame.
  &.metric-widget {
    align-self: start;
    --widget-heading-size: .9rem;
    --widget-meta-size: .8rem;
    &[data-widget-size='small'] { --widget-heading-size: .85rem; --widget-meta-size: .75rem; }
    &[data-widget-size='large'] { --widget-heading-size: 1rem; --widget-meta-size: .85rem; }
    .widget-label { padding: .125rem var(--widget-controls-space) .125rem 0; }
    :deep(.metric-body) {
      display: grid;
      grid-template-columns: var(--metric-body-columns);
      gap: var(--metric-body-gap);
      align-items: center;
      width: var(--metric-body-width, 100%);
      max-width: min(40rem, 100%);
      min-width: 0;
      margin-inline: auto;
    }
    :deep(.metric-value), :deep(.metric-meta) { min-width: 0; max-width: 100%; }
    :deep(.metric-value:only-child) { grid-column: 1 / -1; }
    :deep(.metric-meta) { text-align: var(--metric-meta-align); overflow-wrap: anywhere; }
  }

  .widget-actions {
    position: absolute;
    top: var(--widget-pad-block);
    right: var(--widget-pad-inline);
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
    opacity: .85;
    color: inherit;
    background: transparent;
    border-radius: var(--curve-factor-small, var(--curve-factor));
    svg { width: 1rem; height: 1rem; flex-shrink: 0; }

    &:hover:not(:disabled) {
      opacity: 1;
      color: inherit;
      background: color-mix(in srgb, currentColor 10%, transparent);
    }
    &:focus-visible { outline: 2px solid currentColor; outline-offset: -2px; }
  }

  // Optional widget label
  .widget-label {
    color: inherit;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    min-height: var(--widget-action-size);
    padding: .125rem calc(var(--widget-controls-space) + .5rem) .125rem .5rem;
    font-size: var(--widget-heading-size);
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  @include phone {
    --widget-action-size: 2rem;
    --widget-pad-block: .375rem;
    --widget-pad-inline: .5rem;
    &[data-widget-size='large'] { --widget-pad-block: .5rem; --widget-pad-inline: .65rem; }
  }

  // A narrow desktop column needs the same protection as a narrow phone card.
  @container widget-frame (max-width: 18rem) {
    .widget-wrap {
      --metric-value-size: clamp(1.35rem, calc(var(--widget-value-scale) * 1cqi), min(var(--widget-value-max), 2.2rem));
      --metric-gap: .5rem;
    }
  }

  // Wide small/medium widgets use a value + information row, rather than
  // scattering a small reading and its metadata across a full-width section.
  @container widget-frame (min-width: 28rem) {
    &[data-widget-size='small'] .widget-wrap {
      --metric-body-columns: max-content minmax(0, 1fr);
      --metric-body-width: fit-content;
      --metric-body-gap: 1rem;
      --metric-meta-align: left;
      --metric-meta-justify: flex-start;
    }
  }
  @container widget-frame (min-width: 40rem) {
    &[data-widget-size='medium'] .widget-wrap {
      --metric-body-columns: max-content minmax(0, 1fr);
      --metric-body-width: fit-content;
      --metric-body-gap: 1.25rem;
      --metric-meta-align: left;
      --metric-meta-justify: flex-start;
    }
  }

  // Actual widget container
  .widget-wrap {
    min-width: 0;
    padding: 0;
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

// This theme explicitly supplies a light widget surface and dark widget text.
:global(html[data-theme='brutalist'] .widget-base[data-widget-size]) {
  background: var(--widget-background-color);
  border: 2px solid var(--widget-text-color);
}
</style>
