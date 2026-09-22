const Category = require("../../models/retailers/categories");
const Product = require("../../models/retailers/products");
const { SHIPPING_FEE, FREE_SHIPPING_THRESHOLD } = require("../../config/shipping");

const serializeCategory = (category) => ({
  id: category._id,
  name: category.name,
  slug: category.slug,
  description: category.description,
  imageUrl: category.imageUrl,
  retailer: category.retailer
    ? {
        id: category.retailer._id,
        companyName: category.retailer.companyName,
        companyLogo: category.retailer.companyLogo,
      }
    : null,
});

const serializeProduct = (product) => ({
  id: product._id,
  name: product.name,
  slug: product.slug,
  description: product.description,
  imageUrl: product.imageUrl,
  images: product.images,
  sku: product.sku,
  mrp: product.mrp,
  discountPercent: product.discountPercent,
  price: product.finalPrice,
  finalPrice: product.finalPrice,
  savings: Number((product.mrp - product.finalPrice).toFixed(2)),
  inventory: product.inventory,
  inStock: product.inventory > 0,
  attributes: product.attributes ? Object.fromEntries(product.attributes) : {},
  isFeatured: product.isFeatured,
  category: product.category
    ? {
        id: product.category._id,
        name: product.category.name,
        slug: product.category.slug,
      }
    : null,
  retailer: product.retailer
    ? {
        id: product.retailer._id,
        companyName: product.retailer.companyName,
        companyLogo: product.retailer.companyLogo,
      }
    : null,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

const listStoreCategories = async (req, res) => {
  try {
    const categories = await Category.find({})
      .populate("retailer", "companyName companyLogo")
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json({ success: true, data: categories.map(serializeCategory) });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch categories." });
  }
};

const listStoreProducts = async (req, res) => {
  try {
    const query = { isActive: true };

    if (req.query.categoryId) {
      query.category = req.query.categoryId;
    }

    if (req.query.retailerId) {
      query.retailer = req.query.retailerId;
    }

    if (req.query.featured === "true") {
      query.isFeatured = true;
    }

    if (req.query.onDiscount === "true") {
      query.discountPercent = { $gt: 0 };
    }

    if (req.query.q) {
      query.$or = [
        { name: { $regex: req.query.q, $options: "i" } },
        { description: { $regex: req.query.q, $options: "i" } },
        { tags: { $regex: req.query.q, $options: "i" } },
      ];
    }

    let sort = { isFeatured: -1, createdAt: -1 };
    if (req.query.sort === "price_asc") sort = { finalPrice: 1 };
    if (req.query.sort === "price_desc") sort = { finalPrice: -1 };
    if (req.query.sort === "discount") sort = { discountPercent: -1 };

    const products = await Product.find(query)
      .populate("category", "name slug")
      .populate("retailer", "companyName companyLogo")
      .sort(sort);

    return res
      .status(200)
      .json({ success: true, data: products.map(serializeProduct) });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch products." });
  }
};

const getStoreProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
    })
      .populate("category", "name slug")
      .populate("retailer", "companyName companyLogo");

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    return res
      .status(200)
      .json({ success: true, data: serializeProduct(product) });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch product." });
  }
};

const getSuggestedProducts = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isActive: true });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    const suggestions = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      isActive: true,
    })
      .populate("category", "name slug")
      .populate("retailer", "companyName companyLogo")
      .sort({ discountPercent: -1, isFeatured: -1, createdAt: -1 })
      .limit(6);

    return res
      .status(200)
      .json({ success: true, data: suggestions.map(serializeProduct) });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch suggestions." });
  }
};

// Public endpoint so the frontend can read the real shipping fee / free
// shipping threshold instead of hardcoding its own (out of sync) copies.
// See server/config/shipping.js for the source of truth.
const getShippingConfig = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: { shippingFee: SHIPPING_FEE, freeShippingThreshold: FREE_SHIPPING_THRESHOLD },
  });
};

module.exports = {
  listStoreCategories,
  listStoreProducts,
  getStoreProductById,
  getSuggestedProducts,
  getShippingConfig,
};
