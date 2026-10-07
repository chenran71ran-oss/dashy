<template>
<div class="weather">
  <!-- Icon + Temperature -->
  <div class="intro">
    <p class="temp">{{ temp }}</p>
    <i :class="`owi owi-${icon}`"></i>
  </div>
  <!-- Weather description -->
  <p class="description">{{ description }}</p>
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
    /* Adds units symbol to temperature, depending on metric or imperial */
    processTemp(temp) {
      return `${Math.round(temp)}${this.tempDisplayUnits}`;
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
    color: var(--widget-text-color);
  }

.weather {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  // Weather symbol and temperature
  .intro {
    grid-column-start: span 2;
    display: flex;
    justify-content: space-around;
    .owi {
      font-size: 3rem;
      color: var(--widget-text-color);
      margin: 0;
    }
    .temp {
      font-size: 3rem;
      margin: 0;
    }
  }
  // Weather description
  .description {
    grid-column-start: 2;
    text-transform: capitalize;
    text-align: center;
    margin: 0;
  }
  // Show more details button
  .more-details-btn {
    grid-column-start: span 2;
    cursor: pointer;
    font-size: 0.9rem;
    text-align: center;
    width: fit-content;
    margin: 0.25rem auto;
    padding: 0.1rem 0.25rem;
    border: 1px solid transparent;
    opacity: var(--dimming-factor);
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
    grid-column-start: span 2;
    display: flex;
    .info-wrap {
      display: flex;
      flex-direction: column;
      width: 100%;
      opacity: var(--dimming-factor);
      p.info-line {
        display: flex;
        justify-content: space-between;
        margin: 0.1rem 0.5rem;
        padding: 0.1rem 0;
        color: var(--widget-text-color);
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
