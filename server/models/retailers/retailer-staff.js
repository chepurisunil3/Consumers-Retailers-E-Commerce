const { Schema, model, Types } = require("mongoose");

const STAFF_ROLES = ["admin", "manager", "sales"];

const RetailerStaffSchema = new Schema(
  {
    retailer: {
      type: Types.ObjectId,
      ref: "retailers",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: STAFF_ROLES,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    invitedBy: {
      type: Types.ObjectId,
      ref: "retailer-staff",
    },
  },
  { timestamps: true, versionKey: false },
);

RetailerStaffSchema.index({ retailer: 1, email: 1 }, { unique: true });

RetailerStaffSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    retailer: this.retailer,
    name: this.name,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
};

RetailerStaffSchema.statics.ROLES = STAFF_ROLES;

module.exports = model("retailer-staff", RetailerStaffSchema);
