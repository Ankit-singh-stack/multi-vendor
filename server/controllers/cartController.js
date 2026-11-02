const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getMarketplaceSettings } = require('../utils/settings');

const productPopulate = {
  path: 'items.product',
  populate: [
    { path: 'store', select: 'name slug' },
    { path: 'seller', select: 'name' },
    { path: 'category', select: 'name slug' },
  ],
};

const shapeCart = (cart, settings) => {
  const items = (cart?.items || []).map((item) => {
    const product = item.product;
    const available = Boolean(product && product.status === 'active' && product.stock > 0);
    const price = product ? product.effectivePrice ?? product.price : 0;
    return {
      _id: item._id,
      product,
      quantity: item.quantity,
      price,
      subtotal: Math.round(price * item.quantity * 100) / 100,
      available,
      maxQuantity: product ? Math.min(product.stock, 10) : 0,
    };
  });

  const validItems = items.filter((i) => i.available);
  const itemsTotal = Math.round(validItems.reduce((sum, i) => sum + i.subtotal, 0) * 100) / 100;
  const sellerGroups = new Set(validItems.map((i) => String(i.product.seller?._id || i.product.seller)));
  const deliveryTotal =
    validItems.length === 0
      ? 0
      : itemsTotal >= settings.freeDeliveryAbove
        ? 0
        : settings.deliveryCharge * sellerGroups.size;

  return {
    items,
    summary: {
      itemCount: validItems.reduce((sum, i) => sum + i.quantity, 0),
      distinctItems: items.length,
      itemsTotal,
      deliveryTotal,
      deliveryChargePerStore: settings.deliveryCharge,
      freeDeliveryAbove: settings.freeDeliveryAbove,
      taxRate: settings.taxRate,
      settings: {
        commissionRate: settings.commissionRate,
        taxRate: settings.taxRate,
      },
    },
  };
};

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  await cart.populate(productPopulate);
  const settings = await getMarketplaceSettings();
  res.json({ success: true, ...shapeCart(cart, settings) });
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) throw new ApiError(400, 'Product ID is required.');
  const qty = Math.max(1, Number(quantity));

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found.');
  if (product.status !== 'active') throw new ApiError(400, 'This product is not available.');
  if (product.stock < 1) throw new ApiError(400, 'This product is out of stock.');
  if (product.seller.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot buy your own product.');
  }

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find((i) => String(i.product) === String(productId));
  if (existing) {
    existing.quantity = Math.min(existing.quantity + qty, product.stock, 10);
  } else {
    cart.items.push({ product: productId, quantity: Math.min(qty, product.stock, 10) });
  }
  await cart.save();
  await cart.populate(productPopulate);

  const settings = await getMarketplaceSettings();
  res.status(201).json({ success: true, message: 'Added to cart.', ...shapeCart(cart, settings) });
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const qty = Number(quantity);
  if (!qty || qty < 1) throw new ApiError(400, 'Quantity must be at least 1.');

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.id);
  if (!item) throw new ApiError(404, 'Cart item not found.');

  const product = await Product.findById(item.product);
  if (!product) throw new ApiError(404, 'Product no longer exists.');
  if (qty > product.stock) throw new ApiError(400, `Only ${product.stock} unit(s) available.`);

  item.quantity = Math.min(qty, 10);
  await cart.save();
  await cart.populate(productPopulate);

  const settings = await getMarketplaceSettings();
  res.json({ success: true, message: 'Cart updated.', ...shapeCart(cart, settings) });
});

const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((i) => String(i._id) !== String(req.params.id));
  await cart.save();
  await cart.populate(productPopulate);

  const settings = await getMarketplaceSettings();
  res.json({ success: true, message: 'Item removed from cart.', ...shapeCart(cart, settings) });
});

const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  res.json({ success: true, message: 'Cart cleared.', items: [], summary: {} });
});

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart, shapeCart, productPopulate };
