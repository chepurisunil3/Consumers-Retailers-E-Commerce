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
    images: {
      type: [String],
      default: [],
    },
    sku: {
      type: String,
      default: "",
      trim: true,
    },
    mrp: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 90,
    },
    // finalPrice / price are derived (mrp - discount) and kept in sync via the
    // pre-save hook below so existing serializers that read `price` still work.
    finalPrice: {
      type: Number,
      min: 0,
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
    attributes: {
      type: Map,
      of: String,
      default: {},
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

ProductsSchema.pre("validate", function computeFinalPrice(next) {
  if (this.isModified("mrp") || this.isModified("discountPercent")) {
    const discount = Math.min(Math.max(this.discountPercent || 0, 0), 90);
    const computed = this.mrp - (this.mrp * discount) / 100;
    this.finalPrice = Number(computed.toFixed(2));
    this.price = this.finalPrice;
  }
  next();
});

ProductsSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    retailer: this.retailer,
    category: this.category,
    name: this.name,
    slug: this.slug,
    description: this.description,
    imageUrl: this.imageUrl,
    images: this.images,
    sku: this.sku,
    mrp: this.mrp,
    discountPercent: this.discountPercent,
    finalPrice: this.finalPrice,
    price: this.finalPrice,
    savings: Number((this.mrp - this.finalPrice).toFixed(2)),
    inventory: this.inventory,
    attributes: this.attributes ? Object.fromEntries(this.attributes) : {},
    isFeatured: this.isFeatured,
    isActive: this.isActive,
    tags: this.tags,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = model("products", ProductsSchema);
