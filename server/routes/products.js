const express = require("express");
const {
  listCategories,
  createCategory,
} = require("../controllers/retailers/catalog");
const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/require-role");
const router = express.Router();

router.post("/addCategory", auth, requireRole("retailer"), createCategory);

router.get("/getCategories", auth, requireRole("retailer"), listCategories);

module.exports = router;
