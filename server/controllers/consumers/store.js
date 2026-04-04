const Category = require("../../models/retailers/categories");
const Product = require("../../models/retailers/products");

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
  sku: product.sku,
  price: product.price,
  inventory: product.inventory,
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

    if (req.query.q) {
      query.$or = [
        { name: { $regex: req.query.q, $options: "i" } },
        { description: { $regex: req.query.q, $options: "i" } },
        { tags: { $regex: req.query.q, $options: "i" } },
      ];
    }

    const products = await Product.find(query)
      .populate("category", "name slug")
      .populate("retailer", "companyName companyLogo")
      .sort({ isFeatured: -1, createdAt: -1 });

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

module.exports = {
  listStoreCategories,
  listStoreProducts,
  getStoreProductById,
};
