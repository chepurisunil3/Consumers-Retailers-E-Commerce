const express = require("express");
const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/require-role");
const {
  registerConsumer,
  loginConsumer,
  getConsumerProfile,
  updateConsumerProfile,
} = require("../controllers/consumers/auth");

const router = express.Router();

router.post("/auth/register", registerConsumer);
router.post("/auth/login", loginConsumer);
router.get("/auth/me", auth, requireRole("consumer"), getConsumerProfile);
router.patch("/auth/me", auth, requireRole("consumer"), updateConsumerProfile);

module.exports = router;
