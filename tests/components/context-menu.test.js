import { mount, flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ItemContextMenu from '@/components/LinkItems/ItemContextMenu.vue';
import SectionContextMenu from '@/components/LinkItems/SectionContextMenu.vue';
import clickOutside from '@/directives/ClickOutside';

const labels = {
  'context-menus.item.open-section-title': '打开方式',
  'context-menus.item.sametab': '在当前页打开',
  'context-menus.item.newtab': '在新标签页打开',
  'context-menus.item.edit-item': '编辑',
};
let wrapper;
let host;

async function openMenu(component = ItemContextMenu, props = {}, canEdit = true) {
  host = document.createElement('div');
  host.style.cssText = 'position:relative;transform:translateX(400px);width:80px';
  document.body.append(host);
  wrapper = mount(component, {
    attachTo: host,
    props: { show: true, posX: 0, posY: 0, ...props },
    global: {
      mocks: {
        $t: key => labels[key] || key,
        $store: { state: { editMode: true }, getters: { permissions: { allowViewConfig: canEdit } } },
      },
      directives: { clickOutside },
      stubs: Object.fromEntries(Object.keys(component.components).filter(name => name.endsWith('Icon')).map(name => [name, true])),
    },
  });
  await flushPromises();
  return document.querySelector('.context-menu');
}

beforeEach(() => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function rect() {
    return new DOMRect(0, 0, this.classList.contains('context-menu') ? 240 : 80, this.classList.contains('context-menu') ? 400 : 60);
  });
});
afterEach(() => {
  wrapper?.unmount();
  host?.remove();
  vi.restoreAllMocks();
});

describe('context menus stay readable outside narrow or positioned view containers', () => {
  it.each([ItemContextMenu, SectionContextMenu])('renders outside the triggering card container', async component => {
    const menu = await openMenu(component);
    expect(document.body.contains(menu)).toBe(true);
    expect(host.contains(menu)).toBe(false);
  });

  it('keeps the entire menu inside the lower right viewport edge', async () => {
    const menu = await openMenu(ItemContextMenu, { posX: window.innerWidth - 1, posY: window.innerHeight - 1 });
    expect(parseFloat(menu.style.left)).toBe(window.innerWidth - 240 - 8);
    expect(parseFloat(menu.style.top)).toBe(window.innerHeight - 400 - 8);
  });

  it('accepts pointer coordinates at zero and leaves a small viewport margin', async () => {
    const menu = await openMenu();
    expect(parseFloat(menu.style.left)).toBe(8);
    expect(parseFloat(menu.style.top)).toBe(8);
  });

  it('repositions when the pointer changes while the menu remains open', async () => {
    const menu = await openMenu();
    await wrapper.setProps({ posX: 125, posY: 100 });
    await flushPromises();
    expect(parseFloat(menu.style.left)).toBe(125);
    expect(parseFloat(menu.style.top)).toBe(100);
  });

  it('closes when clicking outside the teleported menu', async () => {
    await openMenu();
    host.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('suppresses the browser menu when right-clicking the popup itself', async () => {
    const menu = await openMenu();
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    menu.querySelector('li').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('keeps the selected opening method when clicking inside the menu', async () => {
    const menu = await openMenu();
    [...menu.querySelectorAll('li')].find(li => li.textContent.includes('在新标签页打开')).click();
    expect(wrapper.emitted('launchItem')).toEqual([['newtab']]);
    expect(wrapper.emitted('close')).toBeUndefined();
  });

  it('keeps edit permissions in the shared menu', async () => {
    const menu = await openMenu(ItemContextMenu, {}, false);
    [...menu.querySelectorAll('li')].find(li => li.textContent.trim() === '编辑').click();
    expect(wrapper.emitted('openItemSettings')).toBeUndefined();
  });
});
