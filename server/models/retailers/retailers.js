const { Schema, model } = require("mongoose");
const RetailersSchema = new Schema(
  {
    companyName: {
      required: true,
      type: String,
      trim: true,
    },
    contactNumber: {
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
    contactName: {
      type: String,
      required: true,
      trim: true,
    },
    gstNumber: {
      type: String,
      default: "",
    },
    panNumber: {
      type: String,
      default: "",
    },
    companyLogo: {
      type: String,
      default: "",
    },
    address: {
      line1: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "" },
      postalCode: { type: String, default: "" },
    },
  },
  { timestamps: true, versionKey: false },
);

RetailersSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    email: this.email,
    contactName: this.contactName,
    contactNumber: this.contactNumber,
    companyName: this.companyName,
    companyLogo: this.companyLogo,
    gstNumber: this.gstNumber,
    panNumber: this.panNumber,
    address: this.address,
    createdAt: this.createdAt,
  };
};

RetailersSchema.methods.getUserReadableData =
  RetailersSchema.methods.toPublicJSON;
module.exports = model("retailers", RetailersSchema);
