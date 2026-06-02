const trackingUtils = require('./utils/trackingUtils');
const p = { event_type: 'product_view', metadata: { product_name: 'Test Product', price: 100 } };
console.log(trackingUtils.sanitizeTrackingPayload(p));
