<template>
  <modal :name="modalName" :resizable="true" width="min(680px, 94vw)" height="auto" classes="dashy-modal edit-item" @closed="modalClosed">
    <div class="portal-editor" v-if="allowViewConfig">
      <h3>{{ isNew ? '添加入口' : '编辑入口' }}</h3>
      <div class="entry-kind" aria-label="入口类型">
        <button type="button" :class="{active: kind === 'link'}" @click="kind = 'link'">网站</button>
        <button type="button" :class="{active: kind === 'group'}" @click="kind = 'group'">小分类</button>
      </div>
      <label>名称 <span class="required">*</span><input v-model="draft.title" aria-label="名称" placeholder="网站或小分类名称" maxlength="120" /></label>
      <label v-if="kind === 'link'">网址 <span class="required">*</span><input v-model="draft.url" type="url" aria-label="网址" placeholder="https://example.com" /></label>
      <IconPicker v-model="draft.icon" :url="kind === 'link' ? draft.url : ''" :siteTitle="draft.title" :allowAuto="kind === 'link'" />
      <label>说明<input v-model="draft.description" aria-label="说明" placeholder="可选，鼠标悬停时显示" /></label>
      <label v-if="kind === 'link'">打开方式<select v-model="draft.target" aria-label="打开方式"><option value="newtab">新标签页</option><option value="sametab">当前标签页</option><option value="modal">弹窗</option><option value="workspace">工作台内打开</option><option value="newwindow">新窗口</option><option value="clipboard">复制网址</option><option value="parent">父级窗口</option><option value="top">顶层窗口</option></select></label>
      <SubItemsEditor v-if="kind === 'group'" v-model="draft.subItems" />
      <details><summary>更多选项</summary>
        <label>搜索标签<input v-model="tags" aria-label="搜索标签" placeholder="多个标签用逗号分隔" /></label>
        <label class="check"><input type="checkbox" v-model="hidden" /> 首页隐藏（搜索与编辑时可见）</label>
      </details>
      <details v-if="kind === 'link'" class="probe-settings"><summary>探针与内网访问 · 高级选项</summary>
        <p class="editor-note">HTTP 检测和内网地址探测已恢复；ICMP Ping 需要在 CF 设置 DASHY_BACKEND_URL 接入主机探针。</p>
        <details><summary>HTTP 状态检测：网站是否正常响应</summary>
          <label class="check"><input type="checkbox" v-model="draft.statusCheck" /> 启用 HTTP 检测</label>
          <label>检测地址<input v-model="draft.statusCheckUrl" aria-label="检测地址" placeholder="留空使用网站网址，或填 https://example.com/health" /></label>
          <label>检测间隔（秒）<input v-model.number="draft.statusCheckInterval" aria-label="HTTP 检测间隔" type="number" min="0" max="300" placeholder="0：仅打开页面时检测" /></label>
          <label>额外接受的状态码<input v-model="draft.statusCheckAcceptCodes" aria-label="接受的状态码" placeholder="例如 301,401；默认接受 2xx" /></label>
          <label>最多跟随重定向次数<input v-model.number="draft.statusCheckMaxRedirects" aria-label="重定向次数" type="number" min="0" max="20" placeholder="0：不跟随重定向" /></label>
          <label>自定义请求头（JSON）<textarea v-model="probeHeaders" aria-label="检测请求头" rows="3" placeholder='{"X-Health-Check":"home-lab"}' /></label>
          <p class="editor-hint">原版用于带认证的健康接口。此处内容会随配置发给已登录的浏览器；需要保密的 Token 应在接入后放到 CF Secrets，不要填真实 Cookie。</p>
          <label class="check"><input type="checkbox" v-model="draft.statusCheckAllowInsecure" /> 接入后允许忽略 TLS 证书错误（原版高级选项）</label>
        </details>
        <details><summary>Ping 检测：主机是否连通</summary>
          <p class="editor-hint">使用 ICMP 检测主机连通性和延迟。能 Ping 通不代表网站正常；部分服务禁用 ICMP，需要独立探针服务提供结果。</p>
          <label class="check"><input type="checkbox" v-model="draft.pingCheckEnabled" /> 启用 Ping 检测</label>
          <label>主机或 IP<input v-model="draft.pingCheckHost" aria-label="Ping 主机" placeholder="example.com；留空取网站域名" /></label>
          <label>检测间隔（秒）<input v-model.number="draft.pingCheckInterval" aria-label="Ping 检测间隔" type="number" min="0" placeholder="0：仅打开页面时检测；非零至少5秒" /></label>
          <label>每次发送包数<input v-model.number="draft.pingCheckCount" aria-label="Ping 包数" type="number" min="0" max="5" placeholder="0：默认3个，最多5个" /></label>
          <label>超时（毫秒）<input v-model.number="draft.pingCheckTimeout" aria-label="Ping 超时" type="number" min="0" placeholder="0：沿用默认值" /></label>
        </details>
        <details><summary>内网地址：在家优先使用局域网入口</summary>
          <p class="editor-hint">原版由浏览器尝试访问内网地址，成功后改用它。HTTPS 到 HTTP、浏览器内网访问限制都可能影响检测；启用后会按原版逻辑检测。</p>
          <label>内网网址<input v-model="draft.localUrl" aria-label="内网网址" placeholder="例如 https://nas.home.example.com" /></label>
          <label>探测超时（毫秒）<input v-model.number="draft.localUrlTimeout" aria-label="内网探测超时" type="number" min="300" max="5000" placeholder="默认1500毫秒" /></label>
          <label>重新检测间隔（秒）<input v-model.number="draft.localUrlCheckInterval" aria-label="内网检测间隔" type="number" min="0" max="300" placeholder="0：页面加载或重新获得焦点时检测" /></label>
        </details>
      </details>
      <details><summary>其他原版字段（JSON）</summary>
        <label>高级字段<textarea v-model="advancedText" aria-label="网站高级字段 JSON" rows="5" spellcheck="false" /></label>
        <p class="editor-hint">例如 hotkey、alias、color、backgroundColor、provider、rel 和 displayData。现有高级字段会保留。</p>
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
  data: () => ({ modalName: modalNames.EDIT_ITEM, draft: {}, kind: 'link', tags: '', hidden: false, probeHeaders: '', advancedText: '{}', error: '' }),
  computed: { allowViewConfig() { return this.$store.getters.permissions.allowViewConfig; } },
  mounted() {
    this.draft = safeClone(this.isNew ? {} : this.$store.getters.getItemById(this.itemId), {});
    this.kind = this.draft.subItems ? 'group' : 'link';
    this.draft.subItems ||= [];
    this.draft.target ||= 'newtab';
    this.draft.icon ||= this.kind === 'link' ? 'auto' : '🔗';
    this.tags = (this.draft.tags || []).join(', ');
    this.hidden = !!this.draft.displayData?.hideFromHomepage;
    this.probeHeaders = this.draft.statusCheckHeaders ? JSON.stringify(this.draft.statusCheckHeaders, null, 2) : '';
    const fields = ['hotkey', 'alias', 'color', 'backgroundColor', 'provider', 'rel', 'displayData'];
    this.advancedText = JSON.stringify(Object.fromEntries(fields.filter(k => this.draft[k] !== undefined).map(k => [k, this.draft[k]])), null, 2);
    this.$modal.show(this.modalName);
  },
  methods: {
    saveItem() {
      this.error = '';
      const item = safeClone(this.draft, {});
      try {
        const advanced = JSON.parse(this.advancedText);
        const fields = ['hotkey', 'alias', 'color', 'backgroundColor', 'provider', 'rel', 'displayData'];
        if (!advanced || Array.isArray(advanced) || typeof advanced !== 'object' || Object.keys(advanced).some(k => !fields.includes(k))) throw new Error();
        for (const key of fields) delete item[key];
        Object.assign(item, advanced);
      } catch { this.error = '高级字段需要 JSON 对象，且只能填写列出的原版字段。'; return; }
      item.title = (item.title || '').trim();
      if (!item.title) { this.error = '请填写名称。'; return; }
      if (this.kind === 'link') {
        item.url = (item.url || '').trim();
        if (!validUrl(item.url)) { this.error = '请填写完整的 HTTP/HTTPS 网址，不要在地址中嵌入账号密码。'; return; }
        for (const field of ['statusCheckUrl', 'localUrl']) {
          if (!item[field]?.trim()) delete item[field];
          else if (!validUrl(item[field])) { this.error = '检测地址和内网网址需要完整的 HTTP/HTTPS 地址。'; return; }
        }
        for (const field of ['statusCheckInterval', 'statusCheckMaxRedirects', 'pingCheckInterval', 'pingCheckCount', 'pingCheckTimeout', 'localUrlTimeout', 'localUrlCheckInterval']) {
          if (item[field] === '' || item[field] === null) delete item[field];
          else if (item[field] !== undefined && (!Number.isFinite(item[field]) || item[field] < 0)) { this.error = '检测间隔、超时、包数和重定向次数应为非负数字。'; return; }
        }
        try {
          if (!this.probeHeaders.trim()) delete item.statusCheckHeaders;
          else {
            const headers = JSON.parse(this.probeHeaders);
            if (!headers || Array.isArray(headers) || typeof headers !== 'object' || Object.values(headers).some(v => typeof v !== 'string')) throw new Error();
            item.statusCheckHeaders = headers;
          }
        } catch { this.error = '请求头需要 JSON 对象，且每个值都是字符串。'; return; }
        delete item.subItems;
      } else {
        if (!item.subItems.length) { this.error = '请在小分类中添加至少一个网站。'; return; }
        const validChildren = list => list.every(child => {
          child.title = (child.title || '').trim();
          if (!child.title) return false;
          if (child.subItems) return Array.isArray(child.subItems) && child.subItems.length > 0 && validChildren(child.subItems);
          child.url = (child.url || '').trim(); return validUrl(child.url);
        });
        if (!validChildren(item.subItems)) { this.error = '小分类需要名称，组内每个网站需要名称和完整网址。'; return; }
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
