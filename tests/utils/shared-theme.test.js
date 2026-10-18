import {withSharedAppearance,withoutLocalAppearance} from '@/utils/SharedTheme';
import ThemingMixin from '@/mixins/ThemingMixin';
import {applyTheme} from '@/utils/Theming';
import Keys from '@/utils/StoreMutations';

it('ignores stale local/subpage appearance while retaining unrelated preferences',()=>{
 expect(withoutLocalAppearance({theme:'dracula',customColors:{},layout:'vertical'})).toEqual({layout:'vertical'});
 expect(withSharedAppearance({theme:'matrix',dayTheme:'dracula',customColors:{matrix:{}},layout:'vertical'},{theme:'material-original'})).toEqual({theme:'material-original',layout:'vertical'});
});
it('previews immediately while persisting the shared theme, and clears previews on success or failure',async()=>{
 window.__KH_CLOUD_AUTH=true;
 const commit=vi.fn(),context={selectedTheme:'material-original',$store:{state:{editMode:false},commit}};
 vi.stubGlobal('fetch',vi.fn(async()=>Response.json({theme:'material-original'})));
 const saving=ThemingMixin.methods.themeChangedInUI.call(context);
 expect(commit).toHaveBeenCalledWith(Keys.SET_THEME_PREVIEW,'material-original');
 expect(commit).not.toHaveBeenCalledWith(Keys.SET_SHARED_THEME,expect.anything());
 await saving;
 expect(fetch).toHaveBeenCalledWith('/api/theme',expect.objectContaining({method:'PATCH',credentials:'same-origin',body:'{"theme":"material-original"}'}));
 expect(commit).toHaveBeenCalledWith(Keys.SET_SHARED_THEME,{theme:'material-original'});
 expect(commit).toHaveBeenLastCalledWith(Keys.SET_THEME_PREVIEW,null);
 fetch.mockResolvedValue(Response.json({error:'保存失败'},{status:503}));commit.mockClear();
 await expect(ThemingMixin.methods.themeChangedInUI.call(context)).rejects.toThrow('保存失败');
 expect(commit).not.toHaveBeenCalledWith(Keys.SET_SHARED_THEME,expect.anything());
 expect(commit).toHaveBeenLastCalledWith(Keys.SET_THEME_PREVIEW,null);
 delete window.__KH_CLOUD_AUTH;vi.unstubAllGlobals();
});
it('does not apply obsolete browser custom colors in cloud mode',()=>{
 window.__KH_CLOUD_AUTH=true;
 vi.stubGlobal('localStorage',{customColors:JSON.stringify({matrix:{primary:'#ff0099'}})});
 applyTheme('matrix',{customColors:{matrix:{primary:'#00ff00'}}});
 expect(document.documentElement.style.getPropertyValue('--primary')).toBe('#00ff00');
 delete window.__KH_CLOUD_AUTH;document.documentElement.style.removeProperty('--primary');vi.unstubAllGlobals();
});
