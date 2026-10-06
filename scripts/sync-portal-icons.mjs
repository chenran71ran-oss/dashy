// Optional maintenance command. Normal browsing uses already bundled local icons.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const base = new URL('../public/portal-icons/', import.meta.url);
const manifest = JSON.parse(await fs.readFile(new URL('qx-sources.json', base), 'utf8'));
for (const entry of manifest.files) {
  if (!/^[A-Za-z0-9-]+\.png$/.test(entry.file) || !/^icons\/qx\/(apps|subscriptions)\/[A-Za-z0-9-]+\.png$/.test(entry.source)) throw Error('Invalid icon manifest');
  const response = await fetch(`https://raw.githubusercontent.com/${manifest.repository}/${manifest.ref}/${entry.source}`, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw Error(`${entry.file}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > 1024 * 1024 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw Error(`${entry.file}: invalid PNG`);
  await fs.writeFile(new URL(`qx/${entry.file}`, base), bytes);
  entry.sha = crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}
await fs.writeFile(new URL('qx-sources.json', base), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Synced ${manifest.files.length} QX icons. Commit these public assets to publish the update.`);
