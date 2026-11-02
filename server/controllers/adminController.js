const User = require('../models/User');
const SellerProfile = require('../models/SellerProfile');
const DeliveryPartnerProfile = require('../models/DeliveryPartnerProfile');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const Commission = require('../models/Commission');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getMarketplaceSettings } = require('../utils/settings');
const { sendSellerApproval } = require('../services/emailService');
const { round } = require('../services/orderService');

const paginate = (query) => {
  const pageNum = Math.max(1, Number(query.page || 1));
  const limitNum = Math.min(100, Math.max(1, Number(query.limit || 20)));
  return { pageNum, limitNum, skip: (pageNum - 1) * limitNum };
};

const getDashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalCustomers,
    totalSellers,
    pendingSellers,
    totalDelivery,
    pendingDelivery,
    totalProducts,
    totalOrders,
    pendingRefunds,
    paidOrders,
    pendingCommissions,
  ] = await Promise.all([
    User.countDocuments({ role: { $ne: 'admin' } }),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'seller' }),
    SellerProfile.countDocuments({ status: 'pending' }),
    User.countDocuments({ role: 'delivery' }),
    DeliveryPartnerProfile.countDocuments({ status: 'pending' }),
    Product.countDocuments(),
    Order.countDocuments(),
    Refund.countDocuments({ status: 'pending' }),
    Order.find({ paymentStatus: 'paid' }).select('pricing'),
    Commission.aggregate([
      { $group: { _id: null, commission: { $sum: '$commissionAmount' }, sellerPayable: { $sum: '$sellerAmount' } } },
    ]),
  ]);

  const totalRevenue = round(paidOrders.reduce((sum, o) => sum + o.pricing.grandTotal, 0));
  const commissionRevenue = round(pendingCommissions[0]?.commission || 0);
  const sellerPayable = round(pendingCommissions[0]?.sellerPayable || 0);

  const since = new Date();
  since.setMonth(since.getMonth() - 5);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const monthlyAgg = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, paymentStatus: 'paid' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        revenue: { $sum: '$pricing.grandTotal' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const statusAgg = await Order.aggregate([{ $group: { _id: '$status', value: { $sum: 1 } } }]);
  const recentOrders = await Order.find()
    .sort('-createdAt')
    .limit(8)
    .populate('customer', 'name email');

  const topSellers = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $unwind: '$subOrders' },
    { $match: { 'subOrders.status': 'Delivered' } },
    {
      $group: {
        _id: '$subOrders.seller',
        sales: { $sum: '$subOrders.itemsTotal' },
        orders: { $sum: 1 },
        commission: { $sum: '$subOrders.commissionAmount' },
      },
    },
    { $sort: { sales: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'seller' } },
    { $unwind: '$seller' },
    { $project: { sales: 1, orders: 1, commission: 1, 'seller.name': 1, 'seller.email': 1 } },
  ]);

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalCustomers,
      totalSellers,
      pendingSellers,
      totalDelivery,
      pendingDelivery,
      totalProducts,
      totalOrders,
      pendingRefunds,
      totalRevenue,
      commissionRevenue,
      sellerPayable,
      monthlyOrders: monthlyAgg.reduce((s, m) => s + m.orders, 0),
    },
    monthlyRevenue: monthlyAgg.map((m) => ({ month: m._id, revenue: round(m.revenue), orders: m.orders })),
    statusCounts: statusAgg.map((s) => ({ name: s._id, value: s.value })),
    recentOrders,
    topSellers,
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const { role, q, isActive } = req.query;
  const { pageNum, limitNum, skip } = paginate(req.query);
  const filter = {};
  if (role && role !== 'all') filter.role = role;
  if (isActive !== undefined && isActive !== '') filter.isActive = isActive === 'true';
  if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];

  const [users, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip(skip).limit(limitNum),
    User.countDocuments(filter),
  ]);
  res.json({
    success: true,
    users,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const setUserStatus = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot change your own account status.');
  }
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  if (user.role === 'admin') throw new ApiError(403, 'Admin accounts cannot be modified here.');
  user.isActive = Boolean(req.body.isActive);
  await user.save();
  res.json({ success: true, user, message: `User ${user.isActive ? 'enabled' : 'disabled'}.` });
});

const getSellers = asyncHandler(async (req, res) => {
  const { status, q } = req.query;
  const { pageNum, limitNum, skip } = paginate(req.query);
  const filter = {};
  if (status && status !== 'all') filter.status = status;

  let profiles = await SellerProfile.find(filter)
    .populate('user', 'name email phone isActive createdAt')
    .sort('-createdAt');

  if (q) {
    const rx = new RegExp(q, 'i');
    profiles = profiles.filter(
      (p) => rx.test(p.businessName) || rx.test(p.user?.name || '') || rx.test(p.user?.email || '')
    );
  }

  const total = profiles.length;
  const pageItems = profiles.slice(skip, skip + limitNum);

  const enriched = await Promise.all(
    pageItems.map(async (p) => {
      const [products, store, sales] = await Promise.all([
        Product.countDocuments({ seller: p.user?._id }),
        Store.findOne({ seller: p.user?._id }),
        Order.aggregate([
          { $match: { paymentStatus: 'paid' } },
          { $unwind: '$subOrders' },
          { $match: { 'subOrders.seller': p.user?._id, 'subOrders.status': 'Delivered' } },
          { $group: { _id: null, total: { $sum: '$subOrders.itemsTotal' } } },
        ]),
      ]);
      return {
        ...p.toJSON(),
        productCount: products,
        store,
        totalSales: round(sales[0]?.total || 0),
      };
    })
  );

  res.json({
    success: true,
    sellers: enriched,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const reviewSeller = asyncHandler(async (req, res) => {
  const { status = 'approved', reason = '', commissionRate } = req.body;
  if (!['approved', 'rejected', 'suspended', 'pending'].includes(status)) {
    throw new ApiError(400, 'Invalid seller status.');
  }
  const profile = await SellerProfile.findById(req.params.id).populate('user', 'name email');
  if (!profile) throw new ApiError(404, 'Seller profile not found.');

  profile.status = status;
  profile.rejectionReason = status === 'rejected' ? reason : '';
  if (status === 'approved') profile.approvedAt = new Date();
  if (commissionRate !== undefined) {
    const rate = Number(commissionRate);
    if (Number.isNaN(rate) || rate < 0 || rate > 100) throw new ApiError(400, 'Invalid commission rate.');
    profile.commissionRate = rate;
  }
  await profile.save();

  await Store.findOneAndUpdate(
    { seller: profile.user._id },
    { isActive: status === 'approved' },
    { new: true }
  );

  if (profile.user?.email && status !== 'pending') {
    sendSellerApproval(profile.user, status === 'approved').catch(() => {});
  }

  res.json({ success: true, seller: profile, message: `Seller ${status}.` });
});

const getAdminProducts = asyncHandler(async (req, res) => {
  const { q, status, category, seller } = req.query;
  const { pageNum, limitNum, skip } = paginate(req.query);
  const filter = {};
  if (q) filter.name = new RegExp(q, 'i');
  if (status && status !== 'all') filter.status = status;
  if (category) filter.category = category;
  if (seller) filter.seller = seller;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name')
      .populate('seller', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);
  res.json({
    success: true,
    products,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const getAdminOrders = asyncHandler(async (req, res) => {
  const { status, paymentStatus, q } = req.query;
  const { pageNum, limitNum, skip } = paginate(req.query);
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (paymentStatus && paymentStatus !== 'all') filter.paymentStatus = paymentStatus;
  if (q) filter.orderNumber = new RegExp(q, 'i');

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('customer', 'name email phone')
      .populate('subOrders.seller', 'name')
      .populate('subOrders.deliveryPartner', 'name phone')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum),
    Order.countDocuments(filter),
  ]);
  res.json({
    success: true,
    orders,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const assignDeliveryPartner = asyncHandler(async (req, res) => {
  const { subOrderId, deliveryPartnerId } = req.body;
  if (!subOrderId || !deliveryPartnerId) {
    throw new ApiError(400, 'subOrderId and deliveryPartnerId are required.');
  }
  const partner = await DeliveryPartnerProfile.findOne({
    user: deliveryPartnerId,
    status: 'approved',
  }).populate('user', 'name phone isActive');
  if (!partner) throw new ApiError(404, 'Approved delivery partner not found.');

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found.');
  const sub = order.subOrders.id(subOrderId);
  if (!sub) throw new ApiError(404, 'Order item group not found.');
  if (['Delivered', 'Cancelled', 'Refunded', 'Returned'].includes(sub.status)) {
    throw new ApiError(400, 'This order group can no longer be assigned.');
  }

  sub.deliveryPartner = deliveryPartnerId;
  sub.status = 'Assigned';
  sub.tracking.push({
    status: 'Assigned',
    note: `Delivery assigned to ${partner.user?.name || 'partner'}.`,
    by: req.user._id,
  });
  order.recalculateStatus();
  await order.save();

  await Commission.findOneAndUpdate(
    { order: order._id, subOrderId: sub._id },
    { deliveryPartner: deliveryPartnerId, deliveryPartnerAmount: sub.deliveryPartnerAmount }
  );

  res.json({ success: true, order, message: 'Delivery partner assigned.' });
});

const getPayments = asyncHandler(async (req, res) => {
  const { status, q } = req.query;
  const { pageNum, limitNum, skip } = paginate(req.query);
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (q) filter.providerPaymentId = new RegExp(q, 'i');

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('order', 'orderNumber status paymentStatus pricing')
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum),
    Payment.countDocuments(filter),
  ]);
  res.json({
    success: true,
    payments,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const getRefunds = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  const refunds = await Refund.find(filter)
    .populate('order', 'orderNumber pricing status paymentStatus')
    .populate('customer', 'name email')
    .sort('-createdAt');
  res.json({ success: true, refunds });
});

const updateRefund = asyncHandler(async (req, res) => {
  const { status, adminNote = '' } = req.body;
  if (!['approved', 'rejected', 'processed', 'pending'].includes(status)) {
    throw new ApiError(400, 'Invalid refund status.');
  }
  const refund = await Refund.findById(req.params.id).populate('order');
  if (!refund) throw new ApiError(404, 'Refund not found.');

  refund.status = status;
  refund.adminNote = adminNote;
  if (['processed', 'rejected'].includes(status)) refund.processedAt = new Date();
  await refund.save();

  if (status === 'processed' && refund.order) {
    const order = await Order.findById(refund.order._id || refund.order);
    if (order) {
      if (refund.subOrderId) {
        const sub = order.subOrders.id(refund.subOrderId);
        if (sub) {
          sub.status = 'Refunded';
          sub.tracking.push({ status: 'Refunded', note: adminNote || 'Refund processed.' });
        }
        await Commission.updateMany(
          { order: order._id, subOrderId: refund.subOrderId },
          { sellerPayoutStatus: 'settled', deliveryPayoutStatus: 'settled' }
        );
      } else {
        order.subOrders.forEach((s) => {
          if (s.status !== 'Cancelled') s.status = 'Refunded';
        });
        order.paymentStatus = 'refunded';
        await Commission.updateMany(
          { order: order._id },
          { sellerPayoutStatus: 'settled', deliveryPayoutStatus: 'settled' }
        );
      }
      if (!refund.subOrderId) order.paymentStatus = 'refunded';
      order.recalculateStatus();
      await order.save();
      await Payment.updateMany({ order: order._id, status: 'paid' }, { status: 'refunded' });
    }
  }

  res.json({
    success: true,
    refund,
    message:
      status === 'processed'
        ? 'Refund marked processed. Complete the actual transfer through your payment provider.'
        : `Refund ${status}.`,
  });
});

const getDeliveryPartners = asyncHandler(async (req, res) => {
  const { status, q } = req.query;
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  let partners = await DeliveryPartnerProfile.find(filter)
    .populate('user', 'name email phone isActive createdAt')
    .sort('-createdAt');
  if (q) {
    const rx = new RegExp(q, 'i');
    partners = partners.filter(
      (p) => rx.test(p.user?.name || '') || rx.test(p.user?.email || '') || rx.test(p.user?.phone || '')
    );
  }
  res.json({ success: true, partners });
});

const reviewDeliveryPartner = asyncHandler(async (req, res) => {
  const { status = 'approved', reason = '' } = req.body;
  if (!['approved', 'rejected', 'suspended', 'pending'].includes(status)) {
    throw new ApiError(400, 'Invalid delivery partner status.');
  }
  const profile = await DeliveryPartnerProfile.findById(req.params.id);
  if (!profile) throw new ApiError(404, 'Delivery partner profile not found.');
  profile.status = status;
  profile.rejectionReason = status === 'rejected' ? reason : '';
  if (status === 'approved') profile.approvedAt = new Date();
  await profile.save();
  res.json({ success: true, partner: profile, message: `Delivery partner ${status}.` });
});

const getCommissions = asyncHandler(async (req, res) => {
  const { sellerPayoutStatus, deliveryPayoutStatus } = req.query;
  const filter = {};
  if (sellerPayoutStatus && sellerPayoutStatus !== 'all') filter.sellerPayoutStatus = sellerPayoutStatus;
  if (deliveryPayoutStatus && deliveryPayoutStatus !== 'all') {
    filter.deliveryPayoutStatus = deliveryPayoutStatus;
  }
  const commissions = await Commission.find(filter)
    .populate('order', 'orderNumber createdAt paymentStatus')
    .populate('seller', 'name email')
    .populate('deliveryPartner', 'name email')
    .sort('-createdAt');
  const totals = commissions.reduce(
    (acc, c) => {
      acc.commission += c.commissionAmount;
      acc.sellerPayable += c.sellerAmount;
      acc.deliveryPayable += c.deliveryPartnerAmount;
      if (c.sellerPayoutStatus === 'pending') acc.sellerPending += c.sellerAmount;
      if (c.deliveryPayoutStatus === 'pending') acc.deliveryPending += c.deliveryPartnerAmount;
      return acc;
    },
    { commission: 0, sellerPayable: 0, deliveryPayable: 0, sellerPending: 0, deliveryPending: 0 }
  );
  Object.keys(totals).forEach((k) => {
    totals[k] = round(totals[k]);
  });
  res.json({ success: true, commissions, totals });
});

const settleCommission = asyncHandler(async (req, res) => {
  const { type = 'seller' } = req.body;
  const commission = await Commission.findById(req.params.id);
  if (!commission) throw new ApiError(404, 'Commission record not found.');
  if (type === 'delivery') {
    if (!commission.deliveryPartner) throw new ApiError(400, 'No delivery partner on this record.');
    commission.deliveryPayoutStatus = 'settled';
  } else {
    commission.sellerPayoutStatus = 'settled';
  }
  commission.settledAt = new Date();
  await commission.save();
  res.json({ success: true, commission, message: 'Payout marked as settled (manual settlement).' });
});

const getSettings = asyncHandler(async (req, res) => {
  const settings = await getMarketplaceSettings();
  res.json({ success: true, settings });
});

const updateSettings = asyncHandler(async (req, res) => {
  const Setting = require('../models/Setting');
  const allowed = ['commissionRate', 'deliveryCharge', 'taxRate', 'freeDeliveryAbove', 'platformName'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] === undefined) continue;
    if (key === 'platformName') {
      updates[key] = String(req.body[key]);
    } else {
      const value = Number(req.body[key]);
      if (Number.isNaN(value) || value < 0) throw new ApiError(400, `Invalid value for ${key}.`);
      if (key === 'commissionRate' && value > 100) throw new ApiError(400, 'Commission cannot exceed 100%.');
      updates[key] = value;
    }
  }
  await Promise.all(
    Object.entries(updates).map(([key, value]) =>
      Setting.findOneAndUpdate(
        { key },
        { key, value, description: `Marketplace ${key}` },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );
  const settings = await getMarketplaceSettings();
  res.json({ success: true, settings, message: 'Marketplace settings updated.' });
});

const getAnalytics = asyncHandler(async (req, res) => {
  const paidOrders = await Order.find({ paymentStatus: 'paid' });
  const revenue = round(paidOrders.reduce((s, o) => s + o.pricing.grandTotal, 0));
  const refunds = await Refund.find({ status: 'processed' });
  const refundTotal = round(refunds.reduce((s, r) => s + r.amount, 0));

  const since = new Date();
  since.setMonth(since.getMonth() - 7);
  const monthly = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, paymentStatus: 'paid' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        revenue: { $sum: '$pricing.grandTotal' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const topProducts = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $unwind: '$subOrders' },
    { $unwind: '$subOrders.items' },
    {
      $group: {
        _id: '$subOrders.items.product',
        name: { $first: '$subOrders.items.name' },
        quantity: { $sum: '$subOrders.items.quantity' },
        revenue: { $sum: '$subOrders.items.subtotal' },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 8 },
  ]);

  const topSellers = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $unwind: '$subOrders' },
    {
      $group: {
        _id: '$subOrders.seller',
        revenue: { $sum: '$subOrders.itemsTotal' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 8 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'seller' } },
    { $unwind: '$seller' },
    { $project: { revenue: 1, orders: 1, name: '$seller.name', email: '$seller.email' } },
  ]);

  const categorySales = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $unwind: '$subOrders' },
    { $unwind: '$subOrders.items' },
    {
      $lookup: {
        from: 'products',
        localField: 'subOrders.items.product',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$product.category',
        revenue: { $sum: '$subOrders.items.subtotal' },
        quantity: { $sum: '$subOrders.items.quantity' },
      },
    },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    { $project: { name: { $ifNull: ['$category.name', 'Other'] }, revenue: 1, quantity: 1 } },
    { $sort: { revenue: -1 } },
  ]);

  const [totalProducts, totalOrders, totalCustomers, totalSellers] = await Promise.all([
    Product.countDocuments(),
    Order.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'seller' }),
  ]);

  res.json({
    success: true,
    summary: {
      revenue,
      refundTotal,
      netRevenue: round(revenue - refundTotal),
      totalProducts,
      totalOrders,
      totalCustomers,
      totalSellers,
      totalRefunds: refunds.length,
    },
    monthly: monthly.map((m) => ({ month: m._id, revenue: round(m.revenue), orders: m.orders })),
    topProducts,
    topSellers,
    categorySales: categorySales.map((c) => ({ name: c.name, revenue: round(c.revenue), quantity: c.quantity })),
  });
});

const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort('-createdAt');
  res.json({ success: true, coupons });
});

const createCoupon = asyncHandler(async (req, res) => {
  const { code, description, discountType, discountValue, minOrderValue, maxDiscount, expiresAt, usageLimit } =
    req.body;
  if (!code || !discountValue || !expiresAt) {
    throw new ApiError(400, 'Coupon code, discount value and expiry date are required.');
  }
  const exists = await Coupon.findOne({ code: code.toUpperCase() });
  if (exists) throw new ApiError(409, 'A coupon with this code already exists.');
  const coupon = await Coupon.create({
    code,
    description,
    discountType: discountType || 'percentage',
    discountValue: Number(discountValue),
    minOrderValue: Number(minOrderValue) || 0,
    maxDiscount: Number(maxDiscount) || 0,
    expiresAt,
    usageLimit: Number(usageLimit) || 0,
  });
  res.status(201).json({ success: true, coupon, message: 'Coupon created.' });
});

const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found.');
  ['description', 'discountType', 'discountValue', 'minOrderValue', 'maxDiscount', 'expiresAt', 'usageLimit', 'isActive'].forEach(
    (f) => {
      if (req.body[f] !== undefined) coupon[f] = req.body[f];
    }
  );
  await coupon.save();
  res.json({ success: true, coupon, message: 'Coupon updated.' });
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found.');
  res.json({ success: true, message: 'Coupon deleted.' });
});

const validateCoupon = asyncHandler(async (req, res) => {
  const { code, itemsTotal } = req.body;
  const { getValidCoupon } = require('./orderController');
  const coupon = await getValidCoupon(code);
  if (!coupon) throw new ApiError(400, 'Coupon code is required.');
  const { calculateCouponDiscount } = require('../services/orderService');
  const total = Number(itemsTotal) || 0;
  if (coupon.minOrderValue && total < coupon.minOrderValue) {
    throw new ApiError(400, `Minimum order value for this coupon is ₹${coupon.minOrderValue}.`);
  }
  const discount = calculateCouponDiscount(coupon, total);
  res.json({ success: true, coupon, discount });
});

module.exports = {
  getDashboard,
  getUsers,
  setUserStatus,
  getSellers,
  reviewSeller,
  getAdminProducts,
  getAdminOrders,
  assignDeliveryPartner,
  getPayments,
  getRefunds,
  updateRefund,
  getDeliveryPartners,
  reviewDeliveryPartner,
  getCommissions,
  settleCommission,
  getSettings,
  updateSettings,
  getAnalytics,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
};
