<template>
  <div>
    <span class="options-label">{{ $t('settings.item-size-label') }}</span>
    <div class="display-options">
      <IconSmall
        @click="updateIconSize('small')" @keydown.enter="updateIconSize('small')" @keydown.space.prevent="updateIconSize('small')" role="button"
        :aria-label="$t('settings.item-size-small')" v-tooltip="tooltip($t('settings.item-size-small'))"
        :class="`layout-icon ${iconSize === 'small' ? 'selected' : ''}`"
        tabindex="0"
      />
      <IconMedium
        @click="updateIconSize('medium')" @keydown.enter="updateIconSize('medium')" @keydown.space.prevent="updateIconSize('medium')" role="button"
        :aria-label="$t('settings.item-size-medium')" v-tooltip="tooltip($t('settings.item-size-medium'))"
        :class="`layout-icon ${iconSize === 'medium' ? 'selected' : ''}`"
        tabindex="0"
      />
      <IconLarge
        @click="updateIconSize('large')" @keydown.enter="updateIconSize('large')" @keydown.space.prevent="updateIconSize('large')" role="button"
        :aria-label="$t('settings.item-size-large')" v-tooltip="tooltip($t('settings.item-size-large'))"
        :class="`layout-icon ${iconSize === 'large' ? 'selected' : ''}`"
        tabindex="0"
      />
    </div>
  </div>
</template>

<script>
import StoreKeys from '@/utils/StoreMutations';
import IconSmall from '@/assets/interface-icons/icon-size-small.svg';
import IconMedium from '@/assets/interface-icons/icon-size-medium.svg';
import IconLarge from '@/assets/interface-icons/icon-size-large.svg';

export default {
  name: 'ItemSizeSelector',
  computed: {
    iconSize() {
      return this.$store.getters.iconSize;
    },
  },
  components: {
    IconSmall,
    IconMedium,
    IconLarge,
  },
  methods: {
    updateIconSize(iconSize) {
      this.$store.commit(StoreKeys.SET_ITEM_SIZE, iconSize);
    },
    tooltip(content) {
      return { content };
    },
  },
};
</script>

