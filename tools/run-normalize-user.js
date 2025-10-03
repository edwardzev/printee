#!/usr/bin/env node
import normalizeImport from '../src/lib/normalizeOrderPayload.js';
import Ajv from 'ajv';
import fs from 'fs';

const normalize = normalizeImport.default || normalizeImport;
const schema = JSON.parse(fs.readFileSync('schemas/order.schema.json','utf8'));
const payload = JSON.parse(fs.readFileSync('tools/sample-user-payload.json','utf8'));
const normalized = normalize(payload);
const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);
const ok = validate(normalized);
console.log('VALID:', ok);
if (!ok) console.log(validate.errors);
console.log('NORMALIZED:', JSON.stringify(normalized, null, 2));
