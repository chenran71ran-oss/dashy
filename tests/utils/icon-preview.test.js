import { verifySiteIcon } from '../../src/utils/SiteIcons.js';
afterEach(()=>{delete window.__KH_CLOUD_AUTH;});
it('uses an anonymous request before assigning the direct image fallback URL',async()=>{
  window.__KH_CLOUD_AUTH=true;const sources=[];
  const result=await verifySiteIcon('https://public.example/logo.png',{imageFactory:()=>({naturalWidth:32,naturalHeight:32,set src(value){sources.push({src:value,mode:this.crossOrigin});queueMicrotask(()=>sources.length===1?this.onerror():this.onload());}})});
  expect(result).toBe(true);expect(sources).toEqual([
    {src:'/api/icon-image?url=https%3A%2F%2Fpublic.example%2Flogo.png',mode:undefined},
    {src:'https://public.example/logo.png',mode:'anonymous'},
  ]);
});
it('fails quietly when both the proxy and anonymous fallback reject a protected image',async()=>{
 window.__KH_CLOUD_AUTH=true;const sources=[];
 expect(await verifySiteIcon('https://protected.example/favicon.ico',{imageFactory:()=>({set src(value){sources.push({src:value,mode:this.crossOrigin});queueMicrotask(()=>this.onerror());}})})).toBe(false);
 expect(sources).toHaveLength(2);expect(sources[1].mode).toBe('anonymous');
});
it('does not accept a decoded image with zero dimensions',async()=>{
  expect(await verifySiteIcon('/portal-icons/test.png',{imageFactory:()=>({naturalWidth:0,naturalHeight:0,set src(value){queueMicrotask(()=>this.onload());}})})).toBe(false);
});
