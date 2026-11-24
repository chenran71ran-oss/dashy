#!/usr/bin/env node
/**
 * Dashy's Internationalization lint and test script
 *
 * Scans code (in src) for translation calls ($t, $tc, i18n.t, i18n.global.t)
 * and then compares against the translation content (in src/assets/locales)
 * en.json is the most important, as missing locales can fallback to English
 *
 * Checks:
 * - All locale files are present, valid and parsable (failure)
 * - Locales registered in src/utils/languages.js but with no JSON file (failure)
 * - Locale JSON files not registered in src/utils/languages.js (failure)
 * - Non-existing translations used in the code, not present in en.json (failure)
 * - Translations in en.json never used anywhere in the code (warn)
 * - Translations in other locales not used in en.json or code (warn)
 * - Missing translations in other locales compared to en.json (coverage report)
 *
 * Run `yarn validate-locales` to use. Also runs as part of the CI workflow on PRs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = path.join(ROOT, 'src');
const LOCALES_DIR = path.join(SRC, 'assets', 'locales');
const LANGUAGES_FILE = path.join(SRC, 'utils', 'languages.js');
const SOURCE_LOCALE = 'en';

const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', cyan: '\x1b[36m', grey: '\x1b[90m',
};
const paint = (col, s) => `${c[col]}${s}${c.reset}`;
const coverageColour = (pct) => (pct === 100 ? 'green' : pct >= 80 ? 'cyan' : pct >= 50 ? 'yellow' : 'red');
const hdr = (t) => `\n${paint('bold', t)}\n${paint('grey', '─'.repeat(stripAnsi(t).length))}`;
// eslint-disable-next-line no-control-regex -- strips ANSI colour codes from terminal output
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');

/* Keys used indirectly (computed at runtime) that the static scanner can't see */
const IGNORED_KEYS = new Set([
  // src/components/Configuration/JsonEditor.vue
  'config-editor.status-warning',
  'config-editor.status-warnings',
  // src/components/InteractiveEditor/ExportConfigMenu.vue
  'interactive-editor.export.status-error',
  'interactive-editor.export.status-loading',
  'interactive-editor.export.status-unknown',
  'interactive-editor.export.status-valid',
  // src/components/Settings/AuthButtons.vue
  'settings.sign-in-tooltip',
  'settings.sign-out-tooltip',
  // src/utils/InitServiceWorker.js
  'updates.sw-update-action',
  'updates.sw-update-available',
]);

/* Walk a dir, returning files matching any of the given extensions. */
const walk = (dir, exts, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, exts, out);
    else if (exts.some((e) => p.endsWith(e))) out.push(p);
  }
  return out;
};

/* Flatten a nested locale object into { 'a.b.c': true } form. */
const flatten = (obj, prefix = '', out = {}) => {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = true;
  }
  return out;
};

/* Extract registered locale codes from src/utils/languages.js. */
const loadRegisteredCodes = () => {
  const src = fs.readFileSync(LANGUAGES_FILE, 'utf8');
  return [...src.matchAll(/code:\s*(['"])([^'"]+)\1/g)].map((m) => m[2]);
};

/* Parse + sanity-check a locale file. Returns { parsed } or { error }. */
const loadLocale = (file) => {
  const rel = path.relative(ROOT, file);
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return { error: `${rel}: invalid JSON — ${e.message}` };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    const got = Array.isArray(parsed) ? 'array' : parsed === null ? 'null' : typeof parsed;
    return { error: `${rel}: root must be an object (got ${got})` };
  }
  return { parsed };
};

// $t('key') / $tc("key") / `i18n.t('key')` / `this.$t('key')` / `i18n.global.t('key')`
const RE_KEY = /(?:\$tc?|i18n(?:\.global)?\.tc?)\s*\(\s*(['"`])((?:(?!\1).)*?)\1/g;
// Same callers, but with a variable as the first arg (no quote).
const RE_DYNAMIC = /(?:\$tc?|i18n(?:\.global)?\.tc?)\s*\(\s*([a-zA-Z_$][\w$.]*)\s*[,)]/g;

const extractFromFile = (file) => {
  const src = fs.readFileSync(file, 'utf8');
  const literals = new Set();
  const prefixes = new Set();
  const dynamic = [];
  for (const m of src.matchAll(RE_KEY)) {
    const [, quote, value] = m;
    // Backtick with `${...}` = dynamic key with static prefix.
    if (quote === '`' && value.includes('${')) {
      const pfx = value.split('${')[0].replace(/\.$/, '');
      if (pfx) prefixes.add(pfx);
    } else {
      literals.add(value);
    }
  }
  for (const m of src.matchAll(RE_DYNAMIC)) {
    const line = src.slice(0, m.index).split('\n').length;
    dynamic.push({ file: path.relative(ROOT, file), line, variable: m[1] });
  }
  return { literals, prefixes, dynamic };
};

const main = () => {
  // Load + validate locales (fail fast on bad JSON)
  const localeFiles = fs.readdirSync(LOCALES_DIR).filter((f) => f.endsWith('.json'));
  const locales = {};
  const localeErrors = [];
  for (const f of localeFiles) {
    const result = loadLocale(path.join(LOCALES_DIR, f));
    if (result.error) localeErrors.push(result.error);
    else locales[f.replace(/\.json$/, '')] = flatten(result.parsed);
  }
  if (localeErrors.length) {
    console.error(hdr(paint('red', `FAIL: ${localeErrors.length} invalid locale file(s)`)));
    for (const e of localeErrors) console.error(`  ${paint('red', '✗')} ${e}`);
    console.error(paint('red', '\n✗ FAIL\n'));
    process.exit(2);
  }
  const en = locales[SOURCE_LOCALE];
  if (!en) {
    console.error(paint('red', `Source locale ${SOURCE_LOCALE}.json not found`));
    process.exit(2);
  }
  const enKeys = Object.keys(en);

  // Scan source
  const files = walk(SRC, ['.vue', '.js'])
    .filter((f) => !f.startsWith(LOCALES_DIR + path.sep));

  const usedLiterals = new Set();
  const usedPrefixes = new Set();
  const dynamicCalls = [];
  for (const f of files) {
    const r = extractFromFile(f);
    r.literals.forEach((k) => usedLiterals.add(k));
    r.prefixes.forEach((p) => usedPrefixes.add(p));
    dynamicCalls.push(...r.dynamic);
  }

  // Cross-check locale files against the registry in languages.js
  const registered = new Set(loadRegisteredCodes());
  const fileCodes = new Set(Object.keys(locales));
  const missingFiles = [...registered].filter((c) => !fileCodes.has(c)).sort();
  const unregistered = [...fileCodes].filter((c) => !registered.has(c)).sort();

  // A key is "potentially used" if a literal matches OR a dynamic prefix covers it.
  const matchesPrefix = (k) => [...usedPrefixes].some((p) => k === p || k.startsWith(`${p}.`));
  const isUsed = (k) => usedLiterals.has(k) || matchesPrefix(k);

  // Diff
  const missingInEn = [...usedLiterals].filter((k) => !(k in en)).sort();
  const unusedInEn = enKeys.filter((k) => !isUsed(k) && !IGNORED_KEYS.has(k)).sort();
  const extras = {};
  const coverage = {};
  for (const [code, keys] of Object.entries(locales)) {
    if (code === SOURCE_LOCALE) continue;
    extras[code] = Object.keys(keys).filter((k) => !(k in en)).sort();
    const have = enKeys.filter((k) => k in keys).length;
    coverage[code] = (have / enKeys.length) * 100;
  }

  // Printy print
  console.log(hdr('Locale check'));
  console.log(`  ${paint('dim', 'Source files scanned')}  ${files.length}`);
  console.log(`  ${paint('dim', 'Literal keys used   ')}  ${usedLiterals.size}`);
  console.log(`  ${paint('dim', 'Dynamic prefixes    ')}  ${usedPrefixes.size}`);
  console.log(`  ${paint('dim', 'Dynamic call sites  ')}  ${dynamicCalls.length}`);
  console.log(`  ${paint('dim', 'Locales found       ')}  ${Object.keys(locales).length}`);

  if (missingFiles.length) {
    console.log(hdr(paint('red', `FAIL: ${missingFiles.length} locale(s) registered in languages.js but no JSON file`)));
    for (const c of missingFiles) console.log(`  ${paint('red', '✗')} ${c}`);
  }

  if (unregistered.length) {
    console.log(hdr(paint('red', `FAIL: ${unregistered.length} locale file(s) not registered in languages.js`)));
    for (const c of unregistered) console.log(`  ${paint('red', '✗')} ${c}`);
  }

  if (missingInEn.length) {
    console.log(hdr(paint('red', `FAIL: ${missingInEn.length} key(s) used in code but missing from ${SOURCE_LOCALE}.json`)));
    for (const k of missingInEn) console.log(`  ${paint('red', '✗')} ${k}`);
  }

  if (unusedInEn.length) {
    console.log(hdr(paint('yellow', `WARN: ${unusedInEn.length} key(s) in ${SOURCE_LOCALE}.json not used in code`)));
    for (const k of unusedInEn) console.log(`  ${paint('yellow', '·')} ${k}`);
  }

  const extraEntries = Object.entries(extras).filter(([, v]) => v.length);
  if (extraEntries.length) {
    const total = extraEntries.reduce((n, [, v]) => n + v.length, 0);
    console.log(hdr(paint('yellow', `WARN: ${total} key(s) in other locales but not in ${SOURCE_LOCALE}.json`)));
    for (const [code, ks] of extraEntries) {
      console.log(`  ${paint('cyan', code)} ${paint('grey', `(${ks.length})`)}`);
      for (const k of ks) console.log(`    ${paint('yellow', '·')} ${k}`);
    }
  }

  console.log(hdr('Coverage vs en.json'));
  const sorted = Object.entries(coverage).sort(([a], [b]) => a.localeCompare(b));
  for (const [code, pct] of sorted) {
    const filled = Math.round(pct / 5);
    const bar = '█'.repeat(filled) + paint('grey', '░'.repeat(20 - filled));
    const col = coverageColour(pct);
    console.log(`  ${code.padEnd(11)} ${paint(col, bar)} ${paint(col, `${pct.toFixed(1)}%`)}`);
  }

  if (dynamicCalls.length) {
    console.log(hdr(paint('grey', `Note: ${dynamicCalls.length} dynamic $t() call(s) — keys under these can't be verified`)));
    for (const d of dynamicCalls) {
      console.log(`  ${paint('grey', `${d.file}:${d.line}`)} → ${paint('dim', d.variable)}`);
    }
  }

  console.log(hdr('Summary'));
  const fail = missingInEn.length > 0 || missingFiles.length > 0 || unregistered.length > 0;
  const extraCount = extraEntries.reduce((n, [, v]) => n + v.length, 0);
  const coverageVals = Object.values(coverage);
  const avgCoverage = coverageVals.length
    ? coverageVals.reduce((a, b) => a + b, 0) / coverageVals.length
    : 0;
  const row = (label, value, col) => console.log(`▶  ${label.padEnd(16)} ${paint(col, value)}`);
  const validLocales = Object.keys(locales).length;
  const totalLocales = localeFiles.length;
  row('Valid Locales', `${validLocales}/${totalLocales}`, totalLocales === validLocales ? 'green' : 'blue');
  row('Total keys', `${enKeys.length}`, 'blue');
  row('Avg coverage', `${avgCoverage.toFixed(1)}%`, coverageColour(avgCoverage));
  row('Missing', `${missingInEn.length}`, missingInEn.length ? 'red' : 'green');
  row('Unused', `${unusedInEn.length}`,  unusedInEn.length ? 'yellow' : 'green');
  row('Extras', `${extraCount}`, extraCount ? 'yellow' : 'green');
  row('Missing files', `${missingFiles.length}`, missingFiles.length ? 'red' : 'green');
  row('Unregistered', `${unregistered.length}`, unregistered.length ? 'red' : 'green');
  console.log(fail ? paint('red', '\n✗ FAIL\n') : paint('green', '\n✓ PASS\n'));
  process.exit(fail ? 1 : 0);
};

main();
