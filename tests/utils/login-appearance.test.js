import { resolveLoginAppearance } from '@/utils/LoginAppearance';
import { publicLoginAppearance } from '../../cloud/login-appearance.mjs';
const storage=values=>({getItem:key=>values[key]||null});
it('keeps desktop and mobile on the saved portal theme despite stale local or OS choices',()=>{
 const remote={theme:'material-original',dayTheme:'nord-frost',nightTheme:'dracula'};
 expect(resolveLoginAppearance(remote,storage({theme:'matrix'}),false).theme).toBe('material-original');
 expect(resolveLoginAppearance(remote,storage({theme:'dracula'}),true).theme).toBe('material-original');
});
it('rejects unknown themes and is independent of browser storage availability',()=>{
 expect(resolveLoginAppearance({theme:'https://private.example/theme.css'},storage({theme:'__proto__'})).theme).toBe('nord-frost');
 expect(resolveLoginAppearance({theme:'dracula'},{getItem(){throw new Error('disabled');}}).theme).toBe('dracula');
});
it('uses shared custom colors and ignores stale local palettes',()=>{
 const appearance=resolveLoginAppearance({theme:'matrix',customColors:{matrix:{primary:'#00ff00',background:'#101010'}}},storage({customColors:JSON.stringify({matrix:{primary:'#ff44aa'}})}));
 expect(appearance.customColors.matrix).toEqual({primary:'#00ff00',background:'#101010'});
 expect(publicLoginAppearance({theme:'matrix',customColors:{matrix:{primary:'red; background:url(secret)',background:'rgb(0 0 0)',foreground:'#eeeeee'}}}).customColors.matrix).toEqual({background:'rgb(0 0 0)',foreground:'#eeeeee'});
});
