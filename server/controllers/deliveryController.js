const DeliveryPartnerProfile = require('../models/DeliveryPartnerProfile');
const Order = require('../models/Order');
const Commission = require('../models/Commission');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { round } = require('../services/orderService');

const registerDeliveryPartner = asyncHandler(async (req, res) => {
  if (req.user.role !== 'customer') {
    throw new ApiError(400, 'Only customer accounts can apply to become delivery partners.');
  }
  const existing = await DeliveryPartnerProfile.findOne({ user: req.user._id });
  if (existing) throw new ApiError(409, 'You already have a delivery partner application.');

  const { vehicleType, vehicleNumber, licenseNumber, serviceArea } = req.body;
  const profile = await DeliveryPartnerProfile.create({
    user: req.user._id,
    vehicleType: vehicleType || 'bike',
    vehicleNumber,
    licenseNumber,
    serviceArea,
    status: 'pending',
  });
  req.user.role = 'delivery';
  req.user.deliveryProfile = profile._id;
  await req.user.save();

  res.status(201).json({
    success: true,
    profile,
    message: 'Delivery partner application submitted for approval.',
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const profile = await DeliveryPartnerProfile.findOne({ user: req.user._id });
  res.json({ success: true, profile, user: req.user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const profile = await DeliveryPartnerProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, 'Delivery partner profile not found.');
  const fields = ['vehicleType', 'vehicleNumber', 'licenseNumber', 'serviceArea', 'isAvailable'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) profile[f] = req.body[f];
  });
  await profile.save();
  res.json({ success: true, profile, message: 'Profile updated.' });
});

const shapeDeliveryOrder = (order, sub) => ({
  orderId: order._id,
  orderNumber: order.orderNumber,
  subOrderId: sub._id,
  status: sub.status,
  storeName: sub.storeName,
  items: sub.items,
  itemsTotal: sub.itemsTotal,
  deliveryCharge: sub.deliveryCharge,
  deliveryPartnerAmount: sub.deliveryPartnerAmount,
  shippingAddress: order.shippingAddress,
  customer: order.customer,
  paymentStatus: order.paymentStatus,
  createdAt: order.createdAt,
  tracking: sub.tracking,
});

const getAssignedOrders = asyncHandler(async (req, res) => {
  const { history } = req.query;
  const filter = { 'subOrders.deliveryPartner': req.user._id };
  if (history === 'true') {
    filter['subOrders.status'] = { $in: ['Delivered', 'Cancelled', 'Refunded', 'Returned'] };
  } else {
    filter['subOrders.status'] = { $nin: ['Delivered', 'Cancelled', 'Refunded', 'Returned'] };
  }

  const orders = await Order.find(filter)
    .sort('-createdAt')
    .populate('customer', 'name email')
    .populate('subOrders.seller', 'name');

  const list = [];
  orders.forEach((order) => {
    order.subOrders
      .filter(
        (s) =>
          s.deliveryPartner &&
          String(s.deliveryPartner) === String(req.user._id) &&
          (history === 'true'
            ? ['Delivered', 'Cancelled', 'Refunded', 'Returned'].includes(s.status)
            : !['Delivered', 'Cancelled', 'Refunded', 'Returned'].includes(s.status))
      )
      .forEach((sub) => list.push(shapeDeliveryOrder(order, sub)));
  });

  res.json({ success: true, orders: list });
});

const getDeliveryOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'name email phone')
    .populate('subOrders.seller', 'name email phone');
  if (!order) throw new ApiError(404, 'Order not found.');
  const sub = order.subOrders.find(
    (s) =>
      s.deliveryPartner &&
      String(s.deliveryPartner) === String(req.user._id) &&
      (!req.query.subOrderId || String(s._id) === String(req.query.subOrderId))
  );
  if (!sub) throw new ApiError(403, 'This delivery is not assigned to you.');
  res.json({ success: true, delivery: shapeDeliveryOrder(order, sub) });
});

const acceptAssignment = asyncHandler(async (req, res) => {
  const { subOrderId } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found.');
  const sub = order.subOrders.id(subOrderId);
  if (!sub || !sub.deliveryPartner || String(sub.deliveryPartner) !== String(req.user._id)) {
    throw new ApiError(403, 'This delivery is not assigned to you.');
  }
  sub.tracking.push({
    status: sub.status,
    note: 'Delivery partner accepted the assignment.',
    by: req.user._id,
  });
  await order.save();
  res.json({ success: true, message: 'Assignment accepted.' });
});

const getEarnings = asyncHandler(async (req, res) => {
  const commissions = await Commission.find({ deliveryPartner: req.user._id })
    .populate('order', 'orderNumber createdAt')
    .sort('-createdAt');

  const stats = commissions.reduce(
    (acc, c) => {
      acc.total += c.deliveryPartnerAmount;
      if (c.deliveryPayoutStatus === 'settled') acc.settled += c.deliveryPartnerAmount;
      else acc.pending += c.deliveryPartnerAmount;
      return acc;
    },
    { total: 0, settled: 0, pending: 0 }
  );
  Object.keys(stats).forEach((k) => (stats[k] = round(stats[k])));

  const monthly = {};
  commissions.forEach((c) => {
    const key = new Date(c.createdAt).toISOString().slice(0, 7);
    if (!monthly[key]) monthly[key] = { month: key, earnings: 0, deliveries: 0 };
    monthly[key].earnings += c.deliveryPartnerAmount;
    monthly[key].deliveries += 1;
  });

  const profile = await DeliveryPartnerProfile.findOne({ user: req.user._id });
  res.json({
    success: true,
    stats: {
      ...stats,
      totalDeliveries: profile?.totalDeliveries || 0,
      completedFromCommissions: commissions.length,
    },
    commissions,
    history: commissions.filter((c) => c.deliveryPayoutStatus === 'settled'),
    monthly: Object.values(monthly)
      .map((m) => ({ ...m, earnings: round(m.earnings) }))
      .sort((a, b) => a.month.localeCompare(b.month)),
  });
});

const getDashboard = asyncHandler(async (req, res) => {
  const profile = await DeliveryPartnerProfile.findOne({ user: req.user._id });
  const [activeOrders, deliveredCount, commissions] = await Promise.all([
    Order.find({
      'subOrders.deliveryPartner': req.user._id,
      'subOrders.status': {
        $nin: ['Delivered', 'Cancelled', 'Refunded', 'Returned'],
      },
    })
      .sort('-createdAt')
      .limit(5)
      .populate('customer', 'name'),
    Order.countDocuments({
      'subOrders': {
        $elemMatch: { deliveryPartner: req.user._id, status: 'Delivered' },
      },
    }),
    Commission.find({ deliveryPartner: req.user._id }),
  ]);

  const active = [];
  activeOrders.forEach((order) => {
    order.subOrders
      .filter(
        (s) =>
          s.deliveryPartner &&
          String(s.deliveryPartner) === String(req.user._id) &&
          !['Delivered', 'Cancelled', 'Refunded', 'Returned'].includes(s.status)
      )
      .forEach((sub) => active.push(shapeDeliveryOrder(order, sub)));
  });

  const earnings = commissions.reduce((sum, c) => sum + c.deliveryPartnerAmount, 0);
  const pendingEarnings = commissions
    .filter((c) => c.deliveryPayoutStatus === 'pending')
    .reduce((sum, c) => sum + c.deliveryPartnerAmount, 0);

  res.json({
    success: true,
    profile,
    stats: {
      activeDeliveries: active.length,
      completedDeliveries: profile?.totalDeliveries || deliveredCount,
      totalEarnings: round(earnings),
      pendingEarnings: round(pendingEarnings),
      settledEarnings: round(earnings - pendingEarnings),
    },
    activeOrders: active,
  });
});

module.exports = {
  registerDeliveryPartner,
  getProfile,
  updateProfile,
  getAssignedOrders,
  getDeliveryOrder,
  acceptAssignment,
  getEarnings,
  getDashboard,
};
