import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverIcon, publicIconUrl, isPublicAddress, extractIconLinks } from '../cloud/icon-discovery.mjs';
import { discoverSiteIcon } from '../src/utils/SiteIcons.js';
import worker from '../cloud/worker.mjs';
const dns=()=>Response.json({Status:0,Answer:[{type:1,data:'8.8.8.8'}]});
test('read public homepage declarations without bookmark path/query or credentials',async()=>{
  const calls=[];
  const fetcher=async(url,options)=>{calls.push({url,options});return url.includes('/dns-query?')?dns():new Response('<head><link rel="apple-touch-icon" href="/apple.png" sizes="180x180"><link rel="icon" type="image/svg+xml" href="/icons/brand.svg?v=2&amp;x=1"></head>',{headers:{'content-type':'text/html'}});};
  const r=await discoverIcon('https://public.example/private/sub?token=secret#fragment',fetcher);
  assert.equal(r.icon,'https://public.example/icons/brand.svg?v=2&x=1');assert.equal(r.source,'site');
  const site=calls.find(c=>!c.url.includes('/dns-query?'));assert.equal(site.url,'https://public.example/');
  assert.equal(site.options.credentials,'omit');assert.equal(site.options.headers.Cookie,undefined);assert.equal(site.options.headers.Authorization,undefined);
  assert.ok(calls.every(c=>!c.url.includes('secret')&&!c.url.includes('/private')));
});
test('public redirects retain locale paths and every redirect is checked',async()=>{
  const calls=[];
  const fetcher=async(url)=>{calls.push(url);if(url.includes('/dns-query?'))return dns();if(url==='https://redirect.example/')return new Response('',{status:302,headers:{location:'https://landing.example/en/?track=1'}});return new Response('<head><link href="logo.png" rel="shortcut icon"></head>',{headers:{'content-type':'text/html'}});};
  assert.equal((await discoverIcon('https://redirect.example/',fetcher)).icon,'https://landing.example/en/logo.png');
  assert.ok(calls.includes('https://landing.example/en/'));assert.ok(!calls.some(x=>x.includes('track=1')));
  await assert.rejects(discoverIcon('https://redirect.example/',async url=>url.includes('/dns-query?')?dns():new Response('',{status:302,headers:{location:'https://127.0.0.1/'}})));
});
test('reject private, encoded IP, credential and non-HTTPS targets before fetching',async()=>{
  for(const url of ['http://public.example','https://localhost','https://127.1','https://2130706433','https://0x7f000001','https://[::1]','https://nas.lan','https://user:pass@public.example','https://public.example:8443'])assert.throws(()=>publicIconUrl(url));
  for(const ip of ['127.0.0.1','10.0.0.1','169.254.169.254','192.168.1.1','172.16.0.1','100.64.0.1','::1','fc00::1','fe80::1','2001:db8::1'])assert.equal(isPublicAddress(ip),false);
  let sites=0;await assert.rejects(discoverIcon('https://private-dns.example',async url=>{if(!url.includes('/dns-query?'))sites++;return Response.json({Status:0,Answer:[{type:1,data:'10.0.0.1'}]});}));assert.equal(sites,0);
});
test('bound HTML reads, ignore executable/comment text, and fall back to favicon',async()=>{
  assert.deepEqual(extractIconLinks('<!-- <link rel="icon" href="bad.png"> --><head><script>"<link rel=icon href=bad.png>"</script><link REL="ICON" HREF="ok.png"></head><body><link rel="icon" href="body.png">'),[{rel:'ICON',href:'ok.png'}]);
  const r=await discoverIcon('https://large.example/',async url=>url.includes('/dns-query?')?dns():new Response('x'.repeat(70000)+'<link rel="icon" href="too-late.png">',{headers:{'content-type':'text/html'}}));
  assert.equal(r.icon,'https://large.example/favicon.ico');
});
test('browser requests use origin only and coalesce repeated lookups',async()=>{
  const bodies=[];const fetcher=async(path,options)=>{bodies.push(JSON.parse(options.body));return Response.json({icon:'https://cache.example/icon.svg',source:'site'});};
  const results=await Promise.all([discoverSiteIcon('https://cache.example/sub?token=secret',{fetcher}),discoverSiteIcon('https://cache.example/other',{fetcher})]);
  assert.equal(bodies.length,1);assert.deepEqual(bodies[0],{origin:'https://cache.example'});assert.equal(results[0].icon,results[1].icon);
  await discoverSiteIcon('https://cache.example/',{fetcher,force:true});assert.equal(bodies.length,2);
});
test('discovery endpoint requires login and same origin, without writing KV',async()=>{
  let writes=0;const env={ADMIN_TOKEN:'isolated-test',HOME_KV:{get:async()=>null,put:async()=>{writes++;}},ASSETS:{fetch:async()=>new Response('')}};
  const request=(origin,cookie)=>new Request('http://127.0.0.1/api/icon-discovery',{method:'POST',headers:{'content-type':'application/json',origin,...(cookie?{cookie}:{})},body:JSON.stringify({origin:'https://localhost'})});
  assert.equal((await worker.fetch(request('http://127.0.0.1'),env)).status,401);
  const login=await worker.fetch(new Request('http://127.0.0.1/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:'isolated-test'})}),env);
  const cookie=login.headers.get('set-cookie').split(';')[0];
  assert.equal((await worker.fetch(request('https://elsewhere.example',cookie),env)).status,403);
  const response=await worker.fetch(request('http://127.0.0.1',cookie),env);
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{icon:'',source:'unavailable',reason:'public-site-required'});assert.equal(writes,0);
});
test('failed metadata lookups preserve a useful reason and still supply the root favicon',async()=>{
  await assert.rejects(discoverIcon('https://dns-failed.example',async()=>new Response('',{status:503})),error=>error.iconReason==='dns');
  const blocked=await discoverIcon('https://http-failed.example',async url=>url.includes('/dns-query?')?dns():new Response('',{status:403}));
  assert.equal(blocked.reason,'http-403');assert.equal(blocked.source,'favicon');
  const result=await discoverSiteIcon('https://read-failed.example/sub?token=secret',{fetcher:async()=>Response.json({icon:'',source:'unavailable',reason:'dns'})});
  assert.equal(result.icon,'https://read-failed.example/favicon.ico');assert.equal(result.source,'unavailable');assert.equal(result.reason,'dns');
});
