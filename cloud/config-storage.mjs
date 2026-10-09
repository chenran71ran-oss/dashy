// Cloud config files and automatic history remain behind administrator auth.
export const CONFIG_KEY = 'kenneth-home:dashy:v1';
const FILE_PREFIX = 'kenneth-home:file:';
const HISTORY_PREFIX = 'kenneth-home:history:';
export function configPath(value = '/conf.yml') {
  if (typeof value !== 'string' || /[?#\\\0]/.test(value) || /(^|\/)\.{1,2}(\/|$)/.test(value)) throw Object.assign(new Error('配置文件路径无效'), { status: 400 });
  const path = value.replace(/^\/+/, '');
  if (!/^[\p{L}\p{N}_/-]+\.ya?ml$/iu.test(path) || path.length > 180) throw Object.assign(new Error('请使用本地 .yml 或 .yaml 配置路径'), { status: 400 });
  return '/' + path;
}
export const configKey = path => configPath(path) === '/conf.yml' ? CONFIG_KEY : FILE_PREFIX + configPath(path);
export async function saveConfig(env, path, config) {
  path = configPath(path);
  const key = configKey(path), previous = await env.HOME_KV.get(key);
  if (previous !== null) {
    const id = `${Date.now()}-${crypto.randomUUID()}`;
    const manifestKey = HISTORY_PREFIX + path;
    const history = JSON.parse(await env.HOME_KV.get(manifestKey) || '[]');
    const entry = { id, savedAt: new Date().toISOString(), path };
    await env.HOME_KV.put(HISTORY_PREFIX + path + ':' + id, previous, { expirationTtl: 30 * 86400 });
    await env.HOME_KV.put(manifestKey, JSON.stringify([entry, ...history].slice(0, 20)));
  }
  await env.HOME_KV.put(key, JSON.stringify(config));
}
export async function listHistory(env, path) {
  return JSON.parse(await env.HOME_KV.get(HISTORY_PREFIX + configPath(path)) || '[]').filter(entry => Date.parse(entry.savedAt) > Date.now() - 30 * 86400000);
}
export async function readHistory(env, path, id) {
  if (!/^[\d]+-[a-f0-9-]{36}$/.test(id || '')) throw Object.assign(new Error('备份编号无效'), { status: 400 });
  return env.HOME_KV.get(HISTORY_PREFIX + configPath(path) + ':' + id);
}
