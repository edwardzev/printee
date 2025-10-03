import fs from 'fs';
import normalize from '../src/lib/normalizeOrderPayload.js';

const payloadPath = process.argv[2];
if (!payloadPath) {
  console.error('Usage: node tools/normalize-pabbly-payload.js <pabbly-payload.json>');
  process.exit(2);
}

const raw = fs.readFileSync(payloadPath, 'utf8');
let parsed;
try { parsed = JSON.parse(raw); } catch (e) { console.error('Invalid JSON file:', e.message); process.exit(2); }

const normalized = normalize(parsed);
console.log(JSON.stringify(normalized, null, 2));

// Quick basic checks
console.error('\n--- Quick checks ---');
console.error('items count:', normalized.items.length);
console.error('items[0].print_areas:', JSON.stringify(normalized.items[0].print_areas || []));
console.error('totals:', JSON.stringify(normalized.order.totals));
