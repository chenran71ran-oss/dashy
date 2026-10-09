<template>
  <fieldset class="cloud-subitems">
    <legend>小分类内的网站</legend>
    <div v-for="(item,index) in modelValue" :key="index" class="cloud-subitem-row">
      <label>名称<input :value="item.title" @input="update(index,'title',$event.target.value)" placeholder="网站名称"></label>
      <label v-if="!item.subItems">网址<input :value="item.url" @input="update(index,'url',$event.target.value)" placeholder="https://example.com" type="url"></label>
      <label v-if="!item.subItems">打开方式<select :value="item.target || 'newtab'" @change="update(index,'target',$event.target.value)"><option value="newtab">新标签页</option><option value="sametab">当前标签页</option><option value="modal">弹窗</option><option value="workspace">工作台内打开</option><option value="newwindow">新窗口</option><option value="clipboard">复制网址</option><option value="parent">父级窗口</option><option value="top">顶层窗口</option></select></label>
      <IconPicker :url="item.url" :siteTitle="item.title" :allowAuto="!item.subItems" :modelValue="item.icon" @update:modelValue="update(index,'icon',$event)" />
      <SubItemsEditor v-if="item.subItems" class="nested-group" :modelValue="item.subItems" @update:modelValue="update(index,'subItems',$event)" />
      <button type="button" @click="remove(index)">删除</button>
    </div>
    <button type="button" @click="add">＋ 添加网站</button>
    <button type="button" @click="addGroup">＋ 添加小分类</button>
    <p>小分类入口无需填写自身网址，点击组内的网站即可跳转。</p>
  </fieldset>
</template>
<script>
import IconPicker from './IconPicker.vue';
export default {
  name: 'SubItemsEditor',
  components: { IconPicker },
  props: { modelValue: { type: Array, default: () => [] } }, emits: ['update:modelValue'],
  methods: {
    update(index,key,value) { this.$emit('update:modelValue',this.modelValue.map((item,i)=>i===index?{...item,[key]:value}:item)); },
    remove(index) { this.$emit('update:modelValue',this.modelValue.filter((_,i)=>i!==index)); },
    add() { this.$emit('update:modelValue',[...this.modelValue,{title:'',url:'',icon:'auto',target:'newtab'}]); },
    addGroup() { this.$emit('update:modelValue',[...this.modelValue,{title:'',icon:'🔗',subItems:[]}]); },
  },
};
</script>
<style scoped lang="scss">
.cloud-subitems{width:100%;min-width:0;box-sizing:border-box;border:1px solid var(--outline-color);color:var(--primary);border-radius:var(--curve-factor);padding:12px}.cloud-subitem-row{display:grid;grid-template-columns:1fr 2fr;gap:8px;margin:8px 0;padding-bottom:12px;border-bottom:1px dashed var(--outline-color)}.nested-group{grid-column:1/-1}label{font-size:14px;min-width:0}input,select{box-sizing:border-box;display:block;width:100%;min-width:0;margin-top:5px;padding:8px;background:var(--input-background);color:var(--input-color,var(--primary));border:1px solid var(--outline-color);border-radius:3px;font-size:14px}button{cursor:pointer;padding:8px;color:var(--primary);background:var(--background);border:1px solid var(--primary);border-radius:3px}p{font-size:12px}@media(max-width:600px){.cloud-subitem-row{grid-template-columns:1fr}input,select{font-size:16px}}
</style>
