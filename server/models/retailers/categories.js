const { Schema, Types, model } = require("mongoose");

const CategoriesSchema = new Schema(
  {
    retailer: {
      type: Types.ObjectId,
      ref: "retailers",
      required: true,
      index: true,
    },
    name: {
      required: true,
      type: String,
      trim: true,
    },
    slug: {
      required: true,
      type: String,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true, versionKey: false },
);

CategoriesSchema.index({ retailer: 1, slug: 1 }, { unique: true });

CategoriesSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    retailer: this.retailer,
    name: this.name,
    slug: this.slug,
    description: this.description,
    imageUrl: this.imageUrl,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

CategoriesSchema.methods.getUserReadableData =
  CategoriesSchema.methods.toPublicJSON;
module.exports = model("categories", CategoriesSchema);
