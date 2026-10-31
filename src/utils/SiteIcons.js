import { websiteFavicon } from './PortalIcons.js';
import { officialSiteIcons } from '../../cloud/icon-catalog.mjs';
import { iconCrossOrigin } from './IconImagePolicy.js';
const cache=new Map();
const CACHE_LIMIT=512;
const VERIFIED_TTL=600000;
// Transient failures retry soon; a site without public icon metadata is not
// re-read by every remounted card or category switch for five minutes.
const RETRY_TTL=5000;
const MISSING_TTL=300000;
const transientReasons=new Set(['request','timeout','dns','login-required','http-429']);
const resultTtl=result=>result.verified?VERIFIED_TTL:(transientReasons.has(result.reason)||/^http-5/.test(result.reason||'')?RETRY_TTL:MISSING_TTL);
function remember(key,entry) {
  if(cache.has(key))cache.delete(key);
  else if(cache.size>=CACHE_LIMIT) {
    // Drop expired entries first, then the oldest one, so the map stays bounded.
    const now=Date.now();
    for(const [stale,value] of cache)if(value.result && value.expires<=now)cache.delete(stale);
    if(cache.size>=CACHE_LIMIT)cache.delete(cache.keys().next().value);
  }
  cache.set(key,entry);
}
function discoveryKey(url,page) {
  const origin=siteIconOrigin(url);if(!origin)return '';
  const target=new URL(url);target.search='';target.hash='';
  return page?target.href:origin;
}
// Render a warm result synchronously, before a remounted card's first paint.
export function cachedSiteIcon(url,{page=false}={}) {
  const stored=cache.get(discoveryKey(url,page));
  return stored?.expires>Date.now() && stored.result?.verified ? stored.result.icon : '';
}
export function siteIconOrigin(url) {
  try { const u=new URL(url);if(u.protocol!=='https:' || u.username || u.password)return '';return u.origin; }
  catch { return ''; }
}
export async function discoverSiteIcon(url,{force=false,page=false,fetcher=fetch}={}) {
  const origin=siteIconOrigin(url);if(!origin)return {icon:websiteFavicon(url),source:'favicon',verified:false};
  // Explicit reads may inspect the bookmarked page, but never its query or fragment.
  const target=new URL(url);target.search='';target.hash='';
  const key=discoveryKey(url,page);
  const stored=cache.get(key);if(!force && stored?.expires>Date.now())return stored.promise;
  const promise=(async()=>{
    try {
      const response=await fetcher('/api/icon-discovery',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(page?{origin,page:target.href}:{origin}),signal:AbortSignal.timeout(page?23000:8000)});
      if(!response.ok)return {icon:'',source:'unavailable',reason:response.status===401?'login-required':`http-${response.status}`,verified:false};const data=await response.json();
      let icon='';try{const u=new URL(data.icon);if(u.protocol==='https:' && !u.username && !u.password)icon=u.href;}catch{}
      if(typeof data.icon==='string' && data.icon.startsWith('/portal-icons/') && Object.values(officialSiteIcons).includes(data.icon))icon=data.icon;
      return {icon:icon||websiteFavicon(url),source:icon?data.source:'unavailable',reason:data.reason,verified:!!icon && data.verified===true};
    }catch{return {icon:websiteFavicon(url),source:'unavailable',reason:'request',verified:false};}
  })();
  remember(key,{promise,expires:Date.now()+VERIFIED_TTL});
  promise.then(result=>{const entry=cache.get(key);if(entry?.promise===promise){entry.result=result;entry.expires=Date.now()+resultTtl(result);}});
  return promise;
}

// Use the same proxy and anonymous-only fallback as the actual card.
// A byte signature alone cannot prove that Safari/Chrome can decode the image.
export async function verifySiteIcon(icon,{imageFactory=()=>new Image()}={}) {
  const paths=typeof window!=='undefined' && window.__KH_CLOUD_AUTH && /^https:\/\//i.test(icon)
    ? [`/api/icon-image?url=${encodeURIComponent(icon)}`,icon] : [icon];
  for(const path of paths) {
    const loaded=await new Promise(resolve=>{
      const image=imageFactory();
      const finish=value=>{clearTimeout(timer);image.onload=null;image.onerror=null;resolve(value);};
      const timer=setTimeout(()=>finish(false),4000);
      image.referrerPolicy='no-referrer';
      const mode=iconCrossOrigin(path);if(mode)image.crossOrigin=mode;
      image.onload=()=>finish(image.naturalWidth>0 && image.naturalHeight>0);
      image.onerror=()=>finish(false);image.src=path;
    });
    if(loaded)return true;
  }
  return false;
}
