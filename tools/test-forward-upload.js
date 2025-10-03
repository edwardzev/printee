import fetch from 'node-fetch';
import fs from 'fs';

// Tiny 1x1 PNG data URL (red)
const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAr8B9fYjG/8AAAAASUVORK5CYII=';

const payload = {
  event: 'order.partial',
  idempotency_key: 'test-' + Date.now(),
  created_at: new Date().toISOString(),
  order: {
    order_id: 'local-test-1',
    order_number: 'TEST-ORDER-1234',
    status: 'in_progress',
    currency: 'ILS',
    totals: { subtotal: 100, delivery: 0, vat_percent: 17, vat_amount: 17, grand_total: 117 }
  },
  contact: { name: 'Test User', email: 'test@example.com', phone: '050-000-0000' },
  cart: [
    {
      id: 'item1',
      productSku: 'dryfit',
      productName: 'חולצת דרייפיט',
      sizeMatrix: { m: 1 },
      selectedPrintAreas: [ { areaKey: 'frontA4', method: 'print' } ],
      uploadedDesigns: { frontA4: dataUrl },
      totalPrice: 100
    }
  ]
};

async function run() {
  const url = process.env.DEV_API_URL || 'http://localhost:3001/api/forward-order';
  console.log('POST', url);
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const txt = await res.text();
  console.log('status', res.status);
  console.log(txt);
}

run().catch(e=>{console.error(e); process.exit(1);});
