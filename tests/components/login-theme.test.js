import { mount,flushPromises } from '@vue/test-utils';
import CloudLogin from '@/CloudLogin.vue';
vi.mock('@/components/PageStrcture/MechLogo.vue',()=>({default:{template:'<img alt="Home Lab 像素高达标识" />'}}));
beforeEach(()=>{vi.stubGlobal('localStorage',{getItem:vi.fn().mockReturnValue(null)});vi.stubGlobal('fetch',vi.fn(async url=>Response.json(url==='/api/login-appearance'?{theme:'material-original'}:{ok:true})));});
afterEach(()=>{vi.unstubAllGlobals();document.documentElement.removeAttribute('data-theme');});
it('uses this browser theme ahead of the saved cloud theme and offers an accessible password reveal',async()=>{
  localStorage.getItem.mockImplementation(key=>key==='theme'?'dracula':null);
  const wrapper=mount(CloudLogin);await flushPromises();
  expect(document.documentElement.dataset.theme).toBe('dracula');
  const input=wrapper.get('input[name="password"]');expect(input.attributes('type')).toBe('password');
  await wrapper.get('button[aria-label="显示密码"]').trigger('click');expect(input.attributes('type')).toBe('text');
  wrapper.unmount();
});
it('loads the cloud theme on a new browser and keeps login POSTs unchanged',async()=>{
  const wrapper=mount(CloudLogin);await flushPromises();
  expect(document.documentElement.dataset.theme).toBe('material-original');
  await wrapper.get('input').setValue('test-password');await wrapper.get('form').trigger('submit');await flushPromises();
  expect(fetch).toHaveBeenCalledWith('/api/login',expect.objectContaining({method:'POST',credentials:'same-origin',body:JSON.stringify({password:'test-password'})}));
  expect(wrapper.emitted('authenticated')).toHaveLength(1);wrapper.unmount();
});
it('shows errors without navigating or replacing the submitted password',async()=>{
  fetch.mockImplementation(async url=>url==='/api/login-appearance'?Response.json({theme:'nord-frost'}):Response.json({error:'管理员密码不正确'},{status:401}));
  const wrapper=mount(CloudLogin);await flushPromises();await wrapper.get('input').setValue('wrong');await wrapper.get('form').trigger('submit');await flushPromises();
  expect(wrapper.get('[role="alert"]').text()).toContain('管理员密码不正确');expect(wrapper.emitted('authenticated')).toBeUndefined();expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined();wrapper.unmount();
});
