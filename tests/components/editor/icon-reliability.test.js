import { shallowMount } from '@vue/test-utils';
import IconPicker from '@/components/InteractiveEditor/IconPicker.vue';
import ItemIcon from '@/components/LinkItems/ItemIcon.vue';
import { discoverSiteIcon, verifySiteIcon } from '@/utils/SiteIcons';
vi.mock('@/utils/SiteIcons',()=>({discoverSiteIcon:vi.fn(),verifySiteIcon:vi.fn()}));
vi.mock('@/assets/interface-icons/broken-icon.svg',()=>({default:{template:'<span />'}}));
it('does not replace an existing icon with an image the browser cannot decode',async()=>{
  discoverSiteIcon.mockResolvedValue({icon:'https://site.example/broken.png',verified:true,source:'site'});
  verifySiteIcon.mockResolvedValue(false);
  const wrapper=shallowMount(IconPicker,{props:{modelValue:'portal-github',url:'https://site.example'}});
  await wrapper.vm.readWebsiteIcon();
  expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  expect(wrapper.vm.discoveryNote).toContain('保留原图标');wrapper.unmount();
});
it('automatic display reads the application path rather than the domain homepage',async()=>{
  discoverSiteIcon.mockResolvedValue({icon:'https://app.example/panel/logo.png',verified:true});
  const wrapper=shallowMount(ItemIcon,{props:{icon:'auto',url:'https://app.example/panel/',title:'Panel'},global:{mocks:{$store:{getters:{appConfig:{}}}}}});
  await Promise.resolve();
  expect(discoverSiteIcon).toHaveBeenLastCalledWith('https://app.example/panel/',{page:true});wrapper.unmount();
});
