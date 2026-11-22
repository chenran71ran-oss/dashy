import {
  describe, it, expect, vi, afterEach,
} from 'vitest';
import { reactive, nextTick } from 'vue';
import { mount, shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import Workspace from '@/views/Workspace.vue';
import SideBar from '@/components/Workspace/SideBar.vue';
import WidgetView from '@/components/Workspace/WidgetView.vue';

vi.mock('@/utils/request', () => ({ default: { get: vi.fn() } }));
vi.mock('@/router', () => ({ default: { push: vi.fn() } }));
vi.mock('@/utils/auth/Auth', () => ({ getCurrentUser: () => null, isLoggedInAsGuest: () => false }));

const widgets = [{ type: 'clock' }];
const sections = [
  {
    name: 'Apps',
    items: [
      { title: 'One', url: 'https://one.com/', icon: 'si-github', iconColor: 'blue' },
      { title: 'Hidden', url: 'https://hidden.com/', displayData: { hideFromWorkspace: true } },
    ],
  },
  { name: 'Group', items: [{ title: 'Group', subItems: [{ title: 'Two', url: 'https://two.com/' }] }] },
  { name: 'Widgets', widgets },
  { name: 'Secret', displayData: { hideFromWorkspace: true }, items: [{ title: 'S', url: 'https://s.com/' }] },
];

function mountWith(component, {
  query = {}, appConfig = {}, props = {}, shallow = true,
} = {}) {
  const store = createStore({
    state: { currentConfigInfo: {}, editMode: false },
    getters: {
      sections: () => sections,
      appConfig: () => appConfig,
      visibleComponents: () => ({ searchBar: true }),
    },
  });
  const route = reactive({ path: '/workspace', params: {}, query });
  const router = { replace: vi.fn((location) => { route.query = location.query; }) };
  const wrapper = (shallow ? shallowMount : mount)(component, {
    props,
    global: {
      plugins: [store],
      directives: { tooltip: {} },
      mocks: { $route: route, $router: router, $t: (key) => key },
      stubs: {
        WebContent: false, IconWorkspace: true, RouterLink: true, Icon: true,
      },
    },
  });
  return { wrapper, router, route };
}

describe('Workspace view', () => {
  const frameSrcs = (wrapper) => wrapper.findAll('iframe').map((f) => f.attributes('src'));
  const sideBarEmit = async (wrapper, event, value) => {
    wrapper.findComponent(SideBar).vm.$emit(event, value);
    await nextTick();
  };

  it('shows the app from the url param, and nothing for unsafe urls', () => {
    expect(frameSrcs(mountWith(Workspace, { query: { url: 'https://one.com/' } }).wrapper))
      .toEqual(['https://one.com/']);
    const { wrapper } = mountWith(Workspace, { query: { url: 'javascript:alert(1)' } });
    expect(frameSrcs(wrapper)).toEqual([]);
    expect(wrapper.find('.empty-state').exists()).toBe(true);
  });

  it('shows one app at a time, unless multi-tasking', async () => {
    const { wrapper } = mountWith(Workspace, { query: { url: 'https://one.com/' } });
    await sideBarEmit(wrapper, 'launch-app', 'https://two.com/');
    expect(frameSrcs(wrapper)).toEqual(['https://two.com/']);
  });

  it('keeps apps mounted when multi-tasking, and switches to the last one on close', async () => {
    const { wrapper, router } = mountWith(Workspace, {
      query: { url: 'https://one.com/' }, appConfig: { enableMultiTasking: true },
    });
    await sideBarEmit(wrapper, 'launch-app', 'https://two.com/');
    expect(frameSrcs(wrapper)).toEqual(['https://one.com/', 'https://two.com/']);
    await sideBarEmit(wrapper, 'close-app', 'https://two.com/');
    expect(router.replace).toHaveBeenLastCalledWith({ query: { url: 'https://one.com/' } });
    expect(frameSrcs(wrapper)).toEqual(['https://one.com/']);
  });

  it('switches to an open app, rather than reopening it, for a variant of its url', async () => {
    const { wrapper, router } = mountWith(Workspace, { query: { url: 'https://one.com/' } });
    await sideBarEmit(wrapper, 'launch-app', 'https://ONE.com');
    expect(router.replace).toHaveBeenLastCalledWith({ query: { url: 'https://one.com/' } });
    expect(wrapper.findComponent(SideBar).props('openUrls')).toEqual(['https://one.com/']);
  });

  it('shows widgets in place of the app, until another app is launched', async () => {
    const { wrapper, router } = mountWith(Workspace, { query: { url: 'https://one.com/' } });
    await sideBarEmit(wrapper, 'launch-widget', widgets);
    expect(router.replace).toHaveBeenLastCalledWith({ query: {} });
    await sideBarEmit(wrapper, 'close-app', 'https://one.com/');
    expect(wrapper.findComponent(WidgetView).exists()).toBe(true);
    await sideBarEmit(wrapper, 'launch-app', 'https://two.com/');
    expect(wrapper.findComponent(WidgetView).exists()).toBe(false);
  });

  it('clears widgets when switching to another page', async () => {
    const { wrapper, route } = mountWith(Workspace);
    await sideBarEmit(wrapper, 'launch-widget', widgets);
    route.path = '/workspace/other';
    await nextTick();
    expect(wrapper.findComponent(WidgetView).exists()).toBe(false);
  });

  it('opens the landing url only when no app is in the url', () => {
    const appConfig = { workspaceLandingUrl: 'https://two.com/' };
    expect(mountWith(Workspace, { appConfig }).router.replace)
      .toHaveBeenCalledWith({ query: { url: 'https://two.com/' } });
    expect(mountWith(Workspace, { appConfig, query: { url: 'https://one.com/' } }).router.replace)
      .not.toHaveBeenCalled();
  });
});

describe('Workspace SideBar', () => {
  afterEach(() => localStorage.clear());

  const mountSideBar = (props = {}) => mountWith(SideBar, {
    props: { sections, ...props }, shallow: false,
  }).wrapper;
  const titlesIn = (wrapper, selector) => wrapper.findAll(`${selector} .title`).map((title) => title.text());

  it('hides sections and items marked hideFromWorkspace', () => {
    const wrapper = mountSideBar({ activeUrl: 'https://one.com/' });
    expect(titlesIn(wrapper, '.side-bar-item-container')).toEqual(['Apps', 'Group', 'Widgets']);
    expect(titlesIn(wrapper, '.sub-side-bar')).toEqual(['One']);
  });

  it('opens the section holding the active app, including sub-items', () => {
    expect(titlesIn(mountSideBar({ activeUrl: 'https://two.com' }), '.sub-side-bar')).toEqual(['Two']);
  });

  it('filters items by search, opening every section with a match', async () => {
    const wrapper = mountSideBar();
    await wrapper.find('.side-bar-toggle').trigger('click');
    await wrapper.find('.side-bar-search').setValue('two');
    expect(titlesIn(wrapper, '.side-bar-item-container')).toEqual(['Group']);
    expect(titlesIn(wrapper, '.sub-side-bar')).toEqual(['Two']);
  });

  it('shows only the matching sub-items of a group, unless the group itself matches', async () => {
    const group = {
      title: 'Downloads',
      description: 'Media managers',
      subItems: [
        { title: 'Sonarr', url: 'https://sonarr.lab/' },
        { title: 'Radarr', url: 'https://radarr.lab/' },
      ],
    };
    const wrapper = mountSideBar({ sections: [{ name: 'Media', items: [group] }] });
    await wrapper.find('.side-bar-toggle').trigger('click');
    const searchFor = (term) => wrapper.find('.side-bar-search').setValue(term);
    await searchFor('sonarr');
    expect(titlesIn(wrapper, '.sub-side-bar')).toEqual(['Sonarr']);
    await searchFor('downloads radarr');
    expect(titlesIn(wrapper, '.sub-side-bar')).toEqual(['Radarr']);
    await searchFor('managers');
    expect(titlesIn(wrapper, '.sub-side-bar')).toEqual(['Sonarr', 'Radarr']);
  });

  it('shows widgets when their section is opened, but not when closed', async () => {
    const wrapper = mountSideBar();
    const header = wrapper.find('.side-bar-item-container [aria-label="Widgets"]');
    await header.trigger('click');
    await header.trigger('click');
    expect(wrapper.emitted('launch-widget')).toEqual([[widgets]]);
  });

  it('lists open apps from the first, by item title or host, and closes them', async () => {
    const wrapper = mountSideBar({ openUrls: ['https://two.com/'] });
    expect(titlesIn(wrapper, '.open-apps')).toEqual(['Two']);
    await wrapper.setProps({ openUrls: ['https://two.com/', 'https://other.com/'] });
    expect(titlesIn(wrapper, '.open-apps')).toEqual(['Two', 'other.com']);
    await wrapper.findAll('.close-app')[1].trigger('click');
    expect(wrapper.emitted('close-app')).toEqual([['https://other.com/']]);
  });

  it('keeps the item icon color for open apps', () => {
    const wrapper = mountSideBar({ openUrls: ['https://one.com/'] });
    expect(wrapper.find('.open-apps').findComponent({ name: 'Icon' }).attributes('style')).toContain('color: blue');
  });
});
