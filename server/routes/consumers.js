const express = require("express");
const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/require-role");
const {
  registerConsumer,
  loginConsumer,
  getConsumerProfile,
  updateConsumerProfile,
} = require("../controllers/consumers/auth");
const {
  listAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} = require("../controllers/consumers/addresses");

const router = express.Router();
const consumer = auth;
const asConsumer = requireRole("consumer");

router.post("/auth/register", registerConsumer);
router.post("/auth/login", loginConsumer);
router.get("/auth/me", consumer, asConsumer, getConsumerProfile);
router.patch("/auth/me", consumer, asConsumer, updateConsumerProfile);

router.get("/addresses", consumer, asConsumer, listAddresses);
router.post("/addresses", consumer, asConsumer, addAddress);
router.patch("/addresses/:id", consumer, asConsumer, updateAddress);
router.delete("/addresses/:id", consumer, asConsumer, deleteAddress);

module.exports = router;
