import { shallowMount } from '@vue/test-utils';
import ItemIcon from '@/components/LinkItems/ItemIcon.vue';
vi.mock('@/assets/interface-icons/broken-icon.svg',()=>({default:{template:'<span />'}}));
it('renders the official DeepSeek silhouette in theme foreground instead of a black image or monogram',()=>{
  const wrapper=shallowMount(ItemIcon,{props:{icon:'portal-deepseek',url:'https://platform.deepseek.com/',title:'DeepSeek API',size:'small'},global:{mocks:{$store:{getters:{appConfig:{}}}}}});
  expect(wrapper.find('.glyph-icon').exists()).toBe(true);
  expect(wrapper.find('.glyph-icon').attributes('style')).toContain('/portal-icons/deepseek.svg');
  expect(wrapper.find('img').exists()).toBe(false);
  expect(wrapper.find('.icon-monogram').exists()).toBe(false);
  wrapper.unmount();
});
