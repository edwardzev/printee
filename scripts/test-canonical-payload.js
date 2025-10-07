// Test script to verify canonical Pabbly payload generation
// Run with: node scripts/test-canonical-payload.js

import normalize from '../src/lib/normalizeOrderPayload.js';

// Simulate a typical checkout payload
const testPayload = {
  idempotency_key: 'test-ord-123',
  contact: {
    name: 'Test Customer',
    phone: '0501234567',
    email: 'test@example.com'
  },
  cartSummary: {
    total: 1200
  },
  cart: [
    {
      id: 'item-1',
      productSku: 'TSH-001',
      productName: 'Test T-Shirt',
      quantity: 2,
      totalPrice: 1200,
      sizeMatrices: {
        'Black': { 'M': 1, 'L': 1 }
      },
      selectedPrintAreas: [
        {
          areaKey: 'front',
          method: 'print',
          designerComments: 'Center the logo',
          printColor: 'white'
        }
      ]
    }
  ],
  paymentMethod: 'card',
  withDelivery: false
};

// Simulate the corrected forwarder canonicalization
function simulateCorrectCanonicalization(body) {
  // Simulate ensured Airtable record
  const ensured = {
    enabled: true,
    airtable_record_id: 'rec123test',
    order_id: 'rec123test',
    order_number: 'PT123'
  };

  // Apply corrected canonicalization logic from forwarder
  body.airtable_record_id = ensured.airtable_record_id;
  body.order_number = ensured.order_number;

  // Customer block - work with normalized customer (not raw contact)
  body.customer = body.customer || {};
  const rawContact = body._app_payload?.contact || {};
  if (!body.customer.contact_name && rawContact.name) body.customer.contact_name = rawContact.name;
  if (!body.customer.email && rawContact.email) body.customer.email = rawContact.email;
  if (!body.customer.phone && rawContact.phone) body.customer.phone = rawContact.phone;

  body.customer.address = {
    line1: '',
    line2: '',
    city: '',
    postcode: '',
    country: ''
  };

  // CRITICAL FIX: Cart mapping - normalize() creates items, copy to cart for Pabbly
  if (!Array.isArray(body.cart) && Array.isArray(body.items)) {
    body.cart = [...body.items];
  } else if (!Array.isArray(body.cart)) {
    body.cart = [];
  }

  // Finance - use already computed totals from normalize() 
  const subtotal = Number(body.order?.totals?.subtotal) || 0;
  const deliveryCost = Number(body.order?.totals?.delivery) || 0;
  const vatPercent = Number(body.order?.totals?.vat_percent) || 17;
  const vatAmount = Number(body.order?.totals?.vat_amount) || 0;
  const grandTotal = Number(body.order?.totals?.grand_total) || 0;

  body.finance = {
    paid: false,
    payment_method: body._app_payload?.paymentMethod || '',
    subtotal: subtotal,
    delivery_cost: deliveryCost,
    vat_percent: vatPercent,
    vat_amount: vatAmount,
    grand_total: grandTotal
  };

  // Other canonical fields
  body.dropbox_folder_url = null;
  body.delivery = { required: Boolean(body.withDelivery) };
  body.payment = {
    method: body._app_payload?.paymentMethod || '',
    amount: grandTotal,
    currency: 'ILS',
    status: 'pending'
  };
  body._forwarded_at = new Date().toISOString();
  body.is_partial = false;

  return body;
}

// Test
console.log('=== Testing CORRECTED Canonical Payload Generation ===');
const normalized = normalize(testPayload);
console.log('1. Normalized structure check:');
console.log('   Has items:', Array.isArray(normalized.items), 'length:', normalized.items?.length);
console.log('   Has customer:', !!normalized.customer, 'name:', normalized.customer?.contact_name);
console.log('   Order totals:', normalized.order?.totals);

const canonical = simulateCorrectCanonicalization(normalized);
console.log('\n2. Canonical fields check:');
console.log('   airtable_record_id:', canonical.airtable_record_id);
console.log('   order_number:', canonical.order_number);
console.log('   customer.contact_name:', canonical.customer?.contact_name);
console.log('   cart.length:', canonical.cart?.length);
console.log('   finance.grand_total:', canonical.finance?.grand_total);
console.log('   finance.payment_method:', canonical.finance?.payment_method);

console.log('\n=== Cart vs Items comparison ===');
console.log('Cart items:', canonical.cart?.length, canonical.cart?.[0]?.line_id);
console.log('Items array:', canonical.items?.length, canonical.items?.[0]?.line_id);

console.log('\n=== Finance object ===');
console.log(JSON.stringify(canonical.finance, null, 2));