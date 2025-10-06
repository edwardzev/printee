import handler from '../api/pay/icount-create-session.js';

async function run() {
  // Mock Express-like req/res
  const req = { method: 'GET', query: { idempotency_key: 'test-1', grand_total: '117', name: 'Test', phone: '050', email: 'test@example.com', desc: '2x T-Shirt' } };
  const res = {
    headers: {},
    statusCode: 200,
    setHeader(k, v) { this.headers[k] = v; },
    end(body) { console.log('RESPONSE:', body); },
    json(obj) { console.log('JSON:', JSON.stringify(obj, null, 2)); }
  };
  await handler(req, res);
}

run().catch(e=>console.error(e));
