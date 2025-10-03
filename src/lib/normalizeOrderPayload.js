import { v4 as uuidv4 } from 'uuid';

function safeParseJSON(maybe) {
  if (maybe == null) return maybe;
  if (typeof maybe === 'string') {
    try { return JSON.parse(maybe); } catch (e) { return maybe; }
  }
  return maybe;
}

// Normalize an in-app payload shape into the canonical order.schema.json shape.
// This intentionally uses placeholders for missing fields so downstream
// validation and forwarding always receive a consistent structure.
export function normalize(payload = {}) {
  const now = new Date().toISOString();

  const idempotency_key = payload.idempotency_key || `local-${Date.now()}`;

  // tolerate payloads where the client accidentally stringified arrays/objects
  const safePayload = { ...payload };
  safePayload.cart = safeParseJSON(payload.cart) || [];

  const itemsFromCart = (Array.isArray(safePayload.cart) ? safePayload.cart : []).map((ciRaw, idx) => {
    const ci = (typeof ciRaw === 'string') ? safeParseJSON(ciRaw) : (ciRaw || {});
    const lineId = ci.id || `${ci.productSku || 'item'}-${idx}`;
    // build size_breakdown by flattening sizeMatrices (supports multi-color)
    const size_breakdown = [];
    const sizeMatrices = safeParseJSON(ci.sizeMatrices) || safeParseJSON(ci.sizeMatrix) || {};
    if (sizeMatrices && typeof sizeMatrices === 'object') {
      for (const colorKey of Object.keys(sizeMatrices)) {
        const mat = sizeMatrices[colorKey] || {};
        for (const size of Object.keys(mat || {})) {
          const rawQty = mat[size];
          const qty = Number(rawQty) || 0;
          size_breakdown.push({ size, qty });
        }
      }
    }

    // Map selectedPrintAreas from cart item into print_areas with optional comments and color
    const rawPrintAreas = safeParseJSON(ci.selectedPrintAreas) || [];
    const print_areas = (Array.isArray(rawPrintAreas) ? rawPrintAreas : []).map((paRaw) => {
      const pa = (typeof paRaw === 'string') ? safeParseJSON(paRaw) : (paRaw || {});
      const areaKey = pa && (pa.areaKey || pa.key) ? (pa.areaKey || pa.key) : '';
      const method = pa && pa.method ? pa.method : 'print';
      return {
        areaKey,
        method,
        designer_comments: String(pa && (pa.designerComments || pa.designer_comments || pa.comments) || ''),
        print_color: String(pa && (pa.printColor || pa.print_color) || '')
      };
    });

    return {
      line_id: String(lineId),
      product_sku: ci.productSku || ci.sku || 'unknown',
      product_name: ci.productName || '',
      size_breakdown,
      print_areas
    };
  });

  const totalQty = (Array.isArray(safePayload.cart) ? safePayload.cart : []).reduce((sum, ciRaw) => {
    const ci = (typeof ciRaw === 'string') ? safeParseJSON(ciRaw) : (ciRaw || {});
    const mats = safeParseJSON(ci.sizeMatrices) || safeParseJSON(ci.sizeMatrix) || {};
    if (mats && typeof mats === 'object') {
      return sum + Object.values(mats).reduce((s, mat) => s + Object.values(mat || {}).reduce((ss, q) => ss + (Number(q) || 0), 0), 0);
    }
    return sum;
  }, 0);

  const deliveryCost = payload.withDelivery ? (Math.ceil(totalQty / 50) * 50) : 0;
  const subtotal = (Array.isArray(safePayload.cart) ? safePayload.cart : []).reduce((s, ciRaw) => {
    const ci = (typeof ciRaw === 'string') ? safeParseJSON(ciRaw) : (ciRaw || {});
    return s + (Number(ci.totalPrice) || 0);
  }, 0);
  const totals = {
    subtotal,
    delivery: deliveryCost,
    vat_percent: 17,
    vat_amount: Math.round((subtotal + deliveryCost) * 0.17),
    grand_total: Math.round((subtotal + deliveryCost) * 1.17)
  };

  const contact = safeParseJSON(payload.contact) || {};
  const customer = {
    customer_id: payload.customerId || contact?.customerId || uuidv4(),
    type: payload.customerType || 'consumer',
    company_name: contact?.companyName || '',
    contact_name: (contact && (contact.fullName || contact.name)) || contact?.contact_name || '',
    email: contact?.email || payload.contact?.email || '',
    phone: contact?.phone || payload.contact?.phone || ''
  };

  const normalized = {
    event: payload.event || 'order.partial',
    idempotency_key,
    created_at: payload.created_at || now,
    environment: process.env.NODE_ENV || 'development',
    order: {
      order_id: payload.order?.order_id || payload.orderId || `local-${Date.now()}`,
      order_number: payload.order?.order_number || payload.orderNumber || `${Date.now()}`,
      status: payload.order?.status || 'in_progress',
      currency: payload.order?.currency || payload.currency || 'ILS',
      totals
    },
    customer,
    items: itemsFromCart,
    delivery: (function() {
      // try common locations for delivery/address info
      const rawDelivery = safeParseJSON(payload.delivery) || {};
  const contactAddr = safeParseJSON(payload.contact) || {};
  const rawAddress = safeParseJSON(payload.address) || {};
  const customerObj = safeParseJSON(payload.customer) || {};
  const customerDelivery = safeParseJSON(customerObj.delivery) || safeParseJSON(customerObj.address) || {};
      const withDelivery = payload.withDelivery || rawDelivery.withDelivery || rawAddress.withDelivery || payload.with_delivery || payload.withDelivery === '1' || payload.withDelivery === 1;
      return {
        withDelivery: withDelivery ? true : false,
        name: rawDelivery.name || customerDelivery.name || contactAddr.name || contactAddr.fullName || rawAddress.name || '',
        phone: rawDelivery.phone || customerDelivery.phone || contactAddr.phone || rawAddress.phone || '',
        address_line1: rawDelivery.address_line1 || customerDelivery.address_line1 || rawAddress.address_line1 || rawAddress.street || contactAddr.address || '',
        address_line2: rawDelivery.address_line2 || customerDelivery.address_line2 || rawAddress.address_line2 || rawAddress.street2 || '',
        city: rawDelivery.city || customerDelivery.city || rawAddress.city || contactAddr.city || '',
        postcode: rawDelivery.postcode || customerDelivery.postcode || rawAddress.postcode || contactAddr.postcode || '',
        country: rawDelivery.country || customerDelivery.country || rawAddress.country || contactAddr.country || '',
        instructions: rawDelivery.instructions || customerDelivery.instructions || rawAddress.instructions || ''
      };
    })(),
    // new optional fields surfaced from the configurator
  designer_comments: payload.designerComments || payload.designer_comments || payload.comments || '',
  print_color: payload.printColor || payload.print_color || '',
    // keep original payload for debugging/diagnostics while still validating
    _app_payload: payload
  };

  return normalized;
}

export default normalize;
