const bcrypt = require("bcrypt");
const Retailer = require("../../models/retailers/retailers");
const { getToken } = require("../../utils/jwt-token");

const SALT_ROUNDS = Number(process.env.saltRounds || 10);

const buildRetailerResponse = (retailer, token) => ({
  success: true,
  data: retailer.toPublicJSON(),
  token,
});

const validateRegisterPayload = ({
  companyName,
  contactName,
  email,
  password,
}) => {
  if (!companyName || !contactName || !email || !password) {
    return "Company name, contact name, email and password are required.";
  }

  if (String(password).length < 6) {
    return "Password must be at least 6 characters long.";
  }

  return null;
};

const registerRetailer = async (req, res) => {
  try {
    const validationError = validateRegisterPayload(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const email = String(req.body.email).toLowerCase().trim();
    const existingRetailer = await Retailer.findOne({ email });
    if (existingRetailer) {
      return res
        .status(409)
        .json({ success: false, message: "Email is already registered." });
    }

    const password = await bcrypt.hash(String(req.body.password), SALT_ROUNDS);

    const retailer = await Retailer.create({
      companyName: req.body.companyName,
      contactName: req.body.contactName,
      email,
      password,
      contactNumber: req.body.contactNumber || "",
      gstNumber: req.body.gstNumber || "",
      panNumber: req.body.panNumber || "",
      companyLogo: req.body.companyLogo || "",
      address: req.body.address || {},
    });

    const token = await getToken({
      id: retailer._id,
      email: retailer.email,
      role: "retailer",
    });

    return res.status(201).json(buildRetailerResponse(retailer, token));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to register retailer." });
  }
};

const loginRetailer = async (req, res) => {
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

    const retailer = await Retailer.findOne({ email }).select("+password");
    if (!retailer) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    const passwordMatches = await bcrypt.compare(password, retailer.password);
    if (!passwordMatches) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    const token = await getToken({
      id: retailer._id,
      email: retailer.email,
      role: "retailer",
    });

    return res.status(200).json(buildRetailerResponse(retailer, token));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to login retailer." });
  }
};

const getRetailerProfile = async (req, res) => {
  try {
    const retailer = await Retailer.findById(req.user.id);
    if (!retailer) {
      return res
        .status(404)
        .json({ success: false, message: "Retailer account not found." });
    }

    return res
      .status(200)
      .json({ success: true, data: retailer.toPublicJSON() });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch retailer profile." });
  }
};

module.exports = {
  registerRetailer,
  loginRetailer,
  getRetailerProfile,
};
