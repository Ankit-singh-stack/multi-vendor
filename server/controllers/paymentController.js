const Order = require('../models/Order');
const Payment = require('../models/Payment');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  isRazorpayConfigured,
  createProviderOrder,
  verifySignature,
  verifyWebhookSignature,
} = require('../services/paymentService');
const { createCommissionsForOrder } = require('../services/orderService');
const { sendOrderConfirmation } = require('../services/emailService');

const markOrderPaid = async (order, payment, paymentId, method = '') => {
  if (order.paymentStatus === 'paid') return order;

  payment.status = 'paid';
  payment.providerPaymentId = paymentId || payment.providerPaymentId;
  payment.method = method || payment.method;
  payment.paidAt = new Date();
  await payment.save();

  order.paymentStatus = 'paid';
  order.payment = payment._id;
  if (order.status === 'Pending') order.status = 'Confirmed';
  order.subOrders.forEach((sub) => {
    if (sub.status === 'Pending') {
      sub.status = 'Confirmed';
      sub.tracking.push({
        status: 'Confirmed',
        note: 'Payment verified. Order sent to seller.',
      });
    }
  });
  order.recalculateStatus();
  await order.save();

  await createCommissionsForOrder(order);
  return order;
};

const createPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) throw new ApiError(400, 'Order ID is required.');

  const order = await Order.findOne({ _id: orderId, customer: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found.');
  if (order.status === 'Cancelled') throw new ApiError(400, 'Cancelled orders cannot be paid.');
  if (order.paymentStatus === 'paid') throw new ApiError(400, 'This order is already paid.');
  if (order.paymentMethod === 'cod') throw new ApiError(400, 'This order is set for cash on delivery.');

  const providerOrder = await createProviderOrder(order.pricing.grandTotal, order.orderNumber);

  const payment = await Payment.create({
    order: order._id,
    user: req.user._id,
    amount: order.pricing.grandTotal,
    providerOrderId: providerOrder.id,
    status: 'created',
    isDemo: Boolean(providerOrder.demo),
  });

  order.payment = payment._id;
  await order.save();

  res.status(201).json({
    success: true,
    payment: {
      _id: payment._id,
      amount: payment.amount,
      currency: payment.currency,
      providerOrderId: payment.providerOrderId,
      isDemo: payment.isDemo,
    },
    razorpay: {
      keyId: process.env.RAZORPAY_KEY_ID || '',
      orderId: providerOrder.id,
      amount: Math.round(order.pricing.grandTotal * 100),
      currency: 'INR',
      name: 'MarketSphere',
      description: `Order ${order.orderNumber}`,
      demo: Boolean(providerOrder.demo),
    },
  });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!orderId || !razorpay_order_id || !razorpay_payment_id) {
    throw new ApiError(400, 'Payment verification details are incomplete.');
  }

  const order = await Order.findOne({ _id: orderId, customer: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found.');

  const payment = await Payment.findOne({ order: order._id, providerOrderId: razorpay_order_id }).sort(
    '-createdAt'
  );
  if (!payment) throw new ApiError(404, 'Payment record not found.');

  const valid = verifySignature({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    signature: razorpay_signature,
    demo: payment.isDemo,
  });
  if (!valid) {
    payment.status = 'failed';
    payment.failureReason = 'Signature verification failed';
    await payment.save();
    throw new ApiError(400, 'Payment verification failed. Please contact support if money was debited.');
  }

  await markOrderPaid(order, payment, razorpay_payment_id, req.body.method || 'razorpay');
  await sendOrderConfirmation(req.user, order).catch(() => {});

  res.json({ success: true, message: 'Payment verified successfully.', order });
});

const markPaymentFailed = asyncHandler(async (req, res) => {
  const { orderId, reason = 'Payment cancelled or failed' } = req.body;
  const order = await Order.findOne({ _id: orderId, customer: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found.');

  await Payment.updateMany(
    { order: order._id, status: 'created' },
    { status: 'failed', failureReason: reason }
  );
  res.json({
    success: true,
    message: 'Payment marked as failed. You can retry payment from your orders page.',
  });
});

const razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const raw = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);

  if (process.env.RAZORPAY_WEBHOOK_SECRET && !verifyWebhookSignature(raw, signature)) {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
  }

  const event = req.body.event;
  const entity = req.body.payload?.payment?.entity;
  if (!entity) return res.json({ success: true });

  if (['payment.captured', 'order.paid'].includes(event)) {
    const payment = await Payment.findOne({ providerOrderId: entity.order_id }).sort('-createdAt');
    if (payment && payment.status !== 'paid') {
      const order = await Order.findById(payment.order);
      if (order) await markOrderPaid(order, payment, entity.id, entity.method);
    }
  } else if (event === 'payment.failed') {
    const payment = await Payment.findOne({ providerOrderId: entity.order_id }).sort('-createdAt');
    if (payment && payment.status === 'created') {
      payment.status = 'failed';
      payment.failureReason = entity.error_description || 'Payment failed';
      await payment.save();
    }
  }

  res.json({ success: true });
});

const getPaymentByOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.orderId, customer: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found.');
  const payments = await Payment.find({ order: order._id }).sort('-createdAt');
  res.json({ success: true, payments });
});

module.exports = {
  createPayment,
  verifyPayment,
  markPaymentFailed,
  razorpayWebhook,
  getPaymentByOrder,
  markOrderPaid,
  isRazorpayConfigured: asyncHandler(async (req, res) => {
    res.json({ success: true, enabled: isRazorpayConfigured() });
  }),
};
