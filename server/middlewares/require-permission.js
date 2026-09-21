// Permission matrix for retailer sub-users. "owner" is the account that
// registered the retailer profile and always has full access.
const PERMISSIONS = {
  "products.write": ["owner", "admin", "manager"],
  "categories.write": ["owner", "admin", "manager"],
  "orders.view": ["owner", "admin", "manager", "sales"],
  "orders.updateStatus": ["owner", "admin", "manager", "sales"],
  "orders.cancel": ["owner", "admin", "manager"],
  "staff.manage": ["owner", "admin"],
  "dashboard.earnings": ["owner", "admin", "manager"],
};

const requirePermission = (action) => (req, res, next) => {
  const allowedRoles = PERMISSIONS[action];
  if (!allowedRoles) {
    return res.status(500).json({
      success: false,
      message: `Unknown permission "${action}".`,
    });
  }

  const staffRole = req.user && req.user.staffRole;
  if (!staffRole || !allowedRoles.includes(staffRole)) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to perform this action.",
    });
  }

  next();
};

module.exports = requirePermission;
module.exports.PERMISSIONS = PERMISSIONS;
