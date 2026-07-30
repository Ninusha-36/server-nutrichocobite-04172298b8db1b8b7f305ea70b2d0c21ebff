const Order = require("../models/order");
const Cart = require("../models/cart");

const confirmOrder = async (req, res, next) => {
  const { user_id, address_id, payment_method } = req.body;

  let cartItems;

  try {
    cartItems = await Cart.find({ user_id });
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Fetching cart failed, please try again.",
    });
  }

  if (!cartItems || cartItems.length === 0) {
    return res.status(404).json({
      status: "SS_03",
      message: "Cart is empty.",
    });
  }

  let subtotal = 0;

  const products = cartItems.map((item) => {
    const total = Number(item.price) * Number(item.quantity);

    subtotal += total;

    return {
      product_id: item.product_id,
      product_name: item.product_name,
      size: item.size,
      quantity: item.quantity,
      price: Number(item.price),
      total,
    };
  });

  const delivery_charge = 0;
  const discount = 0;
  const grand_total = subtotal + delivery_charge - discount;

  const createdOrder = new Order({
    user_id,
    products,
    address_id,
    payment_method,
    payment_status: payment_method === "COD" ? "Pending" : "Paid",
    order_status: "Pending",
    subtotal,
    delivery_charge,
    discount,
    grand_total,
  });

  try {
    await createdOrder.save();

    // Clear user's cart
    await Cart.deleteMany({ user_id });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: "SS_03",
      message: "Order confirmation failed, please try again.",
    });
  }

  return res.status(201).json({
    status: "SS_02",
    message: "Order placed successfully.",
    order: createdOrder.toObject({ getters: true }),
  });
};

const getOrdersByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let orders;

  try {
    orders = await Order.find({ user_id: userId }).sort({
      createdAt: -1,
    });
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Fetching orders failed, please try again later.",
    });
  }

  if (!orders || orders.length === 0) {
    return res.status(404).json({
      status: "SS_03",
      message: "No orders found for this user.",
      orders: [],
    });
  }

  return res.json({
    status: "SS_01",
    message: "Orders fetched successfully.",
    orders: orders.map((order) => order.toObject({ getters: true })),
  });
};

const cancelOrder = async (req, res, next) => {
  const orderId = req.params.oid;

  let order;

  try {
    order = await Order.findById(orderId);
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Failed to fetch order, please try again later.",
    });
  }

  if (!order) {
    return res.status(404).json({
      status: "SS_03",
      message: "Order not found.",
    });
  }

  if (order.order_status === "Cancelled") {
    return res.status(400).json({
      status: "SS_03",
      message: "Order is already cancelled.",
    });
  }

  if (order.order_status === "Delivered") {
    return res.status(400).json({
      status: "SS_03",
      message: "Delivered orders cannot be cancelled.",
    });
  }

  order.order_status = "Cancelled";
  order.cancelled_at = new Date();

  try {
    await order.save();
  } catch (err) {
    return res.status(500).json({
      status: "SS_03",
      message: "Cancelling order failed, please try again.",
    });
  }

  return res.status(200).json({
    status: "SS_04",
    message: "Order cancelled successfully.",
    order: order.toObject({ getters: true }),
  });
};

exports.confirmOrder = confirmOrder;
exports.getOrdersByUserId = getOrdersByUserId;
exports.cancelOrder = cancelOrder;