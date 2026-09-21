const { Schema, model } = require("mongoose");

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const INDUSTRIES = [
  "grocery",
  "electronics",
  "fashion",
  "home_and_furniture",
  "beauty_and_personal_care",
  "pharmacy",
  "books_and_stationery",
  "sports_and_fitness",
  "other",
];

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
    industry: {
      type: String,
      enum: INDUSTRIES,
      required: true,
    },
    gstNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: [GST_REGEX, "Enter a valid 15-character GSTIN."],
    },
    panNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: [PAN_REGEX, "Enter a valid 10-character PAN."],
    },
    companyLogo: {
      type: String,
      default: "",
    },
    address: {
      line1: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "India" },
      postalCode: { type: String, default: "" },
    },
    bankDetails: {
      accountHolderName: { type: String, default: "" },
      accountNumber: { type: String, default: "", select: false },
      ifscCode: {
        type: String,
        default: "",
        uppercase: true,
        trim: true,
        validate: {
          validator: (value) => !value || IFSC_REGEX.test(value),
          message: "Enter a valid IFSC code.",
        },
      },
      bankName: { type: String, default: "" },
    },
    onboardingStatus: {
      type: String,
      enum: ["pending", "verified"],
      default: "pending",
    },
  },
  { timestamps: true, versionKey: false },
);

RetailersSchema.methods.toPublicJSON = function () {
  const accountNumber = this.bankDetails && this.bankDetails.accountNumber;
  return {
    id: this._id,
    email: this.email,
    contactName: this.contactName,
    contactNumber: this.contactNumber,
    companyName: this.companyName,
    companyLogo: this.companyLogo,
    industry: this.industry,
    gstNumber: this.gstNumber,
    panNumber: this.panNumber,
    address: this.address,
    onboardingStatus: this.onboardingStatus,
    bankDetails: {
      accountHolderName: this.bankDetails?.accountHolderName || "",
      bankName: this.bankDetails?.bankName || "",
      ifscCode: this.bankDetails?.ifscCode || "",
      accountNumberMasked: accountNumber
        ? `••••${accountNumber.slice(-4)}`
        : "",
    },
    createdAt: this.createdAt,
  };
};

RetailersSchema.methods.getUserReadableData = RetailersSchema.methods.toPublicJSON;
RetailersSchema.statics.INDUSTRIES = INDUSTRIES;

module.exports = model("retailers", RetailersSchema);
