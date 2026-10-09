// The API key stays in the Worker Secret; only public weather data is returned.
const cities = {
  wuhan: { name: '武汉', lat: 30.5928, lon: 114.3055 },
  qingdao: { name: '青岛', lat: 36.0671, lon: 120.3826 },
  wuchang: { name: '武汉·武昌', lat: 30.5563, lon: 114.3105 },
  huangdao: { name: '青岛·黄岛', lat: 35.9590, lon: 120.1931 },
};
const pending = new Map();
const cache = new Map();
function error(message, status = 400) { throw Object.assign(new Error(message), { status }); }
export async function readWeather(params, env, fetcher = fetch) {
  const city = params.get('city') || 'wuhan';
  const units = params.get('units') || 'metric';
  const lang = params.get('lang') || 'zh_cn';
  if (!['metric', 'imperial', 'standard'].includes(units) || !/^[a-z_]{2,12}$/i.test(lang)) error('天气单位或语言无效');
  const keyName = params.get('apiKey');
  const apiKey = keyName && /^(?:DASHY_|VITE_APP_|VUE_APP_)\w+$/.test(keyName) ? env[keyName] : keyName || env.OPENWEATHER_API_KEY;
  if (!apiKey) error('请在 Cloudflare Secret 中设置 OPENWEATHER_API_KEY 或指定密钥占位符', 503);
  const location = new URLSearchParams();
  if (params.has('lat') || params.has('lon')) {
    const lat = Number(params.get('lat')), lon = Number(params.get('lon'));
    if (!params.has('lat') || !params.has('lon') || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) error('天气经纬度无效');
    location.set('lat', lat); location.set('lon', lon);
  } else if (params.get('cityId')) {
    if (!/^\d+$/.test(params.get('cityId'))) error('天气城市 ID 无效');
    location.set('id', params.get('cityId'));
  } else if (cities[city]) {
    location.set('lat', cities[city].lat); location.set('lon', cities[city].lon);
  } else {
    if (!city || city.length > 120) error('天气城市无效');
    location.set('q', city);
  }
  const keyHash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(apiKey)));
  const key = `${location}:${units}:${lang}:${Array.from(keyHash).map(n => n.toString(16).padStart(2, '0')).join('')}`;
  if (cache.get(key)?.expires > Date.now()) return cache.get(key).data;
  if (pending.has(key)) return pending.get(key);
  const task = (async () => {
    const target = new URL('https://api.openweathermap.org/data/2.5/weather');
    target.search = new URLSearchParams({ ...Object.fromEntries(location), units, lang, appid: apiKey });
    let response;
    try { response = await fetcher(target, { signal: AbortSignal.timeout(10000), redirect: 'manual' }); }
    catch { error('天气服务暂时无法连接，请稍后重试', 502); }
    if (response.status >= 300 && response.status < 400) error('天气服务返回了意外跳转，请稍后重试', 502);
    if (!response.ok) error(response.status === 401 ? '天气密钥尚未激活或无效' : response.status === 429 ? '天气接口调用达到限额，请稍后重试' : '天气服务暂时不可用', 502);
    let raw;
    try { raw = await response.json(); } catch { error('天气服务返回无效数据', 502); }
    if (!Number.isFinite(raw.main?.temp) || !raw.weather?.[0]?.icon) error('天气服务返回不完整数据', 502);
    const data = { name: cities[city]?.name || raw.name || city, coord: location.has('lat') ? { lat: Number(location.get('lat')), lon: Number(location.get('lon')) } : raw.coord, dt: raw.dt, weather: raw.weather.map(({ icon, description }) => ({ icon, description })), main: raw.main, wind: raw.wind || {}, clouds: raw.clouds || {}, visibility: raw.visibility };
    if (cache.size > 100) cache.delete(cache.keys().next().value);
    cache.set(key, { data, expires: Date.now() + 600000 });
    return data;
  })();
  pending.set(key, task);
  try { return await task; } finally { pending.delete(key); }
}
