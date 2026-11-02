const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    provider: { type: String, default: 'razorpay' },
    providerOrderId: { type: String, default: '', index: true },
    providerPaymentId: { type: String, default: '' },
    signature: { type: String, default: '' },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    method: { type: String, default: '' },
    isDemo: { type: Boolean, default: false },
    failureReason: { type: String, default: '' },
    paidAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
