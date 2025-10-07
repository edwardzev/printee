// Tiny harness to test api/order endpoints without a server
import orderIndexHandler from '../api/order/index.js';
import orderByIdHandler from '../api/order/[id].js';

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

async function run() {
  console.log('Running dev order API tests...');

  // 1) Create an order
  const postReq = { method: 'POST', query: {}, body: {
    cart: [{ sku: 'TEST-SKU', quantity: 1 }],
    contact: { name: 'Tester', email: 'test@example.com' },
    paymentMethod: 'cod',
    totals: { subtotal: 1000, total: 1000, currency: 'EUR' },
  } };
  const postRes = createMockRes();
  await orderIndexHandler(postReq, postRes);
  if (!postRes.body?.ok) throw new Error('POST /api/order failed');
  const created = postRes.body.order;
  console.log('POST response body:', postRes.body);
  console.log('Created order id:', created?.id);

  // small delay to allow file append
  await new Promise(r => setTimeout(r, 150));

  // 2) List orders (memory)
  const listReq = { method: 'GET', query: { limit: '5' } };
  const listRes = createMockRes();
  await orderIndexHandler(listReq, listRes);
  if (!listRes.body?.ok) throw new Error('GET /api/order failed');
  console.log('List (memory) count:', listRes.body.count);

  // 3) List orders from file
  const listFileReq = { method: 'GET', query: { limit: '5', from: 'file' } };
  const listFileRes = createMockRes();
  await orderIndexHandler(listFileReq, listFileRes);
  if (!listFileRes.body?.ok) throw new Error('GET /api/order?from=file failed');
  console.log('List (file) count:', listFileRes.body.count);

  // 4) Get by id from file
  const getReq = { method: 'GET', query: { id: created.id, from: 'file' } };
  const getRes = createMockRes();
  await orderByIdHandler(getReq, getRes);
  if (!getRes.body?.ok) throw new Error('GET /api/order/[id]?from=file failed');
  console.log('Get by id (file) ok:', getRes.body.ok);

  console.log('All tests passed.');
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exitCode = 1;
});
