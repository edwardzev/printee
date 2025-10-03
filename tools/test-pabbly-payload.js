import normalize from '../src/lib/normalizeOrderPayload.js';

const payload = {
  "order": {
    "totals": {
      "vat_percent": "17",
      "vat_amount": "10370",
      "subtotal": "60150",
      "grand_total": "71370",
      "delivery": "850"
    },
    "status": "in_progress",
    "order_number": "1759506601223",
    "order_id": "local-1759506601223",
    "currency": "ILS"
  },
  "items": "[{\"line_id\":\"1759506575568\",\"product_sku\":\"dryfit\",\"product_name\":\"חולצת דרייפיט\",\"size_breakdown\":[{\"size\":\"xxxxl\",\"qty\":800},{\"size\":\"xxxl\",\"qty\":2}]}]",
  "idempotency_key": "local-1759506601223",
  "event": "order.partial",
  "environment": "development",
  "customer": {
    "type": "consumer",
    "phone": "Edward",
    "email": "wwe",
    "customer_id": "f558ef80-a0ee-4002-9f91-f2057857f8c0",
    "contact_name": "weddddw",
    "company_name": ""
  },
  "created_at": "2025-10-03T15:50:01.223Z",
  "_app_payload": {
    "withDelivery": "1",
    "sizeMatrices": {
      "white": {
        "xxxxl": "800"
      },
      "gray": {
        "xxxl": "2"
      }
    },
    "selectedPrintAreas": "[{\"areaKey\":\"frontA4\",\"method\":\"print\",\"printColor\":\"black\",\"designerComments\":\"black front\"},{\"areaKey\":\"leftSleeve\",\"method\":\"print\",\"printColor\":\"white\",\"designerComments\":\"white sleeve\"}]",
    "selectedColors": "[\"white\",\"gray\"]",
    "productSku": "dryfit",
    "paymentMethod": "bit",
    "contact": {
      "phone": "Edward",
      "name": "weddddw",
      "email": "wwe"
    },
    "cartSummary": {
      "total": "60150"
    },
    "cart": "[{\"id\":\"1759506575568\",\"productSku\":\"dryfit\",\"productName\":\"חולצת דרייפיט\",\"color\":\"white\",\"sizeMatrix\":{\"xxxxl\":800},\"selectedColors\":[\"white\",\"gray\"],\"sizeMatrices\":{\"white\":{\"xxxxl\":800},\"gray\":{\"xxxl\":2}},\"selectedPrintAreas\":[{\"areaKey\":\"frontA4\",\"method\":\"print\",\"printColor\":\"black\",\"designerComments\":\"black front\"},{\"areaKey\":\"leftSleeve\",\"method\":\"print\",\"printColor\":\"white\",\"designerComments\":\"white sleeve\"}],\"totalPrice\":60150,\"priceBreakdown\":{\"unitBase\":60,\"baseTotal\":48120,\"placementFeesPerUnit\":15,\"placementFeesTotal\":12030,\"emboUnitsCount\":0,\"emboFeeTotal\":0,\"deliveryCost\":0,\"grandTotal\":60150},\"mockupUrl\":\"/product_images/dryfit/white_dryfit.jpg\",\"timestamp\":\"2025-10-03T15:49:35.568Z\",\"uploadedDesigns\":[]}]"
  }
};

const normalized = normalize(payload);
console.log(JSON.stringify(normalized, null, 2));
