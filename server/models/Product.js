const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 160 },
    slug: { type: String, index: true },
    description: { type: String, required: [true, 'Description is required'], maxlength: 5000 },
    brand: { type: String, default: '', trim: true },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, default: '' },
      },
    ],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: 0, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    sold: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'draft', 'inactive', 'blocked'],
      default: 'active',
      index: true,
    },
    isFeatured: { type: Boolean, default: false },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.virtual('effectivePrice').get(function () {
  return this.discountPrice > 0 && this.discountPrice < this.price ? this.discountPrice : this.price;
});

productSchema.virtual('discountPercent').get(function () {
  if (this.discountPrice > 0 && this.discountPrice < this.price) {
    return Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  return 0;
});

productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

productSchema.pre('save', function (next) {
  if (!this.slug || this.isModified('name')) {
    this.slug =
      this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      Math.random().toString(36).slice(2, 6);
  }
  next();
});

productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
