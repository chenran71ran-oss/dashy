<template>
<div class="clock" :class="{ 'date-hidden': options.hideDate }">
  <div class="upper" v-if="!options.hideDate">
    <p class="city">{{ cityName }}</p>
    <p class="date">{{ date }}</p>
  </div>
  <p class="time">{{ time }}</p>
</div>
</template>

<script>
import WidgetMixin from '@/mixins/WidgetMixin';

export default {
  mixins: [WidgetMixin],
  data() {
    return {
      time: null, // Current time string
      date: null, // Current date string
      timeUpdateInterval: null, // Stores setInterval function
    };
  },
  computed: {
    /* Get time zone, either specified by user or calculated from browser */
    timeZone() {
      if (this.options.timeZone) return this.options.timeZone;
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    },
    /* Get date/time format specification, either user choice, or from browser lang */
    timeFormat() {
      if (this.options.format) return this.options.format;
      return navigator.language;
    },
    /* Get city name from time-zone, or return users custom city name */
    cityName() {
      if (this.options.customCityName) return this.options.customCityName;
      return (this.timeZone.split('/').pop() || this.timeZone).replaceAll('_', ' ');
    },
    showSeconds() {
      return !this.options.hideSeconds;
    },
    use12Hour() {
      if (typeof this.options.use12Hour === 'boolean') return this.options.use12Hour;
      // this is the default, it gets computed by the DateTimeFormat implementation
      return Intl.DateTimeFormat(this.timeFormat, { timeZone: this.timeZone, hour: 'numeric' }).resolvedOptions().hour12 ?? false;
    },
  },
  methods: {
    update() {
      this.setTime();
      this.setDate();
    },
    /* Get and format the current time */
    setTime() {
      this.time = Intl.DateTimeFormat(this.timeFormat, {
        timeZone: this.timeZone,
        hour: 'numeric',
        minute: 'numeric',
        ...(this.showSeconds && { second: 'numeric' }),
        hourCycle: this.use12Hour ? 'h12' : 'h23',
      }).format();
    },
    /* Get and format the date */
    setDate() {
      this.date = new Date().toLocaleDateString(this.timeFormat, {
        weekday: 'long',
        day: 'numeric',
        year: 'numeric',
        month: 'short',
        timeZone: this.timeZone,
      });
    },
  },
  created() {
    // Set initial date and time
    this.update();
    // Update the time and date every second (1000 ms)
    this.timeUpdateInterval = setInterval(this.update, 1000);
  },
  beforeUnmount() {
    // Remove the clock interval listener
    clearInterval(this.timeUpdateInterval);
  },
};
</script>

<style scoped lang="scss">

.clock {
  padding: 0;
  &.date-hidden { padding-top: var(--widget-controls-row, 0px); }
  .upper {
    display: flex;
    justify-content: space-between;
    border-radius: var(--curve-factor);
    box-sizing: border-box;
    min-height: var(--widget-action-size, 1.75rem);
    align-items: center;
    flex-wrap: wrap;
    gap: .25rem .5rem;
    line-height: 1.4;
    padding: .25rem calc(var(--widget-controls-space, 0px) + .5rem) .25rem .5rem;
    font-size: var(--widget-heading-size, .85rem);
    background: color-mix(in srgb, currentColor 6%, transparent);
    .date { margin-left: auto; text-align: right; }
  }
  p {
    color: inherit;
    cursor: default;
    margin: 0;
  }
  .time {
    font-size: var(--metric-value-size, 2.8rem);
    min-height: var(--metric-value-height, 3.25rem);
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    letter-spacing: 0;
    padding: .25rem 0;
    text-align: center;
    font-variant-numeric: tabular-nums;
    font-family: Digital, var(--font-monospace);
  }
  @container widget-frame (max-width: 18rem) {
    .upper {
      display: grid;
      grid-template-columns: minmax(0, 1fr) var(--widget-controls-space, 0px);
      grid-template-rows: minmax(var(--widget-controls-row, 0px), auto) auto;
      padding: .125rem .5rem;
      gap: .125rem .25rem;
      .city { grid-column: 1; grid-row: 1; }
      .date { grid-column: 1 / -1; grid-row: 2; margin-left: 0; text-align: left; }
    }
  }
}

</style>
