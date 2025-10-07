import Ajv from 'ajv';
import addFormats from 'ajv-formats';

let ajv;
function getAjv() {
  if (!ajv) {
    ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
  }
  return ajv;
}

const orderSchema = {
  type: 'object',
  required: ['cart', 'contact'],
  properties: {
    cart: {
      type: 'array',
      minItems: 1,
      items: { type: 'object' },
    },
    contact: {
      type: 'object',
      required: ['email'],
      properties: {
        name: { type: 'string', minLength: 1 },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string' },
        address: { type: 'string' },
      },
      additionalProperties: true,
    },
    paymentMethod: { type: 'string' },
    totals: {
      type: 'object',
      required: ['total', 'currency'],
      properties: {
        subtotal: { type: 'number' },
        total: { type: 'number' },
        currency: { type: 'string', minLength: 1 },
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

let validator;
export function validateOrderPayload(payload) {
  const ajv = getAjv();
  validator = validator || ajv.compile(orderSchema);
  const valid = validator(payload);
  if (valid) return { valid: true, errors: [] };
  const errors = (validator.errors || []).map((e) => ({
    path: e.instancePath || e.schemaPath,
    message: e.message,
  }));
  return { valid: false, errors };
}
