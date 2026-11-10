import { shallowMount, flushPromises } from '@vue/test-utils';
import ItemIcon from '@/components/LinkItems/ItemIcon.vue';
import { builtinIcons } from '@/utils/BuiltinIcons';
import { builtinIconPath } from '@/utils/BuiltinIconPaths';
import { configChanged, primeRootConfig, takeRootConfig } from '@/utils/BootConfig';
import index from '@/utils/builtin-icon-index.json';

const mountIcon = icon => shallowMount(ItemIcon, { props: { icon, title: 'T' }, global: { mocks: { $store: { getters: { appConfig: {} } } } } });

it('the start-up icon index resolves every catalog icon to the same file, and nothing else', () => {
  expect(builtinIcons.length).toBeGreaterThan(2000);
  for (const entry of builtinIcons) expect(builtinIconPath(entry.value)).toBe(entry.src);
  expect(Object.values(index).reduce((sum, pack) => sum + pack.names.split('|').length, 0)).toBe(builtinIcons.length);
  for (const value of ['lucide-not-an-icon', 'flat-color-', 'fluent', '🔗', '', undefined, 'https://x.example/lucide-book.svg']) expect(builtinIconPath(value)).toBe('');
  // The index must stay a small fraction of the 550 KB catalog it replaces at start-up
  expect(JSON.stringify(index).length).toBeLessThan(40000);
});

it('shortcode emoji appear once their table has loaded, glyph emoji immediately', async () => {
  const glyph = mountIcon('🚀');
  expect(glyph.find('.emoji-icon').text()).toBe('🚀');
  const shortcode = mountIcon(':rocket:');
  await flushPromises(); await new Promise(resolve => setTimeout(resolve, 50)); await flushPromises();
  expect(shortcode.find('.emoji-icon').text()).toBe('🚀');
  glyph.unmount(); shortcode.unmount();
});

it('the primed root configuration is handed over once, and unchanged polls are ignored', async () => {
  expect(takeRootConfig()).toBe(null);
  primeRootConfig(Promise.resolve({ sections: [] }));
  expect(await takeRootConfig()).toEqual({ sections: [] });
  expect(takeRootConfig()).toBe(null);
  expect(configChanged('{"config":{"a":1}}')).toBe(true);
  expect(configChanged('{"config":{"a":1}}')).toBe(false);
  expect(configChanged('{"config":{"a":2}}')).toBe(true);
});
