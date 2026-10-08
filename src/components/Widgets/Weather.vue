<template>
<div class="weather">
  <div class="metric-body">
    <!-- Icon + Temperature -->
    <div class="intro metric-value">
      <p class="temp">{{ temp }}</p>
      <i :class="`owi owi-${icon}`"></i>
    </div>
    <!-- Weather description and data provenance stay together. -->
    <div class="metric-meta">
      <p class="description" v-if="description">{{ description }}</p>
      <p class="source-meta" v-if="dataTime"><span>OpenWeather ·</span><span>数据时间 {{ dataTime }}（北京时间）</span></p>
      <p class="source-meta" v-if="queryCoordinates"><span>查询坐标</span><span>{{ queryCoordinates }}</span></p>
    </div>
  </div>
  <div class="details" v-if="showDetails && weatherDetails.length > 0">
    <div class="info-wrap" v-for="(section, indx) in weatherDetails" :key="indx">
      <p class="info-line" v-for="weather in section" :key="weather.label">
          <span class="lbl">{{weather.label}}</span>
          <span class="val">{{ weather.value }}</span>
        </p>
    </div>
  </div>
  <!-- Show/ hide toggle button -->
  <p class="more-details-btn" @click="toggleDetails" v-if="weatherDetails.length > 0">
    {{ showDetails ? $t('widgets.general.show-less') : $t('widgets.general.show-more') }}
  </p>
</div>
</template>

<script>
import WidgetMixin from '@/mixins/WidgetMixin';


export default {
  mixins: [WidgetMixin],
  data() {
    return {
      loading: true,
      icon: null,
      description: null,
      temp: null,
      dataTime: null,
      queryCoordinates: null,
      showDetails: !this.options.hideDetails,
      weatherDetails: [],
    };
  },
  mounted() {
    this.checkProps();
  },
  computed: {
    units() {
      return this.options.units || 'metric';
    },
    endpoint() {
      return '/api/weather?' + new URLSearchParams({ city: this.options.city || 'wuhan', units: this.units, lang: this.options.lang || 'zh_cn' });
    },
    tempDisplayUnits() {
      switch (this.units) {
        case ('metric'): return '°C';
        case ('imperial'): return '°F';
        default: return '';
      }
    },
    speedDisplayUnits() {
      switch (this.units) {
        case ('metric'): return 'm/s';
        case ('imperial'): return 'mph';
        default: return '';
      }
    },
  },
  methods: {
    /* Truncate to one decimal as requested; do not round to an integer. */
    processTemp(temp) {
      if (!Number.isFinite(temp)) return '—';
      return `${(Math.trunc(temp * 10) / 10).toFixed(1)}${this.tempDisplayUnits}`;
    },
    fetchData() {
      this.overrideProxyChoice = false;
      fetch(this.endpoint, { credentials: 'same-origin' }).then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '天气暂时不可用');
        this.processData(data);
      }).catch(err => this.error(err.message)).finally(() => this.finishLoading());
    },
    /* Fetches the weather from OpenWeatherMap, and processes results */
    processData(data) {
      this.dataTime = Number.isFinite(data.dt) ? new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(data.dt * 1000)) : null;
      this.queryCoordinates = data.coord ? `${data.coord.lat}°N, ${data.coord.lon}°E` : null;
      this.icon = data.weather[0].icon;
      this.description = data.weather[0].description;
      this.temp = this.processTemp(data.main.temp);
      if (!this.options.hideDetails) {
        this.makeWeatherData(data);
      }
    },
    /* If showing additional info, then generate this data too */
    makeWeatherData(data) {
      this.weatherDetails = [
        [
          { label: '最低温度', value: this.processTemp(data.main.temp_min) },
          { label: '最高温度', value: this.processTemp(data.main.temp_max) },
          { label: '体感温度', value: this.processTemp(data.main.feels_like) },
        ],
        [
          { label: '气压', value: `${data.main.pressure}hPa` },
          { label: '湿度', value: `${data.main.humidity}%` },
          { label: '能见度', value: data.visibility },
          { label: '风速', value: `${data.wind.speed}${this.speedDisplayUnits}` },
          { label: '云量', value: `${data.clouds.all}%` },
        ],
      ];
    },
    /* Show/ hide additional weather info */
    toggleDetails() {
      this.showDetails = !this.showDetails;
    },
    /* Validate input props, and print warning if incorrect */
    checkProps() {
      const ops = this.options;
      if (!['wuhan', 'qingdao', 'wuchang', 'huangdao'].includes(ops.city || 'wuhan')) this.error('请选择天气地区');

      if ((!ops.lat || !ops.lon) && !ops.city && !ops.cityId) {
        this.error('A city name, city ID or lat + lon is required to fetch weather');
      }

      if (ops.units && ops.units !== 'metric' && ops.units !== 'imperial') {
        this.error('Invalid units specified, must be either \'metric\' or \'imperial\'');
      }
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/styles/weather-icons.scss';

.loader {
  margin: 0 auto;
  display: flex;
}
  p {
    color: inherit;
  }

.weather {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  // Weather symbol and temperature
  .intro {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--metric-gap, .75rem);
    flex-wrap: wrap;
    min-height: var(--metric-value-height, 3.25rem);
    min-width: 0;
    padding: .25rem 0;
    box-sizing: border-box;
    line-height: 1;
    .owi {
      font-size: var(--metric-value-size, 2.8rem);
      color: inherit;
      margin: 0;
      flex: 0 0 auto;
      line-height: 1;
    }
    .temp {
      font-size: var(--metric-value-size, 2.8rem);
      margin: 0;
      line-height: 1;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0;
      white-space: nowrap;
    }
  }
  // Weather description
  .description {
    text-transform: capitalize;
    text-align: inherit;
    margin: 0;
    font-size: var(--widget-detail-size, .85rem);
    line-height: 1.4;
  }
  .source-meta {
    display: flex;
    justify-content: var(--metric-meta-justify, center);
    flex-wrap: wrap;
    column-gap: .3rem;
    margin: .15rem 0 0;
    text-align: inherit;
    font-size: var(--widget-meta-size, .8rem);
    line-height: 1.5;
    overflow-wrap: anywhere;
    opacity: .85;
  }
  // Show more details button
  .more-details-btn {
    grid-column: 1 / -1;
    cursor: pointer;
    font-size: var(--widget-detail-size, .85rem);
    text-align: center;
    width: fit-content;
    margin: 0.25rem auto;
    padding: 0.1rem 0.25rem;
    border: 1px solid transparent;
    opacity: .85;
    border-radius: var(--curve-factor);
    &:hover {
      border: 1px solid var(--widget-text-color);
    }
    &:focus, &:active {
      background: var(--widget-text-color);
      color: var(--widget-background-color);
    }
  }
  // More weather details table
  .details {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(12rem, 100%), 1fr));
    gap: .375rem;
    font-size: var(--widget-detail-size, .85rem);
    .info-wrap {
      display: flex;
      flex-direction: column;
      width: 100%;
      min-width: 0;
      p.info-line {
        display: flex;
        flex-wrap: wrap;
        gap: .25rem;
        justify-content: space-between;
        margin: 0.1rem 0.5rem;
        padding: 0.1rem 0;
        color: inherit;
        &:not(:last-child) {
          border-bottom: 1px dashed var(--widget-text-color);
        }
        span.lbl {
          text-transform: capitalize;
        }
      }
    }
  }
}

</style>
