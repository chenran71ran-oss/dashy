import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import SideBarItem from '@/components/Workspace/SideBarItem.vue';

vi.mock('@/utils/request', () => ({ default: { get: vi.fn() } }));
vi.mock('@/router', () => ({ default: { push: vi.fn() } }));

function mountItem(item, props = {}) {
  return shallowMount(SideBarItem, {
    props: { item, ...props },
    global: {
      directives: {
        tooltip: {},
      },
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        Icon: true,
      },
    },
  });
}

describe('SideBarItem', () => {
  let openSpy;

  beforeEach(() => {
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a link with icon and title when item has a url', () => {
    const wrapper = mountItem({ icon: 'fas fa-server', title: 'Server', url: 'https://example.com' });
    expect(wrapper.element.tagName).toBe('A');
    expect(wrapper.attributes('href')).toBe('https://example.com');
    expect(wrapper.findComponent({ name: 'Icon' }).exists()).toBe(true);
    expect(wrapper.find('.title').text()).toBe('Server');
  });

  it('renders a button with initials when there is no url or icon', () => {
    const wrapper = mountItem({ title: 'No Icon App' });
    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.find('.initials').text()).toBe('NI');
  });

  it('emits launch-app on normal click, without navigating', () => {
    const wrapper = mountItem({ title: 'App', url: 'https://example.com', target: 'workspace' });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    wrapper.element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(wrapper.emitted('launch-app')).toEqual([['https://example.com']]);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('leaves ctrl/meta clicks to the browser', async () => {
    const wrapper = mountItem({ title: 'App', url: 'https://example.com' });
    await wrapper.trigger('click', { ctrlKey: true });
    await wrapper.trigger('click', { metaKey: true });
    expect(wrapper.emitted('launch-app')).toBeFalsy();
  });

  it('opens newtab targets outside the workspace', async () => {
    const wrapper = mountItem({ title: 'App', url: 'https://example.com', target: 'newtab' });
    await wrapper.trigger('click');
    expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
    expect(wrapper.emitted('launch-app')).toBeFalsy();
  });

  it('marks the active item', () => {
    const wrapper = mountItem({ title: 'App', url: 'https://example.com' }, { active: true });
    expect(wrapper.classes()).toContain('active');
  });

  it('applies iconColor to the icon', () => {
    const wrapper = mountItem({ icon: 'si-github', url: 'https://example.com', iconColor: 'blue' });
    expect(wrapper.findComponent({ name: 'Icon' }).attributes('style')).toContain('color: blue');
  });
});
