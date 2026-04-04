const Product = require("../../models/retailers/products");
const Order = require("../../models/consumers/orders");

const SHIPPING_FEE = 4.99;

const serializeOrder = (order) => ({
  id: order._id,
  status: order.status,
  paymentMethod: order.paymentMethod,
  subtotal: order.subtotal,
  shippingFee: order.shippingFee,
  total: order.total,
  shippingAddress: order.shippingAddress,
  createdAt: order.createdAt,
  items: order.items.map((item) => ({
    id: item._id,
    productId: item.product,
    retailerId: item.retailer,
    categoryId: item.category,
    name: item.name,
    imageUrl: item.imageUrl,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
  })),
});

const createOrder = async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Order must contain at least one item.",
        });
    }

    const productIds = items.map((item) => item.productId);
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    });
    const productsMap = new Map(
      products.map((product) => [String(product._id), product]),
    );

    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = productsMap.get(String(item.productId));
      const quantity = Number(item.quantity);

      if (!product) {
        return res
          .status(404)
          .json({
            success: false,
            message: `Product ${item.productId} was not found.`,
          });
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Each item must have a valid quantity.",
          });
      }

      if (product.inventory < quantity) {
        return res
          .status(400)
          .json({
            success: false,
            message: `${product.name} does not have enough stock.`,
          });
      }

      const lineTotal = Number((product.price * quantity).toFixed(2));
      subtotal += lineTotal;
      orderItems.push({
        product: product._id,
        retailer: product.retailer,
        category: product.category,
        name: product.name,
        imageUrl: product.imageUrl,
        quantity,
        unitPrice: product.price,
        lineTotal,
      });
    }

    const shippingFee = subtotal > 100 ? 0 : SHIPPING_FEE;
    const total = Number((subtotal + shippingFee).toFixed(2));

    const order = await Order.create({
      consumer: req.user.id,
      items: orderItems,
      subtotal: Number(subtotal.toFixed(2)),
      shippingFee,
      total,
      paymentMethod: req.body.paymentMethod || "card",
      shippingAddress: req.body.shippingAddress || {},
      status: "confirmed",
    });

    await Promise.all(
      orderItems.map((item) =>
        Product.updateOne(
          { _id: item.product },
          { $inc: { inventory: -item.quantity } },
        ),
      ),
    );

    return res.status(201).json({ success: true, data: serializeOrder(order) });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to create order." });
  }
};

const listConsumerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ consumer: req.user.id }).sort({
      createdAt: -1,
    });
    return res
      .status(200)
      .json({ success: true, data: orders.map(serializeOrder) });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch orders." });
  }
};

module.exports = {
  createOrder,
  listConsumerOrders,
};
