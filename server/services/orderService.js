const SellerProfile = require('../models/SellerProfile');
const { getMarketplaceSettings } = require('../utils/settings');

const round = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const calculateCouponDiscount = (coupon, itemsTotal) => {
  if (!coupon) return 0;
  if (coupon.minOrderValue && itemsTotal < coupon.minOrderValue) return 0;
  let discount =
    coupon.discountType === 'percentage'
      ? (itemsTotal * coupon.discountValue) / 100
      : coupon.discountValue;
  if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
  return round(Math.min(discount, itemsTotal));
};

const buildOrderDraft = async ({ items, coupon = null, settings = null }) => {
  const marketplace = settings || (await getMarketplaceSettings());
  const sellerIds = [...new Set(items.map((i) => String(i.product.seller?._id || i.product.seller)))];
  const profiles = await SellerProfile.find({ user: { $in: sellerIds } });
  const rateBySeller = {};
  profiles.forEach((p) => {
    rateBySeller[String(p.user)] = p.commissionRate;
  });

  const grouped = new Map();
  for (const item of items) {
    const product = item.product;
    const sellerId = String(product.seller?._id || product.seller);
    if (!grouped.has(sellerId)) {
      grouped.set(sellerId, {
        seller: sellerId,
        store: product.store?._id || product.store || null,
        storeName: (product.store && product.store.name) || item.storeName || 'MarketSphere Store',
        items: [],
        itemsTotal: 0,
      });
    }
    const price = product.effectivePrice ?? product.discountPrice ?? product.price;
    const subtotal = round(price * item.quantity);
    const group = grouped.get(sellerId);
    group.items.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0]?.url || '',
      price,
      quantity: item.quantity,
      subtotal,
    });
    if (product.store && product.store.name) group.storeName = product.store.name;
    group.itemsTotal = round(group.itemsTotal + subtotal);
  }

  let itemsTotal = 0;
  let deliveryTotal = 0;
  const subOrders = [];

  for (const group of grouped.values()) {
    const rate = rateBySeller[String(group.seller)] ?? marketplace.commissionRate;
    const commissionAmount = round((group.itemsTotal * rate) / 100);
    const sellerAmount = round(group.itemsTotal - commissionAmount);
    const deliveryCharge =
      marketplace.freeDeliveryAbove > 0 && group.itemsTotal >= marketplace.freeDeliveryAbove
        ? 0
        : marketplace.deliveryCharge;

    itemsTotal = round(itemsTotal + group.itemsTotal);
    deliveryTotal = round(deliveryTotal + deliveryCharge);

    subOrders.push({
      seller: group.seller,
      store: group.store,
      storeName: group.storeName,
      items: group.items,
      status: 'Pending',
      itemsTotal: group.itemsTotal,
      deliveryCharge,
      commissionRate: rate,
      commissionAmount,
      sellerAmount,
      deliveryPartnerAmount: deliveryCharge,
      tracking: [{ status: 'Pending', note: 'Order placed, awaiting payment confirmation.' }],
    });
  }

  const discount = coupon ? calculateCouponDiscount(coupon, itemsTotal) : 0;
  const tax = round(((itemsTotal - discount) * marketplace.taxRate) / 100);
  const grandTotal = round(itemsTotal + deliveryTotal + tax - discount);

  return {
    subOrders,
    pricing: {
      itemsTotal,
      deliveryTotal,
      tax,
      discount,
      grandTotal,
      couponCode: coupon ? coupon.code : '',
    },
  };
};

const groupSellerOrdersForUser = (orders, sellerId) =>
  orders
    .map((order) => {
      const subOrders = order.subOrders.filter((s) => String(s.seller) === String(sellerId));
      return { order, subOrders };
    })
    .filter((entry) => entry.subOrders.length > 0);

module.exports = {
  round,
  calculateCouponDiscount,
  buildOrderDraft,
  groupSellerOrdersForUser,
};

const Commission = require('../models/Commission');

const createCommissionsForOrder = async (order) => {
  const existing = await Commission.countDocuments({ order: order._id });
  if (existing > 0) return [];
  const docs = order.subOrders
    .filter((s) => s.status !== 'Cancelled')
    .map((sub) => ({
      order: order._id,
      subOrderId: sub._id,
      seller: sub.seller,
      deliveryPartner: sub.deliveryPartner || null,
      itemsTotal: sub.itemsTotal,
      commissionRate: sub.commissionRate,
      commissionAmount: sub.commissionAmount,
      sellerAmount: sub.sellerAmount,
      deliveryCharge: sub.deliveryCharge,
      deliveryPartnerAmount: sub.deliveryPartnerAmount,
      sellerPayoutStatus: 'pending',
      deliveryPayoutStatus: 'pending',
    }));
  if (!docs.length) return [];
  return Commission.insertMany(docs);
};

module.exports.createCommissionsForOrder = createCommissionsForOrder;
