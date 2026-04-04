const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const secretKey = process.env.tokenSecretKey || "rect-with-node-secret";
const getToken = async (payloadOrId, email) => {
  const payload =
    typeof payloadOrId === "object"
      ? payloadOrId
      : {
          id: payloadOrId,
          email,
        };

  const token = await jwt.sign(payload, secretKey, { expiresIn: "24h" });
  return token;
};

module.exports = { getToken };
