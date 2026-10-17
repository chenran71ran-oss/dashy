import { discoverSiteIcon } from '../../src/utils/SiteIcons.js';
afterEach(()=>vi.restoreAllMocks());
it('retries transient failures after a short delay instead of retaining them for ten minutes',async()=>{
  let now=1000000;vi.spyOn(Date,'now').mockImplementation(()=>now);
  const fetcher=vi.fn().mockResolvedValueOnce(Response.json({icon:'',verified:false,reason:'timeout'})).mockResolvedValue(Response.json({icon:'https://retry.example/logo.png',verified:true}));
  await discoverSiteIcon('https://retry.example',{fetcher});now+=6000;
  expect((await discoverSiteIcon('https://retry.example',{fetcher})).verified).toBe(true);
  expect(fetcher).toHaveBeenCalledTimes(2);
});
