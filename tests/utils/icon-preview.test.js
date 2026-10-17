import { verifySiteIcon } from '../../src/utils/SiteIcons.js';
afterEach(()=>{delete window.__KH_CLOUD_AUTH;});
it('checks the same proxy route as cards and retries the direct address when needed',async()=>{
  window.__KH_CLOUD_AUTH=true;const sources=[];
  const result=await verifySiteIcon('https://public.example/logo.png',{imageFactory:()=>({naturalWidth:32,naturalHeight:32,set src(value){sources.push(value);queueMicrotask(()=>sources.length===1?this.onerror():this.onload());}})});
  expect(result).toBe(true);expect(sources).toEqual(['/api/icon-image?url=https%3A%2F%2Fpublic.example%2Flogo.png','https://public.example/logo.png']);
});
it('does not accept a decoded image with zero dimensions',async()=>{
  expect(await verifySiteIcon('/portal-icons/test.png',{imageFactory:()=>({naturalWidth:0,naturalHeight:0,set src(value){queueMicrotask(()=>this.onload());}})})).toBe(false);
});
