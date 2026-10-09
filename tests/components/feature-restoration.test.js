import { shallowMount, mount, flushPromises } from '@vue/test-utils';
import { reactive, nextTick } from 'vue';
import Minimal from '@/views/Minimal.vue';
import MinimalSection from '@/components/MinimalView/MinimalSection.vue';
import Workspace from '@/views/Workspace.vue';
import MultiTasking from '@/components/Workspace/MultiTaskingWebComtent.vue';
import EditWidget from '@/components/InteractiveEditor/EditWidget.vue';
import EditItem from '@/components/InteractiveEditor/EditItem.vue';
import SubItemsEditor from '@/components/InteractiveEditor/SubItemsEditor.vue';
import WidgetBase from '@/components/Widgets/WidgetBase.vue';
import ItemMixin from '@/mixins/ItemMixin';
import { WIDGET_CATALOG } from '@/utils/WidgetCatalog';
import { readdirSync } from 'node:fs';

vi.mock('@/mixins/HomeMixin', () => ({ default: {
  data: () => ({ searchValue: '' }),
  computed: { sections() { return this.$store.getters.sections; }, pageInfo() { return this.$store.getters.pageInfo; }, appConfig() { return this.$store.getters.appConfig; }, isEditMode() { return this.$store.state.editMode; }, modalOpen: () => false, isBootstrap: () => false, pageId: () => 'home' },
  methods: { getBackgroundImage: () => '', checkTheresData: s => s?.length, makeSectionId: s => s.name, checkIfResults: s => !s.some(c => c.filteredItems.length), filterTiles(items) { return (items || []).filter(i => !this.searchValue || i.title.toLowerCase().includes(this.searchValue.toLowerCase())); }, initiateFontAwesome() {}, initiateMaterialDesignIcons() {}, updateModalVisibility() {} },
} }));
vi.mock('@/utils/config/ConfigHelpers', () => ({ resolveRouteIntent: () => ({ sectionSlug: null }), makePageName: s => s.toLowerCase() }));
vi.mock('@/assets/interface-icons/widget-update.svg', () => ({ default: { template: '<svg />' } }));
vi.mock('@/assets/interface-icons/config-edit-json.svg', () => ({ default: { template: '<svg />' } }));
vi.mock('@/assets/interface-icons/interactive-editor-remove.svg', () => ({ default: { template: '<svg />' } }));
vi.mock('@/assets/interface-icons/loader.svg', () => ({ default: { template: '<svg />' } }));
vi.mock('@/components/Workspace/WebContent', () => ({ default: { name: 'WebContent', props: ['url', 'id'], template: '<div class="web-content" :id="id"><iframe :data-src="url" /></div>' } }));

const sections = [
  { name: 'AI', icon: 'ai', items: [{ title: 'ChatGPT' }], widgets: [{ type: 'clock' }] },
  { name: 'Work', icon: 'work', items: [{ title: 'GitHub' }], widgets: [{ type: 'calendar' }] },
];
const makeStore = () => ({ state: reactive({ editMode: false }), getters: reactive({ sections, pageInfo: { title: 'Home Lab', logo: '/mech/blue.png' }, appConfig: {}, iconSize: 'medium', layout: 'auto', permissions: { allowViewConfig: true }, getSectionByName: () => ({ widgets: [] }), getItemById: () => ({ title: 'Example', url: 'https://example.com', icon: 'auto' }) }), commit: vi.fn() });
const options = store => ({ mocks: { $store: store, $route: { path: '/minimal', params: {}, query: {} }, $t: s => s, $modal: { show: vi.fn(), hide: vi.fn() } }, directives: { tooltip: {} }, stubs: { modal: { template: '<div><slot /></div>' } } });

describe('restored views and editor capabilities preserve the current UI', () => {
  it('the selector covers every upstream widget component, including integrations', () => {
    const source = readdirSync('src/components/Widgets/').filter(file => file.endsWith('.vue') && !['WidgetBase.vue', 'Blank.vue'].includes(file)).map(file => file.replace('.vue', '')).sort();
    expect(WIDGET_CATALOG.map(entry => entry.component).sort()).toEqual(source);
  });
  it('Minimal uses category tabs, shows the selected category widgets and searches across categories', async () => {
    const wrapper = shallowMount(Minimal, { global: options(makeStore()) });
    expect(wrapper.findComponent({ name: 'PageTitle' }).props('title')).toBe('Home Lab');
    const panels = wrapper.findAllComponents(MinimalSection);
    expect(panels).toHaveLength(2);
    expect(panels[0].props('selected')).toBe(true);
    expect(panels[0].props('showAll')).toBe(false);
    expect(panels[0].props('widgets')).toEqual(sections[0].widgets);
    wrapper.vm.sectionSelected(1); await nextTick();
    expect(panels[1].props('selected')).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('minimal-category:home', 'Work');
    wrapper.vm.searchValue = 'github'; await nextTick();
    expect(panels[1].props('showAll')).toBe(true);
    expect(panels[1].props('items')).toEqual(sections[1].items);
    wrapper.unmount();
  });

  it('Workspace has its own web area instead of nesting the Minimal view, respects newtab and embeds workspace targets', async () => {
    const opened = vi.spyOn(window, 'open').mockImplementation(() => null);
    const wrapper = shallowMount(Workspace, { global: options(makeStore()) });
    expect(wrapper.findComponent(Minimal).exists()).toBe(false);
    expect(wrapper.find('.workspace-empty').exists()).toBe(true);
    wrapper.vm.launchApp({ url: 'https://app.example', target: 'newtab' }); await nextTick();
    expect(opened).toHaveBeenCalledWith('https://app.example', '_blank', 'noopener,noreferrer');
    expect(wrapper.vm.url).toBeFalsy();
    wrapper.vm.launchApp({ url: 'https://app.example', target: 'workspace' }); await nextTick();
    expect(wrapper.findComponent({ name: 'WebContent' }).props('url')).toBe('https://app.example');
    wrapper.vm.launchWidget([{ type: 'clock' }]); await nextTick();
    expect(wrapper.findComponent({ name: 'WidgetView' }).props('widgets')).toEqual([{ type: 'clock' }]);
    wrapper.unmount(); opened.mockRestore();
  });

  it('multitasking renders the initial app and switches Unicode URLs without remounting old frames', async () => {
    const wrapper = mount(MultiTasking, { props: { url: 'https://example.com/工作' }, attachTo: document.body });
    expect(wrapper.findAll('iframe')).toHaveLength(1);
    const first = wrapper.get('iframe').element;
    await wrapper.setProps({ url: 'https://example.com/second' });
    expect(wrapper.findAll('iframe')).toHaveLength(2);
    expect(wrapper.findAll('.web-content.hide')).toHaveLength(1);
    await wrapper.setProps({ url: 'https://example.com/工作' });
    expect(wrapper.findAll('iframe')).toHaveLength(2);
    expect(wrapper.get('.web-content:not(.hide) iframe').element).toBe(first);
    wrapper.unmount();
  });

  it('widget editor includes every upstream component and saves arbitrary original options', async () => {
    const store = makeStore();
    const wrapper = shallowMount(EditWidget, { props: { sectionName: 'AI', isAddNew: true }, global: options(store) });
    expect(wrapper.find('select[aria-label="小组件类型"]').findAll('option').length).toBeGreaterThanOrEqual(WIDGET_CATALOG.length);
    await wrapper.get('select[aria-label="小组件类型"]').setValue('custom-api');
    await wrapper.get('textarea[aria-label="组件参数 JSON"]').setValue('{"endpoint":"https://api.example","headers":{"Authorization":"Bearer DASHY_TOKEN"}}');
    await wrapper.get('select[aria-label="小组件类型"]').setValue('calendar');
    await wrapper.get('select[aria-label="小组件类型"]').setValue('custom-api');
    expect(JSON.parse(wrapper.get('textarea[aria-label="组件参数 JSON"]').element.value).endpoint).toBe('https://api.example');
    wrapper.vm.draft.useProxy = true;
    wrapper.vm.draft.timeout = 9000;
    wrapper.vm.saveWidget();
    const saved = store.commit.mock.calls.find(([key]) => key === 'INSERT_WIDGET')[1].widget;
    expect(saved.type).toBe('custom-api'); expect(saved.options.endpoint).toBe('https://api.example');
    expect(saved.useProxy).toBe(true); expect(saved.timeout).toBe(9000);
    wrapper.unmount();
  });

  it('all opening methods and original advanced item fields are editable', async () => {
    const store = makeStore();
    const wrapper = shallowMount(EditItem, { props: { itemId: 'site', parentSectionTitle: 'AI' }, global: options(store) });
    const values = wrapper.findAll('select[aria-label="打开方式"] option').map(o => o.attributes('value'));
    expect(values).toEqual(expect.arrayContaining(['modal', 'workspace', 'clipboard', 'newwindow', 'newtab', 'sametab', 'top', 'parent']));
    await wrapper.get('select[aria-label="打开方式"]').setValue('workspace');
    await wrapper.get('textarea[aria-label="网站高级字段 JSON"]').setValue('{"hotkey":3,"alias":"my-tool","color":"red"}');
    wrapper.vm.saveItem();
    const saved = store.commit.mock.calls.find(([key]) => key === 'UPDATE_ITEM')[1].newItem;
    expect(saved.target).toBe('workspace'); expect(saved.hotkey).toBe(3); expect(saved.alias).toBe('my-tool'); expect(saved.color).toBe('red');
    wrapper.unmount();
  });

  it('the restored renderer actually loads a widget outside the former four-type restriction', async () => {
    const wrapper = mount(WidgetBase, { props: { widget: { type: 'embed', options: { html: '<b>Lab status</b>' } }, index: 0 }, global: options(makeStore()), attachTo: document.body });
    await flushPromises();
    await vi.waitFor(() => expect(wrapper.find('.html-widget').exists()).toBe(true));
    expect(wrapper.find('.widget-deferred').exists()).toBe(false);
    wrapper.unmount();
  });

  it('nested groups preserve child configuration and expose every opening method', async () => {
    const child = { title: 'Docs', url: 'https://docs.example', target: 'newtab', statusCheck: true };
    const wrapper = shallowMount(SubItemsEditor, { props: { modelValue: [{ title: 'Tools', subItems: [child] }, child] } });
    expect(wrapper.findComponent('.nested-group').props('modelValue')).toEqual([child]);
    expect(wrapper.findAll('select option').map(o => o.attributes('value'))).toEqual(expect.arrayContaining(['modal', 'workspace', 'clipboard', 'newwindow', 'newtab', 'sametab', 'top', 'parent']));
    await wrapper.get('select').setValue('workspace');
    expect(wrapper.emitted('update:modelValue').at(-1)[0][1]).toEqual({ ...child, target: 'workspace' });
    wrapper.unmount();

    const store = makeStore();
    store.getters.getItemById = () => ({ title: 'Group', subItems: [{ title: 'Nested', subItems: [child] }] });
    const editor = shallowMount(EditItem, { props: { itemId: 'group', parentSectionTitle: 'AI' }, global: options(store) });
    editor.vm.saveItem();
    expect(editor.vm.error).toBe('');
    expect(store.commit.mock.calls.find(([key]) => key === 'UPDATE_ITEM')[1].newItem.subItems[0].subItems[0]).toEqual(child);
    editor.unmount();
  });

  it('item preferences now enable HTTP/Ping and LAN probing', () => {
    const context = { appConfig: { statusCheck: true, pingCheckEnabled: true }, item: { localUrl: 'https://nas.home' }, pingCheckHost: 'example.com' };
    expect(ItemMixin.computed.enableStatusCheck.call(context)).toBe(true);
    expect(ItemMixin.computed.isPingCheckEnabled.call(context)).toBe(true);
    expect(ItemMixin.computed.hasLocalUrl.call(context)).toBe(true);
    context.item.statusCheck = false;
    expect(ItemMixin.computed.enableStatusCheck.call(context)).toBe(false);
  });
});
