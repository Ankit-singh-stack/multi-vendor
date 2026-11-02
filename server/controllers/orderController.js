const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Address = require('../models/Address');
const Coupon = require('../models/Coupon');
const Commission = require('../models/Commission');
const Refund = require('../models/Refund');
const Payment = require('../models/Payment');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const generateOrderNumber = require('../utils/generateOrderNumber');
const { productPopulate } = require('./cartController');
const { buildOrderDraft, round, createCommissionsForOrder } = require('../services/orderService');
const { sendOrderConfirmation } = require('../services/emailService');

const getValidCoupon = async (code) => {
  if (!code) return null;
  const coupon = await Coupon.findOne({ code: String(code).toUpperCase(), isActive: true });
  if (!coupon) throw new ApiError(400, 'Invalid coupon code.');
  if (new Date(coupon.expiresAt) < new Date()) throw new ApiError(400, 'This coupon has expired.');
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, 'This coupon has reached its usage limit.');
  }
  return coupon;
};

const loadCheckoutCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate(productPopulate);
  if (!cart || !cart.items.length) throw new ApiError(400, 'Your cart is empty.');

  const valid = [];
  for (const item of cart.items) {
    const product = item.product;
    if (!product || product.status !== 'active') {
      throw new ApiError(400, 'One or more products in your cart are no longer available.');
    }
    if (product.stock < item.quantity) {
      throw new ApiError(400, `Only ${product.stock} unit(s) of "${product.name}" are available.`);
    }
    if (String(product.seller?._id || product.seller) === String(userId)) {
      throw new ApiError(400, 'You cannot purchase your own product.');
    }
    valid.push({ product, quantity: item.quantity });
  }
  return { cart, items: valid };
};

const previewOrder = asyncHandler(async (req, res) => {
  const { items } = await loadCheckoutCart(req.user._id);
  const coupon = await getValidCoupon(req.body.couponCode);
  const draft = await buildOrderDraft({ items, coupon });
  res.json({ success: true, ...draft, couponApplied: coupon ? coupon.code : null });
});

const reserveStock = async (items) => {
  const reserved = [];
  try {
    for (const item of items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product._id, status: 'active', stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updated) {
        throw new ApiError(400, `"${item.product.name}" is no longer available in the requested quantity.`);
      }
      reserved.push(item);
    }
  } catch (err) {
    await Promise.all(
      reserved.map((item) =>
        Product.updateOne({ _id: item.product._id }, { $inc: { stock: item.quantity } })
      )
    );
    throw err;
  }
};

const releaseStock = async (items) => {
  await Promise.all(
    items.map((item) =>
      Product.updateOne({ _id: item.product._id }, { $inc: { stock: item.quantity } }).catch(() => {})
    )
  );
};

const createOrder = asyncHandler(async (req, res) => {
  const { addressId, couponCode, paymentMethod = 'razorpay', customerNote = '' } = req.body;
  if (!addressId) throw new ApiError(400, 'Please select a delivery address.');
  if (!['razorpay', 'cod'].includes(paymentMethod)) throw new ApiError(400, 'Invalid payment method.');

  const address = await Address.findOne({ _id: addressId, user: req.user._id });
  if (!address) throw new ApiError(404, 'Delivery address not found.');

  const { cart, items } = await loadCheckoutCart(req.user._id);
  const coupon = await getValidCoupon(couponCode);
  const draft = await buildOrderDraft({ items, coupon });

  await reserveStock(items);

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    customer: req.user._id,
    subOrders: draft.subOrders,
    shippingAddress: {
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
    },
    pricing: draft.pricing,
    paymentMethod,
    paymentStatus: 'pending',
    status: paymentMethod === 'cod' ? 'Confirmed' : 'Pending',
    customerNote,
  });

  if (paymentMethod === 'cod') {
    order.subOrders.forEach((sub) => {
      sub.status = 'Confirmed';
      sub.tracking.push({ status: 'Confirmed', note: 'COD order confirmed.' });
    });
    await order.save();
    await Payment.create({
      order: order._id,
      user: req.user._id,
      amount: order.pricing.grandTotal,
      provider: 'cod',
      status: 'created',
      method: 'COD',
    });
    await createCommissionsForOrder(order);
  }

  cart.items = [];
  await cart.save();

  if (coupon) {
    coupon.usedCount += 1;
    await coupon.save();
  }

  await sendOrderConfirmation(req.user, order).catch(() => {});

  res.status(201).json({
    success: true,
    order,
    message:
      paymentMethod === 'cod'
        ? 'Order placed. Pay on delivery.'
        : 'Order created. Complete payment to confirm.',
  });
});

const getMyOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const filter = { customer: req.user._id };
  if (status && status !== 'all') filter.status = status;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort('-createdAt')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('subOrders.deliveryPartner', 'name phone'),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    orders,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'name email phone')
    .populate('subOrders.seller', 'name email phone')
    .populate('subOrders.deliveryPartner', 'name email phone')
    .populate('subOrders.store', 'name slug');

  if (!order) throw new ApiError(404, 'Order not found.');

  const userId = String(req.user._id);
  const isCustomer = String(order.customer?._id || order.customer) === userId;
  const isSeller = order.subOrders.some((s) => String(s.seller?._id || s.seller) === userId);
  const isDelivery = order.subOrders.some(
    (s) => s.deliveryPartner && String(s.deliveryPartner?._id || s.deliveryPartner) === userId
  );
  const isAdmin = req.user.role === 'admin';

  if (!isCustomer && !isSeller && !isDelivery && !isAdmin) {
    throw new ApiError(403, 'You are not allowed to view this order.');
  }

  if (isSeller && !isAdmin && !isCustomer) {
    order.subOrders = order.subOrders.filter((s) => String(s.seller?._id || s.seller) === userId);
  }
  if (isDelivery && !isAdmin && !isCustomer) {
    order.subOrders = order.subOrders.filter(
      (s) => s.deliveryPartner && String(s.deliveryPartner?._id || s.deliveryPartner) === userId
    );
  }

  const payment = await Payment.findOne({ order: order._id }).sort('-createdAt');
  const refunds = isAdmin || isCustomer ? await Refund.find({ order: order._id }) : [];

  res.json({ success: true, order, payment, refunds });
});

const trackOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id })
    .populate('subOrders.seller', 'name')
    .populate('subOrders.deliveryPartner', 'name phone');
  if (!order) throw new ApiError(404, 'Order not found.');

  res.json({
    success: true,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    shippingAddress: order.shippingAddress,
    createdAt: order.createdAt,
    subOrders: order.subOrders.map((sub) => ({
      _id: sub._id,
      storeName: sub.storeName,
      status: sub.status,
      tracking: sub.tracking,
      items: sub.items,
      deliveryPartner: sub.deliveryPartner,
    })),
  });
});

const sellerTransitions = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Processing', 'Cancelled'],
  Processing: ['Ready for Pickup', 'Cancelled'],
  'Ready for Pickup': [],
  Assigned: [],
  'Picked Up': [],
  'Out for Delivery': [],
};

const deliveryTransitions = {
  Assigned: ['Picked Up'],
  'Picked Up': ['Out for Delivery'],
  'Out for Delivery': ['Delivered'],
};

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { subOrderId, status, note = '' } = req.body;
  if (!subOrderId || !status) throw new ApiError(400, 'subOrderId and status are required.');
  if (!Order.STATUSES.includes(status)) throw new ApiError(400, 'Invalid order status.');

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found.');
  const sub = order.subOrders.id(subOrderId);
  if (!sub) throw new ApiError(404, 'Order item group not found.');

  const userId = String(req.user._id);
  if (req.user.role === 'seller') {
    if (String(sub.seller) !== userId) throw new ApiError(403, 'This order belongs to another seller.');
    if (!(sellerTransitions[sub.status] || []).includes(status)) {
      throw new ApiError(400, `Cannot change status from ${sub.status} to ${status}.`);
    }
  } else if (req.user.role === 'delivery') {
    if (!sub.deliveryPartner || String(sub.deliveryPartner) !== userId) {
      throw new ApiError(403, 'This delivery is not assigned to you.');
    }
    if (!(deliveryTransitions[sub.status] || []).includes(status)) {
      throw new ApiError(400, `Cannot change status from ${sub.status} to ${status}.`);
    }
  } else if (req.user.role !== 'admin') {
    throw new ApiError(403, 'You are not allowed to update order status.');
  }

  sub.status = status;
  sub.tracking.push({ status, note: note || `Status changed to ${status}.`, by: req.user._id });

  if (status === 'Delivered') {
    order.deliveredAt = new Date();
    for (const item of sub.items) {
      await Product.updateOne({ _id: item.product }, { $inc: { sold: item.quantity } }).catch(() => {});
    }
    if (sub.deliveryPartner) {
      const DeliveryPartnerProfile = require('../models/DeliveryPartnerProfile');
      await DeliveryPartnerProfile.findOneAndUpdate(
        { user: sub.deliveryPartner },
        { $inc: { totalDeliveries: 1, totalEarnings: sub.deliveryPartnerAmount } }
      );
    }
  }

  if (status === 'Cancelled') {
    await releaseStock(sub.items);
    if (order.paymentStatus === 'paid') {
      await Refund.create({
        order: order._id,
        subOrderId: sub._id,
        customer: order.customer,
        amount: round(sub.itemsTotal + sub.deliveryCharge),
        reason: 'Seller cancelled the order',
        status: 'pending',
      });
    }
  }

  order.recalculateStatus();
  await order.save();

  res.json({ success: true, order, message: `Order status updated to ${status}.` });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found.');

  const cancellable = ['Pending', 'Confirmed'];
  if (!order.subOrders.every((s) => cancellable.includes(s.status))) {
    throw new ApiError(400, 'This order can no longer be cancelled. Please request a return instead.');
  }

  for (const sub of order.subOrders) {
    sub.status = 'Cancelled';
    sub.tracking.push({ status: 'Cancelled', note: req.body.reason || 'Cancelled by customer.' });
    await releaseStock(sub.items);
  }
  order.status = 'Cancelled';
  order.cancelledAt = new Date();
  order.cancelReason = req.body.reason || 'Cancelled by customer';
  await order.recalculateStatus();
  await order.save();

  if (order.paymentStatus === 'paid') {
    await Refund.create({
      order: order._id,
      customer: req.user._id,
      amount: order.pricing.grandTotal,
      reason: req.body.reason || 'Order cancelled by customer',
      status: 'pending',
    });
  }

  res.json({ success: true, order, message: 'Order cancelled.' });
});

const requestRefund = asyncHandler(async (req, res) => {
  const { reason, subOrderId } = req.body;
  if (!reason) throw new ApiError(400, 'Please provide a reason for the refund request.');
  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found.');
  if (order.paymentStatus !== 'paid') throw new ApiError(400, 'Only paid orders can be refunded.');

  const sub = subOrderId ? order.subOrders.id(subOrderId) : null;
  if (sub && !['Delivered', 'Returned'].includes(sub.status)) {
    throw new ApiError(400, 'Refunds can be requested for delivered items only.');
  }
  const existing = await Refund.findOne({ order: order._id, status: { $in: ['pending', 'approved'] } });
  if (existing) throw new ApiError(400, 'A refund request is already open for this order.');

  const amount = sub
    ? round(sub.itemsTotal + sub.deliveryCharge)
    : round(order.subOrders.reduce((sum, s) => sum + s.itemsTotal + s.deliveryCharge, 0));

  const refund = await Refund.create({
    order: order._id,
    subOrderId: sub ? sub._id : null,
    customer: req.user._id,
    amount,
    reason,
    status: 'pending',
  });
  res.status(201).json({ success: true, refund, message: 'Refund request submitted.' });
});

const getMyRefunds = asyncHandler(async (req, res) => {
  const refunds = await Refund.find({ customer: req.user._id })
    .populate('order', 'orderNumber pricing status paymentStatus')
    .sort('-createdAt');
  res.json({ success: true, refunds });
});

module.exports = {
  previewOrder,
  createOrder,
  getMyOrders,
  getOrderById,
  trackOrder,
  updateOrderStatus,
  cancelOrder,
  requestRefund,
  getMyRefunds,
  getValidCoupon,
  reserveStock,
  releaseStock,
  createCommissionsForOrder,
};
