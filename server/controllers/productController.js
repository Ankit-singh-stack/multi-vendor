const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Store = require('../models/Store');
const SellerProfile = require('../models/SellerProfile');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { filesToImages } = require('../middleware/uploadMiddleware');

const PLACEHOLDER = '/images/product-placeholder.svg';

const getProducts = asyncHandler(async (req, res) => {
  const {
    q,
    category,
    minPrice,
    maxPrice,
    sort = 'newest',
    page = 1,
    limit = 12,
    seller,
    featured,
    rating,
  } = req.query;

  const filter = { status: 'active' };
  if (q) {
    filter.$or = [
      { name: new RegExp(q, 'i') },
      { description: new RegExp(q, 'i') },
      { brand: new RegExp(q, 'i') },
      { tags: new RegExp(q, 'i') },
    ];
  }

  if (category) {
    let catId = category;
    if (!mongoose.Types.ObjectId.isValid(category)) {
      const cat = await Category.findOne({ slug: category });
      catId = cat ? cat._id : null;
    }
    if (!catId) {
      return res.json({
        success: true,
        products: [],
        pagination: { page: 1, limit: Number(limit), total: 0, pages: 0 },
      });
    }
    filter.category = catId;
  }

  if (seller && mongoose.Types.ObjectId.isValid(seller)) filter.seller = seller;
  if (featured === 'true') filter.isFeatured = true;
  if (rating) filter.rating = { $gte: Number(rating) };

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    rating: { rating: -1 },
    popular: { sold: -1 },
  };

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(60, Math.max(1, Number(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .populate('seller', 'name')
      .populate('store', 'name slug')
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: id };
  const product = await Product.findOne(query)
    .populate('category', 'name slug')
    .populate('seller', 'name email')
    .populate('store', 'name slug logo description');
  if (!product) throw new ApiError(404, 'Product not found.');
  res.json({ success: true, product });
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, discountPrice, stock, category, brand, tags, status } = req.body;
  if (!name || !description) throw new ApiError(400, 'Name and description are required.');
  if (price === undefined || Number(price) < 0) throw new ApiError(400, 'A valid price is required.');
  if (!category) throw new ApiError(400, 'Category is required.');

  const cat = await Category.findById(category);
  if (!cat) throw new ApiError(400, 'Selected category does not exist.');

  const sellerProfile = await SellerProfile.findOne({ user: req.user._id });
  if (!sellerProfile || sellerProfile.status !== 'approved') {
    throw new ApiError(403, 'Your seller account must be approved before adding products.');
  }
  const store = await Store.findOne({ seller: req.user._id });

  const uploaded = await filesToImages(req.files || []);
  let urls = [];
  try {
    urls = req.body.imageUrls ? JSON.parse(req.body.imageUrls) : [];
  } catch (e) {
    urls = [];
  }
  const images = [...uploaded, ...urls.filter(Boolean).map((url) => ({ url, publicId: '' }))];
  if (!images.length) images.push({ url: PLACEHOLDER, publicId: '' });

  const product = await Product.create({
    name,
    description,
    brand,
    price: Number(price),
    discountPrice: discountPrice ? Number(discountPrice) : 0,
    stock: Number(stock) || 0,
    category,
    seller: req.user._id,
    store: store ? store._id : undefined,
    images,
    tags: Array.isArray(tags) ? tags : tags ? String(tags).split(',').map((t) => t.trim()) : [],
    status: ['active', 'draft', 'inactive'].includes(status) ? status : 'active',
  });

  if (store) {
    store.totalProducts = await Product.countDocuments({ seller: req.user._id });
    await store.save();
  }

  res.status(201).json({ success: true, product, message: 'Product created successfully.' });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found.');

  const isOwner = String(product.seller) === String(req.user._id);
  if (req.user.role === 'seller' && !isOwner) {
    throw new ApiError(403, 'You can only edit your own products.');
  }
  if (!['seller', 'admin'].includes(req.user.role)) {
    throw new ApiError(403, 'Not authorized to update products.');
  }

  const editable = [
    'name',
    'description',
    'brand',
    'price',
    'discountPrice',
    'stock',
    'category',
    'status',
    'isFeatured',
    'tags',
  ];
  editable.forEach((field) => {
    if (req.body[field] === undefined) return;
    if (field === 'isFeatured' && req.user.role !== 'admin') return;
    if (field === 'status' && req.user.role === 'seller' && req.body.status === 'blocked') return;
    product[field] = req.body[field];
  });

  if (req.body.category) {
    const cat = await Category.findById(req.body.category);
    if (!cat) throw new ApiError(400, 'Selected category does not exist.');
  }

  const uploaded = await filesToImages(req.files || []);
  let urls = [];
  try {
    urls = req.body.imageUrls ? JSON.parse(req.body.imageUrls) : [];
  } catch (e) {
    urls = [];
  }
  if (uploaded.length || req.body.imageUrls !== undefined) {
    const newImages = [...uploaded, ...urls.filter(Boolean).map((url) => ({ url, publicId: '' }))];
    product.images = newImages.length ? newImages : [{ url: PLACEHOLDER, publicId: '' }];
  }

  if (Array.isArray(product.tags) === false) product.tags = [];
  await product.save();

  res.json({ success: true, product, message: 'Product updated.' });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found.');
  if (req.user.role === 'seller' && String(product.seller) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only delete your own products.');
  }
  if (!['seller', 'admin'].includes(req.user.role)) {
    throw new ApiError(403, 'Not authorized to delete products.');
  }

  await Product.findByIdAndDelete(product._id);
  const store = await Store.findOne({ seller: product.seller });
  if (store) {
    store.totalProducts = await Product.countDocuments({ seller: product.seller });
    await store.save();
  }
  res.json({ success: true, message: 'Product deleted.' });
});

const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: 'active', isFeatured: true })
    .populate('category', 'name slug')
    .sort('-createdAt')
    .limit(8);
  res.json({ success: true, products });
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
};
