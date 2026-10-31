import { mount, flushPromises } from '@vue/test-utils';
import CompleteSiteInfo from '@/components/InteractiveEditor/CompleteSiteInfo.vue';
import { applyCompletions, findIncompleteItems } from '@/utils/SiteCompletion';
import StoreKeys from '@/utils/StoreMutations';

vi.mock('@/utils/SiteIcons', () => ({
  discoverSiteIcon: vi.fn(async url => (url.includes('photos')
    ? { icon: 'https://photos.example/logo.png', verified: true }
    : { icon: '', verified: false, reason: 'dynamic-metadata' })),
  verifySiteIcon: vi.fn(async () => true),
}));

const sections = [
  { name: 'Media', items: [
    { title: 'Photos', url: 'https://photos.example/' }, // missing icon and description
    { title: 'GitHub', url: 'https://github.com/', description: 'Code hosting' }, // bundled brand, complete
    { title: 'Notes', url: 'https://notes.example/', icon: 'lucide-book', description: 'Notes' }, // complete
  ] },
  { name: 'Tools', items: [
    { title: 'Group', subItems: [{ title: 'Panel', url: 'https://panel.example/', icon: 'https://panel.example/i.png' }] },
  ] },
];

it('finds websites that rely on runtime icon discovery or lack a description, including grouped ones', () => {
  const found = findIncompleteItems(sections);
  expect(found.map(e => [e.key, e.needsIcon, e.needsDescription])).toEqual([
    ['0.0', true, true],
    ['1.0.0', false, true],
  ]);
});

it('applies only accepted values and never overwrites an existing description', () => {
  const next = applyCompletions(sections, [
    { path: [0, 0], icon: 'https://photos.example/logo.png', description: 'Photo library' },
    { path: [1, 0, 0], icon: '', description: 'Server panel' },
    { path: [0, 1], icon: '', description: 'Replaced?' },
  ]);
  expect(next[0].items[0]).toMatchObject({ icon: 'https://photos.example/logo.png', description: 'Photo library' });
  expect(next[1].items[0].subItems[0]).toMatchObject({ icon: 'https://panel.example/i.png', description: 'Server panel' });
  expect(next[0].items[1].description).toBe('Code hosting');
  expect(next[0].items[2]).toBe(sections[0].items[2]);
  expect(sections[0].items[0].icon).toBeUndefined();
});

it('reads proposals, lets the user edit them, and commits the accepted sections', async () => {
  const fetcher = vi.fn(async (_url, options) => {
    const { page } = JSON.parse(options.body);
    return Response.json(page.includes('photos') ? { description: 'Self-hosted photo library.', source: 'og:description' } : { description: '', reason: 'not-english' });
  });
  vi.stubGlobal('fetch', fetcher);
  const commit = vi.fn();
  const hide = vi.fn();
  const wrapper = mount(CompleteSiteInfo, {
    global: {
      stubs: { modal: { template: '<div><slot /></div>' }, Icon: true, AccessError: true },
      mocks: {
        $store: { state: { configSource: { sections } }, getters: { permissions: { allowViewConfig: true }, appConfig: {} }, commit },
        $modal: { hide }, $toast: { success: vi.fn() },
      },
    },
  });
  wrapper.vm.scan();
  await wrapper.vm.start();
  await flushPromises();
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(wrapper.text()).toContain('说明来自网站 og:description');
  expect(wrapper.text()).toContain('网站描述不是英文');
  const inputs = wrapper.findAll('input[placeholder]');
  expect(inputs[0].element.value).toBe('Self-hosted photo library.');
  await inputs[1].setValue('Server control panel');
  await wrapper.find('button.primary').trigger('click');
  const [mutation, applied] = commit.mock.calls.find(([name]) => name === StoreKeys.SET_SECTIONS);
  expect(mutation).toBe(StoreKeys.SET_SECTIONS);
  expect(applied[0].items[0]).toMatchObject({ icon: 'https://photos.example/logo.png', description: 'Self-hosted photo library.' });
  expect(applied[1].items[0].subItems[0].description).toBe('Server control panel');
  expect(hide).toHaveBeenCalled();
  vi.unstubAllGlobals();
});
