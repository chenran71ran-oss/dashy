// Optional maintenance only. The picker serves the committed SVGs locally.
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const repository = 'icons8/flat-color-icons';
const revision = '1bf90d5ff118bc6690120ff9fdfe234565b7e414';
const root = new URL('../', import.meta.url);
const entries = JSON.parse(await fs.readFile(new URL('src/utils/flat-color-icons.json', root), 'utf8'));
const directory = new URL('public/portal-icons/flat-color/', root);
await fs.mkdir(directory, { recursive: true });
for (const entry of entries) {
  const file = entry.src.split('/').pop();
  if (!/^[a-z0-9_-]+\.svg$/.test(file) || entry.src !== `/portal-icons/flat-color/${file}`) throw Error('Invalid icon path');
  const response = await fetch(`https://raw.githubusercontent.com/${repository}/${revision}/svg/${file}`, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw Error(`${file}: HTTP ${response.status}`);
  const svg = await response.text();
  if (svg.length > 100000 || !/<svg\b/.test(svg) || /<(script|foreignObject|filter)\b|on\w+\s*=|(?:href|src)\s*=\s*["']/i.test(svg)) throw Error(`${file}: invalid SVG`);
  await fs.writeFile(new URL(file, directory), svg);
}
console.log(`Synced ${entries.length} color icons to ${fileURLToPath(directory)}. Review and commit these public assets to publish.`);
