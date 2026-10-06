import { websiteFavicon } from './PortalIcons.js';
const cache=new Map();
export function siteIconOrigin(url) {
  try { const u=new URL(url);if(u.protocol!=='https:' || u.username || u.password)return '';return u.origin; }
  catch { return ''; }
}
export async function discoverSiteIcon(url,{force=false,fetcher=fetch}={}) {
  const origin=siteIconOrigin(url);if(!origin)return {icon:websiteFavicon(url),source:'favicon'};
  const stored=cache.get(origin);if(!force && stored?.expires>Date.now())return stored.promise;
  const promise=(async()=>{
    try {
      const response=await fetcher('/api/icon-discovery',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({origin}),signal:AbortSignal.timeout(8000)});
      if(!response.ok)throw new Error('Icon unavailable');const data=await response.json();
      let icon='';try{const u=new URL(data.icon);if(u.protocol==='https:' && !u.username && !u.password)icon=u.href;}catch{}
      return {icon:icon||websiteFavicon(url),source:icon?data.source:'unavailable',reason:data.reason};
    }catch{return {icon:websiteFavicon(url),source:'unavailable',reason:'request'};}
  })();
  if(cache.size>=64)cache.delete(cache.keys().next().value);
  cache.set(origin,{promise,expires:Date.now()+600000});return promise;
}
