<template>
  <fieldset class="cloud-subitems">
    <legend>小分类内的网站</legend>
    <div v-for="(item,index) in modelValue" :key="index" class="cloud-subitem-row">
      <label>名称<input :value="item.title" @input="update(index,'title',$event.target.value)" placeholder="网站名称"></label>
      <label>网址<input :value="item.url" @input="update(index,'url',$event.target.value)" placeholder="https://example.com" type="url"></label>
      <IconPicker :modelValue="item.icon" @update:modelValue="update(index,'icon',$event)" />
      <button type="button" @click="remove(index)">删除</button>
    </div>
    <button type="button" @click="add">＋ 添加网站</button>
    <p>小分类入口无需填写自身网址，点击组内的网站即可跳转。</p>
  </fieldset>
</template>
<script>
import IconPicker from './IconPicker.vue';
export default {
  components: { IconPicker },
  props: { modelValue: { type: Array, default: () => [] } }, emits: ['update:modelValue'],
  methods: {
    update(index,key,value) { this.$emit('update:modelValue',this.modelValue.map((item,i)=>i===index?{...item,[key]:value}:item)); },
    remove(index) { this.$emit('update:modelValue',this.modelValue.filter((_,i)=>i!==index)); },
    add() { this.$emit('update:modelValue',[...this.modelValue,{title:'',url:'',icon:'🔗',target:'newtab'}]); },
  },
};
</script>
<style scoped lang="scss">
.cloud-subitems{width:100%;min-width:0;box-sizing:border-box;border:1px solid var(--outline-color);color:var(--primary);border-radius:var(--curve-factor);padding:12px}.cloud-subitem-row{display:grid;grid-template-columns:1fr 2fr;gap:8px;margin:8px 0;padding-bottom:12px;border-bottom:1px dashed var(--outline-color)}label{font-size:14px;min-width:0}input{box-sizing:border-box;display:block;width:100%;min-width:0;margin-top:5px;padding:8px;background:var(--input-background);color:var(--input-color,var(--primary));border:1px solid var(--outline-color);border-radius:3px;font-size:14px}button{cursor:pointer;padding:8px;color:var(--primary);background:var(--background);border:1px solid var(--primary);border-radius:3px}p{font-size:12px}@media(max-width:600px){.cloud-subitem-row{grid-template-columns:1fr}input{font-size:16px}}
</style>
