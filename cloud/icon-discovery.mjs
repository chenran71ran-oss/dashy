// Reads public homepage icon metadata. Never forwards session cookies or site URL tokens.
const dnsCache = new Map();
const blockedHost = /(^|\.)(localhost|local|internal|home|lan|invalid)$/i;
export function publicIconUrl(value, base) {
  const u = new URL(value, base);
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) throw new Error('Public HTTPS site required');
  u.hostname = u.hostname.replace(/\.$/, '');
  if (!u.hostname.includes('.') || blockedHost.test(u.hostname) || u.hostname.startsWith('[') || /^\d+(\.\d+){3}$/.test(u.hostname)) throw new Error('Public hostname required');
  u.hash = ''; return u;
}
export function isPublicAddress(value) {
  if (value.includes(':')) {
    // Only global unicast IPv6. IPv4-mapped, loopback, link-local and ULA are excluded.
    return /^[23][0-9a-f]{3}:/i.test(value) && !/^2001:(?:db8|0):/i.test(value);
  }
  const parts = value.split('.').map(Number);
  if (parts.length !== 4 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a,b,c] = parts;
  return !(a===0 || a===10 || a===127 || a>=224 || (a===100 && b>=64 && b<=127)
    || (a===169 && b===254) || (a===172 && b>=16 && b<=31) || (a===192 && (b===168 || b===0 || b===2))
    || (a===198 && (b===18 || b===19 || b===51 && c===100)) || (a===203 && b===0 && c===113));
}
async function checkDns(host, fetcher, signal, useCache) {
  if (useCache && dnsCache.get(host)>Date.now()) return;
  const results=await Promise.all(['A','AAAA'].map(async type=>{
    const response=await fetcher(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`, {headers:{Accept:'application/dns-json'},redirect:'error',signal});
    if(!response.ok)throw new Error('DNS unavailable');
    const data=await response.json(); if(data.Status!==0)throw new Error('DNS unavailable');
    return (data.Answer||[]).filter(a=>a.type===1 || a.type===28).map(a=>a.data);
  }));
  const addresses=results.flat(); if(!addresses.length || addresses.some(a=>!isPublicAddress(a)))throw new Error('Non-public host');
  if(useCache){if(dnsCache.size>=64)dnsCache.delete(dnsCache.keys().next().value);dnsCache.set(host,Date.now()+60000);}
}
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map(m=>[m[1].toLowerCase(),m[2]??m[3]??m[4]]));
export function extractIconLinks(html) {
  // Node test fallback. Production uses the Worker's HTMLRewriter below.
  const head=html.split(/<body[\s>]/i)[0].replace(/<!--[\s\S]*?-->|<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'');
  return [...head.matchAll(/<link\b[^>]*>/gi)].map(m=>attrs(m[0])).filter(a=>a.href && /(^|\s)(icon|apple-touch-icon)(\s|$)/i.test(a.rel||''));
}
async function parseLinks(html) {
  if(typeof HTMLRewriter==='undefined')return extractIconLinks(html);
  const entries=[];
  const rewriter=new HTMLRewriter().on('head link', {element(e){
    const rel=e.getAttribute('rel')||'', href=e.getAttribute('href');
    if(href && /(^|\s)(icon|apple-touch-icon)(\s|$)/i.test(rel))entries.push({rel,href,type:e.getAttribute('type')||'',sizes:e.getAttribute('sizes')||''});
  }});
  await rewriter.transform(new Response(html,{headers:{'content-type':'text/html'}})).text();return entries;
}
async function limitedHtml(response) {
  const reader=response.body?.getReader(); if(!reader)return '';
  const chunks=[];let size=0;
  try { while(size<65536){const {value,done}=await reader.read();if(done)break;const part=value.slice(0,65536-size);chunks.push(part);size+=part.length;} }
  finally { await reader.cancel().catch(()=>{}); }
  const bytes=new Uint8Array(size);let at=0;for(const part of chunks){bytes.set(part,at);at+=part.length;}return new TextDecoder().decode(bytes);
}
export async function discoverIcon(value, fetcher=fetch) {
  const root=publicIconUrl(value); root.pathname='/';root.search='';
  const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),6500);
  let stage='dns';
  try {
    let target=root, response;
    for(let redirects=0;redirects<=2;redirects++){
      stage='dns';
      await checkDns(target.hostname,fetcher,controller.signal,fetcher===fetch);
      stage='request';
      response=await fetcher(target.href,{method:'GET',redirect:'manual',credentials:'omit',signal:controller.signal,headers:{Accept:'text/html',Range:'bytes=0-65535'}});
      if(![301,302,303,307,308].includes(response.status))break;
      const location=response.headers.get('location');await response.body?.cancel();
      if(!location || redirects===2)throw new Error('Redirect unavailable');
      // Public redirects may select a locale path. Queries never come from the user's bookmark.
      target=publicIconUrl(location,target);target.search='';
    }
    if(!response.ok || !(response.headers.get('content-type')||'').toLowerCase().includes('html'))return {icon:`${root.origin}/favicon.ico`,source:'favicon',reason:response.ok?'not-html':`http-${response.status}`};
    stage='html';
    const links=await parseLinks(await limitedHtml(response));
    const candidates=links.map(entry=>{
      try { const url=publicIconUrl(entry.href.replace(/&amp;/g,'&'),target);return {...entry,icon:url.href,
        score:(/(^|\s)icon(\s|$)/i.test(entry.rel)?300:0)+(/svg/i.test(entry.type||url.pathname)?128:0)+Math.min(parseInt(entry.sizes)||0,192)}; }
      catch { return null; }
    }).filter(Boolean).sort((a,b)=>b.score-a.score);
    return {icon:candidates[0]?.icon||`${target.origin}/favicon.ico`,source:candidates.length?'site':'favicon'};
  } catch(error) { error.iconReason=controller.signal.aborted?'timeout':stage;throw error; }
  finally { clearTimeout(timer); }
}
