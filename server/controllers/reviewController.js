const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const recalculateProductRating = async (productId) => {
  const agg = await Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const rating = agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0;
  const numReviews = agg[0] ? agg[0].count : 0;
  await Product.findByIdAndUpdate(productId, { rating, numReviews });
};

const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment, orderId } = req.body;
  if (!productId || !rating || !comment) {
    throw new ApiError(400, 'Product, rating and comment are required.');
  }
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, 'Invalid product ID.');
  }
  const numericRating = Number(rating);
  if (numericRating < 1 || numericRating > 5) throw new ApiError(400, 'Rating must be between 1 and 5.');

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found.');
  if (String(product.seller) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot review your own product.');
  }

  const existing = await Review.findOne({ product: productId, user: req.user._id });
  if (existing) throw new ApiError(409, 'You have already reviewed this product.');

  const deliveredOrder = await Order.findOne({
    customer: req.user._id,
    ...(orderId ? { _id: orderId } : {}),
    subOrders: {
      $elemMatch: {
        status: 'Delivered',
        'items.product': productId,
      },
    },
  });
  if (!deliveredOrder) {
    throw new ApiError(400, 'You can review this product only after it has been delivered.');
  }

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    seller: product.seller,
    order: deliveredOrder._id,
    rating: numericRating,
    comment,
  });
  await recalculateProductRating(product._id);
  const populated = await Review.findById(review._id).populate('user', 'name avatar');
  res.status(201).json({ success: true, review: populated, message: 'Review submitted.' });
});

const getProductReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
    throw new ApiError(400, 'Invalid product ID.');
  }
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));
  const filter = { product: req.params.productId };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name avatar')
      .sort('-createdAt')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Review.countDocuments(filter),
  ]);

  const distributionAgg = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(req.params.productId) } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  distributionAgg.forEach((d) => {
    distribution[d._id] = d.count;
  });

  res.json({
    success: true,
    reviews,
    distribution,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found.');
  if (String(review.user) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ApiError(403, 'You can only delete your own review.');
  }
  const productId = review.product;
  await review.deleteOne();
  await recalculateProductRating(productId);
  res.json({ success: true, message: 'Review deleted.' });
});

module.exports = { createReview, getProductReviews, deleteReview };
