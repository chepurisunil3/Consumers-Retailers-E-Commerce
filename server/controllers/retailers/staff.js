const bcrypt = require("bcrypt");
const RetailerStaff = require("../../models/retailers/retailer-staff");
const { getToken } = require("../../utils/jwt-token");

const SALT_ROUNDS = Number(process.env.saltRounds || 10);

const inviteStaff = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and role are required.",
      });
    }

    if (!RetailerStaff.ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Role must be one of: ${RetailerStaff.ROLES.join(", ")}.`,
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await RetailerStaff.findOne({ email: normalizedEmail });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "That email is already a team member." });
    }

    const hashedPassword = await bcrypt.hash(String(password), SALT_ROUNDS);
    const staff = await RetailerStaff.create({
      retailer: req.user.retailerId,
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      invitedBy: req.user.staffRole === "owner" ? undefined : req.user.id,
    });

    return res.status(201).json({ success: true, data: staff.toPublicJSON() });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to invite team member." });
  }
};

const listStaff = async (req, res) => {
  try {
    const staff = await RetailerStaff.find({ retailer: req.user.retailerId }).sort({
      createdAt: -1,
    });
    return res.status(200).json({ success: true, data: staff.map((s) => s.toPublicJSON()) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to fetch team members." });
  }
};

const updateStaff = async (req, res) => {
  try {
    const staff = await RetailerStaff.findOne({
      _id: req.params.id,
      retailer: req.user.retailerId,
    });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Team member not found." });
    }

    if (req.body.role) {
      if (!RetailerStaff.ROLES.includes(req.body.role)) {
        return res.status(400).json({
          success: false,
          message: `Role must be one of: ${RetailerStaff.ROLES.join(", ")}.`,
        });
      }
      staff.role = req.body.role;
    }

    if (typeof req.body.isActive === "boolean") {
      staff.isActive = req.body.isActive;
    }

    if (typeof req.body.name === "string" && req.body.name.trim()) {
      staff.name = req.body.name.trim();
    }

    await staff.save();
    return res.status(200).json({ success: true, data: staff.toPublicJSON() });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to update team member." });
  }
};

const removeStaff = async (req, res) => {
  try {
    const deleted = await RetailerStaff.findOneAndDelete({
      _id: req.params.id,
      retailer: req.user.retailerId,
    });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Team member not found." });
    }
    return res.status(200).json({ success: true, id: req.params.id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to remove team member." });
  }
};

const loginStaff = async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required." });
    }

    const staff = await RetailerStaff.findOne({ email }).select("+password");
    if (!staff || !staff.isActive) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const passwordMatches = await bcrypt.compare(password, staff.password);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = await getToken({
      id: staff._id,
      email: staff.email,
      role: "retailer",
      retailerId: staff.retailer,
      staffRole: staff.role,
    });

    return res.status(200).json({
      success: true,
      data: { ...staff.toPublicJSON(), staffRole: staff.role },
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to login." });
  }
};

module.exports = { inviteStaff, listStaff, updateStaff, removeStaff, loginStaff };
