import { mount, shallowMount, flushPromises } from '@vue/test-utils';
import { reactive, nextTick } from 'vue';
import WidgetBase from '@/components/Widgets/WidgetBase.vue';
import Section from '@/components/LinkItems/Section.vue';

vi.mock('@/assets/interface-icons/widget-update.svg', () => ({ default: { name: 'UpdateIcon', template: '<svg />' } }));
vi.mock('@/assets/interface-icons/config-edit-json.svg', () => ({ default: { name: 'EditIcon', template: '<svg />' } }));
vi.mock('@/assets/interface-icons/interactive-editor-remove.svg', () => ({ default: { name: 'BinIcon', template: '<svg />' } }));
vi.mock('@/assets/interface-icons/loader.svg', () => ({ default: { name: 'LoadingAnimation', template: '<svg />' } }));

const makeStore = () => ({
  state: reactive({ editMode: false }),
  getters: reactive({ appConfig: {}, iconSize: 'medium', layout: 'auto', getSectionByIndex: () => ({}) }),
});
const globalOptions = store => ({
  mocks: { $store: store, $t: key => key },
  directives: { tooltip: {}, dragSort: {} },
  stubs: { UpdateIcon: true, EditIcon: true, BinIcon: true, LoadingAnimation: true },
});
const widget = { type: 'image', options: { imagePath: '/portal-icons/qx/Speedtest.png' } };

describe('widget preference changes', () => {
  it('updates all size/layout combinations without remounting or refreshing widget content', async () => {
    const store = makeStore();
    const wrapper = mount(WidgetBase, { props: { widget, index: 0 }, global: globalOptions(store) });
    await flushPromises();
    await vi.waitFor(() => expect(wrapper.find('img.embedded-image').exists()).toBe(true));
    const image = wrapper.get('img.embedded-image').element;
    for (const layout of ['auto', 'horizontal', 'vertical', 'masonry']) {
      for (const size of ['small', 'medium', 'large']) {
        store.getters.layout = layout;
        store.getters.iconSize = size;
        await nextTick();
        expect(wrapper.attributes('data-widget-size')).toBe(size);
        expect(wrapper.attributes('data-widget-layout')).toBe(layout);
        expect(wrapper.get('img.embedded-image').element).toBe(image);
        expect(wrapper.get('img.embedded-image').attributes('src')).toBe(widget.options.imagePath);
      }
    }
    await wrapper.get('button[aria-label="刷新小组件"]').trigger('click');
    expect(wrapper.get('img.embedded-image').attributes('src')).toContain('dashy-update=1');
    wrapper.unmount();
  });

  it('honors a section size override, then resumes global sizing when cleared', async () => {
    const store = makeStore();
    const wrapper = mount(WidgetBase, { props: { widget, index: 0, itemSize: 'small' }, global: globalOptions(store) });
    await flushPromises();
    store.getters.iconSize = 'large';
    await nextTick();
    expect(wrapper.attributes('data-widget-size')).toBe('small');
    await wrapper.setProps({ itemSize: '' });
    expect(wrapper.attributes('data-widget-size')).toBe('large');
    store.getters.iconSize = 'invalid-size';
    store.getters.layout = 'invalid-layout';
    await nextTick();
    expect(wrapper.attributes('data-widget-size')).toBe('medium');
    expect(wrapper.attributes('data-widget-layout')).toBe('auto');
    wrapper.unmount();
  });

  it('keeps the clock date with its reading, including long labels, 12-hour time and edit controls', async () => {
    const store = makeStore();
    const clockWidget = { type: 'clock', options: { timeZone: 'Asia/Shanghai', format: 'en-US', use12Hour: true, customCityName: 'Wuhan · Wuchang district' } };
    const wrapper = mount(WidgetBase, { props: { widget: clockWidget, index: 0 }, global: globalOptions(store) });
    try {
      await vi.waitFor(() => expect(wrapper.find('.time').exists()).toBe(true));
      const time = wrapper.get('.time').element;
      const date = wrapper.get('.date').text();
      expect(wrapper.get('.upper').text()).toBe(clockWidget.options.customCityName);
      expect(wrapper.get('.metric-meta').text()).toBe(date);
      expect(wrapper.get('.time').text()).toMatch(/\d+:\d+:\d+\s*[AP]M/);
      for (const layout of ['auto', 'horizontal', 'vertical', 'masonry']) {
        for (const size of ['small', 'medium', 'large']) {
          store.getters.layout = layout;
          store.getters.iconSize = size;
          await nextTick();
          expect(wrapper.get('.time').element).toBe(time);
          expect(wrapper.get('.metric-meta .date').text()).toBe(date);
        }
      }
      store.state.editMode = true;
      await nextTick();
      expect(wrapper.findAll('.widget-actions button')).toHaveLength(3);
      await wrapper.setProps({ widget: { ...clockWidget, options: { ...clockWidget.options, hideDate: true } } });
      expect(wrapper.find('.upper').exists()).toBe(false);
      expect(wrapper.find('.metric-meta').exists()).toBe(false);
      expect(wrapper.get('.time').element).toBe(time);
    } finally { wrapper.unmount(); }
  });

  it('keeps weather readings and the detail toggle when display preferences change', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({
      dt: 1791431580,
      coord: { lat: 30.5563, lon: 114.3105 },
      weather: [{ icon: '01d', description: 'Sunny' }],
      main: { temp: 24.04, temp_min: 22.1, temp_max: 26.2, feels_like: 24.7, pressure: 1014, humidity: 50 },
      wind: { speed: 3.1 }, visibility: 10000, clouds: { all: 0 },
    }));
    const store = makeStore();
    const wrapper = mount(WidgetBase, {
      props: { index: 0, widget: { type: 'weather', label: '天气', options: { city: 'wuchang', units: 'metric' } } },
      global: globalOptions(store),
    });
    try {
      await vi.waitFor(() => expect(wrapper.find('.temp').text()).toBe('24.0°C'));
      const temperature = wrapper.get('.temp').element;
      await wrapper.get('.more-details-btn').trigger('click');
      expect(wrapper.find('.details').exists()).toBe(false);
      for (const layout of ['auto', 'horizontal', 'vertical', 'masonry']) {
        for (const size of ['small', 'medium', 'large']) {
          store.getters.layout = layout;
          store.getters.iconSize = size;
          await nextTick();
          expect(wrapper.get('.temp').element).toBe(temperature);
          expect(wrapper.get('.temp').text()).toBe('24.0°C');
          expect(wrapper.find('.details').exists()).toBe(false);
        }
      }
      expect(fetcher).toHaveBeenCalledTimes(1);
    } finally {
      wrapper.unmount();
      fetcher.mockRestore();
    }
  });

  it('passes effective section preferences to its widget grid and child widgets', async () => {
    const store = makeStore();
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    const wrapper = shallowMount(Section, {
      props: { groupId: 'test', title: 'Widgets', index: 0, activeColCount: 1, displayData: { itemSize: 'small' }, widgets: [widget] },
      global: {
        ...globalOptions(store),
        stubs: { Collapsable: { template: '<section><slot /></section>' }, WidgetBase: true },
      },
    });
    expect(wrapper.getComponent(WidgetBase).props('itemSize')).toBe('small');
    store.getters.iconSize = 'large';
    store.getters.layout = 'vertical';
    await nextTick();
    expect(wrapper.get('.widget-list').attributes('data-widget-size')).toBe('small');
    expect(wrapper.get('.widget-list').attributes('data-widget-layout')).toBe('vertical');
    await wrapper.setProps({ displayData: {} });
    expect(wrapper.getComponent(WidgetBase).props('itemSize')).toBe('large');
    expect(wrapper.get('.widget-list').attributes('data-widget-size')).toBe('large');
    wrapper.unmount();
    vi.unstubAllGlobals();
  });
});
