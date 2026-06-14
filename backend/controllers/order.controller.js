import mongoose from "mongoose";
import Order from "../models/order.model.js";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// @desc    Create order
// @route   POST /api/orders
export const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, paymentResult } = req.body;

  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product",
  );

  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest("Cart is empty");
  }

  let itemsPrice = 0;
  const orderItems = [];
  const stockUpdates = [];

  for (const item of cart.items) {
    const product = item.product;

    if (!product || !product.isActive) {
      throw ApiError.badRequest(
        `Product ${item.product?.name || item.product?._id || "unknown"} not available`,
      );
    }

    if (product.stock < item.quantity) {
      throw ApiError.badRequest(`Insufficient stock for ${product.name}`);
    }

    const price = product.price + (item.variant?.priceModifier || 0);
    itemsPrice += price * item.quantity;

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0]?.url,
      price,
      quantity: item.quantity,
      variant: item.variant,
    });

    stockUpdates.push({
      updateOne: {
        filter: { _id: product._id, stock: { $gte: item.quantity } },
        update: { $inc: { stock: -item.quantity, sold: item.quantity } },
      },
    });
  }

  const shippingPrice = itemsPrice > 50 ? 0 : 5; // Free shipping over $50
  const taxPrice = Number((itemsPrice * 0.1).toFixed(2)); // 10% tax
  const totalPrice = itemsPrice + shippingPrice + taxPrice;

  const session = await mongoose.startSession();
  let order;

  try {
    session.startTransaction();

    if (stockUpdates.length > 0) {
      const bulkResult = await Product.bulkWrite(stockUpdates, { session });

      if (bulkResult.modifiedCount !== stockUpdates.length) {
        throw ApiError.badRequest(
          "Some items are no longer available. Please check your cart and try again.",
        );
      }
    }

    order = (
      await Order.create(
        [
          {
            user: req.user._id,
            orderItems,
            shippingAddress,
            paymentMethod,
            paymentResult,
            itemsPrice,
            shippingPrice,
            taxPrice,
            totalPrice,
            isPaid:
              paymentMethod === "card" && paymentResult?.status === "success",
            paidAt:
              paymentMethod === "card" && paymentResult?.status === "success"
                ? Date.now()
                : undefined,
          },
        ],
        { session },
      )
    )[0];

    // Clear cart
    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();

    throw error;
  } finally {
    session.endSession();
  }

  // Create notification
  await Notification.create({
    user: req.user._id,
    title: "Order Placed Successfully",
    message: `Your order #${order._id.toString().slice(-6).toUpperCase()} has been placed.`,
    type: "order",
    data: { orderId: order._id },
  });

  // Create notifications for all admins
  const admins = await User.find({ role: "admin" });
  if (admins.length > 0) {
    const adminNotifications = admins.map((admin) => ({
      user: admin._id,
      title: "New Order Received",
      message: `A new order #${order._id.toString().slice(-6).toUpperCase()} has been placed for $${totalPrice.toFixed(2)}.`,
      type: "order",
      data: { orderId: order._id },
    }));
    await Notification.insertMany(adminNotifications);
  }

  res
    .status(201)
    .json(new ApiResponse(201, { order }, "Order placed successfully"));
});

// @desc    Get user orders
// @route   GET /api/orders
export const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const query = { user: req.user._id };
  if (status) query.status = status;

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Order.countDocuments(query);

  res.json(
    new ApiResponse(200, {
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    }),
  );
});

// @desc    Get single order
// @route   GET /api/orders/:id
export const getOrder = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.notFound("Order not found");
  }

  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email",
  );

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  // Check ownership (unless admin)
  if (
    order.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw ApiError.forbidden("Not authorized");
  }

  res.json(new ApiResponse(200, { order }));
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  if (order.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("Not authorized");
  }

  if (!["pending", "processing"].includes(order.status)) {
    throw ApiError.badRequest("Order cannot be cancelled");
  }

  // Restore stock
  const restoreUpdates = order.orderItems.map((item) => ({
    updateOne: {
      filter: { _id: item.product },
      update: { $inc: { stock: item.quantity, sold: -item.quantity } },
    },
  }));
  if (restoreUpdates.length > 0) {
    await Product.bulkWrite(restoreUpdates);
  }

  order.status = "cancelled";
  await order.save();

  // Create notification
  await Notification.create({
    user: req.user._id,
    title: "Order Cancelled",
    message: `Your order #${order._id.toString().slice(-6).toUpperCase()} has been cancelled.`,
    type: "order",
    data: { orderId: order._id },
  });

  res.json(new ApiResponse(200, { order }, "Order cancelled"));
});

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
export const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;

  const query = {};
  if (status) query.status = status;

  const orders = await Order.find(query)
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Order.countDocuments(query);

  res.json(
    new ApiResponse(200, {
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    }),
  );
});

// @desc    Update order status (Admin)
// @route   PUT /api/orders/admin/:id/status
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, trackingNumber } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  order.status = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (status === "delivered") order.deliveredAt = Date.now();

  await order.save();

  // Create notification for user
  const statusMessages = {
    processing: "Your order is being processed.",
    shipped: "Your order has been shipped!",
    delivered: "Your order has been delivered. Enjoy your purchase!",
    cancelled: "Your order has been cancelled by the administrator.",
  };

  await Notification.create({
    user: order.user,
    title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message:
      statusMessages[status] ||
      `Your order status has been updated to ${status}.`,
    type: "order",
    data: { orderId: order._id, status },
  });

  res.json(new ApiResponse(200, { order }, "Order status updated"));
});
