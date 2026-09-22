const Product = require("../../models/retailers/products");
const Order = require("../../models/consumers/orders");
const { SHIPPING_FEE, FREE_SHIPPING_THRESHOLD } = require("../../config/shipping");

const serializeOrder = (order) => ({
  id: order._id,
  status: order.status,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
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
    status: item.status,
    statusHistory: item.statusHistory,
  })),
});

// Atomically reserves stock for every line item before the order is created.
// Each reservation is a single-document conditional update (Mongo guarantees
// per-document atomicity without needing a replica-set transaction), so two
// concurrent checkouts against the same low-stock product can never both
// succeed. If any reservation fails, everything already reserved in this
// request is rolled back and the whole order is rejected.
const reserveStock = async (orderItems) => {
  const reserved = [];

  for (const item of orderItems) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.product, inventory: { $gte: item.quantity } },
      { $inc: { inventory: -item.quantity } },
      { new: true },
    );

    if (!updated) {
      await Promise.all(
        reserved.map((done) =>
          Product.updateOne({ _id: done.product }, { $inc: { inventory: done.quantity } }),
        ),
      );
      return { ok: false, productName: item.name };
    }

    reserved.push(item);
  }

  return { ok: true };
};

const createOrder = async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) {
      return res
        .status(400)
        .json({ success: false, message: "Order must contain at least one item." });
    }

    const productIds = items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds }, isActive: true });
    const productsMap = new Map(products.map((product) => [String(product._id), product]));

    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = productsMap.get(String(item.productId));
      const quantity = Number(item.quantity);

      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: `Product ${item.productId} was not found.` });
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "Each item must have a valid quantity." });
      }

      if (product.inventory < quantity) {
        return res
          .status(400)
          .json({ success: false, message: `${product.name} does not have enough stock.` });
      }

      const lineTotal = Number((product.finalPrice * quantity).toFixed(2));
      subtotal += lineTotal;
      orderItems.push({
        product: product._id,
        retailer: product.retailer,
        category: product.category,
        name: product.name,
        imageUrl: product.imageUrl,
        quantity,
        unitPrice: product.finalPrice,
        lineTotal,
      });
    }

    const reservation = await reserveStock(orderItems);
    if (!reservation.ok) {
      return res.status(409).json({
        success: false,
        message: `${reservation.productName} sold out while you were checking out. Please update your cart.`,
      });
    }

    const shippingFee = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const total = Number((subtotal + shippingFee).toFixed(2));
    const paymentMethod = req.body.paymentMethod === "mock-online" ? "mock-online" : "cod";

    const order = await Order.create({
      consumer: req.user.id,
      items: orderItems,
      subtotal: Number(subtotal.toFixed(2)),
      shippingFee,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === "mock-online" ? "paid" : "pending",
      shippingAddress: req.body.shippingAddress || {},
      status: "pending",
    });

    return res.status(201).json({ success: true, data: serializeOrder(order) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to create order." });
  }
};

const listConsumerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ consumer: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: orders.map(serializeOrder) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to fetch orders." });
  }
};

const getConsumerOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, consumer: req.user.id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    return res.status(200).json({ success: true, data: serializeOrder(order) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to fetch order." });
  }
};

const cancelOrderItem = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, consumer: req.user.id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const item = order.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Order item not found." });
    }

    if (!["pending", "accepted"].includes(item.status)) {
      return res.status(400).json({
        success: false,
        message: `This item can no longer be cancelled (status: ${item.status}).`,
      });
    }

    await Product.updateOne({ _id: item.product }, { $inc: { inventory: item.quantity } });

    item.status = "cancelled";
    item.statusHistory.push({
      status: "cancelled",
      changedBy: req.user.id,
      changedByRole: "consumer",
      at: new Date(),
    });

    order.recomputeStatus();
    await order.save();

    return res.status(200).json({ success: true, data: serializeOrder(order) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to cancel item." });
  }
};

const returnOrderItem = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, consumer: req.user.id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const item = order.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Order item not found." });
    }

    if (item.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Only delivered items can be returned.",
      });
    }

    item.status = "return_requested";
    item.statusHistory.push({
      status: "return_requested",
      changedBy: req.user.id,
      changedByRole: "consumer",
      note: req.body.reason || "",
      at: new Date(),
    });

    order.recomputeStatus();
    await order.save();

    return res.status(200).json({ success: true, data: serializeOrder(order) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to request return." });
  }
};

module.exports = {
  createOrder,
  listConsumerOrders,
  getConsumerOrder,
  cancelOrderItem,
  returnOrderItem,
};
