import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverIcon, publicIconUrl, isPublicAddress, extractIconLinks, fetchPublicIcon } from '../cloud/icon-discovery.mjs';
import { discoverSiteIcon } from '../src/utils/SiteIcons.js';
import worker from '../cloud/worker.mjs';
const image=()=>new Response(new Uint8Array([137,80,78,71,13,10,26,10]),{headers:{'content-type':'image/png'}});
const dns=()=>Response.json({Status:0,Answer:[{type:1,data:'8.8.8.8'}]});
test('the image route serves the exact image verified during discovery without fetching it again',async(t)=>{
  const values=new Map();let imageRequests=0;
  const env={ADMIN_TOKEN:'test-only',HOME_KV:{get:async key=>values.get(key)||null,put:async(key,value)=>values.set(key,value)}};
  const login=await worker.fetch(new Request('https://home.example/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:'test-only'})}),env);
  const cookie=login.headers.get('set-cookie').split(';')[0];
  t.mock.method(globalThis,'fetch',async(url,options)=>{
    if(url.includes('/dns-query?'))return dns();
    if(options.headers.Accept==='image/*'){imageRequests++;if(imageRequests>1)throw new Error('source no longer available');return image();}
    return new Response('<link rel="icon" href="/icon.png">',{headers:{'content-type':'text/html'}});
  });
  const discovered=await worker.fetch(new Request('https://home.example/api/icon-discovery',{method:'POST',headers:{origin:'https://home.example',cookie,'content-type':'application/json'},body:JSON.stringify({origin:'https://exact-bytes.example'})}),env);
  assert.equal((await discovered.json()).verified,true);
  const displayed=await worker.fetch(new Request('https://home.example/api/icon-image?url='+encodeURIComponent('https://exact-bytes.example/icon.png'),{headers:{origin:'https://home.example',cookie}}),env);
  assert.equal(displayed.status,200);assert.equal(displayed.headers.get('content-type'),'image/png');assert.equal(imageRequests,1);
});
test('recognize precomposed Apple icons used by Google AI Studio',async()=>{
  const result=await discoverIcon('https://studio.example/',async(url,options)=>url.includes('/dns-query?')?dns():options.headers.Accept==='image/*'?image():new Response('<head><link rel="apple-touch-icon-precomposed" href="/studio.png" sizes="192x192"></head>',{headers:{'content-type':'text/html'}}));
  assert.equal(result.icon,'https://studio.example/studio.png');
});
test('a broken optional manifest cannot prevent a valid declared favicon',async()=>{
  let manifests=0;
  const result=await discoverIcon('https://manifest-delay.example/',async(url,options)=>{
    if(url.includes('/dns-query?'))return dns();
    if(url.endsWith('/manifest.json')){manifests++;throw new Error('manifest timeout');}
    if(options.headers.Accept==='image/*')return image();
    return new Response('<head><link rel="icon" href="/logo.png"><link rel="manifest" href="/manifest.json"></head>',{headers:{'content-type':'text/html'}});
  });
  assert.equal(result.icon,'https://manifest-delay.example/logo.png');
  assert.equal(manifests,0);
});
test('discovery supplies verified image bytes to the display cache',async()=>{
  const captured=[];
  const result=await discoverIcon('https://cache-bytes.example/',async(url,options)=>url.includes('/dns-query?')?dns():options.headers.Accept==='image/*'?image():new Response('<link rel="icon" href="/logo.png">',{headers:{'content-type':'text/html'}}),{onImage:async(url,asset)=>captured.push({url,mime:asset.mime,bytes:[...asset.bytes]})});
  assert.equal(captured.length,1);assert.equal(captured[0].url,result.icon);assert.equal(captured[0].mime,'image/png');
});
test('read public homepage declarations without bookmark path/query or credentials',async()=>{
  const calls=[];
  const fetcher=async(url,options)=>{calls.push({url,options});return url.includes('/dns-query?')?dns():options?.headers?.Accept==='image/*'?image():new Response('<head><link rel="apple-touch-icon" href="/apple.png" sizes="180x180"><link rel="icon" type="image/svg+xml" href="/icons/brand.svg?v=2&amp;x=1"></head>',{headers:{'content-type':'text/html'}});};
  const r=await discoverIcon('https://public.example/private/sub?token=secret#fragment',fetcher);
  assert.equal(r.icon,'https://public.example/icons/brand.svg?v=2&x=1');assert.equal(r.source,'site');
  const site=calls.find(c=>!c.url.includes('/dns-query?'));assert.equal(site.url,'https://public.example/');
  assert.equal(site.options.credentials,'omit');assert.equal(site.options.headers.Cookie,undefined);assert.equal(site.options.headers.Authorization,undefined);
  assert.ok(calls.every(c=>!c.url.includes('secret')&&!c.url.includes('/private')));
  assert.ok(calls.filter(c=>c.url.includes('/dns-query?')).every(c=>c.options.redirect==='manual'));
});
test('public redirects retain locale paths and every redirect is checked',async()=>{
  const calls=[];
  const fetcher=async(url,options)=>{calls.push(url);if(options?.headers?.Accept==='image/*')return image();if(url.includes('/dns-query?'))return dns();if(url==='https://redirect.example/')return new Response('',{status:302,headers:{location:'https://landing.example/en/?track=1'}});return new Response('<head><link href="logo.png" rel="shortcut icon"></head>',{headers:{'content-type':'text/html'}});};
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
  const r=await discoverIcon('https://large.example/',async (url,options)=>url.includes('/dns-query?')?dns():options?.headers?.Accept==='image/*'?image():new Response('x'.repeat(70000)+'<link rel="icon" href="too-late.png">',{headers:{'content-type':'text/html'}}));
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
  assert.equal(blocked.reason,'http-403');assert.equal(blocked.source,'unavailable');assert.equal(blocked.icon,'');assert.equal(blocked.verified,false);
  const result=await discoverSiteIcon('https://read-failed.example/sub?token=secret',{fetcher:async()=>Response.json({icon:'',source:'unavailable',reason:'dns'})});
  assert.equal(result.icon,'https://read-failed.example/favicon.ico');assert.equal(result.source,'unavailable');assert.equal(result.reason,'dns');
});

test('skip broken declarations, validate the next image, and reject HTML masquerading as a favicon',async()=>{
  const result=await discoverIcon('https://candidates.example',async (url,options)=>{
    if(url.includes('/dns-query?'))return dns();
    if(options.headers.Accept==='text/html')return new Response('<head><link rel="icon" href="/broken.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple.png" sizes="180x180"></head>',{headers:{'content-type':'text/html'}});
    return url.endsWith('/apple.png')?image():new Response('<html>login</html>',{headers:{'content-type':'text/html'}});
  });
  assert.equal(result.icon,'https://candidates.example/apple.png');assert.equal(result.verified,true);
});
test('use a verified official icon when Linux DO homepage metadata is unavailable',async()=>{
  const calls=[];
  const result=await discoverIcon('https://linux.do/t/private?token=secret',async (url,options)=>{
    calls.push(url);if(url.includes('/dns-query?'))return dns();
    return options.headers.Accept==='image/*'?image():new Response('',{status:403});
  });
  assert.match(result.icon,/^https:\/\/cdn3\.ldstatic\.com\/.*180x180\.png$/);assert.equal(result.source,'catalog');assert.equal(result.verified,true);
  assert.ok(calls.every(url=>!url.includes('secret')&&!url.includes('/t/private')));
});
test('a candidate redirect to an internal host never becomes a successful icon',async()=>{
  const result=await discoverIcon('https://unsafe-icon.example',async (url,options)=>{
    if(url.includes('/dns-query?'))return dns();
    if(options.headers.Accept==='text/html')return new Response('<head><link rel="icon" href="/redirect.png"></head>',{headers:{'content-type':'text/html'}});
    return new Response('',{status:302,headers:{location:'https://127.0.0.1/'}});
  });
  assert.equal(result.icon,'');assert.equal(result.verified,false);
});
test('explicit reads retain app paths, honor base href and remove query secrets',async()=>{
  const calls=[];
  const result=await discoverIcon('https://panel.example/custom/panel?token=secret#key',async(url,options)=>{
    calls.push(url);if(url.includes('/dns-query?'))return dns();
    if(options.headers.Accept==='image/*')return image();
    return new Response('<head><base href="/custom/"><link rel="icon" href="icons/logo.png"></head>',{headers:{'content-type':'text/html'}});
  },{page:true});
  assert.equal(result.icon,'https://panel.example/custom/icons/logo.png');
  assert.ok(calls.includes('https://panel.example/custom/panel'));assert.ok(calls.every(x=>!x.includes('secret')&&!x.includes('#key')));
});
test('discover PWA manifest icons relative to their manifest, not the origin',async()=>{
  const result=await discoverIcon('https://pwa.example/app/panel',async(url,options)=>{
    if(url.includes('/dns-query?'))return dns();
    if(options.headers.Accept==='image/*')return image();
    if(url.endsWith('/app/manifest.webmanifest'))return Response.json({icons:[{src:'icons/logo.png',sizes:'192x192'}]});
    return new Response('<head><link rel="manifest" href="manifest.webmanifest"></head>',{headers:{'content-type':'text/html'}});
  },{page:true});
  assert.equal(result.icon,'https://pwa.example/app/icons/logo.png');assert.equal(result.source,'manifest');
});
test('explicit browser reads are path-scoped and send no query or fragment',async()=>{
  const bodies=[];const fetcher=async(_,options)=>{bodies.push(JSON.parse(options.body));return Response.json({icon:'https://pathcache.example/logo.png',source:'site'});};
  await discoverSiteIcon('https://pathcache.example/app/panel?token=secret#fragment',{fetcher,page:true});
  await discoverSiteIcon('https://pathcache.example/other/',{fetcher,page:true});
  assert.equal(bodies.length,2);assert.deepEqual(bodies[0],{origin:'https://pathcache.example',page:'https://pathcache.example/app/panel'});
});
test('AWS console subdomains use the public vendor icon without visiting the account URL',async()=>{
  const calls=[];
  const result=await discoverIcon('https://session.region.console.aws.amazon.com/ec2/home',async(url)=>{
    calls.push(url);return url.includes('/dns-query?')?dns():image();
  },{page:true});
  assert.equal(result.source,'catalog');assert.match(result.icon,/awslabs\/aws-icons-for-plantuml/);
  assert.ok(calls.every(url=>!url.includes('session.region')));
});
test('NodeSeek uses its verified official icon for both bare and www hostnames',async()=>{
  for(const host of ['nodeseek.com','www.nodeseek.com']) {
    const result=await discoverIcon(`https://${host}/`,async(url)=>url.includes('/dns-query?')?dns():image());
    assert.equal(result.source,'catalog');assert.equal(result.icon,'/portal-icons/nodeseek.png');assert.equal(result.verified,true);
  }
});
test('DeepSeek official sites use a bundled brand icon even when homepage requests are refused',async()=>{
  for(const host of ['deepseek.com','www.deepseek.com','platform.deepseek.com','chat.deepseek.com','api-docs.deepseek.com']) {
    const calls=[];
    const result=await discoverIcon(`https://${host}/settings?token=secret`,async(url)=>{
      calls.push(url);return url.includes('/dns-query?')?dns():new Response('',{status:403});
    },{page:true});
    assert.deepEqual(result,{icon:'/portal-icons/deepseek.svg',source:'catalog',verified:true});
    assert.deepEqual(calls,[]);
  }
});
test('DeepSeek brand fallback does not accept lookalike hostnames',async()=>{
  const result=await discoverIcon('https://platform.deepseek.com.untrusted.example/',async(url)=>url.includes('/dns-query?')?dns():new Response('',{status:403}));
  assert.equal(result.icon,'');assert.equal(result.verified,false);
});
test('explicit reads accept the registered bundled DeepSeek icon',async()=>{
  const result=await discoverSiteIcon('https://platform.deepseek.com/',{force:true,page:true,fetcher:async()=>Response.json({icon:'/portal-icons/deepseek.svg',source:'catalog',verified:true})});
  assert.equal(result.icon,'/portal-icons/deepseek.svg');assert.equal(result.verified,true);
});
test('browser accepts only registered local brand assets returned by discovery',async()=>{
  const good=await discoverSiteIcon('https://www.nodeseek.com/',{force:true,fetcher:async()=>Response.json({icon:'/portal-icons/nodeseek.png',source:'catalog',verified:true})});
  assert.equal(good.icon,'/portal-icons/nodeseek.png');assert.equal(good.verified,true);
  const bad=await discoverSiteIcon('https://unregistered.example/',{fetcher:async()=>Response.json({icon:'/api/config',source:'catalog',verified:true})});
  assert.equal(bad.verified,false);
});
test('manifest discovery does not fetch private targets or follow unchecked redirects',async()=>{
  const calls=[];
  const result=await discoverIcon('https://manifest-safe.example/app/',async(url,options)=>{
    calls.push(url);if(url.includes('/dns-query?'))return dns();
    if(options.headers.Accept==='text/html')return new Response('<head><link rel="manifest" href="https://127.0.0.1/private"></head>',{headers:{'content-type':'text/html'}});
    return new Response('',{status:404});
  },{page:true});
  assert.equal(result.verified,false);assert.ok(calls.every(url=>!url.includes('127.0.0.1')));
});
test('real icons served as downloads are recognized by bytes, while fake image HTML is rejected',async()=>{
  const fetcher=async url=>url.includes('/dns-query?')?dns():new Response(new Uint8Array([0,0,1,0,1,0,32,32]),{headers:{'content-type':'application/octet-stream'}});
  assert.equal((await fetchPublicIcon('https://download-icon.example/favicon.ico',fetcher)).mime,'image/x-icon');
  await assert.rejects(fetchPublicIcon('https://fake-icon.example/logo.png',async url=>url.includes('/dns-query?')?dns():new Response('<html>not an image</html>',{headers:{'content-type':'image/png'}})));
});
test('identified Komari metadata falls back to its official project logo, not a generic monogram',async()=>{
  const result=await discoverIcon('https://monitor.example/',async(url,options)=>{
    if(url.includes('/dns-query?'))return dns();
    if(options.headers.Accept==='text/html')return new Response('<head><meta name="keywords" content="Komari-Theme-LuminaPlus"><link rel="icon" href="/favicon.ico"></head>',{headers:{'content-type':'text/html'}});
    if(url.startsWith('https://raw.githubusercontent.com/komari-monitor/'))return image();
    return new Response('',{status:404});
  });
  assert.equal(result.source,'catalog');assert.match(result.icon,/komari-monitor\/komari-web/);assert.equal(result.verified,true);
});

const shopShell = '<head><script type="module" src="/package/shop/assets/index.3fc5a55f.js"></script></head><body><div id="app"></div></body>';
test('read runtime favicon from an identified shop app public config, without a domain-specific icon',async()=>{
  const calls=[];
  const result=await discoverIcon('https://store.example/shop/seller?token=secret#session',async(url,options)=>{
    calls.push({url,options});
    if(url.includes('/dns-query?'))return dns();
    if(url==='https://store.example/shop/seller')return new Response(shopShell,{headers:{'content-type':'text/html'}});
    if(url==='https://store.example/shopApi/system/config')return Response.json({code:1,data:{website:{favicon:'https://cdn.example/real-brand.jpg'}}});
    if(url==='https://cdn.example/real-brand.jpg')return new Response(new Uint8Array([255,216,255,224]),{headers:{'content-type':'image/jpeg'}});
    return new Response('',{status:404});
  },{page:true});
  assert.deepEqual(result,{icon:'https://cdn.example/real-brand.jpg',source:'site-config',verified:true});
  const config=calls.find(c=>c.url.endsWith('/shopApi/system/config'));
  assert.equal(config.options.method,'GET');assert.equal(config.options.credentials,'omit');
  assert.ok(calls.every(c=>!c.url.includes('secret')&&!c.url.includes('#session')));
});
test('an ordinary app or third-party script must not trigger shop configuration probes',async()=>{
  for(const script of ['/assets/app.js','https://external.example/package/shop/assets/index.123.js']) {
    const calls=[];
    const result=await discoverIcon('https://ordinary.example/',async(url,options)=>{
      calls.push(url);if(url.includes('/dns-query?'))return dns();
      if(options.headers.Accept==='text/html')return new Response(`<head><script type="module" src="${script}"></script></head>`,{headers:{'content-type':'text/html'}});
      return new Response('',{status:404});
    });
    assert.equal(result.verified,false);assert.equal(result.reason,'dynamic-metadata');
    assert.ok(!calls.some(c=>c.includes('/shopApi/')));
  }
});
test('valid HTML icon declarations take precedence over a runtime config probe',async()=>{
  const calls=[];
  const result=await discoverIcon('https://declared-shop.example/',async(url,options)=>{
    calls.push(url);if(url.includes('/dns-query?'))return dns();
    if(options.headers.Accept==='text/html')return new Response(shopShell.replace('</head>','<link rel="icon" href="/declared.png"></head>'),{headers:{'content-type':'text/html'}});
    return url.endsWith('/declared.png')?image():new Response('',{status:404});
  });
  assert.equal(result.icon,'https://declared-shop.example/declared.png');assert.ok(!calls.some(c=>c.includes('/shopApi/')));
});
test('runtime configuration cannot introduce private icons or follow unvalidated redirects',async()=>{
  for(const response of [()=>Response.json({code:1,data:{website:{favicon:'https://127.0.0.1/private.png'}}}),()=>new Response('',{status:302,headers:{location:'https://127.0.0.1/private'}}),()=>new Response('<html>Login</html>',{headers:{'content-type':'text/html'}})]) {
    const calls=[];
    const result=await discoverIcon('https://unsafe-config.example/',async(url,options)=>{
      calls.push(url);if(url.includes('/dns-query?'))return dns();
      if(url.endsWith('/shopApi/system/config'))return response();
      if(options.headers.Accept==='text/html')return new Response(shopShell,{headers:{'content-type':'text/html'}});
      return new Response('',{status:404});
    });
    assert.equal(result.verified,false);assert.ok(calls.every(c=>!c.includes('127.0.0.1')));
  }
});

test('protected SparkFlow uses explicit local service artwork without a remote request',async()=>{
  const result=await discoverIcon('https://spark.chenran71ran.cc/',async()=>{throw new Error('must not fetch protected service');});
  assert.equal(result.icon,'/portal-icons/fluent/fire.svg');assert.equal(result.source,'local-service');assert.equal(result.verified,true);
  const client=await discoverSiteIcon('https://spark.chenran71ran.cc/',{force:true,fetcher:async()=>Response.json(result)});
  assert.equal(client.icon,result.icon);assert.equal(client.verified,true);
});
test('Cloudflare Access redirect is identified without fetching a login page favicon',async()=>{
  const calls=[];
  const result=await discoverIcon('https://protected-app.example/',async(url)=>{
    calls.push(url);if(url.includes('/dns-query?'))return dns();
    return new Response('',{status:302,headers:{location:'https://team.cloudflareaccess.com/cdn-cgi/access/login/protected-app.example'}});
  });
  assert.equal(result.reason,'authentication-required');assert.equal(result.verified,false);assert.equal(result.icon,'');
  assert.equal(calls.some(u=>u.includes('team.cloudflareaccess.com')),false);
});
