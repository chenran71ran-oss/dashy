import { shallowMount } from '@vue/test-utils';
import StatusIndicator from '@/components/LinkItems/StatusIndicator.vue';

describe('HTTP and Ping indicators only show success when the response confirms it', () => {
  it('moves from pending to success and then failure without fabricating a green status', async () => {
    const wrapper = shallowMount(StatusIndicator, { props: { statusSuccess: undefined }, global: { directives: { tooltip: {} } } });
    expect(wrapper.find('.dot-yellow').exists()).toBe(true);
    await wrapper.setProps({ statusSuccess: true, statusText: 'HTTP 200' });
    expect(wrapper.find('.dot-green').exists()).toBe(true);
    await wrapper.setProps({ statusSuccess: undefined, statusText: 'Checking...' });
    expect(wrapper.find('.dot-green').exists()).toBe(false);
    await wrapper.setProps({ statusSuccess: false, statusText: 'Ping backend unavailable' });
    expect(wrapper.find('.dot-red').exists()).toBe(true);
    wrapper.unmount();
  });
  it('preserves shape-based status accessibility', () => {
    const wrapper = shallowMount(StatusIndicator, { props: { statusSuccess: false, statusAccessibility: true }, global: { directives: { tooltip: {} } } });
    expect(wrapper.get('.dot').classes()).toEqual(expect.arrayContaining(['dot-red', 'a11y-mode']));
    wrapper.unmount();
  });
});
