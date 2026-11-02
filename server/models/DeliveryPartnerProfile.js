const mongoose = require('mongoose');

const deliveryPartnerProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    vehicleType: { type: String, enum: ['bike', 'scooter', 'cycle', 'car', 'other'], default: 'bike' },
    vehicleNumber: { type: String, default: '', trim: true, uppercase: true },
    licenseNumber: { type: String, default: '', trim: true, uppercase: true },
    serviceArea: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
      index: true,
    },
    rejectionReason: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true },
    totalDeliveries: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    approvedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeliveryPartnerProfile', deliveryPartnerProfileSchema);
