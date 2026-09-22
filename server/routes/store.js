const express = require("express");
const checkObjectId = require("../middlewares/check-object-id");
const {
  listStoreCategories,
  listStoreProducts,
  getStoreProductById,
  getSuggestedProducts,
  getShippingConfig,
} = require("../controllers/consumers/store");

const router = express.Router();

router.get("/categories", listStoreCategories);
router.get("/products", listStoreProducts);
router.get("/products/:id", checkObjectId("id"), getStoreProductById);
router.get("/products/:id/suggestions", checkObjectId("id"), getSuggestedProducts);
router.get("/shipping-config", getShippingConfig);

module.exports = router;
