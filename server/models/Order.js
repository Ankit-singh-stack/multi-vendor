const mongoose = require('mongoose');

const ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'Processing',
  'Ready for Pickup',
  'Assigned',
  'Picked Up',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Returned',
  'Refunded',
];

const trackingSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    note: { type: String, default: '' },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const subOrderSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    storeName: { type: String, default: '' },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        image: { type: String, default: '' },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        subtotal: { type: Number, required: true },
      },
    ],
    status: { type: String, enum: ORDER_STATUSES, default: 'Pending', index: true },
    itemsTotal: { type: Number, required: true },
    deliveryCharge: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 0 },
    commissionAmount: { type: Number, default: 0 },
    sellerAmount: { type: Number, default: 0 },
    deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deliveryPartnerAmount: { type: Number, default: 0 },
    tracking: [trackingSchema],
  },
  { timestamps: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subOrders: [subOrderSchema],
    shippingAddress: {
      fullName: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    pricing: {
      itemsTotal: { type: Number, default: 0 },
      deliveryTotal: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      grandTotal: { type: Number, default: 0 },
      couponCode: { type: String, default: '' },
    },
    paymentMethod: { type: String, enum: ['razorpay', 'cod'], default: 'razorpay' },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'Pending',
      index: true,
    },
    customerNote: { type: String, default: '', maxlength: 500 },
    deliveredAt: Date,
    cancelledAt: Date,
    cancelReason: { type: String, default: '' },
  },
  { timestamps: true }
);

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ 'subOrders.seller': 1, createdAt: -1 });
orderSchema.index({ 'subOrders.deliveryPartner': 1 });

orderSchema.methods.recalculateStatus = function () {
  const active = this.subOrders.filter((s) => s.status !== 'Cancelled');
  if (!active.length) {
    this.status = 'Cancelled';
    return this.status;
  }
  const rank = (s) => ORDER_STATUSES.indexOf(s);
  const delivered = active.every((s) => s.status === 'Delivered');
  if (delivered) {
    this.status = 'Delivered';
  } else if (active.every((s) => ['Returned', 'Refunded'].includes(s.status))) {
    this.status = active.some((s) => s.status === 'Refunded') ? 'Refunded' : 'Returned';
  } else {
    const minRank = Math.min(...active.map((s) => rank(s.status)));
    this.status = ORDER_STATUSES[minRank] || 'Pending';
  }
  return this.status;
};

orderSchema.statics.STATUSES = ORDER_STATUSES;

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
