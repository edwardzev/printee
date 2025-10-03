#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

async function run() {
  const arg = process.argv[2];
  const target = process.argv[3] || process.env.TARGET_URL || 'http://localhost:3001/api/forward-order';
  if (!arg) {
    console.error('Usage: node tools/resend-failed.js <order_number|idempotency_key> [target_url]');
    process.exit(2);
  }

  const forwardedLog = path.resolve(process.cwd(), 'logs', 'forwarded.jsonl');
  if (!fs.existsSync(forwardedLog)) {
    console.error('No forwarded log at', forwardedLog);
    process.exit(2);
  }

  const lines = fs.readFileSync(forwardedLog, 'utf8').trim().split('\n').filter(Boolean).map(l => {
    try { return JSON.parse(l); } catch (e) { return null; }
  }).filter(Boolean);

  // find entries whose payload.order.order_number or payload.idempotency_key matches arg
  let found = null;
  for (let i = lines.length - 1; i >= 0; i--) {
    const e = lines[i];
    const payload = e.payload || e.normalized || {};
    const idk = (payload && payload.idempotency_key) || (payload && payload.order && payload.order.order_number);
    const orderNum = (payload && payload.order && payload.order.order_number) || (payload && payload.order_number);
    if ([idk, orderNum, e?.raw?.order?.order_number, e?.raw?.idempotency_key].includes(arg)) {
      found = e.raw || payload || null;
      break;
    }
  }

  if (!found) {
    console.error('Could not find a matching log entry for', arg);
    process.exit(3);
  }

  console.log('Found raw payload for', arg, '— forwarding to', target);
  const r = await fetch(target, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(found) });
  const txt = await r.text().catch(()=>'');
  console.log('Status', r.status);
  console.log(txt);
}

run().catch(e => { console.error(e); process.exit(1); });
