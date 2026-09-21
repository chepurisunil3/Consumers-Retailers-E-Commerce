const { Schema, model } = require("mongoose");

const AddressSchema = new Schema(
  {
    label: { type: String, default: "Home" },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, default: "India", trim: true },
    postalCode: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const ConsumersSchema = new Schema(
  {
    name: {
      required: true,
      type: String,
      trim: true,
    },
    mobileNumber: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    profilePhoto: {
      type: String,
      default: "",
    },
    shippingAddress: {
      line1: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "" },
      postalCode: { type: String, default: "" },
    },
    addresses: {
      type: [AddressSchema],
      default: [],
    },
  },
  { timestamps: true, versionKey: false },
);

ConsumersSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    mobileNumber: this.mobileNumber,
    profilePhoto: this.profilePhoto,
    shippingAddress: this.shippingAddress,
    addresses: this.addresses,
    createdAt: this.createdAt,
  };
};

module.exports = model("consumers", ConsumersSchema);
