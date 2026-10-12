import { websiteFavicon } from './PortalIcons.js';
import { officialSiteIcons } from '../../cloud/icon-catalog.mjs';
const cache=new Map();
export function siteIconOrigin(url) {
  try { const u=new URL(url);if(u.protocol!=='https:' || u.username || u.password)return '';return u.origin; }
  catch { return ''; }
}
export async function discoverSiteIcon(url,{force=false,page=false,fetcher=fetch}={}) {
  const origin=siteIconOrigin(url);if(!origin)return {icon:websiteFavicon(url),source:'favicon',verified:false};
  // Explicit reads may inspect the bookmarked page, but never its query or fragment.
  const target=new URL(url);target.search='';target.hash='';
  const key=page?target.href:origin;
  const stored=cache.get(key);if(!force && stored?.expires>Date.now())return stored.promise;
  const promise=(async()=>{
    try {
      const response=await fetcher('/api/icon-discovery',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(page?{origin,page:target.href}:{origin}),signal:AbortSignal.timeout(8000)});
      if(!response.ok)throw new Error('Icon unavailable');const data=await response.json();
      let icon='';try{const u=new URL(data.icon);if(u.protocol==='https:' && !u.username && !u.password)icon=u.href;}catch{}
      if(typeof data.icon==='string' && data.icon.startsWith('/portal-icons/') && Object.values(officialSiteIcons).includes(data.icon))icon=data.icon;
      return {icon:icon||websiteFavicon(url),source:icon?data.source:'unavailable',reason:data.reason,verified:!!icon && data.verified!==false};
    }catch{return {icon:websiteFavicon(url),source:'unavailable',reason:'request',verified:false};}
  })();
  if(cache.size>=64)cache.delete(cache.keys().next().value);
  cache.set(key,{promise,expires:Date.now()+600000});return promise;
}
