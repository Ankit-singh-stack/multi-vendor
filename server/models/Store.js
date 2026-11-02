const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    sellerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerProfile' },
    name: { type: String, required: true, trim: true },
    slug: { type: String, index: true },
    description: { type: String, default: '', maxlength: 2000 },
    logo: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
    banner: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
    address: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    totalProducts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

storeSchema.pre('save', function (next) {
  if (!this.slug || this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Store', storeSchema);
