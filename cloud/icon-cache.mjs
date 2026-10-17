const encoder=new TextEncoder();
export async function iconCacheKey(url) {
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(url)));
  const hash=btoa(String.fromCharCode(...digest)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  return `kenneth-home:icon:${hash}`;
}
export async function cacheIconAsset(kv,url,{bytes,mime}) {
  if(!kv)return;
  let binary='';for(let at=0;at<bytes.length;at+=8192)binary+=String.fromCharCode(...bytes.slice(at,at+8192));
  await kv.put(await iconCacheKey(url),JSON.stringify({mime,body:btoa(binary)}),{expirationTtl:86400});
}
