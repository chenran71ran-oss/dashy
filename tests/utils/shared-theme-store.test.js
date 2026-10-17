import store from '@/store';
import request from '@/utils/request';
import Keys from '@/utils/StoreMutations';
vi.mock('@/utils/request',()=>({default:{get:vi.fn()}}));
beforeEach(()=>{
 window.__KH_CLOUD_AUTH=true;
 const values={theme:'dracula',appConfig:JSON.stringify({theme:'matrix',customColors:{matrix:{primary:'#ff0099'}},layout:'vertical'}),'theme-lab':'nord'};
 vi.stubGlobal('localStorage',{getItem:key=>values[key]||null,setItem:vi.fn(),removeItem:vi.fn()});
 store.state.editMode=false;store.state.currentConfigInfo={};
 store.commit(Keys.SET_ROOT_CONFIG,{appConfig:{theme:'material-original',dayTheme:'matrix',nightTheme:'dracula'},sections:[{name:'Links',items:[]}],pages:[{name:'Lab',path:'/lab.yml'}]});
});
afterEach(()=>{delete window.__KH_CLOUD_AUTH;vi.unstubAllGlobals();});
it('loads the shared root theme despite old local settings, then follows another device refresh',async()=>{
 await store.dispatch(Keys.INITIALIZE_CONFIG);
 expect(store.getters.theme).toBe('material-original');expect(store.getters.appConfig.layout).toBe('vertical');
 store.commit(Keys.SET_ROOT_CONFIG,{...store.state.rootConfig,appConfig:{theme:'zinc'}});
 await store.dispatch(Keys.INITIALIZE_CONFIG);
 expect(store.getters.theme).toBe('zinc');
});
it('subpages inherit the root appearance rather than their cached or file theme',async()=>{
 request.get.mockResolvedValue({data:{appConfig:{theme:'matrix',customColors:{matrix:{primary:'#ff0000'}}},sections:[]}});
 await store.dispatch(Keys.INITIALIZE_CONFIG,'lab');
 expect(store.getters.theme).toBe('material-original');expect(store.getters.appConfig.customColors).toBeUndefined();
 const before=store.state.config.sections;
 store.commit(Keys.SET_SHARED_THEME,{theme:'dracula'});
 expect(store.getters.theme).toBe('dracula');expect(store.state.rootConfig.appConfig.theme).toBe('dracula');
 expect(store.state.config.sections).toBe(before);expect(store.state.rootConfig.appConfig.dayTheme).toBeUndefined();
});
