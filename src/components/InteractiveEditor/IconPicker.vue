<template>
  <div class="icon-picker">
    <label class="icon-input-label">{{ label }}</label>
    <div class="icon-input-row">
      <Icon :icon="modelValue || '🔗'" :url="url" :title="siteTitle" size="small" class="icon-preview" />
      <input :aria-label="label" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" placeholder="选择图标，或粘贴图片网址" />
      <button type="button" @click="toggle" :aria-expanded="open">{{ open ? '收起' : '选择图标' }}</button>
    </div>
    <div v-if="allowAuto" class="auto-tools">
      <p class="picker-hint">{{ usesAutomaticIcon ? '自动：你的 QX 图库 → 网站声明图标 → favicon → 首字。预览与主页、工作台一致。' : '当前为手动图标，预览与主页、工作台一致。' }}</p>
      <button type="button" class="auto-button" @click="choose('auto')">自动匹配图标</button>
      <button type="button" class="auto-button read-site-icon" aria-label="读取网站图标" @click="readWebsiteIcon" :disabled="fetching || !url">{{ fetching ? '正在读取…' : '↻ 读取当前网站图标' }}</button>
      <p v-if="discoveryNote" class="picker-hint" role="status" :data-icon-reason="discoveryReason">{{ discoveryNote }}</p>
    </div>
    <div v-if="open" class="icon-library">
      <input v-model="query" aria-label="搜索图标" placeholder="搜索名称，如 GitHub、cloud、媒体、工具" />
      <nav class="icon-categories" aria-label="图标分类"><button v-for="category in categories" :key="category.id" type="button" :aria-pressed="category.id === activeCategory" @click="activeCategory = category.id">{{ category.label }}</button></nav>
      <p class="picker-hint">{{ matches.length }} 个结果 · {{ colorCount }} 个彩色图标 + {{ builtinCount - colorCount }} 个线条图标 + {{ brandCount }} 个品牌图标。可搜索中文分类、名称或英文关键词。</p>
      <div class="icon-grid">
        <button v-for="entry in matches.slice(0, visibleCount)" :key="entry.value" type="button" @click="choose(entry.value)" :title="entry.title + (entry.slug ? ' / ' + entry.slug : '')" :aria-label="entry.title">
          <Icon v-if="entry.src" :icon="entry.value" size="small" />
          <svg v-else-if="entry.path" viewBox="0 0 24 24" aria-hidden="true"><path :d="entry.path" :fill="entry.hex ? '#' + entry.hex : 'currentColor'" /></svg>
          <span v-else class="emoji">{{ entry.value }}</span><span class="icon-name">{{ entry.title }}</span>
        </button>
      </div>
      <p v-if="loading" role="status">正在加载图标库…</p>
      <p v-else-if="!matches.length">没有匹配结果，可直接填写 emoji 或图片网址。</p>
      <button v-if="matches.length > visibleCount" type="button" class="load-more-icons" @click="visibleCount += 48">加载更多（已显示 {{ visibleCount }} / {{ matches.length }}）</button>
      <p v-if="loadError">图标库暂时无法加载，仍可使用常用图标。</p>
    </div>
  </div>
</template>
<script>
import { portalIcons, websiteIcon } from '@/utils/PortalIcons';
import { builtinIcons, builtinIconPath, iconCategories, isColoredIcon } from '@/utils/BuiltinIcons';
import { discoverSiteIcon } from '@/utils/SiteIcons';
import Icon from '@/components/LinkItems/ItemIcon.vue';
// New manual choices must not be interpreted as the legacy emoji placeholders
// that older Home Lab configs migrate to brand icons.
const manualCommonIcons = { '🔗': 'lucide-link', '🌐': 'lucide-globe', '☁️': 'lucide-cloud', '🖥️': 'lucide-monitor' };
const common = [ ['🔗','链接 link'], ['🌐','网站 网络 web network'], ['🎬','媒体 电影 media movie Emby'], ['📊','监控 monitoring'], ['☁️','云 VPS cloud'], ['🖥️','服务器 server'], ['🛠️','工具 tools'], ['📚','阅读 reading'], ['💻','开发 code'], ['🎵','音乐 music'], ['🛡️','安全 security'], ['🚀','启动 rocket'] ].map(([emoji,title]) => { const value = manualCommonIcons[emoji] || emoji; return { value, title, src: builtinIconPath(value) }; });
let library;
export default {
  components: { Icon }, props: { modelValue: { type: String, default: '' }, label: { type: String, default: '图标' }, url: { type: String, default: '' }, siteTitle: { type: String, default: '' }, allowAuto: Boolean }, emits: ['update:modelValue'],
  data: () => ({ open: false, query: '', activeCategory: 'all', categories: iconCategories, visibleCount: 48, entries: [], loading: false, loadError: false, fetching: false, discoveryNote: '', discoveryReason: '', discoveryRequest: 0 }),
  watch: { url() { this.discoveryRequest += 1; this.fetching=false; this.discoveryNote=''; }, query() { this.visibleCount = 48; }, activeCategory() { this.visibleCount = 48; } },
  beforeUnmount() { this.discoveryRequest += 1; },
  computed: {
    usesAutomaticIcon() { const resolved = websiteIcon({ icon: this.modelValue, url: this.url, title: this.siteTitle }); return this.modelValue === 'auto' || resolved !== this.modelValue; },
    builtinCount() { return builtinIcons.length; },
    colorCount() { return builtinIcons.filter(isColoredIcon).length; },
    brandCount() { return this.brandEntries.length; },
    brandEntries() {
      const brands = portalIcons.map(e => ({...e, value: 'portal-' + e.id, slug: e.id, category: 'brand', tags: '品牌 QX ' + (e.tags || '')}));
      const covered = new Set([...brands.map(e => e.slug), 'googlegemini']);
      return [...brands, ...this.entries.filter(e => !covered.has(e.slug)).map(e => ({ ...e, category: 'brand', tags: '品牌' }))];
    },
    matches() {
      const q = this.query.trim().toLowerCase().replace(/^si-/, '');
      const all = [...this.brandEntries.slice(0, portalIcons.length), ...builtinIcons.filter(isColoredIcon), ...common.map(e => ({ ...e, category: 'tools', tags: '常用 工具' })), ...builtinIcons.filter(e => !isColoredIcon(e)), ...this.brandEntries.slice(portalIcons.length)];
      const seen = new Set();
      const filtered = all.filter(e => {
        const matchesCategory = this.activeCategory === 'all' || (this.activeCategory === 'color' ? isColoredIcon(e) : e.category === this.activeCategory);
        const matches = matchesCategory && (!q || (e.title + ' ' + (e.slug || '') + ' ' + (e.tags || '')).toLowerCase().includes(q));
        if (!matches || seen.has(e.value)) return false;
        seen.add(e.value);
        return true;
      });
      if (!q) return filtered;
      const relevance = e => e.title.toLowerCase() === q || e.slug === q ? 3 : `${e.title} ${e.slug || ''}`.toLowerCase().includes(q) ? 2 : 1;
      return filtered.sort((a, b) => relevance(b) - relevance(a));
    },
  },
  methods: {
    async readWebsiteIcon() {
      const request=++this.discoveryRequest; this.fetching=true;this.discoveryNote='';
      const result=await discoverSiteIcon(this.url,{force:true});
      if(request!==this.discoveryRequest)return;
      this.fetching=false;
      this.discoveryReason=result.reason||'';
      if(result.icon){
        this.choose(result.icon);
        const problem=result.reason==='dns'?'暂无法解析网站':result.reason==='timeout'?'读取网站超时':result.reason==='public-site-required'?'仅支持公开 HTTPS 网站':result.reason?'网站元信息暂不可用':'';
        this.discoveryNote=result.source==='site'?'已读取网站声明的图标，可在左侧预览。':`${problem?problem+'，先使用':'使用'}网站 favicon；无法显示时可从图库选择或填写图片地址。`;
      }
      else this.discoveryNote='暂时无法读取图标，请从图库选择或填写图片地址。';
    },
    choose(value) { this.$emit('update:modelValue', value); this.open = false; },
    async toggle() {
      this.open = !this.open;
      if (!this.open || this.entries.length) return;
      this.loading = true;
      try { library ||= import('simple-icons'); const icons = await library; this.entries = Object.values(icons).filter(e => e && e.slug && e.path).map(e => ({...e, value: 'si-' + e.slug})); }
      catch { this.loadError = true; library = null; }
      finally { this.loading = false; }
    },
  },
};
</script>
<style scoped lang="scss">
.icon-picker { min-width: 0; width: 100%; }
.icon-input-label { display: block; margin-bottom: 0.4rem; }
.icon-input-row { display: flex; gap: 0.5rem; align-items: center; }
input { width: 100%; min-width: 0; box-sizing: border-box; padding: 0.65rem; color: var(--interactive-editor-color); background: var(--interactive-editor-background); border: 1px solid currentColor; border-radius: var(--curve-factor-small); font-size: 1rem; }
.icon-input-row input { flex: 1; }
.icon-preview { flex-shrink: 0; width: 2rem; }
button { padding: 0.5rem; min-height: 44px; color: var(--interactive-editor-color); background: var(--interactive-editor-background); border: 1px solid currentColor; border-radius: var(--curve-factor-small); cursor: pointer; white-space: normal; }
button:hover, button:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
.icon-library { margin-top: 0.6rem; padding: 0.7rem; border: 1px dashed currentColor; border-radius: var(--curve-factor); }
p { font-size: 0.75rem; opacity: 0.85; }
.icon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(86px, 1fr)); gap: 0.45rem; }
.icon-grid button { display: flex; flex-direction: column; align-items: center; min-height: 64px; min-width: 0; gap: 0.3rem; }
.icon-name { font-size: 0.7rem; max-width: 100%; white-space: normal; overflow-wrap: anywhere; line-height: 1.4; }
.auto-button { padding: 0.25rem 0.4rem; font-size: 0.75rem; }
.auto-tools { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.auto-tools p { width: 100%; margin: 0.4rem 0; }
.read-site-icon { border-style: solid; font-weight: 600; }
.icon-categories { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0.7rem 0; }
.icon-categories button { font-size: 0.75rem; }
.icon-categories button[aria-pressed='true'] { background: var(--interactive-editor-color); color: var(--interactive-editor-background); }
.load-more-icons { width: 100%; margin-top: 0.8rem; }
svg { width: 24px; height: 24px; }
.emoji { font-size: 24px; }
</style>
