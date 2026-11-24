import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';
import { shallowMount, flushPromises } from '@vue/test-utils';
import request from '@/utils/request';
import Calendar from '@/components/Widgets/Calendar.vue';

vi.mock('@/utils/request', () => ({ default: vi.fn() }));
vi.mock('@/utils/logging/ErrorHandler', () => ({ default: vi.fn() }));

/* Events sit at a local wall-clock time on a frozen local day, so that day
 * labels and ordering come out the same whatever timezone the tests run in */
const NOW = new Date('2026-09-03T08:00:00');
const at = (addDays, hour) => {
  const date = new Date(NOW);
  date.setDate(date.getDate() + addDays);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString().replace(/[-:]|\.\d{3}/g, '');
};

const feed = (...events) => [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  ...events.map((lines) => ['BEGIN:VEVENT', ...lines, 'END:VEVENT'].join('\r\n')),
  'END:VCALENDAR',
].join('\r\n');

const defaultFeed = feed(
  ['UID:1', `DTSTART:${at(0, 10)}`, `DTEND:${at(0, 11)}`,
    'SUMMARY:Standup, where nobody stands', 'LOCATION:The broom cupboard',
    'DESCRIPTION:Bring your own excuses'],
  ['UID:2', 'DTSTART;VALUE=DATE:20260904', 'DTEND;VALUE=DATE:20260905',
    'SUMMARY:Offsite trust falls'],
  ['UID:3', `DTSTART:${at(2, 9)}`, 'SUMMARY:Dentist, reluctantly',
    'URL:https://example.com/appointment'],
);

const tooltips = [];
const tooltip = { mounted: (el, binding) => tooltips.push(binding.value.content) };

async function mount(options = {}) {
  const wrapper = shallowMount(Calendar, {
    props: { options: { calendarUrl: 'https://example.com/cal.ics', ...options } },
    global: { directives: { tooltip }, mocks: { $t: (key) => key } },
  });
  await flushPromises();
  return wrapper;
}

const textOf = (wrapper, selector) => wrapper.findAll(selector).map((node) => node.text());
const titles = (wrapper) => textOf(wrapper, '.event-title');

describe('Calendar widget', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(NOW);
    tooltips.length = 0;
    request.mockReset();
    request.mockResolvedValue({ data: defaultFeed });
  });

  afterEach(() => vi.useRealTimers());

  it('groups events under a heading for each day', async () => {
    const wrapper = await mount();
    const labels = textOf(wrapper, '.day-label');
    expect(labels).toHaveLength(3);
    expect(labels.slice(0, 2)).toEqual(['widgets.calendar.today', 'widgets.calendar.tomorrow']);
    expect(titles(wrapper))
      .toEqual(['Standup, where nobody stands', 'Offsite trust falls', 'Dentist, reluctantly']);
  });

  it('labels all-day events, and shows a start time for the rest', async () => {
    const times = textOf(await mount(), '.event-time');
    expect(times[1]).toBe('widgets.calendar.all-day');
    expect(times[0]).toMatch(/\d{2}:\d{2}/);
  });

  it('always fetches through the proxy, rewriting webcal links', async () => {
    await mount({ calendarUrl: 'webcal://example.com/cal.ics' });
    expect(request).toHaveBeenCalledTimes(1);
    const [config] = request.mock.calls[0];
    expect(config.url).toContain('/cors-proxy');
    expect(config.headers['Target-URL']).toBe('https://example.com/cal.ics');
  });

  it('merges several calendars, ordered by start time', async () => {
    request.mockImplementation((config) => Promise.resolve({
      data: config.headers['Target-URL'].includes('work')
        ? feed(['UID:w', `DTSTART:${at(0, 11)}`, 'SUMMARY:Explain the outage'])
        : feed(['UID:h', `DTSTART:${at(0, 9)}`, 'SUMMARY:Gym (aspirational)']),
    }));
    const wrapper = await mount({
      calendarUrl: [
        { url: 'https://example.com/work.ics', name: 'Work', color: '#ff0000' },
        { url: 'https://example.com/home.ics', name: 'Home' },
      ],
    });
    expect(titles(wrapper)).toEqual(['Gym (aspirational)', 'Explain the outage']);
    expect(wrapper.findAll('.calendar-dot')).toHaveLength(1);
  });

  it('keeps rendering when only some of the calendars fail', async () => {
    request
      .mockRejectedValueOnce(new Error('unreachable'))
      .mockResolvedValueOnce({ data: defaultFeed });
    const wrapper = await mount({
      calendarUrl: ['https://example.com/broken.ics', 'https://example.com/cal.ics'],
    });
    expect(titles(wrapper)).toHaveLength(3);
  });

  it('respects limit, hideAllDay and days', async () => {
    expect(titles(await mount({ limit: 2 }))).toHaveLength(2);

    expect(titles(await mount({ hideAllDay: true })))
      .toEqual(['Standup, where nobody stands', 'Dentist, reluctantly']);

    const today = titles(await mount({ days: 1 }));
    expect(today).toContain('Standup, where nobody stands');
    expect(today).not.toContain('Dentist, reluctantly');
  });

  it('links events that have a URL, and leaves the others as plain rows', async () => {
    const links = (await mount()).findAll('a.event-row');
    expect(links).toHaveLength(1);
    expect(links[0].attributes('href')).toBe('https://example.com/appointment');
  });

  it('drops unsafe event URLs', async () => {
    request.mockResolvedValue({
      data: feed(['UID:1', `DTSTART:${at(0, 10)}`, 'SUMMARY:Totally legitimate prize',

        'URL:javascript:alert(1)']),
    });
    expect((await mount()).findAll('a.event-row')).toHaveLength(0);
  });

  it('shows the location in the tooltip, and names the calendar only when there are several', async () => {
    await mount();
    expect(tooltips[0]).toContain('The broom cupboard');
    expect(tooltips[0]).not.toContain('Work');

    tooltips.length = 0;
    await mount({
      calendarUrl: [
        { url: 'https://example.com/work.ics', name: 'Work' },
        { url: 'https://example.com/home.ics' },
      ],
    });
    expect(tooltips[0]).toContain('Work');
  });

  it('falls back to the feed\'s own name when the calendar has not been named', async () => {
    request.mockResolvedValue({
      data: ['BEGIN:VCALENDAR', 'X-WR-CALNAME:Bin collections',
        `BEGIN:VEVENT\r\nUID:1\r\nDTSTART:${at(0, 10)}\r\nSUMMARY:Green bin\r\nEND:VEVENT`,
        'END:VCALENDAR'].join('\r\n'),
    });
    await mount({ calendarUrl: ['https://example.com/a.ics', 'https://example.com/b.ics'] });
    expect(tooltips[0]).toContain('Bin collections');
  });

  it('shows location and description inline, only when asked', async () => {
    expect(textOf(await mount(), '.event-meta')).toEqual([]);

    expect(textOf(await mount({ showLocation: true }), '.event-meta')[0])
      .toBe('The broom cupboard');
    expect(textOf(await mount({ showDescription: true }), '.event-meta')[0])
      .toBe('Bring your own excuses');
    expect(textOf(await mount({ showLocation: true, showDescription: true }), '.event-meta')[0])
      .toBe('The broom cupboard · Bring your own excuses');
  });

  it('keeps showing an event that is underway, under today', async () => {
    request.mockResolvedValue({
      data: feed(['UID:1', `DTSTART:${at(0, 7)}`, `DTEND:${at(0, 18)}`, 'SUMMARY:All-day hackathon']),
    });
    const wrapper = await mount();
    expect(titles(wrapper)).toEqual(['All-day hackathon']);
    expect(textOf(wrapper, '.day-label')).toEqual(['widgets.calendar.today']);
  });

  it('reports a helpful message when no calendar is configured', async () => {
    const wrapper = await mount({ calendarUrl: null });
    expect(request).not.toHaveBeenCalled();
    expect(wrapper.emitted().error[0][0]).toContain('Missing calendarUrl');
  });

  it('reports a message when the feed is not a calendar, without saying it is empty', async () => {
    request.mockResolvedValue({ data: '<html>Please log in</html>' });
    const wrapper = await mount();
    expect(wrapper.emitted().error[0][0]).toContain('Unable to parse calendar');
    expect(wrapper.find('.no-events').exists()).toBe(false);
  });

  it('says so when there is nothing coming up', async () => {
    request.mockResolvedValue({ data: feed() });
    expect((await mount()).find('.no-events').text()).toBe('widgets.calendar.no-events');
  });
});
