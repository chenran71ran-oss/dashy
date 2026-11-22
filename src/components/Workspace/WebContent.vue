<template>
  <div class="web-content">
    <iframe
      v-for="url in urls"
      v-show="url === activeUrl"
      :key="url"
      :src="url"
      :title="url"
      allow="fullscreen; clipboard-write"
    />
    <div v-if="!activeUrl" class="empty-state">
      <IconWorkspace />
      <p>{{ $t('workspace.empty-state') }}</p>
    </div>
  </div>
</template>

<script>
import IconWorkspace from '@/assets/interface-icons/open-workspace.svg';

export default {
  name: 'WebContent',
  props: {
    urls: { type: Array, default: () => [] }, // Apps to keep mounted
    activeUrl: { type: String, default: '' }, // The app currently visible
  },
  components: {
    IconWorkspace,
  },
};
</script>

<style lang="scss" scoped>
.web-content {
  flex: 1;
  min-width: 0;
  background: var(--workspace-web-content-background);
  iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: none;
  }
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 1rem;
    box-sizing: border-box;
    color: var(--side-bar-color);
    opacity: var(--dimming-factor);
    text-align: center;
    svg { width: 3rem; height: 3rem; }
  }
}
</style>
