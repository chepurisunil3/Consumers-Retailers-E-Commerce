const express = require("express");
const {
  listStoreCategories,
  listStoreProducts,
  getStoreProductById,
  getSuggestedProducts,
} = require("../controllers/consumers/store");

const router = express.Router();

router.get("/categories", listStoreCategories);
router.get("/products", listStoreProducts);
router.get("/products/:id", getStoreProductById);
router.get("/products/:id/suggestions", getSuggestedProducts);

module.exports = router;
