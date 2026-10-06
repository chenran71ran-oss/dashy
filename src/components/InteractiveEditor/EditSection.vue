<template>
  <modal :name="modalName" :resizable="false" width="min(640px, 94vw)" height="auto" classes="dashy-modal edit-section" @closed="modalClosed">
    <div class="portal-editor" v-if="allowViewConfig">
      <h3>{{ isAddNew ? '添加分类' : '编辑分类' }}</h3>
      <label>分类名称 <span class="required">*</span><input v-model="sectionData.name" aria-label="分类名称" placeholder="例如：常用工具、媒体与娱乐" maxlength="120" /></label>
      <IconPicker v-model="sectionData.icon" label="分类图标" />
      <details>
        <summary>布局选项</summary>
        <label>排序方式<select v-model="sectionData.displayData.sortBy" aria-label="排序方式"><option value="default">保持当前顺序</option><option value="alphabetical">按名称</option><option value="most-used">按使用频率</option></select></label>
        <label>每行卡片数<select v-model.number="sectionData.displayData.itemCountX" aria-label="每行卡片数"><option :value="0">自动适配屏幕</option><option v-for="n in 6" :key="n" :value="n">{{ n }}</option></select></label>
        <label class="check"><input type="checkbox" v-model="sectionData.displayData.collapsed" /> 默认折叠分类</label>
      </details>
      <p v-if="error" class="editor-error" role="alert">{{ error }}</p>
      <p class="editor-hint">分类保存后可继续添加网站，最后点击“保存到云端”。</p>
      <SaveCancelButtons :saveClick="saveSection" :cancelClick="closeModal" />
    </div><AccessError v-else />
  </modal>
</template>
<script>
import IconPicker from './IconPicker.vue';
import StoreKeys from '@/utils/StoreMutations';
import { modalNames } from '@/utils/config/defaults';
import safeClone from '@/utils/safeClone';
import { makePageName } from '@/utils/config/ConfigHelpers';
import SaveCancelButtons from './SaveCancelButtons';
import AccessError from '@/components/Configuration/AccessError';
export default {
  components: { SaveCancelButtons, AccessError, IconPicker },
  props: { sectionName: { type: String, default: '' }, isAddNew: Boolean }, emits: ['closeEditSection'],
  data: () => ({ modalName: modalNames.EDIT_SECTION, sectionData: {displayData:{}}, error: '' }),
  computed: { allowViewConfig() { return this.$store.getters.permissions.allowViewConfig; } },
  mounted() {
    this.sectionData = safeClone(this.isAddNew ? {} : this.$store.getters.getSectionByName(this.sectionName), {});
    this.sectionData.displayData = { sortBy: 'default', itemCountX: 0, ...this.sectionData.displayData };
    this.$modal.show(this.modalName);
  },
  methods: {
    closeModal() { this.$modal.hide(this.modalName); },
    modalClosed() { this.$store.commit(StoreKeys.SET_MODAL_OPEN, false); this.$emit('closeEditSection'); },
    saveSection() {
      this.error = '';
      const payload = safeClone(this.sectionData, {}); payload.name = (payload.name || '').trim();
      if (!payload.name) { this.error = '请填写分类名称。'; return; }
      const others = (this.$store.state.config.sections || []).filter(s => this.isAddNew || s.name !== this.sectionName);
      if (others.some(s => makePageName(s.name) === makePageName(payload.name))) { this.error = '这个分类名称已存在，请换一个名称。'; return; }
      if (!payload.displayData.itemCountX) delete payload.displayData.itemCountX;
      if (this.isAddNew) this.$store.commit(StoreKeys.INSERT_SECTION, payload);
      else { const live = this.$store.getters.getSectionByName(this.sectionName); payload.items = live?.items || []; this.$store.commit(StoreKeys.UPDATE_SECTION, { sectionName: this.sectionName, sectionData: payload }); }
      this.$store.commit(StoreKeys.SET_EDIT_MODE, true); this.closeModal();
    },
  },
};
</script>
<style lang="scss">@import '@/styles/portal-editor.scss';</style>
