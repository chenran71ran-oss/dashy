// Compile schema validation during the cloud build: Workers cannot run new Function().
import fs from 'node:fs';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import standaloneCode from 'ajv/dist/standalone/index.js';
const ajv = new Ajv({ strict: false, allErrors: false, code: { source: true } });
addFormats(ajv);
const validate = ajv.compile(JSON.parse(fs.readFileSync(new URL('../src/utils/config/ConfigSchema.json', import.meta.url), 'utf8')));
fs.writeFileSync(new URL('./config-validator.cjs', import.meta.url), standaloneCode(ajv, validate));
