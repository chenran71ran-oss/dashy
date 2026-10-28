import { shallowMount, flushPromises } from '@vue/test-utils';
import ItemIcon from '@/components/LinkItems/ItemIcon.vue';
import { discoverSiteIcon, cachedSiteIcon } from '@/utils/SiteIcons';

afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
const mountIcon=url=>shallowMount(ItemIcon,{props:{icon:'auto',url,title:'Test'},global:{mocks:{$store:{getters:{appConfig:{}}}}}});

it('remounts a visited category directly on the discovered image without another discovery',async()=>{
  const fetcher=vi.fn().mockResolvedValue(Response.json({icon:'https://warm-switch.example/logo.png',verified:true}));
  vi.stubGlobal('fetch',fetcher);
  const first=mountIcon('https://warm-switch.example/app/');
  await flushPromises();first.unmount();
  const second=mountIcon('https://warm-switch.example/app/');
  expect(second.find('img').attributes('src')).toBe('https://warm-switch.example/logo.png');
  expect(second.find('img').attributes('loading')).toBe('eager');
  await flushPromises();
  expect(fetcher).toHaveBeenCalledTimes(1);second.unmount();
});

it('shares pending requests and retains more than 64 visited websites',async()=>{
  const fetcher=vi.fn().mockImplementation(()=>Promise.resolve(Response.json({icon:'https://cache-large.example/logo.png',verified:true})));
  const urls=Array.from({length:100},(_,i)=>`https://cache-large-${i}.example/app/`);
  await Promise.all(urls.flatMap(url=>[discoverSiteIcon(url,{page:true,fetcher}),discoverSiteIcon(url,{page:true,fetcher})]));
  expect(fetcher).toHaveBeenCalledTimes(100);
  expect(cachedSiteIcon(urls[0],{page:true})).toBe('https://cache-large.example/logo.png');
  await discoverSiteIcon(urls[0],{page:true,fetcher});
  expect(fetcher).toHaveBeenCalledTimes(100);
});

it('expires warm results and keeps application paths separate without query tokens',async()=>{
  let now=1000000;vi.spyOn(Date,'now').mockImplementation(()=>now);
  const fetcher=vi.fn().mockImplementation(()=>Promise.resolve(Response.json({icon:'https://cache-path.example/a.png',verified:true})));
  await discoverSiteIcon('https://cache-path.example/a?secret=one',{page:true,fetcher});
  expect(cachedSiteIcon('https://cache-path.example/a?secret=two',{page:true})).toBe('https://cache-path.example/a.png');
  expect(cachedSiteIcon('https://cache-path.example/b',{page:true})).toBe('');
  expect(fetcher.mock.calls[0][1].body).not.toContain('secret');
  now+=600001;
  expect(cachedSiteIcon('https://cache-path.example/a',{page:true})).toBe('');
  await discoverSiteIcon('https://cache-path.example/a',{page:true,fetcher});
  expect(fetcher).toHaveBeenCalledTimes(2);
});
