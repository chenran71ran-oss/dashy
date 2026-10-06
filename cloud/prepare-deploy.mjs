import fs from 'node:fs';
import path from 'node:path';
// Read deployment identifiers from Cloudflare build variables, never frontend VITE_*.
const sourcePath = new URL('../wrangler.jsonc', import.meta.url);
const config = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const supplied = (process.env.HOME_KV_NAMESPACE_ID || '').trim();
const current = config.kv_namespaces.find((entry) => entry.binding === 'HOME_KV');
const namespaceId = supplied || current?.id || '';
if (!/^[a-fA-F0-9]{32}$/.test(namespaceId)) {
  throw new Error('请在 Cloudflare 的 Build variables 中添加 HOME_KV_NAMESPACE_ID，填写现有 HOME_KV 的32位 Namespace ID。不要填写密码或命名空间名称。');
}
current.id = namespaceId;
if (process.env.WORKER_NAME) config.name = process.env.WORKER_NAME.trim();
if (!/^[a-z0-9][a-z0-9_-]{0,62}$/.test(config.name)) throw new Error('WORKER_NAME 格式不正确');
// Keep this file at the project root so relative main and assets paths stay correct.
fs.writeFileSync(path.resolve('.wrangler-deploy.json'), JSON.stringify(config, null, 2) + '\n');
console.log('Cloudflare deploy configuration prepared for Worker: ' + config.name);
