import {applyTheme} from '@/utils/Theming';

afterEach(()=>{
 document.documentElement.removeAttribute('data-theme');
 document.documentElement.removeAttribute('style');
});

it('updates a built-in theme directly without clearing its theme attribute first',()=>{
 const root=document.documentElement;
 root.setAttribute('data-theme','matrix');
 const remove=vi.spyOn(root,'removeAttribute');
 applyTheme('dracula');
 expect(root.dataset.theme).toBe('dracula');
 expect(remove).not.toHaveBeenCalledWith('data-theme');
 remove.mockRestore();
});

it('does not rewrite identical custom properties and clears only obsolete theme overrides',()=>{
 const root=document.documentElement;
 root.style.setProperty('--primary','#ff0000');
 root.style.setProperty('--background','#ffffff');
 root.style.setProperty('--unrelated','42px');
 const set=vi.spyOn(root.style,'setProperty'),remove=vi.spyOn(root.style,'removeProperty');
 applyTheme('dracula',{customColors:{dracula:{primary:'#ff0000'}}});
 expect(set).not.toHaveBeenCalledWith('--primary','#ff0000');
 expect(remove).toHaveBeenCalledWith('--background');
 expect(root.style.getPropertyValue('--unrelated')).toBe('42px');
 set.mockRestore();remove.mockRestore();
});

it('suppresses layout transitions for two frames and resumes interactions after rapid theme changes',()=>{
 const frames=new Map();let id=0;
 vi.stubGlobal('requestAnimationFrame',callback=>{frames.set(++id,callback);return id;});
 vi.stubGlobal('cancelAnimationFrame',key=>frames.delete(key));
 const frame=()=>{const callbacks=[...frames.values()];frames.clear();callbacks.forEach(callback=>callback());};
 try {
   applyTheme('matrix');applyTheme('dracula');
   expect(frames.size).toBe(1);
   expect(document.documentElement.hasAttribute('data-theme-switching')).toBe(true);
   frame();frame();
   expect(document.documentElement.hasAttribute('data-theme-switching')).toBe(false);
   expect(document.documentElement.dataset.theme).toBe('dracula');
 } finally {vi.unstubAllGlobals();}
});
