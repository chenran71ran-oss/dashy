<template>
  <modal :name="modalName" :resizable="true" width="min(640px, 94vw)" height="auto" classes="dashy-modal edit-section" @closed="modalClosed">
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
      <details><summary>原版高级布局与可见性（JSON）</summary>
        <label>displayData<textarea v-model="displayText" aria-label="分类高级布局 JSON" rows="6" spellcheck="false" /></label>
        <p class="editor-hint">支持 rows、cols、itemCountY、itemSize、color、customStyles 及隐藏／用户可见性选项。排序、每行数量和默认折叠以上方选择为准。</p>
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
  data: () => ({ modalName: modalNames.EDIT_SECTION, sectionData: {displayData:{}}, displayText: '{}', error: '' }),
  computed: { allowViewConfig() { return this.$store.getters.permissions.allowViewConfig; } },
  mounted() {
    this.sectionData = safeClone(this.isAddNew ? {} : this.$store.getters.getSectionByName(this.sectionName), {});
    this.sectionData.displayData = { sortBy: 'default', itemCountX: 0, ...this.sectionData.displayData };
    this.displayText = JSON.stringify(Object.fromEntries(Object.entries(this.sectionData.displayData).filter(([k]) => !['sortBy', 'itemCountX', 'collapsed'].includes(k))), null, 2);
    this.$modal.show(this.modalName);
  },
  methods: {
    closeModal() { this.$modal.hide(this.modalName); },
    modalClosed() { this.$store.commit(StoreKeys.SET_MODAL_OPEN, false); this.$emit('closeEditSection'); },
    saveSection() {
      this.error = '';
      const payload = safeClone(this.sectionData, {}); payload.name = (payload.name || '').trim();
      try {
        const advanced = JSON.parse(this.displayText);
        if (!advanced || Array.isArray(advanced) || typeof advanced !== 'object') throw new Error();
        const { sortBy, itemCountX, collapsed } = payload.displayData;
        payload.displayData = { ...advanced, sortBy, itemCountX, ...(collapsed === undefined ? {} : { collapsed }) };
      } catch { this.error = '高级布局需要有效的 JSON 对象。'; return; }
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
