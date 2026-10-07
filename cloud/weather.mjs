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
  if (!cities[city] || !['metric', 'imperial'].includes(units) || !['zh_cn', 'en'].includes(lang)) error('天气城市、单位或语言无效');
  if (!env.OPENWEATHER_API_KEY) error('请在 Cloudflare Secret 中设置 OPENWEATHER_API_KEY', 503);
  const key = `${city}:${units}:${lang}`;
  if (cache.get(key)?.expires > Date.now()) return cache.get(key).data;
  if (pending.has(key)) return pending.get(key);
  const task = (async () => {
    const target = new URL('https://api.openweathermap.org/data/2.5/weather');
    target.search = new URLSearchParams({ lat: cities[city].lat, lon: cities[city].lon, units, lang, appid: env.OPENWEATHER_API_KEY });
    let response;
    try { response = await fetcher(target, { signal: AbortSignal.timeout(10000), redirect: 'manual' }); }
    catch { error('天气服务暂时无法连接，请稍后重试', 502); }
    if (response.status >= 300 && response.status < 400) error('天气服务返回了意外跳转，请稍后重试', 502);
    if (!response.ok) error(response.status === 401 ? '天气密钥尚未激活或无效' : response.status === 429 ? '天气接口调用达到限额，请稍后重试' : '天气服务暂时不可用', 502);
    let raw;
    try { raw = await response.json(); } catch { error('天气服务返回无效数据', 502); }
    if (!Number.isFinite(raw.main?.temp) || !raw.weather?.[0]?.icon) error('天气服务返回不完整数据', 502);
    const data = { name: cities[city].name, dt: raw.dt, weather: raw.weather.map(({ icon, description }) => ({ icon, description })), main: raw.main, wind: raw.wind || {}, clouds: raw.clouds || {}, visibility: raw.visibility };
    cache.set(key, { data, expires: Date.now() + 600000 });
    return data;
  })();
  pending.set(key, task);
  try { return await task; } finally { pending.delete(key); }
}
