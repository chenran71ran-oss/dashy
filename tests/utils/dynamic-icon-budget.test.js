import { discoverIcon } from '../../cloud/icon-discovery.mjs';
import { discoverSiteIcon } from '../../src/utils/SiteIcons.js';
const delay=(signal,ms,value)=>new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve(value);},ms);
  const abort=()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'));};
  signal.addEventListener('abort',abort,{once:true});
});
afterEach(()=>{vi.restoreAllMocks();vi.useRealTimers();});
it('explicit metadata reads allow a slow public page to finish before image validation',async()=>{
  vi.useFakeTimers();
  const pending=discoverIcon('https://slow-metadata.example/page',async(url,options)=>{
    if(url.includes('/dns-query?'))return Response.json({Status:0,Answer:[{type:1,data:'8.8.8.8'}]});
    if(options.headers.Accept==='text/html')return delay(options.signal,7000,new Response('<head><link rel="icon" href="/logo.png"></head>',{headers:{'content-type':'text/html'}}));
    return new Response(new Uint8Array([137,80,78,71,13,10,26,10]),{headers:{'content-type':'image/png'}});
  },{page:true}).then(value=>({value}),error=>({error}));
  await vi.advanceTimersByTimeAsync(7000);
  const result=await pending;
  expect(result.error).toBeUndefined();expect(result.value?.icon).toBe('https://slow-metadata.example/logo.png');
});
it('the editor does not give up before a slow successful discovery response',async()=>{
  vi.useFakeTimers();
  // Route native AbortSignal timers through the fake clock.
  vi.spyOn(AbortSignal,'timeout').mockImplementation(ms=>{const c=new AbortController();setTimeout(()=>c.abort(),ms);return c.signal;});
  const pending=discoverSiteIcon('https://slow-editor.example/page',{force:true,page:true,fetcher:async(_,options)=>delay(options.signal,9000,Response.json({icon:'https://slow-editor.example/logo.png',source:'site',verified:true}))});
  await vi.advanceTimersByTimeAsync(9000);
  expect((await pending).verified).toBe(true);
});
