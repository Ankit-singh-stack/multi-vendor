const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    subOrderId: { type: mongoose.Schema.Types.ObjectId, default: null },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'processed'],
      default: 'pending',
      index: true,
    },
    adminNote: { type: String, default: '' },
    processedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Refund', refundSchema);
