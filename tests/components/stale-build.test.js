vi.mock('@/utils/Toast', () => ({ toast: vi.fn() }));

// tests/setup.js stubs sessionStorage with no-ops; the reload guard needs one that keeps values.
beforeEach(() => {
  vi.resetModules(); vi.useFakeTimers();
  const store = new Map();
  vi.stubGlobal('sessionStorage', { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k), clear: () => store.clear() });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it('while editing, asks before reloading so unsaved changes are not lost, and asks only once', async () => {
  const { handleStaleBuild } = await import('@/utils/StaleBuild');
  const { toast } = await import('@/utils/Toast');
  const reload = vi.fn(); const event = { preventDefault: vi.fn() };
  handleStaleBuild(event, { isEditing: () => true, reload });
  handleStaleBuild(event, { isEditing: () => true, reload });
  vi.advanceTimersByTime(5000);
  expect(reload).not.toHaveBeenCalled();
  expect(toast).toHaveBeenCalledTimes(1);
  expect(toast.mock.calls[0][0]).toContain('保存到云端');
  toast.mock.calls[0][1].action.onClick();
  expect(reload).toHaveBeenCalledTimes(1);
  expect(event.preventDefault).toHaveBeenCalled();
});

it('while browsing, reloads once, straight into the route that failed to load', async () => {
  const { handleStaleBuild, rememberDestination } = await import('@/utils/StaleBuild');
  const reload = vi.fn();
  handleStaleBuild({}, { reload });
  rememberDestination('/minimal');
  expect(reload).toHaveBeenCalledWith('/minimal');
  vi.advanceTimersByTime(5000);
  expect(reload).toHaveBeenCalledTimes(1);
  // A second failure right after the reload shows the error instead of looping
  handleStaleBuild({}, { reload });
  vi.advanceTimersByTime(5000);
  expect(reload).toHaveBeenCalledTimes(1);
});

it('reloads in place when no route change was involved', async () => {
  const { handleStaleBuild, rememberDestination } = await import('@/utils/StaleBuild');
  const reload = vi.fn();
  rememberDestination('/ignored'); // no failure pending: ignored
  handleStaleBuild({}, { reload });
  vi.advanceTimersByTime(999);
  expect(reload).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(reload).toHaveBeenCalledWith();
});
