const express = require("express");
const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/require-role");
const {
  createOrder,
  listConsumerOrders,
  getConsumerOrder,
  cancelOrderItem,
  returnOrderItem,
} = require("../controllers/consumers/orders");

const router = express.Router();
const consumer = auth;
const asConsumer = requireRole("consumer");

router.get("/", consumer, asConsumer, listConsumerOrders);
router.post("/", consumer, asConsumer, createOrder);
router.get("/:id", consumer, asConsumer, getConsumerOrder);
router.post("/:id/items/:itemId/cancel", consumer, asConsumer, cancelOrderItem);
router.post("/:id/items/:itemId/return", consumer, asConsumer, returnOrderItem);

module.exports = router;
