const { Schema, model, Types } = require("mongoose");

const OrderItemSchema = new Schema(
  {
    product: {
      type: Types.ObjectId,
      ref: "products",
      required: true,
    },
    retailer: {
      type: Types.ObjectId,
      ref: "retailers",
      required: true,
      index: true,
    },
    category: {
      type: Types.ObjectId,
      ref: "categories",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true, versionKey: false },
);

const OrdersSchema = new Schema(
  {
    consumer: {
      type: Types.ObjectId,
      ref: "consumers",
      required: true,
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "confirmed",
    },
    paymentMethod: {
      type: String,
      default: "card",
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingFee: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingAddress: {
      line1: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "" },
      postalCode: { type: String, default: "" },
    },
  },
  { timestamps: true, versionKey: false },
);

module.exports = model("orders", OrdersSchema);
