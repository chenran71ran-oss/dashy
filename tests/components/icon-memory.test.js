import { shallowMount, flushPromises } from '@vue/test-utils';
import ItemIcon from '@/components/LinkItems/ItemIcon.vue';
import MinimalSection from '@/components/MinimalView/MinimalSection.vue';
import clickOutside from '@/directives/ClickOutside';
import longPress from '@/directives/LongPress';
import { prefetchItemIcons } from '@/utils/IconPrefetch';
import { discoverSiteIcon } from '@/utils/SiteIcons';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it('click-outside removes exactly the listeners of the unmounted element', () => {
  const add = vi.spyOn(document, 'addEventListener');
  const remove = vi.spyOn(document, 'removeEventListener');
  const elements = [0, 1, 2].map(() => document.createElement('div'));
  const actions = elements.map(() => vi.fn());
  elements.forEach((el, i) => clickOutside.mounted(el, { value: actions[i] }));
  const own = el => add.mock.calls.filter(([, fn]) => fn === add.mock.calls[elements.indexOf(el) * 2][1]);
  expect(own(elements[1]).map(([type]) => type)).toEqual(['click', 'touchstart']);
  clickOutside.unmounted(elements[1]);
  const removed = remove.mock.calls.map(([type, fn]) => [type, fn]);
  expect(removed).toEqual(own(elements[1]).map(([type, fn]) => [type, fn]));
  document.body.click();
  expect(actions[0]).toHaveBeenCalledTimes(1); expect(actions[1]).not.toHaveBeenCalled(); expect(actions[2]).toHaveBeenCalledTimes(1);
  elements.forEach(el => clickOutside.unmounted(el));
  document.body.click();
  expect(actions[0]).toHaveBeenCalledTimes(1);
});

it('long-press releases document and element listeners left by an unfinished press', () => {
  const el = document.createElement('div');
  longPress.mounted(el, { instance: null });
  const remove = vi.spyOn(document, 'removeEventListener');
  el.dispatchEvent(new PointerEvent('pointerdown', { button: 0 }));
  longPress.unmounted(el);
  expect(remove.mock.calls.some(([type]) => type === 'pointerup')).toBe(true);
  expect(el.$longPressCleanup).toBeUndefined();
});

it('warms other categories with bounded concurrency and stops when cancelled', async () => {
  let active = 0; let peak = 0; const seen = [];
  const discover = vi.fn(async (url) => {
    active += 1; peak = Math.max(peak, active); seen.push(url);
    await new Promise(resolve => setTimeout(resolve, 5));
    active -= 1;
    return { icon: `${url}logo.png`, verified: true };
  });
  const preload = vi.fn(async () => true);
  const items = [
    { title: 'GitHub', url: 'https://github.com/', icon: 'auto' }, // Bundled brand: no request
    ...Array.from({ length: 8 }, (_, i) => ({ title: `Site ${i}`, url: `https://warm-${i}.example/`, icon: 'auto' })),
    { title: 'Group', subItems: [{ title: 'Child', url: 'https://child.example/', icon: 'auto' }] },
  ];
  const cancel = prefetchItemIcons(items, { discover, preload, concurrency: 3 });
  await cancel.done;
  expect(peak).toBeLessThanOrEqual(3);
  expect(seen).not.toContain('https://github.com/');
  expect(seen).toContain('https://child.example/');
  expect(discover).toHaveBeenCalledTimes(9);
  expect(discover.mock.calls[0][1]).toEqual({ page: true });
  expect(preload).toHaveBeenCalledWith('https://warm-0.example/logo.png');

  discover.mockClear();
  const stop = prefetchItemIcons(items, { discover, preload, concurrency: 1 });
  stop();
  await stop.done;
  expect(discover.mock.calls.length).toBeLessThanOrEqual(1);
});

it('does not re-read a site without public icon metadata on every category switch', async () => {
  let now = 5000000; vi.spyOn(Date, 'now').mockImplementation(() => now);
  const fetcher = vi.fn().mockImplementation(() => Promise.resolve(Response.json({ icon: '', verified: false, reason: 'dynamic-metadata' })));
  await discoverSiteIcon('https://no-metadata.example/', { page: true, fetcher });
  now += 60000;
  await discoverSiteIcon('https://no-metadata.example/', { page: true, fetcher });
  expect(fetcher).toHaveBeenCalledTimes(1);
  now += 300001;
  await discoverSiteIcon('https://no-metadata.example/', { page: true, fetcher });
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it('editor preview waits for typing to pause before reading the website icon', async () => {
  vi.useFakeTimers();
  const fetcher = vi.fn().mockImplementation(() => Promise.resolve(Response.json({ icon: 'https://typed.example/logo.png', verified: true })));
  vi.stubGlobal('fetch', fetcher);
  const wrapper = shallowMount(ItemIcon, { props: { icon: 'auto', url: '', title: 'Typed' }, global: { mocks: { $store: { getters: { appConfig: {} } } } } });
  for (const url of ['https://t', 'https://ty', 'https://typed', 'https://typed.ex', 'https://typed.example/']) {
    await wrapper.setProps({ url });
    vi.advanceTimersByTime(100);
  }
  expect(fetcher).not.toHaveBeenCalled();
  vi.advanceTimersByTime(450);
  await flushPromises();
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetcher.mock.calls[0][1].body).page).toBe('https://typed.example/');
  wrapper.unmount();
  vi.advanceTimersByTime(1000);
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it('keeps a visited focus category mounted while another category is shown', async () => {
  const wrapper = shallowMount(MinimalSection, {
    props: { groupId: 'g', index: 0, title: 'Tools', displayData: {}, items: [{ id: 'a', title: 'A', url: 'https://a.example' }], selected: false },
    global: { mocks: { $store: { getters: { appConfig: {}, iconSize: 'medium' } }, $t: k => k } },
  });
  expect(wrapper.find('.section-items').exists()).toBe(false);
  await wrapper.setProps({ selected: true });
  expect(wrapper.find('.section-items').attributes('style') || '').not.toContain('display: none');
  await wrapper.setProps({ selected: false });
  expect(wrapper.find('.section-items').exists()).toBe(true);
  expect(wrapper.find('.section-items').attributes('style')).toContain('display: none');
});
