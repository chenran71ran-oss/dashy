<template>
  <modal :name="modalName" :resizable="false" width="min(680px, 94vw)" height="auto" classes="dashy-modal edit-item" @closed="modalClosed">
    <div class="portal-editor" v-if="allowViewConfig">
      <h3>{{ isNew ? '添加入口' : '编辑入口' }}</h3>
      <div class="entry-kind" aria-label="入口类型">
        <button type="button" :class="{active: kind === 'link'}" @click="kind = 'link'">网站</button>
        <button type="button" :class="{active: kind === 'group'}" @click="kind = 'group'">小分类</button>
      </div>
      <label>名称 <span class="required">*</span><input v-model="draft.title" aria-label="名称" placeholder="网站或小分类名称" maxlength="120" /></label>
      <label v-if="kind === 'link'">网址 <span class="required">*</span><input v-model="draft.url" type="url" aria-label="网址" placeholder="https://example.com" /></label>
      <IconPicker v-model="draft.icon" />
      <label>说明<input v-model="draft.description" aria-label="说明" placeholder="可选，鼠标悬停时显示" /></label>
      <label v-if="kind === 'link'">打开方式<select v-model="draft.target" aria-label="打开方式"><option value="newtab">新标签页</option><option value="sametab">当前标签页</option></select></label>
      <SubItemsEditor v-if="kind === 'group'" v-model="draft.subItems" />
      <details><summary>更多选项</summary>
        <label>搜索标签<input v-model="tags" aria-label="搜索标签" placeholder="多个标签用逗号分隔" /></label>
        <label class="check"><input type="checkbox" v-model="hidden" /> 首页隐藏（搜索与编辑时可见）</label>
      </details>
      <p class="editor-error" role="alert" v-if="error">{{ error }}</p>
      <p class="editor-hint">此处保存后可预览，最后点击“保存到云端”同步到其他设备。</p>
      <SaveCancelButtons :saveClick="saveItem" :cancelClick="closeModal" />
    </div>
    <AccessError v-else />
  </modal>
</template>
<script>
import IconPicker from './IconPicker.vue';
import SubItemsEditor from './SubItemsEditor.vue';
import SaveCancelButtons from './SaveCancelButtons';
import AccessError from '@/components/Configuration/AccessError';
import StoreKeys from '@/utils/StoreMutations';
import { modalNames } from '@/utils/config/defaults';
import safeClone from '@/utils/safeClone';
const validUrl = (value) => { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password; } catch { return false; } };
export default {
  components: { IconPicker, SubItemsEditor, SaveCancelButtons, AccessError },
  props: { itemId: { type: String, default: '' }, isNew: Boolean, parentSectionTitle: { type: String, default: '' } },
  emits: ['closeEditMenu'],
  data: () => ({ modalName: modalNames.EDIT_ITEM, draft: {}, kind: 'link', tags: '', hidden: false, error: '' }),
  computed: { allowViewConfig() { return this.$store.getters.permissions.allowViewConfig; } },
  mounted() {
    this.draft = safeClone(this.isNew ? {} : this.$store.getters.getItemById(this.itemId), {});
    this.kind = this.draft.subItems ? 'group' : 'link';
    this.draft.subItems ||= [];
    this.draft.target ||= 'newtab';
    this.draft.icon ||= '🔗';
    this.tags = (this.draft.tags || []).join(', ');
    this.hidden = !!this.draft.displayData?.hideFromHomepage;
    this.$modal.show(this.modalName);
  },
  methods: {
    saveItem() {
      this.error = '';
      const item = safeClone(this.draft, {});
      item.title = (item.title || '').trim();
      if (!item.title) { this.error = '请填写名称。'; return; }
      if (this.kind === 'link') {
        item.url = (item.url || '').trim();
        if (!validUrl(item.url)) { this.error = '请填写完整的 HTTP/HTTPS 网址，不要在地址中嵌入账号密码。'; return; }
        delete item.subItems;
      } else {
        if (!item.subItems.length) { this.error = '请在小分类中添加至少一个网站。'; return; }
        for (const child of item.subItems) {
          child.title = (child.title || '').trim(); child.url = (child.url || '').trim();
          if (!child.title || !validUrl(child.url)) { this.error = '小分类中的每个网站都需要名称和完整网址。'; return; }
        }
        delete item.url; delete item.target;
      }
      item.tags = this.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean);
      if (!item.tags.length) delete item.tags;
      item.displayData = { ...item.displayData, hideFromHomepage: this.hidden };
      if (this.isNew) {
        item.id = 'temp_' + crypto.randomUUID();
        this.$store.commit(StoreKeys.INSERT_ITEM, { newItem: item, targetSection: this.parentSectionTitle });
      } else this.$store.commit(StoreKeys.UPDATE_ITEM, { newItem: item, itemId: this.itemId });
      this.$store.commit(StoreKeys.SET_EDIT_MODE, true);
      this.closeModal();
    },
    closeModal() { this.$modal.hide(this.modalName); },
    modalClosed() { this.$store.commit(StoreKeys.SET_MODAL_OPEN, false); this.$emit('closeEditMenu'); },
  },
};
</script>
<style lang="scss">
@import '@/styles/portal-editor.scss';
</style>
