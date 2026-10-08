import { shallowMount } from '@vue/test-utils';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import IconPicker from '@/components/InteractiveEditor/IconPicker.vue';
import { builtinIcons, builtinIconPath, isColoredIcon, iconCategories } from '@/utils/BuiltinIcons';

vi.mock('@/components/LinkItems/ItemIcon.vue', () => ({ default: { name: 'Icon', props: ['icon'], template: '<span />' } }));

describe('bundled color icon catalog', () => {
  it('provides resolvable, transparent SVG assets with valid categories and unique saved identifiers', () => {
    const entries = builtinIcons.filter(entry => entry.pack === 'Icons8 Flat Color');
    const categories = new Set(iconCategories.map(category => category.id));
    expect(entries).toHaveLength(329);
    expect(new Set(builtinIcons.map(entry => entry.value)).size).toBe(builtinIcons.length);
    for (const entry of entries) {
      expect(categories.has(entry.category)).toBe(true);
      expect(builtinIconPath(entry.value)).toBe(entry.src);
      const svg = readFileSync(resolve(process.cwd(), `public${entry.src}`), 'utf8');
      expect(svg).toMatch(/<svg\b[^>]*viewBox=/);
      expect(svg).not.toMatch(/<(script|foreignObject|filter)\b|(?:href|src)\s*=\s*["']/i);
    }
  });

  it('lets the picker find color icons by category, Chinese name and English keyword, and emit the saved icon', async () => {
    const wrapper = shallowMount(IconPicker, { props: { modelValue: '' } });
    await wrapper.setData({ open: true, activeCategory: 'color' });
    expect(wrapper.vm.matches).toHaveLength(387);
    expect(wrapper.vm.matches.every(isColoredIcon)).toBe(true);
    await wrapper.setData({ query: '数据库' });
    expect(wrapper.vm.matches.some(entry => entry.value === 'flat-color-database')).toBe(true);
    await wrapper.setData({ query: 'database', activeCategory: 'infra' });
    expect(wrapper.vm.matches.some(entry => entry.value === 'flat-color-database')).toBe(true);
    await wrapper.setData({ query: '时钟', activeCategory: 'productivity' });
    const clock = wrapper.get('button[aria-label="时钟 / clock"]');
    await clock.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([['flat-color-clock']]);
    expect(wrapper.vm.open).toBe(false);
    wrapper.unmount();
  });
});
