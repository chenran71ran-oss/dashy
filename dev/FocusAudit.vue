<template>
  <header class="audit-controls"><strong>专注卡片 · 独立分支检查</strong><label>主题 <select v-model="theme" aria-label="主题"><option v-for="(label,key) in themeLabels" :key="key" :value="key">{{label}} · {{key}}</option></select></label><label>尺寸 <select v-model="size" aria-label="卡片尺寸"><option>small</option><option>medium</option><option>large</option></select></label><span>合成示例 · 不连接生产数据</span></header>
  <main class="minimal-home focus-home audit-view" @click="stopNavigation">
    <h1>Home Lab · 专注</h1>
    <div class="minimal-headings-row"><MinimalHeading v-for="(name,index) in ['网站','应用','工具']" :key="name" :title="name" :index="index" :selected="index===0" /></div>
    <MinimalSection class="focus-category" groupId="audit" title="示例" :index="0" :selected="true" :items="items" :displayData="{itemSize:size}" />
  </main>
</template>
<script setup>
import {ref,watch} from 'vue';
import {themeLabels} from '../src/utils/ThemeCatalog';
import {applyTheme} from '../src/utils/Theming';
import MinimalHeading from '../src/components/MinimalView/MinimalHeading.vue';
import MinimalSection from '../src/components/MinimalView/MinimalSection.vue';
const theme=ref('material-original'),size=ref('large');
watch(theme,value=>applyTheme(value,{}),{immediate:true});
const descriptions=['Short description.','Personal movies and TV library.','Manage API keys, usage and rate limits with a longer explanation that used to expand the third line and misalign the row.','','LongWordWithoutAnySpacesToVerifyThatTheDescriptionCanWrapAndTruncateWithoutWideningTheCard','第一行说明\nSecond line with details\nThird line with more details.'];
const items=descriptions.map((description,index)=>({id:`audit-${index}`,title:index===4?'一个很长的网站标题与英文 Long Website Title':`Example ${index+1}`,description,url:`https://example.org/${index}`,icon:'emoji:1f680',statusCheck:index===0}));
function stopNavigation(event){if(event.target.closest('a.item'))event.preventDefault();}
</script>
<style>
html,body{margin:0;min-height:100%;background:var(--background);color:var(--foreground);font-family:system-ui,sans-serif}
.audit-controls{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:16px;background:#111827;color:white;font-size:14px}.audit-controls select{min-height:40px;max-width:250px;background:#fff;color:#111;padding:6px}.audit-view{max-width:1000px;margin:32px auto;width:calc(100% - 32px)}.audit-view h1{text-align:center;color:var(--foreground)}.audit-view .minimal-headings-row{display:flex;gap:4px}.audit-view .section-items{gap:12px;padding:12px}.audit-view .focus-category{min-height:0}
</style>
