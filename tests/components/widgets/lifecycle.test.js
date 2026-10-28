import { shallowMount } from '@vue/test-utils';
import WidgetMixin from '@/mixins/WidgetMixin';
vi.mock('rsup-progress',()=>({Progress:class {start=vi.fn();end=vi.fn();}}));
afterEach(()=>vi.useRealTimers());
const mountWidget=()=>shallowMount({mixins:[WidgetMixin],template:'<div/>',methods:{fetchData:vi.fn()}},{props:{options:{updateInterval:2}}});
it('keeps one refresh interval when continuous updates are restarted',()=>{
  vi.useFakeTimers({toFake:['setTimeout','clearTimeout','setInterval','clearInterval']});const w=mountWidget();
  const fetchData=vi.spyOn(w.vm,'fetchData');
  w.vm.continuousUpdates();w.vm.continuousUpdates();
  vi.advanceTimersByTime(2000);
  expect(fetchData).toHaveBeenCalledTimes(1);
  w.unmount();vi.advanceTimersByTime(10000);
  expect(fetchData).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});
it('clears delayed progress completion and ignores late finishes after unmount',()=>{
  vi.useFakeTimers({toFake:['setTimeout','clearTimeout','setInterval','clearInterval']});const w=mountWidget();const vm=w.vm;
  vm.finishLoading();vm.finishLoading();
  expect(vi.getTimerCount()).toBe(2);
  w.unmount();expect(vi.getTimerCount()).toBe(0);
  const calls=vm.progress.end.mock.calls.length;
  vm.finishLoading();vm.startLoading();vm.continuousUpdates();
  vi.advanceTimersByTime(5000);
  expect(vi.getTimerCount()).toBe(0);
  expect(vm.progress.end).toHaveBeenCalledTimes(calls);
});
