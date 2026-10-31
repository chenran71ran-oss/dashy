<template>
  <modal :name="modalName" :resizable="true" width="min(760px, 94vw)" height="auto"
    classes="dashy-modal complete-site-info" @before-open="scan" @closed="closed">
    <div class="portal-editor" v-if="allowViewConfig">
      <h3>补齐图标与英文说明</h3>
      <p class="editor-hint">
        共 {{ entries.length }} 个网站待补齐：{{ iconCount }} 个缺少固定图标，{{ descriptionCount }} 个缺少说明。
        图标取自网站声明并经浏览器验证；英文说明只采用网站自己公开的英文描述，不翻译、不生成。
      </p>
      <div class="complete-actions">
        <button type="button" @click="start" :disabled="running || !entries.length">{{ done ? '重新读取' : '开始读取' }}</button>
        <button v-if="running" type="button" @click="stop">停止</button>
        <span role="status" class="progress">{{ running ? `正在读取 ${finished} / ${entries.length}` : done ? `已读取 ${finished} / ${entries.length}` : '' }}</span>
      </div>
      <p v-if="!entries.length" class="editor-hint">当前页面所有网站都已有图标和说明。</p>
      <ul v-else class="complete-list">
        <li v-for="entry in entries" :key="entry.key" :class="{ ready: hasProposal(entry) }">
          <label class="check">
            <input type="checkbox" v-model="selected[entry.key]" :disabled="!hasProposal(entry)" :aria-label="`应用 ${entry.title}`" />
          </label>
          <div class="complete-icon">
            <Icon v-if="results[entry.key]?.icon" :icon="results[entry.key].icon" :title="entry.title" size="small" />
            <span v-else class="placeholder" aria-hidden="true">{{ entry.needsIcon ? '?' : '✓' }}</span>
          </div>
          <div class="complete-body">
            <p class="complete-title">{{ entry.title || host(entry.url) }} <small>{{ entry.sectionName }} · {{ host(entry.url) }}</small></p>
            <input v-if="entry.needsDescription" v-model="descriptions[entry.key]" :aria-label="`${entry.title} 英文说明`"
              placeholder="未读取到英文说明，可手动填写" maxlength="300" @input="selectIfFilled(entry)" />
            <p class="complete-note">{{ note(entry) }}</p>
          </div>
        </li>
      </ul>
      <p class="editor-hint">应用后在页面中预览，最后点击“保存到云端”同步。</p>
      <div class="complete-footer">
        <button type="button" class="primary" @click="apply" :disabled="!selectedCount">应用所选（{{ selectedCount }}）</button>
        <button type="button" @click="close">取消</button>
      </div>
    </div>
    <AccessError v-else />
  </modal>
</template>

<script>
import Icon from '@/components/LinkItems/ItemIcon.vue';
import AccessError from '@/components/Configuration/AccessError';
import StoreKeys from '@/utils/StoreMutations';
import { modalNames } from '@/utils/config/defaults';
import { discoverSiteIcon, verifySiteIcon } from '@/utils/SiteIcons';
import { applyCompletions, findIncompleteItems, readSiteDescription } from '@/utils/SiteCompletion';

const reasons = {
  'login-required': '总站登录已过期', timeout: '读取超时', dns: '无法解析网站', request: '网站无法访问',
  'public-site-required': '仅支持公开 HTTPS 网站', 'dynamic-metadata': '图标由页面脚本动态加载', 'no-icon': '网站未声明图标',
  'image-load': '图片地址浏览器无法显示', 'not-english': '网站描述不是英文', 'no-description': '网站未提供描述', 'not-html': '不是网页',
};
const reasonText = reason => reasons[reason] || (reason?.startsWith('http-') ? `网站返回 HTTP ${reason.slice(5)}` : '未读取到');

export default {
  name: 'CompleteSiteInfo',
  components: { Icon, AccessError },
  data: () => ({
    modalName: modalNames.COMPLETE_SITE_INFO,
    entries: [], results: {}, descriptions: {}, selected: {},
    running: false, done: false, finished: 0, run: 0,
  }),
  computed: {
    allowViewConfig() { return this.$store.getters.permissions.allowViewConfig; },
    iconCount() { return this.entries.filter(e => e.needsIcon).length; },
    descriptionCount() { return this.entries.filter(e => e.needsDescription).length; },
    selectedCount() { return this.entries.filter(e => this.selected[e.key] && this.hasProposal(e)).length; },
  },
  beforeUnmount() { this.stop(); },
  methods: {
    host(url) { try { return new URL(url).hostname; } catch { return url; } },
    scan() {
      this.stop();
      const sections = this.$store.state.configSource.sections || [];
      this.entries = findIncompleteItems(sections, this.$store.getters.appConfig?.defaultIcon);
      this.results = {}; this.descriptions = {}; this.selected = {};
      this.done = false; this.finished = 0;
    },
    hasProposal(entry) {
      return !!(this.results[entry.key]?.icon || (entry.needsDescription && this.descriptions[entry.key]?.trim()));
    },
    selectIfFilled(entry) { this.selected[entry.key] = this.hasProposal(entry); },
    note(entry) {
      const result = this.results[entry.key];
      if (!result) return this.running ? '等待读取…' : '';
      const parts = [];
      if (entry.needsIcon) parts.push(result.icon ? '已找到网站图标' : `图标：${reasonText(result.iconReason)}`);
      if (entry.needsDescription) parts.push(result.description ? `说明来自网站 ${result.descriptionSource}` : `说明：${reasonText(result.descriptionReason)}`);
      return parts.join('；');
    },
    async readEntry(entry, run) {
      const result = {};
      const tasks = [];
      if (entry.needsIcon) tasks.push((async () => {
        const found = await discoverSiteIcon(entry.url, { page: true });
        if (found.icon && found.verified && await verifySiteIcon(found.icon)) result.icon = found.icon;
        else result.iconReason = found.verified ? 'image-load' : found.reason;
      })());
      if (entry.needsDescription) tasks.push((async () => {
        const found = await readSiteDescription(entry.url);
        if (found.description) { result.description = found.description; result.descriptionSource = found.source || 'meta'; }
        else result.descriptionReason = found.reason;
      })());
      await Promise.all(tasks);
      if (run !== this.run) return;
      this.results[entry.key] = result;
      if (result.description && !this.descriptions[entry.key]) this.descriptions[entry.key] = result.description;
      this.selected[entry.key] = this.hasProposal(entry);
      this.finished += 1;
    },
    async start() {
      const run = ++this.run;
      this.running = true; this.done = false; this.finished = 0; this.results = {};
      const queue = [...this.entries];
      // Each read is a server-side page request; keep the Worker and target sites unhurried.
      const worker = async () => {
        while (run === this.run && queue.length) {
          try { await this.readEntry(queue.shift(), run); } catch { this.finished += 1; }
        }
      };
      await Promise.all([worker(), worker(), worker()]);
      if (run !== this.run) return;
      this.running = false; this.done = true;
    },
    stop() { this.run += 1; this.running = false; },
    apply() {
      const changes = this.entries.filter(e => this.selected[e.key] && this.hasProposal(e)).map(e => ({
        path: e.path,
        icon: this.results[e.key]?.icon || '',
        description: e.needsDescription ? (this.descriptions[e.key] || '').trim() : '',
      }));
      if (!changes.length) return;
      const sections = this.$store.state.configSource.sections || [];
      this.$store.commit(StoreKeys.SET_SECTIONS, applyCompletions(sections, changes));
      this.$toast?.success?.(`已补齐 ${changes.length} 个网站，请点击“保存到云端”同步`);
      this.close();
    },
    close() { this.$modal.hide(this.modalName); },
    closed() {
      this.stop();
      this.$store.commit(StoreKeys.SET_MODAL_OPEN, false);
    },
  },
};
</script>

<style scoped lang="scss">
.complete-actions, .complete-footer { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin: 0.6rem 0; }
.progress { font-size: 0.85rem; opacity: 0.85; }
.complete-list { list-style: none; margin: 0; padding: 0; max-height: min(55vh, 520px); overflow-y: auto; }
.complete-list li { display: grid; grid-template-columns: auto 2.25rem minmax(0, 1fr); gap: 0.6rem; align-items: start; padding: 0.55rem 0.2rem; border-bottom: 1px solid color-mix(in srgb, currentColor 18%, transparent); }
.complete-icon { display: grid; place-items: center; min-height: 2rem; }
.placeholder { opacity: 0.6; font-weight: 700; }
.complete-title { margin: 0; font-weight: 600; overflow-wrap: anywhere; }
.complete-title small { font-weight: 400; opacity: 0.7; margin-left: 0.3rem; }
.complete-note { margin: 0.25rem 0 0; font-size: 0.75rem; opacity: 0.8; }
.complete-body input { width: 100%; box-sizing: border-box; margin-top: 0.35rem; padding: 0.45rem; color: var(--interactive-editor-color); background: var(--interactive-editor-background); border: 1px solid currentColor; border-radius: var(--curve-factor-small); }
button { padding: 0.5rem 0.8rem; min-height: 44px; color: var(--interactive-editor-color); background: var(--interactive-editor-background); border: 1px solid currentColor; border-radius: var(--curve-factor-small); cursor: pointer; }
button.primary { font-weight: 700; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
.check input { width: 1.1rem; height: 1.1rem; margin-top: 0.5rem; }
</style>
