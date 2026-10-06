<template>
  <div class="sub-items-group" :style="`--sub-item-col-count: ${columnCount}`">
    <p v-if="title" class="sub-item-group-title">{{ title }} <button v-if="$store.state.editMode" type="button" class="cloud-edit-group" @click="editing = true">编辑小分类</button></p>
    <EditItem v-if="editing" :itemId="itemId" @closeEditMenu="editing = false" />
    <SubItem
      v-for="(subItem, subIndex) in subItems"
      :key="subIndex"
      :id="`${itemId}-sub-${subIndex}`"
      :item="subItem"
      @triggerModal="triggerModal"
    />
  </div>
</template>

<script>
import EditItem from '@/components/InteractiveEditor/EditItem.vue';
import SubItem from '@/components/LinkItems/SubItem.vue';

export default {
  data: () => ({ editing: false }),
  props: {
    itemId: { type: String, required: true },
    subItems: { type: Array, required: true },
    title: { type: String, default: '' },
    subItemGridSize: { type: Number, default: 0 },
  },
  emits: ['triggerModal'],
  components: {
    SubItem,
    EditItem,
  },
  computed: {
    /* Determine number of columns to split items into, depending on number of items */
    columnCount() {
      if (this.subItemGridSize) return this.subItemGridSize;
      const numItems = this.subItems.length;
      if (numItems >= 10) return 4;
      if (numItems >= 5) return 3;
      if (numItems >= 2) return 2;
      if (numItems === 1) return 1;
      return 2;
    },
  },
  methods: {
    /* Pass open modal emit event up */
    triggerModal(url) {
      this.$emit('triggerModal', url);
    },
  },
};
</script>

<style scoped lang="scss">
.cloud-edit-group { cursor:pointer; background:transparent; border:1px solid var(--primary); color:var(--primary); border-radius:3px; font-size:12px; padding:3px 6px; }
.sub-items-group {
  display: grid;
  margin: 0.25rem;
  padding: 0.1rem;
  flex-grow: 1;
  flex-basis: 6rem;
  grid-template-columns: repeat(var(--sub-item-col-count, 3), minmax(0, 1fr));
  color: var(--item-text-color);
  border: 1px solid var(--outline-color);
  border-radius: var(--curve-factor);
  text-decoration: none;
  transition: all 0.2s ease-in-out 0s;
  p.sub-item-group-title {
    margin: 0 auto;
    cursor: default;
    grid-column-start: span var(--sub-item-col-count, 3);
  }
}
</style>
