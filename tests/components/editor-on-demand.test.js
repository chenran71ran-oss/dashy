import fs from 'node:fs';
import path from 'node:path';
import { h } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import SubItemGroup from '@/components/LinkItems/SubItemGroup.vue';

vi.mock('@/components/InteractiveEditor/EditItem.vue', () => ({
  __esModule: true,
  default: { name: 'EditItem', props: ['itemId'], render() { return h('div', { class: 'edit-item-stub' }, this.itemId); } },
}));

// Views and cards render at start-up; a static import of the editor pulls it (and the modules it
// shares with them) into the start-up chunks, which once left the page blank after sign-in.
it('start-up views and cards load the item editor only on demand', () => {
  const dirs = ['src/views', 'src/components/LinkItems', 'src/components/Workspace', 'src/components/MinimalView'];
  const offenders = [];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter(name => name.endsWith('.vue'))) {
      const source = fs.readFileSync(path.join(dir, file), 'utf8');
      if (/^import\s+\w+\s+from\s+['"]@\/components\/InteractiveEditor\/EditItem\.vue['"]/m.test(source)) offenders.push(`${dir}/${file}`);
    }
  }
  expect(offenders).toEqual([]);
});

it('a sub-item group opens the editor when asked', async () => {
  const w = mount(SubItemGroup, {
    props: { itemId: 'item-1', subItems: [], title: '小分类' },
    global: { mocks: { $store: { state: { editMode: true } } }, stubs: { SubItem: true } },
  });
  expect(w.find('.edit-item-stub').exists()).toBe(false);
  await w.find('button.cloud-edit-group').trigger('click');
  await flushPromises(); await new Promise(resolve => setTimeout(resolve, 0)); await flushPromises();
  expect(w.find('.edit-item-stub').text()).toBe('item-1');
  w.unmount();
});
