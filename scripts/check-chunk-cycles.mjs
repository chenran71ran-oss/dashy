// Fails the build when two built chunks import each other, directly or through others.
// Whichever chunk of a cycle the browser evaluates first reads the other's exports before
// they exist, which left the page blank after sign-in (see CHANGELOG 2026-11-24).
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2] || 'dist/assets';
const graph = new Map();
for (const file of fs.readdirSync(dir).filter(name => name.endsWith('.js'))) {
  const source = fs.readFileSync(path.join(dir, file), 'utf8');
  // Static imports only: dynamic import() runs after its importer has finished.
  const imports = [...source.matchAll(/(?:^|[;\n}])\s*import\s*(?:[\w${},*\s]+from\s*)?["']\.\/([^"']+\.js)["']/g)].map(match => match[1]);
  graph.set(file, imports);
}

const cycles = [];
const state = new Map();
const stack = [];
const visit = (file) => {
  state.set(file, 'open');
  stack.push(file);
  for (const dependency of graph.get(file) || []) {
    if (state.get(dependency) === 'open') cycles.push([...stack.slice(stack.indexOf(dependency)), dependency]);
    else if (!state.has(dependency)) visit(dependency);
  }
  stack.pop();
  state.set(file, 'done');
};
for (const file of graph.keys()) if (!state.has(file)) visit(file);

if (cycles.length) {
  console.error(`Circular imports between built chunks (${cycles.length}):`);
  for (const cycle of cycles) console.error(`  ${cycle.join(' -> ')}`);
  console.error('Break the cycle, for example by loading a component used only on demand with defineAsyncComponent.');
  process.exit(1);
}
console.log(`No circular imports between ${graph.size} built chunks.`);
