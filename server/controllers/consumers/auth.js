const bcrypt = require("bcrypt");
const Consumer = require("../../models/consumers/consumers");
const { getToken } = require("../../utils/jwt-token");

const SALT_ROUNDS = Number(process.env.saltRounds || 10);

const buildConsumerResponse = (consumer, token) => ({
  success: true,
  data: consumer.toPublicJSON(),
  token,
});

const normalizeText = (value) => String(value || "").trim();

const normalizeShippingAddress = (shippingAddress = {}) => ({
  line1: normalizeText(shippingAddress.line1),
  city: normalizeText(shippingAddress.city),
  state: normalizeText(shippingAddress.state),
  country: normalizeText(shippingAddress.country),
  postalCode: normalizeText(shippingAddress.postalCode),
});

const registerConsumer = async (req, res) => {
  try {
    const { name, email, password, mobileNumber, shippingAddress } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existingConsumer = await Consumer.findOne({ email: normalizedEmail });
    if (existingConsumer) {
      return res
        .status(409)
        .json({ success: false, message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(String(password), SALT_ROUNDS);
    const consumer = await Consumer.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      mobileNumber: mobileNumber || "",
      profilePhoto: req.body.profilePhoto || "",
      shippingAddress: shippingAddress || {},
    });

    const token = await getToken({
      id: consumer._id,
      email: consumer.email,
      role: "consumer",
    });
    return res.status(201).json(buildConsumerResponse(consumer, token));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to register consumer." });
  }
};

const loginConsumer = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .toLowerCase()
      .trim();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required." });
    }

    const consumer = await Consumer.findOne({ email }).select("+password");
    if (!consumer) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    const isValid = await bcrypt.compare(password, consumer.password);
    if (!isValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    const token = await getToken({
      id: consumer._id,
      email: consumer.email,
      role: "consumer",
    });
    return res.status(200).json(buildConsumerResponse(consumer, token));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to login consumer." });
  }
};

const getConsumerProfile = async (req, res) => {
  try {
    const consumer = await Consumer.findById(req.user.id);
    if (!consumer) {
      return res
        .status(404)
        .json({ success: false, message: "Consumer account not found." });
    }

    return res
      .status(200)
      .json({ success: true, data: consumer.toPublicJSON() });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch consumer profile." });
  }
};

const updateConsumerProfile = async (req, res) => {
  try {
    const consumer = await Consumer.findById(req.user.id);
    if (!consumer) {
      return res
        .status(404)
        .json({ success: false, message: "Consumer account not found." });
    }

    const nextName = normalizeText(req.body.name || consumer.name);
    const nextEmail = normalizeText(req.body.email || consumer.email)
      .toLowerCase()
      .trim();

    if (!nextName || !nextEmail) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required.",
      });
    }

    const existingConsumer = await Consumer.findOne({
      email: nextEmail,
      _id: { $ne: consumer._id },
    });
    if (existingConsumer) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    consumer.name = nextName;
    consumer.email = nextEmail;

    if (req.body.mobileNumber !== undefined) {
      consumer.mobileNumber = normalizeText(req.body.mobileNumber);
    }

    if (req.body.profilePhoto !== undefined) {
      consumer.profilePhoto = normalizeText(req.body.profilePhoto);
    }

    if (req.body.shippingAddress) {
      consumer.shippingAddress = normalizeShippingAddress(
        req.body.shippingAddress,
      );
    }

    await consumer.save();

    return res.status(200).json({
      success: true,
      data: consumer.toPublicJSON(),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to update consumer profile.",
    });
  }
};

module.exports = {
  registerConsumer,
  loginConsumer,
  getConsumerProfile,
  updateConsumerProfile,
};
