const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/require-role");
const {
  registerRetailer,
  loginRetailer,
  getRetailerProfile,
} = require("../controllers/retailers/auth");
const {
  listCategories,
  createCategory,
  deleteCategory,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getRetailerDashboard,
} = require("../controllers/retailers/catalog");

router.post("/auth/register", registerRetailer);
router.post("/auth/login", loginRetailer);
router.get("/auth/me", auth, requireRole("retailer"), getRetailerProfile);
router.get("/dashboard", auth, requireRole("retailer"), getRetailerDashboard);

router.get("/categories", auth, requireRole("retailer"), listCategories);
router.post("/categories", auth, requireRole("retailer"), createCategory);
router.delete("/categories/:id", auth, requireRole("retailer"), deleteCategory);

router.get("/products", auth, requireRole("retailer"), listProducts);
router.post("/products", auth, requireRole("retailer"), createProduct);
router.patch("/products/:id", auth, requireRole("retailer"), updateProduct);
router.delete("/products/:id", auth, requireRole("retailer"), deleteProduct);

router.post("/addUser", registerRetailer);
router.post("/checkLogin", loginRetailer);
router.get("/getUser", auth, requireRole("retailer"), getRetailerProfile);
router.delete(
  "/deleteCategory/:id",
  auth,
  requireRole("retailer"),
  deleteCategory,
);

module.exports = router;
