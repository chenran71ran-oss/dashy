import { shallowMount } from '@vue/test-utils';
import ItemIcon from '@/components/LinkItems/ItemIcon.vue';
vi.mock('@/assets/interface-icons/broken-icon.svg',()=>({default:{template:'<span />'}}));
it('renders the official DeepSeek API image without a theme foreground mask',()=>{
  const wrapper=shallowMount(ItemIcon,{props:{icon:'portal-deepseek',url:'https://platform.deepseek.com/',title:'DeepSeek API',size:'small'},global:{mocks:{$store:{getters:{appConfig:{}}}}}});
  expect(wrapper.find('.glyph-icon').exists()).toBe(false);
  expect(wrapper.find('img').attributes('src')).toBe('/portal-icons/deepseek.svg');
  expect(wrapper.classes()).toContain('monochrome-brand');
  expect(wrapper.find('.icon-monogram').exists()).toBe(false);
  wrapper.unmount();
});
