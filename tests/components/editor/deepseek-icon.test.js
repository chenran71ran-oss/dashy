import { shallowMount } from '@vue/test-utils';
import ItemIcon from '@/components/LinkItems/ItemIcon.vue';
vi.mock('@/assets/interface-icons/broken-icon.svg',()=>({default:{template:'<span />'}}));
const mountIcon=(icon,url,title)=>shallowMount(ItemIcon,{props:{icon,url,title,size:'small'},global:{mocks:{$store:{getters:{appConfig:{}}}}}});
it('renders the official blue DeepSeek mark on a transparent background',()=>{
  const wrapper=mountIcon('portal-deepseek','https://platform.deepseek.com/','DeepSeek API');
  expect(wrapper.find('.glyph-icon').exists()).toBe(false);
  expect(wrapper.find('img').attributes('src')).toBe('/portal-icons/brand/deepseek.svg');
  expect(wrapper.html()).not.toContain('monochrome-brand');
  expect(wrapper.find('.icon-monogram').exists()).toBe(false);
  wrapper.unmount();
});
it('draws single-colour brand marks in the theme text colour instead of on a white tile',()=>{
  for(const [icon,url,mask] of [['portal-chatgpt','https://chatgpt.com/','/portal-icons/chatgpt-official.svg'],['portal-github','https://github.com/','/portal-icons/brand/github.svg'],['portal-x','https://x.com/','/portal-icons/brand/x.svg']]){
    const wrapper=mountIcon(icon,url,'Brand');
    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.find('.glyph-icon').attributes('style')).toContain(mask);
    wrapper.unmount();
  }
  const tiktok=mountIcon('portal-tiktok','https://www.tiktok.com/','TikTok');
  expect(tiktok.find('.glyph-stack').attributes('style')).toContain('/portal-icons/brand/tiktok-under.svg');
  tiktok.unmount();
});
