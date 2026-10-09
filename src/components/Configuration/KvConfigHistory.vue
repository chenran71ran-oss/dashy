<template>
  <section class="kv-history">
    <h3>CF 配置历史</h3>
    <p>云端保存前自动保留上一版配置；最近 20 条记录，备份保存 30 天。</p>
    <button type="button" @click="load" :disabled="busy">查看当前页面备份</button>
    <p v-if="message" role="status">{{ message }}</p>
    <ul v-if="entries.length">
      <li v-for="entry in entries" :key="entry.id">
        <span>{{ new Date(entry.savedAt).toLocaleString() }}</span>
        <button type="button" :disabled="busy" @click="download(entry)">下载</button>
        <button type="button" :disabled="busy" @click="preview(entry)">载入编辑预览</button>
      </li>
    </ul>
  </section>
</template>
<script>
import request from '@/utils/request';
export default {
  name: 'KvConfigHistory',
  data: () => ({ entries: [], busy: false, message: '' }),
  computed: { filename() { return this.$store.state.currentConfigInfo?.confPath || '/conf.yml'; } },
  watch: { filename() { this.entries = []; this.message = ''; } },
  methods: {
    endpoint(id) { return '/api/config-backups?' + new URLSearchParams({ filename: this.filename, ...(id ? { id } : {}) }); },
    async load() {
      this.busy = true;
      try { this.entries = (await request.get(this.endpoint())).data.backups; this.message = this.entries.length ? '' : '当前页面还没有云端历史版本。'; }
      catch (e) { this.message = e.response?.data?.error || '无法读取备份。'; }
      finally { this.busy = false; }
    },
    async download(entry) {
      this.busy = true;
      try {
        const { config } = (await request.get(this.endpoint(entry.id))).data;
        const { dump } = await import('@/utils/yaml');
        const url = URL.createObjectURL(new Blob([dump(config)], { type: 'text/yaml' }));
        const a = document.createElement('a'); a.href = url; a.download = `home-lab-${entry.id}.yml`; a.click(); URL.revokeObjectURL(url);
      } catch (e) { this.message = e.response?.data?.error || '无法下载备份。'; }
      finally { this.busy = false; }
    },
    async preview(entry) {
      this.busy = true;
      try {
        const { config } = (await request.get(this.endpoint(entry.id))).data;
        await this.$store.dispatch('APPLY_EDITED_CONFIG', config);
        this.$store.commit('SET_EDIT_MODE', true);
        this.message = '历史配置已载入编辑预览，检查后点击保存到云端。';
      } catch (e) { this.message = e.response?.data?.error || '无法载入备份。'; }
      finally { this.busy = false; }
    },
  },
};
</script>
<style scoped>
.kv-history { margin-bottom: 1.5rem; color: var(--config-code-color, var(--primary)); }
p { font-size: .85rem; line-height: 1.5; }
ul { padding: 0; list-style: none; }
li { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; margin: .5rem 0; }
button { border: 1px solid currentColor; color: inherit; background: var(--background); border-radius: var(--curve-factor-small); padding: .4rem .6rem; cursor: pointer; }
</style>
