import { shallowMount } from '@vue/test-utils';
import ItemIcon from '@/components/LinkItems/ItemIcon.vue';
import { standInIcon } from '@/utils/StandInIcons';

vi.mock('@/utils/IconTransparency', () => ({ canMakeTransparent: () => false, transparentIcon: () => undefined, makeTransparent: async () => null }));
afterEach(() => { delete window.__KH_CLOUD_AUTH; });
const mountIcon = props => shallowMount(ItemIcon, { props: { size: 'small', ...props }, global: { mocks: { $store: { getters: { appConfig: {} } } } } });
const proxied = url => `/api/icon-image?url=${encodeURIComponent(url)}`;

it('a failing saved image is retried as the site favicon through the proxy, then anonymously, then shows a stand-in glyph', async () => {
  window.__KH_CLOUD_AUTH = true;
  const w = mountIcon({ icon: 'https://cdn.shop.example/logo.png', url: 'https://shop.example/store', title: 'Example 小店' });
  expect(w.find('img').attributes('src')).toBe(proxied('https://cdn.shop.example/logo.png'));
  await w.find('img').trigger('error');
  expect(w.find('img').attributes('src')).toBe(proxied('https://shop.example/favicon.ico'));
  await w.find('img').trigger('error');
  expect(w.find('img').attributes('src')).toBe('https://cdn.shop.example/logo.png');
  expect(w.find('img').attributes('crossorigin')).toBe('anonymous'); // never invites a password prompt
  await w.find('img').trigger('error');
  expect(w.find('img').exists()).toBe(false);
  expect(w.find('.icon-monogram').exists()).toBe(false);
  expect(w.find('.stand-in .glyph-icon').attributes('style')).toContain('/portal-icons/lucide/shopping-bag.svg');
  w.unmount();
});

it('a saved root favicon is not retried as itself, and a bundled brand still wins over the anonymous retry', async () => {
  window.__KH_CLOUD_AUTH = true;
  const own = mountIcon({ icon: 'https://speed.example/favicon.ico', url: 'https://speed.example/', title: 'TestMy' });
  await own.find('img').trigger('error');
  expect(own.find('img').attributes('src')).toBe('https://speed.example/favicon.ico');
  await own.find('img').trigger('error');
  expect(own.find('.stand-in .glyph-icon').attributes('style')).toContain('gauge.svg');
  own.unmount();
});

it('section headings and items without a web address keep the initial', async () => {
  const section = mountIcon({ icon: 'https://cdn.example/broken.png', url: 'AI 助手', title: 'AI 助手' });
  await section.find('img').trigger('error');
  expect(section.find('.stand-in').exists()).toBe(false);
  expect(section.find('.icon-monogram').text()).toBe('A');
  section.unmount();
});

it('stand-in glyphs describe the kind of site from its title and address', () => {
  const name = (t, u) => standInIcon(t, u).replace('/portal-icons/lucide/', '').replace('.svg', '');
  expect(name('TestMy', 'https://testmy.net/')).toBe('gauge');
  expect(name('Cloud Mail', 'https://mail.example/inbox')).toBe('mail');
  expect(name('VPS', 'https://jk.example/')).toBe('server');
  expect(name('DNS检测', 'https://browserleaks.com/dns')).toBe('shield-check');
  expect(name('Letpub', 'https://www.letpub.com/')).toBe('graduation-cap');
  expect(name('灯塔', 'http://zzb.qingdao.gov.cn/')).toBe('landmark');
  expect(name('Oyunfor', 'https://www.oyunfor.com/')).toBe('gamepad-2');
  expect(name('Something', 'https://unknown.example/')).toBe('globe');
  expect(standInIcon('AI 助手', 'AI 助手')).toBe('');
});
