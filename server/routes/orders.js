const express = require("express");
const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/require-role");
const {
  createOrder,
  listConsumerOrders,
} = require("../controllers/consumers/orders");

const router = express.Router();

router.get("/", auth, requireRole("consumer"), listConsumerOrders);
router.post("/", auth, requireRole("consumer"), createOrder);

module.exports = router;
