require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const SellerProfile = require('../models/SellerProfile');
const DeliveryPartnerProfile = require('../models/DeliveryPartnerProfile');
const Store = require('../models/Store');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Address = require('../models/Address');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Commission = require('../models/Commission');
const Coupon = require('../models/Coupon');
const Setting = require('../models/Setting');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const Review = require('../models/Review');
const Refund = require('../models/Refund');
const { buildOrderDraft, createCommissionsForOrder } = require('../services/orderService');
const generateOrderNumber = require('./generateOrderNumber');

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

const categoriesData = [
  { name: 'Electronics', icon: 'FiMonitor', description: 'Gadgets, audio, computers and more' },
  { name: 'Fashion', icon: 'FiShoppingBag', description: 'Clothing, footwear and accessories' },
  { name: 'Home & Living', icon: 'FiHome', description: 'Furniture, decor and kitchen essentials' },
  { name: 'Beauty', icon: 'FiHeart', description: 'Skincare, grooming and wellness' },
  { name: 'Sports & Outdoors', icon: 'FiActivity', description: 'Fitness, outdoor and adventure gear' },
  { name: 'Books & Stationery', icon: 'FiBookOpen', description: 'Books, journals and supplies' },
];

const productData = [
  {
    name: 'Aurora Wireless Noise-Cancelling Headphones',
    category: 'Electronics',
    seller: 1,
    price: 8999,
    discountPrice: 6499,
    stock: 36,
    rating: 4.6,
    numReviews: 128,
    sold: 214,
    brand: 'Aurora',
    featured: true,
    image: 'photo-1505740420928-5e560c06d30e',
    description:
      'Immersive 40-hour battery life, active noise cancellation and studio-tuned drivers. The Aurora over-ear headphones are built for long commutes, deep work sessions and everything in between.',
    tags: ['headphones', 'audio', 'wireless', 'noise cancelling'],
  },
  {
    name: 'NovaBook Air 14" Thin & Light Laptop',
    category: 'Electronics',
    seller: 1,
    price: 74999,
    discountPrice: 68999,
    stock: 18,
    rating: 4.5,
    numReviews: 84,
    sold: 91,
    brand: 'Nova',
    featured: true,
    image: 'photo-1496181133206-80ce9b88a853',
    description:
      'A 14-inch 2.8K display laptop with a 12-hour battery, 16GB RAM and 512GB SSD. Weighs just 1.2kg and powers through work, study and creative projects.',
    tags: ['laptop', 'computer', 'work'],
  },
  {
    name: 'PulseFit Smartwatch Series 5',
    category: 'Electronics',
    seller: 1,
    price: 4999,
    discountPrice: 3499,
    stock: 64,
    rating: 4.3,
    numReviews: 203,
    sold: 388,
    brand: 'PulseFit',
    featured: true,
    image: 'photo-1523275335684-37898b6baf30',
    description:
      'Track workouts, heart rate, sleep and SpO2 with a bright AMOLED display. IP68 water resistance with 10-day battery life.',
    tags: ['smartwatch', 'fitness', 'wearable'],
  },
  {
    name: 'Lumina 4K Mirrorless Camera',
    category: 'Electronics',
    seller: 1,
    price: 89999,
    discountPrice: 79999,
    stock: 9,
    rating: 4.8,
    numReviews: 41,
    sold: 57,
    brand: 'Lumina',
    featured: false,
    image: 'photo-1516035069371-29a1b244cc32',
    description:
      'A 24MP mirrorless camera with 4K 60fps video, in-body stabilisation and a versatile kit lens. Perfect for creators stepping up their craft.',
    tags: ['camera', 'photography', '4k'],
  },
  {
    name: 'Everyday Cotton Crew T-Shirt',
    category: 'Fashion',
    seller: 2,
    price: 1299,
    discountPrice: 799,
    stock: 120,
    rating: 4.2,
    numReviews: 96,
    sold: 421,
    brand: 'UrbanThread',
    featured: true,
    image: 'photo-1521572163474-6864f9cf17ab',
    description:
      'Breathable 100% combed cotton with a relaxed fit. Pre-shrunk and garment-dyed for a soft, lived-in feel from day one.',
    tags: ['tshirt', 'cotton', 'casual'],
  },
  {
    name: 'Streetline Runner Sneakers',
    category: 'Fashion',
    seller: 2,
    price: 4499,
    discountPrice: 2999,
    stock: 52,
    rating: 4.4,
    numReviews: 148,
    sold: 302,
    brand: 'Streetline',
    featured: true,
    image: 'photo-1542291026-7eec264c27ff',
    description:
      'Lightweight knit sneakers with responsive cushioning for all-day comfort. A clean silhouette that pairs with everything.',
    tags: ['shoes', 'sneakers', 'running'],
  },
  {
    name: 'Highland Quilted Puffer Jacket',
    category: 'Fashion',
    seller: 2,
    price: 5499,
    discountPrice: 3999,
    stock: 34,
    rating: 4.5,
    numReviews: 62,
    sold: 118,
    brand: 'Highland',
    featured: false,
    image: 'photo-1551028719-00167b16eac5',
    description:
      'Warm, wind-resistant puffer with recycled insulation and a water-repellent shell. Packs down small for travel.',
    tags: ['jacket', 'winter', 'outerwear'],
  },
  {
    name: 'Solstice Polarised Sunglasses',
    category: 'Fashion',
    seller: 2,
    price: 2499,
    discountPrice: 1799,
    stock: 76,
    rating: 4.1,
    numReviews: 57,
    sold: 143,
    brand: 'Solstice',
    featured: false,
    image: 'photo-1511499767150-a48a237f0083',
    description:
      'UV400 polarised lenses in a lightweight acetate frame. Glare-free vision with a timeless shape.',
    tags: ['sunglasses', 'accessories'],
  },
  {
    name: 'Nordic Ceramic Table Lamp',
    category: 'Home & Living',
    seller: 2,
    price: 3299,
    discountPrice: 2499,
    stock: 41,
    rating: 4.6,
    numReviews: 38,
    sold: 84,
    brand: 'Nordic Home',
    featured: true,
    image: 'photo-1507473885765-e6ed057f782c',
    description:
      'Hand-finished ceramic base with a linen shade and warm dimmable glow. Adds a calm, minimal accent to any room.',
    tags: ['lamp', 'decor', 'lighting'],
  },
  {
    name: 'Cove Oak Accent Chair',
    category: 'Home & Living',
    seller: 2,
    price: 12999,
    discountPrice: 9999,
    stock: 12,
    rating: 4.4,
    numReviews: 24,
    sold: 39,
    brand: 'Cove',
    featured: false,
    image: 'photo-1567538096630-e0c55bd6374c',
    description:
      'Solid oak frame with a curved backrest and stain-resistant upholstery. Assembly in under 15 minutes.',
    tags: ['chair', 'furniture'],
  },
  {
    name: 'ChefCraft Non-Stick Cookware Set',
    category: 'Home & Living',
    seller: 1,
    price: 6999,
    discountPrice: 4999,
    stock: 28,
    rating: 4.3,
    numReviews: 71,
    sold: 167,
    brand: 'ChefCraft',
    featured: false,
    image: 'photo-1556911220-bff31c812dba',
    description:
      'Five-piece induction-friendly cookware set with triple-layer non-stick coating and heat-resistant handles.',
    tags: ['cookware', 'kitchen'],
  },
  {
    name: 'Botanica Vitamin C Glow Serum',
    category: 'Beauty',
    seller: 2,
    price: 1499,
    discountPrice: 1099,
    stock: 95,
    rating: 4.7,
    numReviews: 188,
    sold: 512,
    brand: 'Botanica',
    featured: true,
    image: 'photo-1556228720-195a672e8a03',
    description:
      'A lightweight 10% vitamin C serum with hyaluronic acid and green tea. Brightens dull skin and supports the moisture barrier.',
    tags: ['skincare', 'serum', 'vitamin c'],
  },
  {
    name: 'Atelier No. 7 Eau de Parfum',
    category: 'Beauty',
    seller: 2,
    price: 4999,
    discountPrice: 3999,
    stock: 44,
    rating: 4.5,
    numReviews: 45,
    sold: 101,
    brand: 'Atelier',
    featured: false,
    image: 'photo-1541643600914-78b084683601',
    description:
      'A warm woody-floral fragrance with notes of bergamot, jasmine and sandalwood. Long-lasting 100ml bottle.',
    tags: ['perfume', 'fragrance'],
  },
  {
    name: 'FlowGrip Premium Yoga Mat',
    category: 'Sports & Outdoors',
    seller: 1,
    price: 2499,
    discountPrice: 1699,
    stock: 58,
    rating: 4.6,
    numReviews: 83,
    sold: 247,
    brand: 'FlowGrip',
    featured: true,
    image: 'photo-1601925260368-ae2f83cf8b7f',
    description:
      '6mm natural rubber mat with superior grip, alignment lines and a carry strap. Free from PVC and latex.',
    tags: ['yoga', 'fitness', 'mat'],
  },
  {
    name: 'IronCore Adjustable Dumbbell Pair',
    category: 'Sports & Outdoors',
    seller: 1,
    price: 8499,
    discountPrice: 6499,
    stock: 22,
    rating: 4.4,
    numReviews: 36,
    sold: 74,
    brand: 'IronCore',
    featured: false,
    image: 'photo-1517836357463-d25dfeac3438',
    description:
      'Space-saving adjustable dumbbells from 2.5kg to 24kg per side. A complete home gym in two compact units.',
    tags: ['dumbbell', 'gym', 'strength'],
  },
  {
    name: 'The Art of Clear Thinking (Hardcover)',
    category: 'Books & Stationery',
    seller: 2,
    price: 899,
    discountPrice: 649,
    stock: 87,
    rating: 4.8,
    numReviews: 154,
    sold: 356,
    brand: 'Rupa',
    featured: false,
    image: 'photo-1512820790803-83ca734da794',
    description:
      'A practical guide to decision-making, focus and mental models from a bestselling author. 288 pages.',
    tags: ['book', 'nonfiction', 'self help'],
  },
  {
    name: 'Dotted Hardcover Journal A5',
    category: 'Books & Stationery',
    seller: 2,
    price: 699,
    discountPrice: 499,
    stock: 150,
    rating: 4.5,
    numReviews: 67,
    sold: 289,
    brand: 'Papermoon',
    featured: false,
    image: 'photo-1531346878377-a5be20888e57',
    description:
      '160gsm bleed-proof dotted pages, lay-flat binding and an elastic closure. Ideal for bullet journaling.',
    tags: ['journal', 'notebook', 'stationery'],
  },
];

const seed = async () => {
  await connectDB();
  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    SellerProfile.deleteMany({}),
    DeliveryPartnerProfile.deleteMany({}),
    Store.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Address.deleteMany({}),
    Order.deleteMany({}),
    Payment.deleteMany({}),
    Commission.deleteMany({}),
    Coupon.deleteMany({}),
    Setting.deleteMany({}),
    Cart.deleteMany({}),
    Wishlist.deleteMany({}),
    Review.deleteMany({}),
    Refund.deleteMany({}),
  ]);

  console.log('Creating categories...');
  const categories = {};
  for (const c of categoriesData) {
    const cat = await Category.create(c);
    categories[c.name] = cat;
  }

  console.log('Creating users...');
  const admin = await User.create({
    name: 'Aarav Admin',
    email: 'admin@marketsphere.test',
    password: 'Admin@123',
    phone: '9000000001',
    role: 'admin',
  });

  const customer = await User.create({
    name: 'Riya Customer',
    email: 'customer@marketsphere.test',
    password: 'Customer@123',
    phone: '9000000002',
    role: 'customer',
  });

  const sellerUser1 = await User.create({
    name: 'Kabir Mehta',
    email: 'seller@marketsphere.test',
    password: 'Seller@123',
    phone: '9000000003',
    role: 'seller',
  });
  const sellerUser2 = await User.create({
    name: 'Ananya Rao',
    email: 'seller2@marketsphere.test',
    password: 'Seller@123',
    phone: '9000000004',
    role: 'seller',
  });

  const deliveryUser = await User.create({
    name: 'Rohan Das',
    email: 'delivery@marketsphere.test',
    password: 'Delivery@123',
    phone: '9000000005',
    role: 'delivery',
  });
  const deliveryUser2 = await User.create({
    name: 'Meera Singh',
    email: 'delivery2@marketsphere.test',
    password: 'Delivery@123',
    phone: '9000000006',
    role: 'delivery',
  });

  const seller1 = await SellerProfile.create({
    user: sellerUser1._id,
    businessName: 'TechNova Store',
    ownerName: 'Kabir Mehta',
    gstNumber: '27ABCDE1234F1Z5',
    phone: '9000000003',
    description: 'Premium electronics and fitness gear, curated for everyday performance.',
    status: 'approved',
    commissionRate: 10,
    approvedAt: new Date(),
    address: { line1: '12 Innovation Park', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
  });
  const seller2 = await SellerProfile.create({
    user: sellerUser2._id,
    businessName: 'UrbanThread Living',
    ownerName: 'Ananya Rao',
    gstNumber: '29ABCDE5678G1Z2',
    phone: '9000000004',
    description: 'Fashion, beauty and home essentials with a modern Indian sensibility.',
    status: 'approved',
    commissionRate: 12,
    approvedAt: new Date(),
    address: { line1: '88 Lakeview Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
  });

  const store1 = await Store.create({
    seller: sellerUser1._id,
    sellerProfile: seller1._id,
    name: 'TechNova Store',
    description: seller1.description,
    address: 'Mumbai, Maharashtra',
    isActive: true,
  });
  const store2 = await Store.create({
    seller: sellerUser2._id,
    sellerProfile: seller2._id,
    name: 'UrbanThread Living',
    description: seller2.description,
    address: 'Bengaluru, Karnataka',
    isActive: true,
  });

  sellerUser1.sellerProfile = seller1._id;
  await sellerUser1.save();
  sellerUser2.sellerProfile = seller2._id;
  await sellerUser2.save();

  const deliveryProfile1 = await DeliveryPartnerProfile.create({
    user: deliveryUser._id,
    vehicleType: 'bike',
    vehicleNumber: 'MH01AB1234',
    licenseNumber: 'DL-MH-2022-8891',
    serviceArea: 'Mumbai',
    status: 'approved',
    approvedAt: new Date(),
  });
  const deliveryProfile2 = await DeliveryPartnerProfile.create({
    user: deliveryUser2._id,
    vehicleType: 'scooter',
    vehicleNumber: 'KA02CD5678',
    licenseNumber: 'DL-KA-2021-4410',
    serviceArea: 'Bengaluru',
    status: 'approved',
    approvedAt: new Date(),
  });
  deliveryUser.deliveryProfile = deliveryProfile1._id;
  await deliveryUser.save();
  deliveryUser2.deliveryProfile = deliveryProfile2._id;
  await deliveryUser2.save();

  const address = await Address.create({
    user: customer._id,
    label: 'Home',
    fullName: 'Riya Customer',
    phone: '9000000002',
    line1: '42 Palm Grove Apartments',
    line2: 'Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    isDefault: true,
  });

  console.log('Creating products...');
  const products = [];
  for (const p of productData) {
    const store = p.seller === 1 ? store1 : store2;
    const seller = p.seller === 1 ? sellerUser1 : sellerUser2;
    const product = await Product.create({
      name: p.name,
      description: p.description,
      brand: p.brand,
      images: [{ url: img(p.image), publicId: '' }],
      category: categories[p.category]._id,
      seller: seller._id,
      store: store._id,
      price: p.price,
      discountPrice: p.discountPrice,
      stock: p.stock,
      rating: p.rating,
      numReviews: p.numReviews,
      sold: p.sold,
      isFeatured: p.featured,
      tags: p.tags,
      status: 'active',
    });
    products.push(product);
  }

  await Store.updateMany({}, {});

  await Setting.insertMany([
    { key: 'commissionRate', value: 10, description: 'Default marketplace commission %' },
    { key: 'deliveryCharge', value: 49, description: 'Delivery charge per seller order' },
    { key: 'taxRate', value: 5, description: 'GST % applied on items after discount' },
    { key: 'freeDeliveryAbove', value: 999, description: 'Free delivery threshold per store' },
    { key: 'platformName', value: 'MarketSphere', description: 'Marketplace name' },
  ]);

  await Coupon.create({
    code: 'WELCOME10',
    description: '10% off your first order (max ₹200)',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 499,
    maxDiscount: 200,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    usageLimit: 1000,
    isActive: true,
  });
  await Coupon.create({
    code: 'FESTIVE500',
    description: 'Flat ₹500 off orders above ₹2,999',
    discountType: 'fixed',
    discountValue: 500,
    minOrderValue: 2999,
    maxDiscount: 500,
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    usageLimit: 500,
    isActive: true,
  });

  console.log('Creating sample orders...');

  const makeOrder = async ({ items, statuses, paymentStatus, deliveryPartner, coupon = null }) => {
    const draft = await buildOrderDraft({
      items: items.map(({ product, quantity }) => ({
        product,
        quantity,
        storeName: product.store?.name,
      })),
      coupon,
    });
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      customer: customer._id,
      subOrders: draft.subOrders,
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: 'India',
      },
      pricing: draft.pricing,
      paymentMethod: 'razorpay',
      paymentStatus,
      status: 'Pending',
    });

    for (let i = 0; i < order.subOrders.length; i += 1) {
      const sub = order.subOrders[i];
      const target = statuses[i] || 'Pending';
      sub.status = target;
      if (deliveryPartner && ['Assigned', 'Picked Up', 'Out for Delivery', 'Delivered'].includes(target)) {
        sub.deliveryPartner = deliveryPartner;
      }
      sub.tracking = [
        { status: 'Pending', note: 'Order placed.' },
        { status: 'Confirmed', note: 'Payment verified.' },
        ...(target !== 'Confirmed' ? [{ status: target, note: `Status updated to ${target}.` }] : []),
      ];
    }
    order.recalculateStatus();
    if (order.status === 'Delivered') order.deliveredAt = new Date();
    await order.save();

    if (paymentStatus === 'paid') {
      const payment = await Payment.create({
        order: order._id,
        user: customer._id,
        amount: order.pricing.grandTotal,
        provider: 'razorpay',
        providerOrderId: `seed_order_${order._id}`,
        providerPaymentId: `seed_pay_${order._id}`,
        status: 'paid',
        method: 'upi',
        isDemo: true,
        paidAt: new Date(),
      });
      order.payment = payment._id;
      await order.save();
      await createCommissionsForOrder(order);
    }
    return order;
  };

  const deliveredOrder = await makeOrder({
    items: [
      { product: products[0], quantity: 1 },
      { product: products[2], quantity: 1 },
    ],
    statuses: ['Delivered'],
    paymentStatus: 'paid',
    deliveryPartner: deliveryUser._id,
    coupon: { code: 'WELCOME10', discountType: 'percentage', discountValue: 10, maxDiscount: 200, minOrderValue: 499 },
  });
  await Commission.updateMany(
    { order: deliveredOrder._id },
    { sellerPayoutStatus: 'settled', deliveryPayoutStatus: 'settled', settledAt: new Date() }
  );
  await DeliveryPartnerProfile.findOneAndUpdate(
    { user: deliveryUser._id },
    { $inc: { totalDeliveries: 1, totalEarnings: deliveredOrder.subOrders[0].deliveryPartnerAmount } }
  );

  await makeOrder({
    items: [
      { product: products[4], quantity: 2 },
      { product: products[11], quantity: 1 },
    ],
    statuses: ['Processing'],
    paymentStatus: 'paid',
  });

  await makeOrder({
    items: [{ product: products[13], quantity: 1 }],
    statuses: ['Confirmed'],
    paymentStatus: 'pending',
  });

  const pendingOrder = await makeOrder({
    items: [
      { product: products[1], quantity: 1 },
    ],
    statuses: ['Ready for Pickup'],
    paymentStatus: 'paid',
  });

  console.log(`Sample orders created: ${await Order.countDocuments()}`);
  console.log('Sample order ready for delivery assignment:', pendingOrder.orderNumber);

  console.log('\n=== MarketSphere seed complete ===');
  console.log('Admin:    admin@marketsphere.test / Admin@123');
  console.log('Seller 1: seller@marketsphere.test / Seller@123 (TechNova Store)');
  console.log('Seller 2: seller2@marketsphere.test / Seller@123 (UrbanThread Living)');
  console.log('Customer: customer@marketsphere.test / Customer@123');
  console.log('Delivery: delivery@marketsphere.test / Delivery@123');
  console.log(`Products: ${products.length}, Categories: ${Object.keys(categories).length}`);
  console.log('Coupons: WELCOME10 (10% max ₹200), FESTIVE500 (₹500 off above ₹2999)');
  console.log('Address seeded for the customer.');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch(async (err) => {
  console.error('Seed failed:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
