import { shallowMount } from '@vue/test-utils';
import IconPicker from '@/components/InteractiveEditor/IconPicker.vue';
import ItemIcon from '@/components/LinkItems/ItemIcon.vue';
import { discoverSiteIcon, verifySiteIcon } from '@/utils/SiteIcons';
vi.mock('@/utils/SiteIcons',()=>({discoverSiteIcon:vi.fn(),cachedSiteIcon:vi.fn(()=>''),verifySiteIcon:vi.fn()}));
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
it('never retries an external protected image with browser credentials',async()=>{
  window.__KH_CLOUD_AUTH=true;
  const wrapper=shallowMount(ItemIcon,{props:{icon:'https://protected.example/favicon.ico',url:'https://protected.example',title:'Private'},global:{mocks:{$store:{getters:{appConfig:{}}}}}});
  try {
    expect(wrapper.find('img').attributes('src')).toBe('/api/icon-image?url=https%3A%2F%2Fprotected.example%2Ffavicon.ico');
    await wrapper.find('img').trigger('error');
    expect(wrapper.find('img').attributes('src')).toBe('https://protected.example/favicon.ico');
    expect(wrapper.find('img').attributes('crossorigin')).toBe('anonymous');
    await wrapper.find('img').trigger('error');
    expect(wrapper.find('img').exists()).toBe(false);
  } finally {wrapper.unmount();delete window.__KH_CLOUD_AUTH;}
});
it('uses the bundled Paperless-GPT logo after a saved protected favicon fails',async()=>{
  window.__KH_CLOUD_AUTH=true;
  const wrapper=shallowMount(ItemIcon,{props:{icon:'https://paperless-gpt.example/favicon.ico',url:'https://paperless-gpt.example/',title:'Paper-LLM'},global:{mocks:{$store:{getters:{appConfig:{}}}}}});
  try {
    await wrapper.find('img').trigger('error');
    expect(wrapper.find('img').attributes('src')).toBe('/portal-icons/paperless-gpt.svg');
    expect(wrapper.find('img').attributes('crossorigin')).toBeUndefined();
  } finally {wrapper.unmount();delete window.__KH_CLOUD_AUTH;}
});
it('does not contact a protected Paperless-GPT favicon for automatic icons',async()=>{
  discoverSiteIcon.mockClear();
  const wrapper=shallowMount(ItemIcon,{props:{icon:'auto',url:'https://paperless-gpt.example/',title:'Paper-LLM'},global:{mocks:{$store:{getters:{appConfig:{}}}}}});
  expect(wrapper.find('img').attributes('src')).toBe('/portal-icons/paperless-gpt.svg');
  expect(discoverSiteIcon).not.toHaveBeenCalled();wrapper.unmount();
});
