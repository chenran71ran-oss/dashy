<template>
  <div>
    <span class="options-label">{{ $t('settings.layout-label') }}</span>
    <div class="display-options">
      <IconDeafault
        @click="updateDisplayLayout('auto')" @keydown.enter="updateDisplayLayout('auto')" @keydown.space.prevent="updateDisplayLayout('auto')" role="button" aria-hidden="false"
        :aria-label="$t('settings.layout-auto')" v-tooltip="tooltip($t('settings.layout-auto'))"
        :class="`layout-icon ${layout === 'auto' ? 'selected' : ''}`"
        tabindex="0"
      />
      <IconHorizontal
        @click="updateDisplayLayout('horizontal')" @keydown.enter="updateDisplayLayout('horizontal')" @keydown.space.prevent="updateDisplayLayout('horizontal')" role="button" aria-hidden="false"
        :aria-label="$t('settings.layout-horizontal')" v-tooltip="tooltip($t('settings.layout-horizontal'))"
        :class="`layout-icon ${layout === 'horizontal' ? 'selected' : ''}`"
        tabindex="0"
      />
      <IconVertical
        @click="updateDisplayLayout('vertical')" @keydown.enter="updateDisplayLayout('vertical')" @keydown.space.prevent="updateDisplayLayout('vertical')" role="button" aria-hidden="false"
        :aria-label="$t('settings.layout-vertical')" v-tooltip="tooltip($t('settings.layout-vertical'))"
        :class="`layout-icon ${layout === 'vertical' ? 'selected' : ''}`"
        tabindex="0"
      />
      <IconMasonry
        @click="updateDisplayLayout('masonry')" @keydown.enter="updateDisplayLayout('masonry')" @keydown.space.prevent="updateDisplayLayout('masonry')" role="button" aria-hidden="false"
        :aria-label="$t('settings.layout-masonry')" v-tooltip="tooltip($t('settings.layout-masonry'))"
        :class="`layout-icon ${layout === 'masonry' ? 'selected' : ''}`"
        tabindex="0"
      />
    </div>
  </div>
</template>

<script>
import StoreKeys from '@/utils/StoreMutations';
import IconDeafault from '@/assets/interface-icons/layout-default.svg';
import IconHorizontal from '@/assets/interface-icons/layout-horizontal.svg';
import IconVertical from '@/assets/interface-icons/layout-vertical.svg';
import IconMasonry from '@/assets/interface-icons/layout-masonry.svg';

export default {
  name: 'LayoutSelector',
  components: {
    IconDeafault,
    IconHorizontal,
    IconVertical,
    IconMasonry,
  },
  computed: {
    layout() {
      return this.$store.getters.layout;
    },
  },
  methods: {
    updateDisplayLayout(layout) {
      this.$store.commit(StoreKeys.SET_ITEM_LAYOUT, layout);
    },
    tooltip(content) {
      return { content };
    },
  },
};
</script>

