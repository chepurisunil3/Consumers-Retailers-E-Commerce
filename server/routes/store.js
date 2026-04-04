const express = require("express");
const {
  listStoreCategories,
  listStoreProducts,
  getStoreProductById,
} = require("../controllers/consumers/store");

const router = express.Router();

router.get("/categories", listStoreCategories);
router.get("/products", listStoreProducts);
router.get("/products/:id", getStoreProductById);

module.exports = router;
