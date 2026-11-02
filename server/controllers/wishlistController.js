const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
    path: 'products',
    populate: [
      { path: 'category', select: 'name slug' },
      { path: 'store', select: 'name slug' },
    ],
  });
  if (!wishlist) wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  const products = (wishlist.products || []).filter(Boolean);
  res.json({ success: true, products, count: products.length });
});

const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) throw new ApiError(400, 'Product ID is required.');
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found.');

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  if (!wishlist.products.some((p) => String(p) === String(productId))) {
    wishlist.products.push(productId);
    await wishlist.save();
  }
  res.json({ success: true, message: 'Added to wishlist.', count: wishlist.products.length });
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const productId = req.params.productId || req.params.id;
  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) throw new ApiError(404, 'Wishlist not found.');
  wishlist.products = wishlist.products.filter((p) => String(p) !== String(productId));
  await wishlist.save();
  res.json({ success: true, message: 'Removed from wishlist.', count: wishlist.products.length });
});

const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) wishlist = await Wishlist.create({ user: req.user._id, products: [] });

  const exists = wishlist.products.some((p) => String(p) === String(productId));
  if (exists) {
    wishlist.products = wishlist.products.filter((p) => String(p) !== String(productId));
  } else {
    wishlist.products.push(productId);
  }
  await wishlist.save();
  res.json({
    success: true,
    added: !exists,
    message: exists ? 'Removed from wishlist.' : 'Added to wishlist.',
    count: wishlist.products.length,
  });
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist, toggleWishlist };
