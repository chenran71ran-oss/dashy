<template>
  <modal :name="modalName" :resizable="true" width="min(680px, 94vw)" height="auto" classes="dashy-modal edit-widget" @closed="modalClosed">
    <div class="portal-editor" v-if="allowViewConfig">
      <h3>{{ isAddNew ? '添加小组件' : '编辑小组件' }}</h3>
      <label>小组件类型<select v-model="draft.type" aria-label="小组件类型" @change="typeChanged">
        <optgroup label="常用小组件">
          <option value="weather">天气 · 地区与实况</option>
          <option value="clock">时钟 · 时间与日期</option>
          <option value="image">图片 · 图片或图表快照</option>
          <option value="iframe">嵌入网页 · 对方需允许嵌入</option>
        </optgroup>
        <optgroup label="全部 Dashy 小组件">
          <option v-for="entry in widgetCatalog.filter(e => !['clock', 'weather', 'image', 'iframe'].includes(e.type))" :key="entry.type" :value="entry.type">{{ entry.label }} · {{ entry.type }}</option>
        </optgroup>
        <option v-if="!widgetCatalog.some(e => e.type === draft.type)" :value="draft.type">{{ draft.type }} · {{ supported ? '原版别名' : '自定义类型' }}</option>
      </select></label>
      <p class="editor-note">{{ description }}</p>
      <label>显示名称<input v-model="draft.label" aria-label="小组件名称" placeholder="可选，例如 北京时间" maxlength="120" /></label>
      <template v-if="draft.type === 'clock'">
        <label>时区<input v-model="options.timeZone" aria-label="时区" placeholder="留空跟随设备，例如 Asia/Shanghai" /></label>
        <label>显示语言<input v-model="options.format" aria-label="时间语言" placeholder="留空跟随设备，例如 zh-CN" /></label>
        <label>地点名称<input v-model="options.customCityName" aria-label="地点名称" placeholder="可选，例如 北京" /></label>
        <label class="check"><input type="checkbox" v-model="options.hideDate" /> 隐藏日期</label>
        <label class="check"><input type="checkbox" v-model="options.hideSeconds" /> 隐藏秒数</label>
        <label>时间制式<select v-model="hourFormat" aria-label="时间制式"><option value="auto">跟随设备语言</option><option value="24">24小时</option><option value="12">12小时</option></select></label>
      </template>
      <template v-else-if="draft.type === 'weather'">
        <label>地区<select v-model="options.city" aria-label="天气地区"><option value="wuhan">武汉</option><option value="qingdao">青岛</option><option value="wuchang">武汉·武昌</option><option value="huangdao">青岛·黄岛</option></select></label>
        <label>其他城市名称<input v-model="options.city" aria-label="其他城市名称" placeholder="例如 London,GB；经纬度或城市 ID 优先" /></label>
        <label>城市 ID<input v-model="options.cityId" aria-label="天气城市 ID" /></label>
        <label>纬度<input type="number" v-model.number="options.lat" aria-label="天气纬度" /></label>
        <label>经度<input type="number" v-model.number="options.lon" aria-label="天气经度" /></label>
        <label>密钥占位符<input v-model="options.apiKey" aria-label="天气密钥占位符" placeholder="留空使用现有 CF Secret；例如 DASHY_WEATHER_TOKEN" /></label>
        <label>单位<select v-model="options.units" aria-label="天气单位"><option value="metric">摄氏度 °C</option><option value="imperial">华氏度 °F</option><option value="standard">开尔文 K</option></select></label>
        <label>语言<select v-model="options.lang" aria-label="天气语言"><option value="zh_cn">中文</option><option value="en">English</option></select></label>
        <label class="check"><input type="checkbox" v-model="options.hideDetails" /> 默认收起详细天气</label>
        <p class="editor-hint">密钥由 Cloudflare Secret OPENWEATHER_API_KEY 提供，此处无需填写。默认每10分钟刷新，支持原版城市名、城市 ID 和经纬度。</p>
      </template>
      <template v-else-if="draft.type === 'image'">
        <label>图片地址 <span class="required">*</span><input v-model="options.imagePath" aria-label="图片地址" placeholder="https://example.com/chart.png 或 /kenneth-mech.svg" /></label>
        <label>替代文字<input v-model="options.alt" aria-label="图片替代文字" placeholder="图片内容说明" /></label>
        <label>自动刷新间隔（秒）<input v-model.number="draft.updateInterval" aria-label="图片刷新间隔" type="number" min="0" max="7200" placeholder="0：不自动刷新；最少2秒" /></label>
      </template>
      <template v-else-if="draft.type === 'iframe'">
        <label>嵌入网址 <span class="required">*</span><input v-model="options.url" aria-label="嵌入网址" placeholder="https://example.com/status" /></label>
        <label>高度（像素）<input v-model.number="options.frameHeight" aria-label="嵌入高度" type="number" min="80" max="1200" placeholder="默认320" /></label>
        <p class="editor-hint">对方的 CSP / X-Frame-Options 可能禁止嵌入。遇到拒绝连接时，改成普通网站卡片跳转。HTTPS 总站请使用 HTTPS 嵌入地址。</p>
      </template>
      <label v-if="!simpleType">组件参数（JSON）<textarea v-model="optionsText" aria-label="组件参数 JSON" rows="9" spellcheck="false" placeholder='{"hostname":"https://your-service.example"}' /></label>
      <p v-if="!simpleType" class="editor-hint">按原版文档填写该组件所需的 API 地址、密钥占位符和其他参数。需要服务端密钥时开启代理，并在 CF Secrets 设置 DASHY_ 开头的变量。</p>
      <a href="https://dashy.to/docs/widgets/" target="_blank" rel="noopener noreferrer">查看原版小组件参数文档</a>
      <details><summary>原版通用选项</summary>
        <label>自动刷新间隔（秒）<input type="number" min="0" max="7200" v-model.number="draft.updateInterval" aria-label="通用刷新间隔" /></label>
        <label>请求超时（毫秒）<input type="number" min="0" v-model.number="draft.timeout" aria-label="请求超时" /></label>
        <label class="check"><input type="checkbox" v-model="draft.useProxy" /> 使用 CF 服务端代理（解决跨域／解析密钥占位符）</label>
        <label class="check"><input type="checkbox" v-model="draft.ignoreErrors" /> 忽略组件错误提示</label>
        <label class="check"><input type="checkbox" v-model="draft.allowInsecure" /> 允许不受信任证书（需要独立后端代理）</label>
      </details>
      <p class="editor-error" role="alert" v-if="error">{{ error }}</p>
      <p class="editor-hint">保存后暂存到编辑预览，最后点击“保存到云端”。小组件显示在首页与分类页面。</p>
      <SaveCancelButtons :saveClick="saveWidget" :cancelClick="closeModal" />
    </div>
    <AccessError v-else />
  </modal>
</template>
<script>
import { WIDGET_CATALOG, WIDGET_COMPONENTS } from '@/utils/WidgetCatalog';
import SaveCancelButtons from './SaveCancelButtons';
import AccessError from '@/components/Configuration/AccessError';
import StoreKeys from '@/utils/StoreMutations';
import safeClone from '@/utils/safeClone';
import { modalNames } from '@/utils/config/defaults';
const validUrl = value => { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password; } catch { return false; } };
export default {
  name: 'EditWidget', components: { SaveCancelButtons, AccessError },
  props: { sectionName: { type: String, required: true }, widgetIndex: { type: Number, default: -1 }, isAddNew: Boolean },
  emits: ['closeEditWidget'],
  data: () => ({ modalName: modalNames.EDIT_WIDGET, draft: {}, hourFormat: 'auto', error: '', typeOptions: {}, optionsText: '{}', widgetCatalog: WIDGET_CATALOG }),
  computed: {
    allowViewConfig() { return this.$store.getters.permissions.allowViewConfig; },
    supported() { return !!WIDGET_COMPONENTS[this.draft.type] || WIDGET_CATALOG.some(e => e.type === this.draft.type); },
    simpleType() { return ['clock', 'weather', 'image', 'iframe'].includes(this.draft.type); },
    options() { return this.draft.options || {}; },
    description() {
      return { weather: 'OpenWeatherMap 实况天气；可显示温度、体感、湿度与风速。默认使用 CF Secret，也支持密钥占位符。', clock: '直接使用设备时间，无需 API Key。可同时添加不同时区的时钟。', image: '展示图片、壁纸或监控服务导出的图表快照。远程图片由浏览器加载。', iframe: '把对方允许嵌入的页面放进分类，例如公开状态页；不需要填写 API Key。' }[this.draft.type] || '原版小组件已恢复；填写数据服务参数后运行。主机监控需要相应监控服务，公共 API 组件按提供方要求配置。';
    },
  },
  watch: {
    optionsText(value) {
      if (this.simpleType) return;
      try {
        const options = JSON.parse(value);
        if (options && !Array.isArray(options) && typeof options === 'object') {
          this.draft.options = options;
          this.typeOptions[this.draft.type] = options;
        }
      } catch { /* Invalid drafts remain in the editor until corrected. */ }
    },
  },
  created() {
    const live = this.$store.getters.getSectionByName(this.sectionName);
    this.draft = safeClone(this.isAddNew ? { type: 'clock', options: {} } : live?.widgets?.[this.widgetIndex], {});
    this.draft.type = this.draft.type || 'clock';
    this.draft.options ||= {};
    this.hourFormat = typeof this.options.use12Hour === 'boolean' ? (this.options.use12Hour ? '12' : '24') : 'auto';
    this.typeOptions[this.draft.type] = this.draft.options;
    this.optionsText = JSON.stringify(this.options, null, 2);
  },
  mounted() { this.$modal.show(this.modalName); },
  methods: {
    typeChanged() {
      this.draft.options = this.typeOptions[this.draft.type] ||= {};
      this.hourFormat = typeof this.options.use12Hour === 'boolean' ? (this.options.use12Hour ? '12' : '24') : 'auto';
      if (this.draft.type === 'weather') Object.assign(this.options, { city: this.options.city || 'wuhan', units: this.options.units || 'metric', lang: this.options.lang || 'zh_cn' });
      this.optionsText = JSON.stringify(this.options, null, 2);
      this.error = '';
    },
    saveWidget() {
      this.error = '';
      const widget = safeClone(this.draft, {});
      if (!this.simpleType) {
        try {
          widget.options = JSON.parse(this.optionsText);
          if (!widget.options || Array.isArray(widget.options) || typeof widget.options !== 'object') throw new Error();
        } catch { this.error = '组件参数需要有效的 JSON 对象。'; return; }
      }
      for (const key of ['timeout', 'updateInterval']) {
        if (widget[key] === '' || widget[key] == null) delete widget[key];
        else if (!Number.isFinite(widget[key]) || widget[key] < 0) { this.error = '刷新间隔和超时应为非负数。'; return; }
      }
      const options = widget.options;
      if (widget.type === 'clock') {
        for (const key of ['timeZone', 'format', 'customCityName']) { if (!options[key]?.trim()) delete options[key]; else options[key] = options[key].trim(); }
        try { new Intl.DateTimeFormat(options.format || navigator.language, { timeZone: options.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone }).format(); }
        catch { this.error = '请填写有效时区（例如 Asia/Shanghai）和语言（例如 zh-CN）。'; return; }
        if (this.hourFormat === 'auto') delete options.use12Hour;
        else options.use12Hour = this.hourFormat === '12';
      }
      if (widget.type === 'weather') {
        for (const key of ['cityId', 'lat', 'lon', 'apiKey']) if (options[key] === '' || options[key] === null) delete options[key];
        if (widget.updateInterval === undefined) widget.updateInterval = 600;
      }
      if (widget.type === 'image') {
        options.imagePath = (options.imagePath || '').trim();
        if (!/^\/(?!\/)/.test(options.imagePath) && !validUrl(options.imagePath)) { this.error = '请填写完整的图片网址，或以 / 开头的本站图片路径。'; return; }
        if (widget.updateInterval === '' || widget.updateInterval === null) delete widget.updateInterval;
        else if (widget.updateInterval !== undefined && (!Number.isFinite(widget.updateInterval) || widget.updateInterval < 0 || widget.updateInterval > 7200 || (widget.updateInterval > 0 && widget.updateInterval < 2))) { this.error = '刷新间隔应为0（关闭）或2至7200秒。'; return; }
      }
      if (widget.type === 'iframe') {
        options.url = (options.url || '').trim();
        if (!validUrl(options.url)) { this.error = '请填写完整的 HTTP/HTTPS 嵌入网址。'; return; }
        if (options.frameHeight === '' || options.frameHeight === undefined) options.frameHeight = 320;
        if (!Number.isFinite(options.frameHeight) || options.frameHeight < 80 || options.frameHeight > 1200) { this.error = '高度应为80至1200像素。'; return; }
      }
      if (this.isAddNew) this.$store.commit(StoreKeys.INSERT_WIDGET, { sectionName: this.sectionName, widget });
      else this.$store.commit(StoreKeys.UPDATE_WIDGET, { sectionName: this.sectionName, widgetIndex: this.widgetIndex, widget });
      this.$store.commit(StoreKeys.SET_EDIT_MODE, true);
      this.closeModal();
    },
    closeModal() { this.$modal.hide(this.modalName); },
    modalClosed() { this.$store.commit(StoreKeys.SET_MODAL_OPEN, false); this.$emit('closeEditWidget'); },
  },
};
</script>
<style lang="scss">
@import '@/styles/portal-editor.scss';
.widget-options-preview { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 0.8rem; }
</style>
