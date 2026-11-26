const encoder=new TextEncoder();
// Website icons rarely change at the same address. Three days keeps them on hand between
// daily visits; an icon replaced at the same address shows within three days.
export const ICON_CACHE_SECONDS=3*86400;
// The browser keeps a proxied icon for a day, so a cold start the next morning still hits KV, not the website.
export const ICON_BROWSER_SECONDS=86400;
export async function iconCacheKey(url) {
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(url)));
  const hash=btoa(String.fromCharCode(...digest)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  return `kenneth-home:icon:${hash}`;
}
export async function cacheIconAsset(kv,url,{bytes,mime}) {
  if(!kv)return;
  let binary='';for(let at=0;at<bytes.length;at+=8192)binary+=String.fromCharCode(...bytes.slice(at,at+8192));
  await kv.put(await iconCacheKey(url),JSON.stringify({mime,body:btoa(binary)}),{expirationTtl:ICON_CACHE_SECONDS});
}
