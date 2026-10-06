<template>
  <div class="focus-home" :style="getBackgroundImage()">
    <div class="focus-heading"><PageTitle :title="pageInfo.title" :description="pageInfo.description" :logo="pageInfo.logo" /><router-link to="/" class="return-home">返回总站</router-link></div>
    <Home v-if="isEditMode" />
    <template v-else>
      <SettingsContainer @user-is-searchin="searching" :forceSearch="true" />
      <main class="focus-content">
        <div class="focus-status"><span>快速访问</span><span>{{ websiteCount }} 个网站 · {{ sections.length }} 个分类</span></div>
        <nav class="focus-tabs" aria-label="分类筛选" v-if="sections.length">
          <button type="button" :class="{active: selectedSection === -1}" @click="selectedSection = -1">全部</button>
          <button v-for="(section,index) in sections" :key="section.name" type="button" :class="{active: selectedSection === index}" @click="selectedSection = index">{{ section.name }} <span>{{ (section.items || []).length }}</span></button>
        </nav>
        <section v-for="(section,index) in filteredSections" :key="section.name" v-show="(selectedSection === -1 || selectedSection === index || searchValue) && (!searchValue || section.filteredItems.length)" class="focus-category">
          <h2>{{ section.name }}</h2>
          <MinimalSection :index="index" :title="section.name" :groupId="makeSectionId(section)" :items="section.filteredItems" :displayData="section.displayData || {}" :selected="true" :showAll="true" @change-modal-visibility="updateModalVisibility" />
        </section>
        <div v-if="checkIfResults(filteredSections)" class="focus-empty"><p>{{ searchValue ? '没有匹配的网站，换个关键词试试。' : '还没有网站，先在总站添加你的常用入口。' }}</p><router-link v-if="!searchValue" to="/">添加网站</router-link></div>
      </main>
    </template>
  </div>
</template>
<script>
import HomeMixin from '@/mixins/HomeMixin';
import MinimalSection from '@/components/MinimalView/MinimalSection.vue';
import SettingsContainer from '@/components/Settings/SettingsContainer.vue';
import PageTitle from '@/components/PageStrcture/PageTitle.vue';
import Home from './Home.vue';
import { resolveRouteIntent, makePageName } from '@/utils/config/ConfigHelpers';
export default {
  mixins: [HomeMixin], components: { MinimalSection, SettingsContainer, PageTitle, Home },
  data: () => ({ selectedSection: -1 }),
  computed: {
    filteredSections() { return (this.sections || []).map(section => ({...section, filteredItems: this.filterTiles(section.items, section.name, {showHidden: !!this.searchValue})})); },
    websiteCount() { const count = items => (items || []).reduce((n,item) => n + (item.subItems ? count(item.subItems) : 1),0); return this.sections.reduce((n,section) => n + count(section.items),0); },
  },
  watch: { '$route.params.section': {immediate:true,handler() { const {sectionSlug} = resolveRouteIntent(this.$route, this.$store); this.selectedSection = sectionSlug ? this.sections.findIndex(s => makePageName(s.name) === sectionSlug) : -1; }} },
};
</script>
<style scoped lang="scss">
.focus-home { min-height: 100dvh; background: var(--background); color: var(--primary); }
.focus-heading { display: flex; gap: 1rem; align-items: center; padding: 1rem clamp(1rem,4vw,3rem); background: var(--background-darker); }
.return-home { color: inherit; text-decoration: none; font-size: 0.85rem; flex-shrink: 0; border: 1px solid currentColor; padding: 0.55rem 0.7rem; border-radius: var(--curve-factor-small); }
.focus-content { max-width: 1280px; margin: 0 auto; padding: 1.5rem clamp(1rem,4vw,2rem); }
.focus-status { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; font-size: 0.8rem; margin-bottom: 1rem; opacity: 0.85; }
.focus-status span:first-child { font-size: 1.2rem; font-weight: 600; }
.focus-tabs { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; }
.focus-tabs button { border: 1px solid var(--outline-color); padding: 0.65rem 0.9rem; color: var(--primary); background: var(--background-darker); cursor: pointer; border-radius: var(--curve-factor); font-size: 0.85rem; }
.focus-tabs button.active { color: var(--background); background: var(--primary); }
.focus-tabs span { opacity: 0.7; margin-left: 0.4rem; }
.focus-category { margin: 1rem 0 1.5rem; }
.focus-category h2 { margin: 0 0 0.75rem; font-size: 1.2rem; }
.focus-category :deep(.minimal-section-inner) { height: auto; min-height: 0; padding: 0.5rem; background: var(--item-group-background); border: 1px solid var(--outline-color); border-radius: var(--curve-factor); }
.focus-category :deep(.section-items) { grid-template-columns: repeat(auto-fill,minmax(min(160px,100%),1fr)); gap: 0.6rem; }
.focus-category :deep(.item) { margin: 0; }
.focus-category :deep(.sub-items-group) { grid-column: span 2; padding: 0.5rem; }
.focus-empty { text-align: center; padding: 2rem 1rem; border: 1px dashed var(--outline-color); }
.focus-empty a { color: inherit; }
@media(max-width:600px) { .focus-heading { padding: 1rem; align-items: flex-start; } .return-home { font-size: 0.75rem; } .focus-status { flex-wrap: wrap; } .focus-category :deep(.section-items) { grid-template-columns: repeat(2,minmax(0,1fr)); } }
</style>
