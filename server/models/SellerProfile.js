const mongoose = require('mongoose');

const sellerProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true, trim: true },
    ownerName: { type: String, default: '', trim: true },
    gstNumber: { type: String, default: '', trim: true, uppercase: true },
    phone: { type: String, default: '', trim: true },
    description: { type: String, default: '', maxlength: 1000 },
    logo: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
      index: true,
    },
    rejectionReason: { type: String, default: '' },
    commissionRate: { type: Number, default: 10, min: 0, max: 100 },
    approvedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('SellerProfile', sellerProfileSchema);
