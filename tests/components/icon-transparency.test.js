import { shallowMount, flushPromises } from '@vue/test-utils';

afterEach(() => { delete window.__KH_CLOUD_AUTH; vi.resetModules(); vi.doUnmock('@/utils/IconTransparency'); });

it('only same-origin raster images are processed; bundled and vector artwork are left alone', async () => {
  const { canMakeTransparent } = await import('@/utils/IconTransparency');
  const own = window.location.origin;
  expect(canMakeTransparent(`/api/icon-image?url=${encodeURIComponent('https://shop.example/logo.png')}`)).toBe(true);
  expect(canMakeTransparent('/item-icons/nas.jpg')).toBe(true);
  expect(canMakeTransparent(`/api/icon-image?url=${encodeURIComponent('https://shop.example/logo.svg')}`)).toBe(false);
  expect(canMakeTransparent('/portal-icons/brand/github.svg')).toBe(false);
  expect(canMakeTransparent('/portal-icons/qx/DMIT.png')).toBe(false);
  expect(canMakeTransparent('https://elsewhere.example/logo.png')).toBe(false);
  expect(canMakeTransparent('data:image/png;base64,AAAA')).toBe(false);
  expect(canMakeTransparent(`${own}/logo.png`)).toBe(true);
});

it('a failed download is retried later, while a decided result is reused', async () => {
  const { makeTransparent, transparentIcon } = await import('@/utils/IconTransparency');
  const fetcher = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(new Response('not an image', { headers: { 'content-type': 'text/plain' } }));
  expect(await makeTransparent('/retry.png', { fetcher })).toBe(null);
  expect(transparentIcon('/retry.png')).toBe(undefined);
  expect(await makeTransparent('/retry.png', { fetcher })).toBe(null);
  expect(transparentIcon('/retry.png')).toBe(null);
  await makeTransparent('/retry.png', { fetcher });
  expect(fetcher).toHaveBeenCalledTimes(2);
});

const mountWith = async (result) => {
  let resolve;
  vi.doMock('@/utils/IconTransparency', () => ({
    canMakeTransparent: () => true,
    transparentIcon: () => undefined,
    makeTransparent: () => new Promise((r) => { resolve = r; }),
  }));
  window.__KH_CLOUD_AUTH = true;
  const { default: ItemIcon } = await import('@/components/LinkItems/ItemIcon.vue');
  const wrapper = shallowMount(ItemIcon, { props: { icon: 'https://shop.example/logo.png', url: 'https://shop.example/', title: 'Shop' }, global: { mocks: { $store: { getters: { appConfig: {} } } } } });
  expect(wrapper.find('img').classes()).toContain('awaiting-transparency');
  resolve(result); await flushPromises();
  return wrapper;
};

it('shows the transparent version once ready, without a white flash before it', async () => {
  const wrapper = await mountWith({ src: 'data:image/png;base64,COLOUR', mono: false });
  expect(wrapper.find('img').attributes('src')).toBe('data:image/png;base64,COLOUR');
  expect(wrapper.find('img').classes()).not.toContain('awaiting-transparency');
  wrapper.unmount();
});

it('draws a dark single-colour website logo in the theme text colour', async () => {
  const wrapper = await mountWith({ src: 'data:image/png;base64,MONO', mono: true });
  expect(wrapper.find('img').exists()).toBe(false);
  expect(wrapper.find('.glyph-icon').attributes('style')).toContain('data:image/png;base64,MONO');
  wrapper.unmount();
});

it('keeps the original image when the icon is not suitable for background removal', async () => {
  const wrapper = await mountWith(null);
  expect(wrapper.find('img').attributes('src')).toBe(`/api/icon-image?url=${encodeURIComponent('https://shop.example/logo.png')}`);
  expect(wrapper.find('img').classes()).not.toContain('awaiting-transparency');
  wrapper.unmount();
});
