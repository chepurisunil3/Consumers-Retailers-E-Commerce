const { Schema, model, Types } = require("mongoose");

const ITEM_STATUSES = [
  "pending",
  "accepted",
  "declined",
  "dispatched",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "return_requested",
  "returned",
];

const ORDER_STATUSES = [
  "pending",
  "processing",
  "partially_fulfilled",
  "dispatched",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
];

const StatusHistoryEntrySchema = new Schema(
  {
    status: { type: String, enum: ITEM_STATUSES, required: true },
    changedBy: { type: Types.ObjectId },
    changedByRole: { type: String, default: "" },
    note: { type: String, default: "" },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

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
    status: {
      type: String,
      enum: ITEM_STATUSES,
      default: "pending",
    },
    statusHistory: {
      type: [StatusHistoryEntrySchema],
      default: () => [{ status: "pending", at: new Date() }],
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
      enum: ORDER_STATUSES,
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "mock-online"],
      default: "cod",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
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
      label: { type: String, default: "" },
      line1: { type: String, default: "" },
      line2: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "India" },
      postalCode: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
  },
  { timestamps: true, versionKey: false },
);

// Rolls the per-item statuses up into a single order-level status the
// consumer sees. Evaluated in priority order (most "final" states first).
OrdersSchema.methods.recomputeStatus = function recomputeStatus() {
  const statuses = this.items.map((item) => item.status);
  const all = (value) => statuses.every((status) => status === value);
  const any = (...values) => statuses.some((status) => values.includes(status));
  const isTerminal = (status) =>
    ["delivered", "cancelled", "declined", "returned"].includes(status);

  if (all("delivered")) {
    this.status = "delivered";
  } else if (statuses.every((status) => ["cancelled", "declined"].includes(status))) {
    this.status = "cancelled";
  } else if (
    any("return_requested", "returned") &&
    statuses.every((status) => isTerminal(status) || status === "return_requested")
  ) {
    this.status = "returned";
  } else if (any("out_for_delivery")) {
    this.status = "out_for_delivery";
  } else if (any("dispatched")) {
    this.status = "dispatched";
  } else if (statuses.some(isTerminal) && statuses.some((status) => !isTerminal(status))) {
    this.status = "partially_fulfilled";
  } else if (any("accepted")) {
    this.status = "processing";
  } else {
    this.status = "pending";
  }

  return this.status;
};

OrdersSchema.statics.ITEM_STATUSES = ITEM_STATUSES;
OrdersSchema.statics.ORDER_STATUSES = ORDER_STATUSES;

module.exports = model("orders", OrdersSchema);
