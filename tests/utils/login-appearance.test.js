import { resolveLoginAppearance } from '@/utils/LoginAppearance';
import { publicLoginAppearance } from '../../cloud/login-appearance.mjs';
const storage=values=>({getItem:key=>values[key]||null});
it('follows day and night themes on a new device and preserves local choice',()=>{
 const remote={theme:'nord-frost',dayTheme:'material-original',nightTheme:'dracula'};
 expect(resolveLoginAppearance(remote,storage({}),false).theme).toBe('material-original');
 expect(resolveLoginAppearance(remote,storage({}),true).theme).toBe('dracula');
 expect(resolveLoginAppearance(remote,storage({theme:'matrix'}),true).theme).toBe('matrix');
});
it('rejects unknown and external themes, and survives unavailable browser storage',()=>{
 expect(resolveLoginAppearance({theme:'https://private.example/theme.css'},storage({theme:'__proto__'})).theme).toBe('nord-frost');
 expect(resolveLoginAppearance({theme:'dracula'},{getItem(){throw new Error('disabled');}}).theme).toBe('dracula');
});
it('applies only safe local color values, using the same local-over-config map precedence as the portal',()=>{
 const appearance=resolveLoginAppearance({theme:'matrix',customColors:{matrix:{primary:'#00ff00',background:'#101010'}}},storage({customColors:JSON.stringify({matrix:{primary:'#ff44aa',foreground:'url(https://private.example/secret)', 'font-body':'private-font'}})}));
 expect(appearance.customColors.matrix).toEqual({primary:'#ff44aa'});
 expect(publicLoginAppearance({theme:'matrix',customColors:{matrix:{primary:'red; background:url(secret)',background:'rgb(0 0 0)',foreground:'#eeeeee'}}}).customColors.matrix).toEqual({background:'rgb(0 0 0)',foreground:'#eeeeee'});
});
