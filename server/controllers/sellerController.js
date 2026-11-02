const User = require('../models/User');
const SellerProfile = require('../models/SellerProfile');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Commission = require('../models/Commission');
const Review = require('../models/Review');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { fileToImage } = require('../middleware/uploadMiddleware');

const registerSeller = asyncHandler(async (req, res) => {
  if (!['customer'].includes(req.user.role)) {
    throw new ApiError(400, 'Only customer accounts can apply to become a seller.');
  }
  const existing = await SellerProfile.findOne({ user: req.user._id });
  if (existing) throw new ApiError(409, 'You already have a seller application.');

  const { businessName, ownerName, gstNumber, phone, description, address } = req.body;
  if (!businessName) throw new ApiError(400, 'Business / store name is required.');

  let logo = { url: '', publicId: '' };
  if (req.file) logo = await fileToImage(req.file);

  const profile = await SellerProfile.create({
    user: req.user._id,
    businessName,
    ownerName: ownerName || req.user.name,
    gstNumber: gstNumber || '',
    phone: phone || req.user.phone,
    description,
    address: address || {},
    logo,
    status: 'pending',
  });
  const store = await Store.create({
    seller: req.user._id,
    sellerProfile: profile._id,
    name: businessName,
    description: description || `${businessName} on MarketSphere`,
    logo,
    address: address ? [address.line1, address.city, address.state].filter(Boolean).join(', ') : '',
    isActive: false,
  });

  req.user.role = 'seller';
  req.user.sellerProfile = profile._id;
  await req.user.save();

  res.status(201).json({
    success: true,
    sellerProfile: profile,
    store,
    message: 'Seller application submitted. An administrator will review it shortly.',
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const sellerProfile = await SellerProfile.findOne({ user: req.user._id });
  const store = await Store.findOne({ seller: req.user._id });
  res.json({ success: true, sellerProfile, store, user: req.user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const profile = await SellerProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, 'Seller profile not found.');
  const store = await Store.findOne({ seller: req.user._id });

  const profileFields = ['businessName', 'ownerName', 'gstNumber', 'phone', 'description', 'address'];
  profileFields.forEach((f) => {
    if (req.body[f] !== undefined) profile[f] = req.body[f];
  });
  if (req.file) {
    const logo = await fileToImage(req.file);
    profile.logo = logo;
    if (store) store.logo = logo;
  }
  await profile.save();

  if (store) {
    if (req.body.businessName) store.name = req.body.businessName;
    if (req.body.description !== undefined) store.description = req.body.description;
    if (req.body.storeAddress !== undefined) store.address = req.body.storeAddress;
    if (req.body.isActive !== undefined) store.isActive = req.body.isActive;
    await store.save();
  }

  res.json({ success: true, sellerProfile: profile, store, message: 'Seller profile updated.' });
});

const getSellerProducts = asyncHandler(async (req, res) => {
  const { q, status, page = 1, limit = 20 } = req.query;
  const filter = { seller: req.user._id };
  if (q) filter.name = new RegExp(q, 'i');
  if (status && status !== 'all') filter.status = status;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(60, Math.max(1, Number(limit)));
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name')
      .sort('-createdAt')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);
  res.json({
    success: true,
    products,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const getSellerOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ 'subOrders.seller': req.user._id })
    .sort('-createdAt')
    .populate('customer', 'name email phone');

  let list = orders
    .map((order) => {
      const subOrders = order.subOrders.filter(
        (s) => String(s.seller) === String(req.user._id)
      );
      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        customer: order.customer,
        shippingAddress: order.shippingAddress,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        subOrders,
      };
    })
    .filter((o) => o.subOrders.length);

  if (req.query.status && req.query.status !== 'all') {
    list = list.filter((o) => o.subOrders.some((s) => s.status === req.query.status));
  }

  res.json({ success: true, orders: list });
});

const sellerSubOrderStats = async (sellerId) => {
  const orders = await Order.find({
    'subOrders.seller': sellerId,
    paymentStatus: { $in: ['paid', 'pending'] },
  });

  const stats = {
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    grossSales: 0,
    commission: 0,
    netEarnings: 0,
  };
  const monthly = {};
  for (const order of orders) {
    for (const sub of order.subOrders) {
      if (String(sub.seller) !== String(sellerId)) continue;
      stats.totalOrders += 1;
      if (['Pending', 'Confirmed', 'Processing', 'Ready for Pickup'].includes(sub.status)) {
        stats.pendingOrders += 1;
      }
      if (sub.status === 'Delivered') {
        stats.deliveredOrders += 1;
        stats.grossSales += sub.itemsTotal;
        stats.commission += sub.commissionAmount;
        stats.netEarnings += sub.sellerAmount;
        const month = new Date(sub.updatedAt || order.createdAt).toISOString().slice(0, 7);
        if (!monthly[month]) monthly[month] = { month, sales: 0, earnings: 0, orders: 0 };
        monthly[month].sales += sub.itemsTotal;
        monthly[month].earnings += sub.sellerAmount;
        monthly[month].orders += 1;
      }
      if (sub.status === 'Cancelled') stats.cancelledOrders += 1;
    }
  }
  stats.monthly = Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  stats.grossSales = Math.round(stats.grossSales * 100) / 100;
  stats.commission = Math.round(stats.commission * 100) / 100;
  stats.netEarnings = Math.round(stats.netEarnings * 100) / 100;
  return stats;
};

const getDashboard = asyncHandler(async (req, res) => {
  const profile = await SellerProfile.findOne({ user: req.user._id });
  const store = await Store.findOne({ seller: req.user._id });
  const [totalProducts, activeProducts, lowStock, stats, recentOrders] = await Promise.all([
    Product.countDocuments({ seller: req.user._id }),
    Product.countDocuments({ seller: req.user._id, status: 'active' }),
    Product.countDocuments({ seller: req.user._id, stock: { $lte: 5 }, status: 'active' }),
    sellerSubOrderStats(req.user._id),
    Order.find({ 'subOrders.seller': req.user._id })
      .sort('-createdAt')
      .limit(5)
      .populate('customer', 'name email'),
  ]);

  const shapedRecent = recentOrders.map((order) => ({
    _id: order._id,
    orderNumber: order.orderNumber,
    customer: order.customer,
    createdAt: order.createdAt,
    subOrders: order.subOrders.filter((s) => String(s.seller) === String(req.user._id)),
  }));

  const topProducts = await Product.find({ seller: req.user._id })
    .sort('-sold')
    .limit(5)
    .select('name images sold stock price rating');

  res.json({
    success: true,
    profile,
    store,
    stats: {
      totalProducts,
      activeProducts,
      lowStock,
      ...stats,
    },
    recentOrders: shapedRecent,
    topProducts,
  });
});

const getAnalytics = asyncHandler(async (req, res) => {
  const stats = await sellerSubOrderStats(req.user._id);
  const topProducts = await Product.find({ seller: req.user._id })
    .sort('-sold')
    .limit(8)
    .select('name sold price images');

  const orders = await Order.find({ 'subOrders.seller': req.user._id, paymentStatus: 'paid' });
  const statusCounts = {};
  orders.forEach((order) =>
    order.subOrders
      .filter((s) => String(s.seller) === String(req.user._id))
      .forEach((s) => {
        statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
      })
  );

  res.json({
    success: true,
    stats,
    topProducts,
    statusCounts: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
  });
});

const getCommissionHistory = asyncHandler(async (req, res) => {
  const commissions = await Commission.find({ seller: req.user._id })
    .populate('order', 'orderNumber createdAt paymentStatus')
    .sort('-createdAt');
  const totals = commissions.reduce(
    (acc, c) => {
      acc.gross += c.itemsTotal;
      acc.commission += c.commissionAmount;
      acc.payable += c.sellerAmount;
      if (c.sellerPayoutStatus === 'settled') acc.settled += c.sellerAmount;
      return acc;
    },
    { gross: 0, commission: 0, payable: 0, settled: 0 }
  );
  Object.keys(totals).forEach((k) => {
    totals[k] = Math.round(totals[k] * 100) / 100;
  });
  res.json({ success: true, commissions, totals });
});

const getPayoutHistory = asyncHandler(async (req, res) => {
  const payouts = await Commission.find({ seller: req.user._id, sellerPayoutStatus: 'settled' })
    .populate('order', 'orderNumber createdAt')
    .sort('-settledAt');
  const totalPaid = Math.round(payouts.reduce((sum, p) => sum + p.sellerAmount, 0) * 100) / 100;
  res.json({ success: true, payouts, totalPaid });
});

const getSellerReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ seller: req.user._id })
    .populate('user', 'name avatar')
    .populate('product', 'name images')
    .sort('-createdAt');
  res.json({ success: true, reviews });
});

const replyToReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, seller: req.user._id });
  if (!review) throw new ApiError(404, 'Review not found for your store.');
  if (!req.body.reply) throw new ApiError(400, 'Reply text is required.');
  review.sellerReply = req.body.reply;
  await review.save();
  res.json({ success: true, review, message: 'Reply posted.' });
});

module.exports = {
  registerSeller,
  getProfile,
  updateProfile,
  getSellerProducts,
  getSellerOrders,
  getDashboard,
  getAnalytics,
  getCommissionHistory,
  getPayoutHistory,
  getSellerReviews,
  replyToReview,
  sellerSubOrderStats,
};
