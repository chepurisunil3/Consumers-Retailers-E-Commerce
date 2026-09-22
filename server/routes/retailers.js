const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/require-role");
const requirePermission = require("../middlewares/require-permission");
const checkObjectId = require("../middlewares/check-object-id");
const {
  registerRetailer,
  loginRetailer,
  getRetailerProfile,
  updateRetailerProfile,
} = require("../controllers/retailers/auth");
const {
  inviteStaff,
  listStaff,
  updateStaff,
  removeStaff,
  loginStaff,
} = require("../controllers/retailers/staff");
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
const {
  listRetailerOrders,
  getRetailerOrder,
  updateOrderItemStatus,
} = require("../controllers/retailers/orders");

const retailer = auth;
const asRetailer = requireRole("retailer");

router.post("/auth/register", registerRetailer);
router.post("/auth/login", loginRetailer);
router.post("/staff/login", loginStaff);
router.get("/auth/me", retailer, asRetailer, getRetailerProfile);
router.patch("/auth/me", retailer, asRetailer, updateRetailerProfile);

router.get("/dashboard", retailer, asRetailer, getRetailerDashboard);

router.get("/categories", retailer, asRetailer, listCategories);
router.post(
  "/categories",
  retailer,
  asRetailer,
  requirePermission("categories.write"),
  createCategory,
);
router.delete(
  "/categories/:id",
  retailer,
  asRetailer,
  requirePermission("categories.write"),
  checkObjectId("id"),
  deleteCategory,
);

router.get("/products", retailer, asRetailer, listProducts);
router.post(
  "/products",
  retailer,
  asRetailer,
  requirePermission("products.write"),
  createProduct,
);
router.patch(
  "/products/:id",
  retailer,
  asRetailer,
  requirePermission("products.write"),
  checkObjectId("id"),
  updateProduct,
);
router.delete(
  "/products/:id",
  retailer,
  asRetailer,
  requirePermission("products.write"),
  checkObjectId("id"),
  deleteProduct,
);

router.get("/orders", retailer, asRetailer, listRetailerOrders);
router.get("/orders/:id", retailer, asRetailer, checkObjectId("id"), getRetailerOrder);
router.patch(
  "/orders/:orderId/items/:itemId/status",
  retailer,
  asRetailer,
  requirePermission("orders.updateStatus"),
  updateOrderItemStatus,
);

router.get(
  "/staff",
  retailer,
  asRetailer,
  requirePermission("staff.manage"),
  listStaff,
);
router.post(
  "/staff",
  retailer,
  asRetailer,
  requirePermission("staff.manage"),
  inviteStaff,
);
router.patch(
  "/staff/:id",
  retailer,
  asRetailer,
  requirePermission("staff.manage"),
  updateStaff,
);
router.delete(
  "/staff/:id",
  retailer,
  asRetailer,
  requirePermission("staff.manage"),
  removeStaff,
);

module.exports = router;
