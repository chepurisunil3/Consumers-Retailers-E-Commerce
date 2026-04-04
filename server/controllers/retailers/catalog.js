const Category = require("../../models/retailers/categories");
const Product = require("../../models/retailers/products");
const Order = require("../../models/consumers/orders");

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const serializeCategory = (category) => ({
  id: category._id,
  name: category.name,
  slug: category.slug,
  description: category.description,
  imageUrl: category.imageUrl,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
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
  isActive: product.isActive,
  tags: product.tags,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
  category: product.category
    ? {
        id: product.category._id || product.category,
        name: product.category.name,
        slug: product.category.slug,
      }
    : null,
});

const listCategories = async (req, res) => {
  try {
    const categories = await Category.find({ retailer: req.user.id }).sort({
      createdAt: -1,
    });
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

const createCategory = async (req, res) => {
  try {
    const name = String(req.body.name || req.body.categoryName || "").trim();
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Category name is required." });
    }

    const slug = slugify(name);
    const existingCategory = await Category.findOne({
      retailer: req.user.id,
      slug,
    });
    if (existingCategory) {
      return res
        .status(409)
        .json({ success: false, message: "Category already exists." });
    }

    const category = await Category.create({
      retailer: req.user.id,
      name,
      slug,
      description: req.body.description || "",
      imageUrl: req.body.imageUrl || req.body.categoryImage || "",
    });

    return res
      .status(201)
      .json({ success: true, data: serializeCategory(category) });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to create category." });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      retailer: req.user.id,
    });
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found." });
    }

    const productsCount = await Product.countDocuments({
      category: category._id,
      retailer: req.user.id,
    });
    if (productsCount > 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Delete the products in this category before deleting it.",
        });
    }

    await category.deleteOne();
    return res.status(200).json({ success: true, id: req.params.id });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to delete category." });
  }
};

const listProducts = async (req, res) => {
  try {
    const products = await Product.find({ retailer: req.user.id })
      .populate("category", "name slug")
      .sort({ createdAt: -1 });

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

const createProduct = async (req, res) => {
  try {
    const { name, description, imageUrl, sku } = req.body;
    const categoryId = req.body.categoryId || req.body.category;
    const price = Number(req.body.price);
    const inventory = Number(req.body.inventory);

    if (
      !name ||
      !categoryId ||
      Number.isNaN(price) ||
      Number.isNaN(inventory)
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Name, category, price and inventory are required.",
        });
    }

    const category = await Category.findOne({
      _id: categoryId,
      retailer: req.user.id,
    });
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found." });
    }

    const product = await Product.create({
      retailer: req.user.id,
      category: category._id,
      name: String(name).trim(),
      slug: slugify(`${name}-${Date.now()}`),
      description: description || "",
      imageUrl: imageUrl || "",
      sku: sku || "",
      price,
      inventory,
      isFeatured: Boolean(req.body.isFeatured),
      isActive: req.body.isActive !== false,
      tags: Array.isArray(req.body.tags)
        ? req.body.tags.filter(Boolean)
        : String(req.body.tags || "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
    });

    await product.populate("category", "name slug").execPopulate();
    return res
      .status(201)
      .json({ success: true, data: serializeProduct(product) });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to create product." });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      retailer: req.user.id,
    });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    if (req.body.categoryId || req.body.category) {
      const nextCategory = await Category.findOne({
        _id: req.body.categoryId || req.body.category,
        retailer: req.user.id,
      });

      if (!nextCategory) {
        return res
          .status(404)
          .json({ success: false, message: "Category not found." });
      }

      product.category = nextCategory._id;
    }

    if (req.body.name) {
      product.name = String(req.body.name).trim();
    }

    if (typeof req.body.description === "string") {
      product.description = req.body.description;
    }

    if (typeof req.body.imageUrl === "string") {
      product.imageUrl = req.body.imageUrl;
    }

    if (typeof req.body.sku === "string") {
      product.sku = req.body.sku;
    }

    if (req.body.price !== undefined) {
      product.price = Number(req.body.price);
    }

    if (req.body.inventory !== undefined) {
      product.inventory = Number(req.body.inventory);
    }

    if (req.body.isFeatured !== undefined) {
      product.isFeatured = Boolean(req.body.isFeatured);
    }

    if (req.body.isActive !== undefined) {
      product.isActive = Boolean(req.body.isActive);
    }

    if (req.body.tags !== undefined) {
      product.tags = Array.isArray(req.body.tags)
        ? req.body.tags.filter(Boolean)
        : String(req.body.tags || "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);
    }

    await product.save();
    await product.populate("category", "name slug").execPopulate();

    return res
      .status(200)
      .json({ success: true, data: serializeProduct(product) });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to update product." });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findOneAndDelete({
      _id: req.params.id,
      retailer: req.user.id,
    });
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    return res.status(200).json({ success: true, id: req.params.id });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to delete product." });
  }
};

const getRetailerDashboard = async (req, res) => {
  try {
    const [categoriesCount, products, orders] = await Promise.all([
      Category.countDocuments({ retailer: req.user.id }),
      Product.find({ retailer: req.user.id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("category", "name slug"),
      Order.find({ "items.retailer": req.user.id })
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const totalProducts = await Product.countDocuments({
      retailer: req.user.id,
    });
    const lowStockProducts = await Product.countDocuments({
      retailer: req.user.id,
      inventory: { $lte: 5 },
    });
    const productInventory = await Product.find({
      retailer: req.user.id,
    }).select("inventory price");
    const inventoryValue = productInventory.reduce(
      (sum, current) => sum + current.inventory * current.price,
      0,
    );

    const recentOrders = orders.map((order) => {
      const retailerItems = order.items.filter(
        (item) => String(item.retailer) === String(req.user.id),
      );
      return {
        id: order._id,
        status: order.status,
        total: retailerItems.reduce((sum, item) => sum + item.lineTotal, 0),
        itemCount: retailerItems.reduce((sum, item) => sum + item.quantity, 0),
        createdAt: order.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          categoriesCount,
          productsCount: totalProducts,
          lowStockProducts,
          inventoryValue,
        },
        recentProducts: products.map(serializeProduct),
        recentOrders,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch dashboard data." });
  }
};

module.exports = {
  listCategories,
  createCategory,
  deleteCategory,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getRetailerDashboard,
};
