<template>
  <router-link to="/" class="page-titles" :disabled="isEditMode">
    <!-- Optional page logo image -->
    <MechLogo v-if="!logo || /kenneth-mech|\/mech\//.test(logo)" class="site-logo" :alt="`${title} 标识`" syncFavicon />
    <img v-else-if="logo" :src="logo" class="site-logo" :alt="`${title} 标识`" />
    <!-- Page heading and sub-heading -->
    <div class="text">
      <h1>{{ title }}</h1>
    </div>
    <EditModeIcon v-if="isEditMode" @click.stop.prevent="editTitle()"
      class="edit-icon" v-tooltip="tooltip()" />
  </router-link>
</template>

<script>
import MechLogo from './MechLogo.vue';
import EditModeIcon from '@/assets/interface-icons/interactive-editor-edit-mode.svg';
import StoreKeys from '@/utils/StoreMutations';
import { modalNames } from '@/utils/config/defaults';

export default {
  name: 'PageTitle',
  props: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    logo: { type: String, default: '' },
  },
  components: {
    EditModeIcon,
    MechLogo,
  },
  computed: {
    isEditMode() {
      return this.$store.state.editMode;
    },
  },
  methods: {
    /* On edit button click, open the edit pageInfo modal */
    editTitle() {
      this.$modal.show(modalNames.EDIT_PAGE_INFO);
      this.$store.commit(StoreKeys.SET_MODAL_OPEN, true);
    },
    /* Edit button tooltip */
    tooltip() {
      const content = this.$t('interactive-editor.menu.edit-page-info-btn');
      return { content };
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/styles/media-queries.scss';

.page-titles {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  flex: 1 1 auto;
  text-decoration: none;
  position: relative;
  .text { min-width: 0; }
  .text h1 {
    text-transform: none;
    color: var(--heading-text-color);
    font-size: clamp(1.4rem, 0.5rem + 3vw, 2.5rem);
    overflow-wrap: anywhere;
    line-height: 1.15;
    margin: 0;
  }
  .site-logo {
    margin: 0;
    width: clamp(2.6rem, 4vw, 3.4rem);
    height: clamp(2.6rem, 4vw, 3.4rem);
    flex-shrink: 0;
    image-rendering: pixelated;
  }
  @include phone {
    flex-direction: row;
    text-align: left;
    padding: 0.25rem 0;
  }
  &[disabled] {
    cursor: default;
  }
  svg.edit-icon {
    width: 1rem;
    height: 1rem;
    right: 1rem;
    top: 0.5rem;
    padding: 0.25rem;
    margin: 0.25rem;
    cursor: pointer;
    color: var(--primary);
    border: 1px solid var(--background-darker);
    border-radius: var(--curve-factor);
    &:hover { border: 1px solid var(--primary); }
  }
}
</style>
