const Order = require("../../models/consumers/orders");
const Product = require("../../models/retailers/products");

// Valid next statuses a retailer can move an item to, keyed by current status.
const TRANSITIONS = {
  pending: ["accepted", "declined"],
  accepted: ["dispatched", "cancelled"],
  dispatched: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  return_requested: ["returned"],
};

const serializeOrderForRetailer = (order, retailerId) => ({
  id: order._id,
  status: order.status,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  shippingAddress: order.shippingAddress,
  createdAt: order.createdAt,
  items: order.items
    .filter((item) => String(item.retailer) === String(retailerId))
    .map((item) => ({
      id: item._id,
      productId: item.product,
      name: item.name,
      imageUrl: item.imageUrl,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      status: item.status,
      statusHistory: item.statusHistory,
    })),
});

const listRetailerOrders = async (req, res) => {
  try {
    const retailerId = req.user.retailerId;
    const filter = { "items.retailer": retailerId };

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    let scoped = orders.map((order) => serializeOrderForRetailer(order, retailerId));

    if (req.query.status) {
      scoped = scoped.filter((order) =>
        order.items.some((item) => item.status === req.query.status),
      );
    }

    return res.status(200).json({ success: true, data: scoped });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to fetch orders." });
  }
};

const getRetailerOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const hasOwnItems = order.items.some(
      (item) => String(item.retailer) === String(req.user.retailerId),
    );
    if (!hasOwnItems) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    return res
      .status(200)
      .json({ success: true, data: serializeOrderForRetailer(order, req.user.retailerId) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to fetch order." });
  }
};

const updateOrderItemStatus = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { status: nextStatus, note } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const item = order.items.id(itemId);
    if (!item || String(item.retailer) !== String(req.user.retailerId)) {
      return res.status(404).json({ success: false, message: "Order item not found." });
    }

    const allowedNextStatuses = TRANSITIONS[item.status] || [];
    if (!allowedNextStatuses.includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot move an item from "${item.status}" to "${nextStatus}".`,
      });
    }

    if (nextStatus === "declined" || nextStatus === "cancelled") {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { inventory: item.quantity } },
      );
    }

    item.status = nextStatus;
    item.statusHistory.push({
      status: nextStatus,
      changedBy: req.user.id,
      changedByRole: req.user.staffRole,
      note: note || "",
      at: new Date(),
    });

    if (nextStatus === "delivered") {
      order.paymentStatus = "paid";
    }

    order.recomputeStatus();
    await order.save();

    return res
      .status(200)
      .json({ success: true, data: serializeOrderForRetailer(order, req.user.retailerId) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to update order status." });
  }
};

module.exports = { listRetailerOrders, getRetailerOrder, updateOrderItemStatus };
