const bcrypt = require("bcrypt");
const Retailer = require("../../models/retailers/retailers");
const { getToken } = require("../../utils/jwt-token");

const SALT_ROUNDS = Number(process.env.saltRounds || 10);

const buildRetailerResponse = (retailer, token) => ({
  success: true,
  data: { ...retailer.toPublicJSON(), staffRole: "owner" },
  token,
});

const validateRegisterPayload = ({
  companyName,
  contactName,
  email,
  password,
  industry,
  gstNumber,
  panNumber,
}) => {
  if (!companyName || !contactName || !email || !password) {
    return "Company name, contact name, email and password are required.";
  }

  if (!industry) {
    return "Please select the industry your business operates in.";
  }

  if (!gstNumber || !panNumber) {
    return "GSTIN and PAN are required to onboard as a retailer.";
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

    let retailer;
    try {
      retailer = await Retailer.create({
        companyName: req.body.companyName,
        contactName: req.body.contactName,
        email,
        password,
        contactNumber: req.body.contactNumber || "",
        industry: req.body.industry,
        gstNumber: String(req.body.gstNumber).toUpperCase().trim(),
        panNumber: String(req.body.panNumber).toUpperCase().trim(),
        companyLogo: req.body.companyLogo || "",
        address: req.body.address || {},
        bankDetails: req.body.bankDetails || {},
      });
    } catch (validationErr) {
      if (validationErr.name === "ValidationError") {
        const message = Object.values(validationErr.errors)
          .map((err) => err.message)
          .join(" ");
        return res.status(400).json({ success: false, message });
      }
      throw validationErr;
    }

    const token = await getToken({
      id: retailer._id,
      email: retailer.email,
      role: "retailer",
      retailerId: retailer._id,
      staffRole: "owner",
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
      retailerId: retailer._id,
      staffRole: "owner",
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
    const retailer = await Retailer.findById(req.user.retailerId);
    if (!retailer) {
      return res
        .status(404)
        .json({ success: false, message: "Retailer account not found." });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...retailer.toPublicJSON(),
        staffRole: req.user.staffRole,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch retailer profile." });
  }
};

const updateRetailerProfile = async (req, res) => {
  try {
    const retailer = await Retailer.findById(req.user.retailerId);
    if (!retailer) {
      return res
        .status(404)
        .json({ success: false, message: "Retailer account not found." });
    }

    const editable = ["companyName", "contactName", "contactNumber", "companyLogo"];
    editable.forEach((field) => {
      if (typeof req.body[field] === "string") {
        retailer[field] = req.body[field];
      }
    });

    if (req.body.address) {
      retailer.address = { ...retailer.address.toObject(), ...req.body.address };
    }

    if (req.body.bankDetails) {
      retailer.bankDetails = {
        ...retailer.bankDetails.toObject(),
        ...req.body.bankDetails,
      };
    }

    await retailer.save();
    return res.status(200).json({ success: true, data: retailer.toPublicJSON() });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to update retailer profile." });
  }
};

module.exports = {
  registerRetailer,
  loginRetailer,
  getRetailerProfile,
  updateRetailerProfile,
};
