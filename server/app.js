const express = require("express");
const cors = require("cors");
const retailersRouter = require("./routes/retailers");
const consumersRouter = require("./routes/consumers");
const storeRouter = require("./routes/store");
const ordersRouter = require("./routes/orders");
const uploadsRouter = require("./routes/uploads");

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  "http://localhost:3000,http://localhost:3002,http://localhost:4000"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not " +
          "allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Consumers-Retailers-E-Commerce API is running.",
    services: ["retailers", "consumers", "store", "orders", "uploads"],
  });
});
app.get("/api/health", (req, res) => {
  res
    .status(200)
    .json({ success: true, status: "ok", timestamp: new Date().toISOString() });
});
app.use("/api/retailers", retailersRouter);
app.use("/api/consumers", consumersRouter);
app.use("/api/store", storeRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/uploads", uploadsRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ success: false, message: "Unexpected server error." });
});

module.exports = app;
