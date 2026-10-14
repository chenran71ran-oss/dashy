import { shallowMount } from '@vue/test-utils';
import IconPicker from '@/components/InteractiveEditor/IconPicker.vue';
import { discoverSiteIcon } from '@/utils/SiteIcons';
vi.mock('@/utils/SiteIcons',()=>({ discoverSiteIcon:vi.fn() }));
vi.mock('@/components/LinkItems/ItemIcon.vue',()=>({default:{template:'<span />'}}));
it('retains the existing manual icon when the favicon has not been verified',async()=>{
  discoverSiteIcon.mockResolvedValue({icon:'https://site.example/favicon.ico',verified:false,reason:'http-403'});
  const wrapper=shallowMount(IconPicker,{props:{modelValue:'portal-github',url:'https://site.example'}});
  await wrapper.vm.readWebsiteIcon();expect(wrapper.emitted('update:modelValue')).toBeUndefined();expect(wrapper.vm.discoveryNote).toContain('已保留原图标');wrapper.unmount();
});
it('saves a verified icon candidate and reports success',async()=>{
  discoverSiteIcon.mockResolvedValue({icon:'https://site.example/apple.png',verified:true,source:'site'});
  const wrapper=shallowMount(IconPicker,{props:{modelValue:'portal-github',url:'https://site.example'}});
  await wrapper.vm.readWebsiteIcon();expect(wrapper.emitted('update:modelValue')).toEqual([['https://site.example/apple.png']]);wrapper.unmount();
});
it('explains HTTP 403 as a refused server request, not a site without an icon',async()=>{
  discoverSiteIcon.mockResolvedValue({icon:'https://site.example/favicon.ico',source:'unavailable',verified:false,reason:'http-403'});
  const wrapper=shallowMount(IconPicker,{props:{modelValue:'auto',url:'https://site.example'}});
  await wrapper.vm.readWebsiteIcon();
  expect(wrapper.vm.discoveryNote).toContain('HTTP 403');
  expect(wrapper.vm.discoveryNote).toContain('拒绝');
  expect(wrapper.vm.discoveryNote).toContain('已保留原图标');
  expect(wrapper.emitted('update:modelValue')).toBeUndefined();wrapper.unmount();
});
