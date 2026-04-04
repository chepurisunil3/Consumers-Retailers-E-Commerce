const { Schema, model, Types } = require("mongoose");

const ProductsSchema = new Schema(
  {
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
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    sku: {
      type: String,
      default: "",
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    inventory: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true, versionKey: false },
);

ProductsSchema.index({ retailer: 1, slug: 1 }, { unique: true });

ProductsSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    retailer: this.retailer,
    category: this.category,
    name: this.name,
    slug: this.slug,
    description: this.description,
    imageUrl: this.imageUrl,
    sku: this.sku,
    price: this.price,
    inventory: this.inventory,
    isFeatured: this.isFeatured,
    isActive: this.isActive,
    tags: this.tags,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = model("products", ProductsSchema);
