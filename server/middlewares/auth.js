const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const jwtSecret = process.env.tokenSecretKey || "rect-with-node-secret";
module.exports = function (req, res, next) {
  const authHeader = req.header("authorization");
  const token =
    req.header("x-auth-token") ||
    (authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "")
      : null);

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No token, authorization denied" });
  }

  try {
    jwt.verify(token, jwtSecret, (error, decoded) => {
      if (error) {
        return res
          .status(401)
          .json({ success: false, message: "Token is not valid" });
      } else {
        req.user = decoded;
        next();
      }
    });
  } catch (err) {
    console.error("something wrong with auth middleware");
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
