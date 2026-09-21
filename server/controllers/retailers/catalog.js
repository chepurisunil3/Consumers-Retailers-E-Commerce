const Category = require("../../models/retailers/categories");
const Product = require("../../models/retailers/products");
const Order = require("../../models/consumers/orders");
const { PERMISSIONS } = require("../../middlewares/require-permission");

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

const parseAttributes = (rawAttributes) => {
  if (!rawAttributes) return {};
  if (typeof rawAttributes === "string") {
    try {
      return JSON.parse(rawAttributes);
    } catch (error) {
      return {};
    }
  }
  return rawAttributes;
};

const serializeProduct = (product) => ({
  ...product.toPublicJSON(),
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
    const categories = await Category.find({ retailer: req.user.retailerId }).sort({
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
      retailer: req.user.retailerId,
      slug,
    });
    if (existingCategory) {
      return res
        .status(409)
        .json({ success: false, message: "Category already exists." });
    }

    const category = await Category.create({
      retailer: req.user.retailerId,
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
      retailer: req.user.retailerId,
    });
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found." });
    }

    const productsCount = await Product.countDocuments({
      category: category._id,
      retailer: req.user.retailerId,
    });
    if (productsCount > 0) {
      return res.status(400).json({
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
    const products = await Product.find({ retailer: req.user.retailerId })
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
    const mrp = Number(req.body.mrp ?? req.body.price);
    const discountPercent = Number(req.body.discountPercent || 0);
    const inventory = Number(req.body.inventory);

    if (!name || !categoryId || Number.isNaN(mrp) || Number.isNaN(inventory)) {
      return res.status(400).json({
        success: false,
        message: "Name, category, MRP and inventory are required.",
      });
    }

    const category = await Category.findOne({
      _id: categoryId,
      retailer: req.user.retailerId,
    });
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found." });
    }

    const product = await Product.create({
      retailer: req.user.retailerId,
      category: category._id,
      name: String(name).trim(),
      slug: slugify(`${name}-${Date.now()}`),
      description: description || "",
      imageUrl: imageUrl || "",
      images: Array.isArray(req.body.images) ? req.body.images : [],
      sku: sku || "",
      mrp,
      discountPercent,
      inventory,
      attributes: parseAttributes(req.body.attributes),
      isFeatured: Boolean(req.body.isFeatured),
      isActive: req.body.isActive !== false,
      tags: Array.isArray(req.body.tags)
        ? req.body.tags.filter(Boolean)
        : String(req.body.tags || "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
    });

    await product.populate("category", "name slug");
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
      retailer: req.user.retailerId,
    });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    if (req.body.categoryId || req.body.category) {
      const nextCategory = await Category.findOne({
        _id: req.body.categoryId || req.body.category,
        retailer: req.user.retailerId,
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

    if (Array.isArray(req.body.images)) {
      product.images = req.body.images;
    }

    if (typeof req.body.sku === "string") {
      product.sku = req.body.sku;
    }

    if (req.body.mrp !== undefined) {
      product.mrp = Number(req.body.mrp);
    }

    if (req.body.discountPercent !== undefined) {
      product.discountPercent = Number(req.body.discountPercent);
    }

    if (req.body.inventory !== undefined) {
      product.inventory = Number(req.body.inventory);
    }

    if (req.body.attributes !== undefined) {
      product.attributes = parseAttributes(req.body.attributes);
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
    await product.populate("category", "name slug");

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
      retailer: req.user.retailerId,
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
    const retailerId = req.user.retailerId;
    const canSeeEarnings = PERMISSIONS["dashboard.earnings"].includes(
      req.user.staffRole,
    );

    const [categoriesCount, totalProducts, lowStockProducts, recentProducts] =
      await Promise.all([
        Category.countDocuments({ retailer: retailerId }),
        Product.countDocuments({ retailer: retailerId }),
        Product.countDocuments({ retailer: retailerId, inventory: { $lte: 5 } }),
        Product.find({ retailer: retailerId })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("category", "name slug"),
      ]);

    const lowStockList = await Product.find({
      retailer: retailerId,
      inventory: { $lte: 5 },
    })
      .select("name inventory imageUrl")
      .limit(10);

    const orders = await Order.find({ "items.retailer": retailerId }).sort({
      createdAt: -1,
    });

    let earnings = 0;
    let pendingAttentionCount = 0;
    let oldestPendingAt = null;
    const statusCounts = {};
    const trendMap = new Map();
    const now = Date.now();

    orders.forEach((order) => {
      const ownItems = order.items.filter(
        (item) => String(item.retailer) === String(retailerId),
      );

      ownItems.forEach((item) => {
        statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;

        if (item.status === "delivered") {
          earnings += item.lineTotal;
        }

        if (item.status === "pending") {
          pendingAttentionCount += 1;
          const createdAt = order.createdAt;
          if (!oldestPendingAt || createdAt < oldestPendingAt) {
            oldestPendingAt = createdAt;
          }
        }

        const daysAgo = Math.floor((now - order.createdAt.getTime()) / 86400000);
        if (daysAgo >= 0 && daysAgo < 14) {
          const dayKey = new Date(order.createdAt).toISOString().slice(0, 10);
          trendMap.set(dayKey, (trendMap.get(dayKey) || 0) + item.lineTotal);
        }
      });
    });

    const recentOrders = orders.slice(0, 5).map((order) => {
      const ownItems = order.items.filter(
        (item) => String(item.retailer) === String(retailerId),
      );
      return {
        id: order._id,
        status: order.status,
        total: ownItems.reduce((sum, item) => sum + item.lineTotal, 0),
        itemCount: ownItems.reduce((sum, item) => sum + item.quantity, 0),
        createdAt: order.createdAt,
      };
    });

    const productInventory = await Product.find({ retailer: retailerId }).select(
      "inventory finalPrice",
    );
    const inventoryValue = productInventory.reduce(
      (sum, current) => sum + current.inventory * current.finalPrice,
      0,
    );

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          categoriesCount,
          productsCount: totalProducts,
          lowStockProducts,
          inventoryValue: canSeeEarnings ? inventoryValue : null,
          earnings: canSeeEarnings ? Number(earnings.toFixed(2)) : null,
          ordersByStatus: statusCounts,
          pendingAttentionCount,
          oldestPendingAt,
        },
        trend: Array.from(trendMap.entries())
          .sort(([a], [b]) => (a > b ? 1 : -1))
          .map(([date, total]) => ({ date, total: Number(total.toFixed(2)) })),
        lowStockList,
        recentProducts: recentProducts.map(serializeProduct),
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
