const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    subOrderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    itemsTotal: { type: Number, required: true },
    commissionRate: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    sellerAmount: { type: Number, required: true },
    deliveryCharge: { type: Number, default: 0 },
    deliveryPartnerAmount: { type: Number, default: 0 },
    sellerPayoutStatus: {
      type: String,
      enum: ['pending', 'settled'],
      default: 'pending',
      index: true,
    },
    deliveryPayoutStatus: {
      type: String,
      enum: ['pending', 'settled'],
      default: 'pending',
      index: true,
    },
    settledAt: Date,
  },
  { timestamps: true }
);

commissionSchema.index({ seller: 1, createdAt: -1 });
commissionSchema.index({ deliveryPartner: 1, createdAt: -1 });

module.exports = mongoose.model('Commission', commissionSchema);
