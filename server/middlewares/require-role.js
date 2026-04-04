module.exports = function requireRole(expectedRole) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== expectedRole) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this resource.",
      });
    }

    next();
  };
};
