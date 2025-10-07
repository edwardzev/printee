// End-to-end test with real forwarder endpoint
// Usage: DEBUG_FORWARDER=1 node scripts/test-forwarder-e2e.js

const testPayload = {
  idempotency_key: 'test-e2e-123',
  contact: {
    name: 'Test Customer E2E',
    phone: '0501234567',
    email: 'test.e2e@example.com'
  },
  cartSummary: {
    total: 850
  },
  cart: [
    {
      id: 'test-item-1',
      productSku: 'TSH-001',
      productName: 'Test T-Shirt',
      quantity: 1,
      totalPrice: 850,
      sizeMatrices: {
        'Red': { 'L': 1 }
      },
      selectedPrintAreas: [
        {
          areaKey: 'front',
          method: 'print',
          designerComments: 'Test print area',
          printColor: 'white'
        }
      ]
    }
  ],
  paymentMethod: 'card',
  withDelivery: false,
  // Mark as partial to avoid actually sending to Pabbly
  _partial: true
};

async function testForwarder() {
  console.log('=== E2E Forwarder Test ===');
  console.log('Testing with payload:', JSON.stringify(testPayload, null, 2).slice(0, 400) + '...');

  try {
    const response = await fetch('http://localhost:3000/api/forward-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    
    console.log('\n=== Response ===');
    console.log('Status:', response.status);
    console.log('Success:', result.ok);
    
    if (result.normalized) {
      console.log('\n=== Canonical Fields Check ===');
      const n = result.normalized;
      console.log('airtable_record_id:', n.airtable_record_id);
      console.log('order_number:', n.order_number);
      console.log('customer.contact_name:', n.customer?.contact_name);
      console.log('cart.length:', n.cart?.length);
      console.log('finance.grand_total:', n.finance?.grand_total);
      console.log('finance.payment_method:', n.finance?.payment_method);
      console.log('dropbox_folder_url:', n.dropbox_folder_url);
      
      if (n.cart && n.cart.length > 0) {
        console.log('\n=== Cart Item Sample ===');
        const item = n.cart[0];
        console.log('line_id:', item.line_id);
        console.log('sku:', item.sku);
        console.log('product_name:', item.product_name);
        console.log('quantity:', item.quantity);
        console.log('unit_price:', item.unit_price);
        console.log('line_total:', item.line_total);
        if (item.print_areas) console.log('print_areas:', item.print_areas.length);
        if (item.colors) console.log('colors:', item.colors.length);
      }
    }
    
    if (result.warnings) {
      console.log('\n=== Warnings ===');
      console.log(result.warnings);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Check if we can connect to dev server
if (process.env.DEBUG_FORWARDER) {
  testForwarder();
} else {
  console.log('Run with DEBUG_FORWARDER=1 to enable test');
  console.log('Example: DEBUG_FORWARDER=1 node scripts/test-forwarder-e2e.js');
}