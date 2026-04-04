const { Schema, model } = require("mongoose");
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
    createdAt: this.createdAt,
  };
};

module.exports = model("consumers", ConsumersSchema);
