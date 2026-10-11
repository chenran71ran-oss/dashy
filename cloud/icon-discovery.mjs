// Reads public homepage icon metadata. Never forwards session cookies or site URL tokens.
import { officialSiteIcons, officialApplicationIcons } from './icon-catalog.mjs';
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
export function imageMime(bytes) {
  const starts=(values)=>values.every((value,i)=>bytes[i]===value);
  const text=new TextDecoder().decode(bytes.slice(0,1024));
  if(starts([137,80,78,71,13,10,26,10]))return 'image/png';
  if(starts([255,216,255]))return 'image/jpeg';
  if(/^GIF8[79]a/.test(text))return 'image/gif';
  if(text.startsWith('RIFF') && text.slice(8,12)==='WEBP')return 'image/webp';
  if(starts([0,0,1,0]))return 'image/x-icon';
  if(text.slice(4,8)==='ftyp' && /avif|avis/.test(text.slice(8,32)))return 'image/avif';
  if(/^\s*(?:<\?xml[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg(?:\s|>)/i.test(text))return 'image/svg+xml';
  return '';
}
async function checkDns(host, fetcher, signal, useCache) {
  if (useCache && dnsCache.get(host)>Date.now()) return;
  const results=await Promise.all(['A','AAAA'].map(async type=>{
    // Reject redirects via status, using the mode supported by outbound Worker requests.
    const response=await fetcher(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`, {headers:{Accept:'application/dns-json'},redirect:'manual',signal});
    if(!response.ok)throw new Error('DNS unavailable');
    const data=await response.json(); if(data.Status!==0)throw new Error('DNS unavailable');
    return (data.Answer||[]).filter(a=>a.type===1 || a.type===28).map(a=>a.data);
  }));
  const addresses=results.flat(); if(!addresses.length || addresses.some(a=>!isPublicAddress(a)))throw new Error('Non-public host');
  if(useCache){if(dnsCache.size>=64)dnsCache.delete(dnsCache.keys().next().value);dnsCache.set(host,Date.now()+60000);}
}
export async function fetchPublicIcon(value, fetcher=fetch, {signal}={}) {
  let target=publicIconUrl(value);
  const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),6500);
  const abort=()=>controller.abort();
  if(signal?.aborted)controller.abort();
  signal?.addEventListener('abort',abort,{once:true});
  try {
    for(let redirects=0;redirects<=2;redirects++) {
      await checkDns(target.hostname,fetcher,controller.signal,fetcher===fetch);
      const response=await fetcher(target.href,{redirect:'manual',credentials:'omit',signal:controller.signal,headers:{Accept:'image/*'}});
      if([301,302,303,307,308].includes(response.status)) {
        const location=response.headers.get('location');await response.body?.cancel();
        if(!location || redirects===2)throw new Error('Redirect unavailable');
        target=publicIconUrl(location,target);continue;
      }
      const mime=(response.headers.get('content-type')||'').split(';')[0].toLowerCase();
      if(!response.ok || !['image/png','image/jpeg','image/webp','image/gif','image/svg+xml','image/x-icon','image/vnd.microsoft.icon','image/avif','application/octet-stream','binary/octet-stream'].includes(mime))throw new Error('Image unavailable');
      const reader=response.body?.getReader();if(!reader)throw new Error('Empty image');
      const chunks=[];let size=0;
      try { while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>524288)throw new Error('Image too large');chunks.push(value);} }
      finally { await reader.cancel().catch(()=>{}); }
      const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
      const detected=imageMime(bytes);
      if(!detected)throw new Error('Invalid image');
      return {bytes,mime:detected};
    }
    throw new Error('Image unavailable');
  } finally { clearTimeout(timer); signal?.removeEventListener('abort',abort); }
}
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map(m=>[m[1].toLowerCase(),m[2]??m[3]??m[4]]));
export function extractIconLinks(html) {
  // Node test fallback. Production uses the Worker's HTMLRewriter below.
  const head=html.split(/<body[\s>]/i)[0].replace(/<!--[\s\S]*?-->|<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'');
  return [...head.matchAll(/<link\b[^>]*>/gi)].map(m=>attrs(m[0])).filter(a=>a.href && /(^|\s)(icon|apple-touch-icon)(\s|$)/i.test(a.rel||''));
}
async function parseLinks(html) {
  if(typeof HTMLRewriter==='undefined') {
    const head=html.split(/<body[\s>]/i)[0].replace(/<!--[\s\S]*?-->|<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'');
    const base=head.match(/<base\b[^>]*>/i);
    const product=[...head.matchAll(/<meta\b[^>]*>/gi)].map(m=>attrs(m[0])).find(a=>/^(keywords|generator)$/i.test(a.name||'') && /\bkomari(?:\b|-theme)/i.test(a.content||''))?'komari':'';
    return {product,base:base?attrs(base[0]).href:'',entries:[...head.matchAll(/<link\b[^>]*>/gi)].map(m=>attrs(m[0])).filter(a=>a.href && /(^|\s)(icon|apple-touch-icon|manifest)(\s|$)/i.test(a.rel||''))};
  }
  const entries=[];
  let base='',product='';
  const rewriter=new HTMLRewriter().on('head link', {element(e){
    const rel=e.getAttribute('rel')||'', href=e.getAttribute('href');
    if(href && /(^|\s)(icon|apple-touch-icon|manifest)(\s|$)/i.test(rel))entries.push({rel,href,type:e.getAttribute('type')||'',sizes:e.getAttribute('sizes')||''});
  }}).on('head base',{element(e){base ||= e.getAttribute('href')||'';}})
    .on('head meta',{element(e){if(/^(keywords|generator)$/i.test(e.getAttribute('name')||'') && /\bkomari(?:\b|-theme)/i.test(e.getAttribute('content')||''))product='komari';}});
  await rewriter.transform(new Response(html,{headers:{'content-type':'text/html'}})).text();return {base,entries,product};
}
async function limitedHtml(response) {
  const reader=response.body?.getReader(); if(!reader)return '';
  const chunks=[];let size=0;
  try { while(size<65536){const {value,done}=await reader.read();if(done)break;const part=value.slice(0,65536-size);chunks.push(part);size+=part.length;} }
  finally { await reader.cancel().catch(()=>{}); }
  const bytes=new Uint8Array(size);let at=0;for(const part of chunks){bytes.set(part,at);at+=part.length;}return new TextDecoder().decode(bytes);
}
export async function discoverIcon(value, fetcher=fetch, {page=false}={}) {
  const root=publicIconUrl(value); if(!page)root.pathname='/';root.search='';
  const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),6500);
  let stage='dns';
  try {
    // Account-specific console hosts use the vendor's public logo, not a login favicon.
    const consoleIcon=(root.hostname==='console.aws.amazon.com'||root.hostname.endsWith('.console.aws.amazon.com'))&&officialSiteIcons['console.aws.amazon.com'];
    if(consoleIcon) {
      try {await fetchPublicIcon(consoleIcon,fetcher,{signal:controller.signal});return {icon:consoleIcon,source:'catalog',verified:true};}
      catch(error){if(controller.signal.aborted)throw error;}
    }
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
    let reason='', candidates=[];
    if(response.ok && (response.headers.get('content-type')||'').toLowerCase().includes('html')) {
      stage='html';
      const metadata=await parseLinks(await limitedHtml(response));
      let base=target;try { if(metadata.base)base=publicIconUrl(metadata.base,target); }catch{}
      const links=metadata.entries.filter(e=>!/(^|\s)manifest(\s|$)/i.test(e.rel));
      candidates=links.map(entry=>{
        try { const url=publicIconUrl(entry.href.replace(/&amp;/g,'&'),base);return {...entry,icon:url.href,source:'site',
          score:(/(^|\s)icon(\s|$)/i.test(entry.rel)?300:0)+(/svg/i.test(entry.type||url.pathname)?128:0)+Math.min(parseInt(entry.sizes)||0,192)}; }
        catch { return null; }
      }).filter(Boolean).sort((a,b)=>b.score-a.score).slice(0,5);
      // Apps may expose their only real logo through the PWA manifest.
      for(const entry of metadata.entries.filter(e=>/(^|\s)manifest(\s|$)/i.test(e.rel)).slice(0,1)) {
        try {
          const manifest=publicIconUrl(entry.href.replace(/&amp;/g,'&'),base);
          await checkDns(manifest.hostname,fetcher,controller.signal,fetcher===fetch);
          const result=await fetcher(manifest.href,{redirect:'manual',credentials:'omit',signal:controller.signal,headers:{Accept:'application/manifest+json, application/json'}});
          if(!result.ok || !/(json|manifest)/i.test(result.headers.get('content-type')||'')){await result.body?.cancel();continue;}
          const data=JSON.parse(await limitedHtml(result));
          if(Array.isArray(data.icons))candidates.push(...data.icons.slice(0,16).map(e=>{
            try{return {icon:publicIconUrl(e.src,manifest).href,source:'manifest',score:Math.min(parseInt(e.sizes)||0,512)};}catch{return null;}
          }).filter(Boolean).sort((a,b)=>b.score-a.score).slice(0,3));
        }catch(error){if(controller.signal.aborted)throw error;}
      }
      const application=officialApplicationIcons[metadata.product];
      if(application)candidates.push({icon:application,source:'catalog'});
    } else {
      reason=response.ok?'not-html':`http-${response.status}`;
      await response.body?.cancel();
    }
    const known=officialSiteIcons[root.hostname];
    if(known)candidates.push({icon:known,source:'catalog'});
    if(page)candidates.push({icon:new URL('favicon.ico',target).href,source:'favicon'});
    candidates.push({icon:`${target.origin}/favicon.ico`,source:'favicon'});
    stage='image';
    const seen=new Set();
    for(const candidate of candidates) {
      if(seen.has(candidate.icon))continue;seen.add(candidate.icon);
      try {
        await fetchPublicIcon(candidate.icon,fetcher,{signal:controller.signal});
        return {icon:candidate.icon,source:candidate.source,verified:true,...(reason?{reason}:{})};
      } catch(error) { if(controller.signal.aborted)throw error; }
    }
    return {icon:'',source:'unavailable',verified:false,reason:reason||'no-icon'};
  } catch(error) { error.iconReason=controller.signal.aborted?'timeout':stage;throw error; }
  finally { clearTimeout(timer); }
}
