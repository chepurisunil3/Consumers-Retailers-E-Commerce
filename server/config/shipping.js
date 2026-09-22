// Single source of truth for shipping pricing.
//
// Both order creation (server/controllers/consumers/orders.js) and the
// public shipping-config endpoint (server/controllers/consumers/store.js,
// exposed as GET /api/store/shipping-config) read these values from here.
// The consumers frontend (CartPage.js, CheckoutPage.js) fetches them from
// that endpoint instead of hardcoding its own copies, so the shipping fee
// a shopper is shown always matches what they're actually charged.
const SHIPPING_FEE = 4.99;
const FREE_SHIPPING_THRESHOLD = 100;

module.exports = { SHIPPING_FEE, FREE_SHIPPING_THRESHOLD };
