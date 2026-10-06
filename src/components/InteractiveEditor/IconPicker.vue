<template>
  <div class="icon-picker">
    <label class="icon-input-label">{{ label }}</label>
    <div class="icon-input-row">
      <Icon :icon="modelValue || '🔗'" :url="url" :title="siteTitle" size="small" class="icon-preview" />
      <input :aria-label="label" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" placeholder="选择图标，或粘贴图片网址" />
      <button type="button" @click="toggle" :aria-expanded="open">{{ open ? '收起' : '选择图标' }}</button>
    </div>
    <div v-if="allowAuto" class="auto-tools">
      <p class="picker-hint">{{ modelValue === 'auto' ? '自动：你的 QX 图库 → 网站声明图标 → favicon → 首字。' : '当前为手动图标，可切换为自动匹配。' }}</p>
      <button type="button" class="auto-button" @click="choose('auto')">自动匹配图标</button>
      <button type="button" class="auto-button" @click="readWebsiteIcon" :disabled="fetching || !url">{{ fetching ? '正在读取…' : '读取网站图标' }}</button>
      <p v-if="discoveryNote" class="picker-hint" role="status" :data-icon-reason="discoveryReason">{{ discoveryNote }}</p>
    </div>
    <div v-if="open" class="icon-library">
      <input v-model="query" aria-label="搜索图标" placeholder="搜索名称，如 GitHub、cloud、媒体、工具" />
      <p class="picker-hint">品牌图标来自你的 QX 库及内置图库，在本站加载。{{ query ? '搜索结果' : '常用图标' }}（{{ matches.length }}）</p>
      <div class="icon-grid">
        <button v-for="entry in matches.slice(0, 48)" :key="entry.value" type="button" @click="choose(entry.value)" :title="entry.title" :aria-label="entry.title">
          <Icon v-if="entry.src" :icon="entry.src" size="small" />
          <svg v-else-if="entry.path" viewBox="0 0 24 24" aria-hidden="true"><path :d="entry.path" :fill="entry.hex ? '#' + entry.hex : 'currentColor'" /></svg>
          <span v-else class="emoji">{{ entry.value }}</span><span class="icon-name">{{ entry.title }}</span>
        </button>
      </div>
      <p v-if="loading" role="status">正在加载图标库…</p>
      <p v-else-if="!matches.length">没有匹配结果，可直接填写 emoji 或图片网址。</p>
      <p v-if="matches.length > 48">显示前48个结果，请输入更具体的名称。</p>
      <p v-if="loadError">图标库暂时无法加载，仍可使用常用图标。</p>
    </div>
  </div>
</template>
<script>
import { portalIcons } from '@/utils/PortalIcons';
import { discoverSiteIcon } from '@/utils/SiteIcons';
import Icon from '@/components/LinkItems/ItemIcon.vue';
const common = [ ['🔗','链接 link'], ['🌐','网站 网络 web network'], ['🎬','媒体 电影 media movie Emby'], ['📊','监控 monitoring'], ['☁️','云 VPS cloud'], ['🖥️','服务器 server'], ['🛠️','工具 tools'], ['📚','阅读 reading'], ['💻','开发 code'], ['🎵','音乐 music'], ['🛡️','安全 security'], ['🚀','启动 rocket'] ].map(([value,title]) => ({value,title}));
let library;
export default {
  components: { Icon }, props: { modelValue: { type: String, default: '' }, label: { type: String, default: '图标' }, url: { type: String, default: '' }, siteTitle: { type: String, default: '' }, allowAuto: Boolean }, emits: ['update:modelValue'],
  data: () => ({ open: false, query: '', entries: [], loading: false, loadError: false, fetching: false, discoveryNote: '', discoveryReason: '', discoveryRequest: 0 }),
  watch: { url() { this.discoveryRequest += 1; this.fetching=false; this.discoveryNote=''; } },
  beforeUnmount() { this.discoveryRequest += 1; },
  computed: {
    matches() {
      const q = this.query.trim().toLowerCase().replace(/^si-/, '');
      const brands = portalIcons.map(e => ({...e, value: 'portal-' + e.id, slug: e.id}));
      const covered = new Set([...brands.map(e => e.slug), 'googlegemini']);
      const all = [...brands, ...common, ...this.entries.filter(e => !covered.has(e.slug))];
      if (!q) { const wanted = ['github','cloudflare','jellyfin','plex','youtube','netflix','spotify','docker','proxmox','homeassistant','nextcloud','bitwarden','notion','telegram','rss']; return [...brands, ...common, ...this.entries.filter(e => wanted.includes(e.slug) && !brands.some(b => b.id === e.slug))]; }
      return all.filter(e => (e.title + ' ' + (e.slug || '')).toLowerCase().includes(q));
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
button { padding: 0.5rem; color: var(--interactive-editor-color); background: var(--interactive-editor-background); border: 1px solid currentColor; border-radius: var(--curve-factor-small); cursor: pointer; white-space: nowrap; }
button:hover, button:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
.icon-library { margin-top: 0.6rem; padding: 0.7rem; border: 1px dashed currentColor; border-radius: var(--curve-factor); }
p { font-size: 0.75rem; opacity: 0.85; }
.icon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(86px, 1fr)); gap: 0.45rem; }
.icon-grid button { display: flex; flex-direction: column; align-items: center; min-height: 64px; min-width: 0; gap: 0.3rem; }
.icon-name { font-size: 0.65rem; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
.auto-button { padding: 0.25rem 0.4rem; font-size: 0.75rem; }
.auto-tools { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.auto-tools p { width: 100%; margin: 0.4rem 0; }
svg { width: 24px; height: 24px; }
.emoji { font-size: 24px; }
</style>
