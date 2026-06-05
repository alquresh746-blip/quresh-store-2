import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      default: null,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['keyboard', 'mouse', 'headset', 'monitor', 'mousepad', 'controller', 'accessories', 'laptop', 'other'],
    },
    images: {
      type: [String],
      validate: {
        validator: (arr) => arr.length >= 1,
        message: 'At least one image is required',
      },
    },
    specs: {
      type: Map,
      of: String,
      default: {},
    },
    tags: [String],
    wholesalePrice: {
      type: Number,
      default: null,
      min: [0, 'Wholesale price cannot be negative'],
    },
    minWholesaleQty: {
      type: Number,
      default: 5,
      min: [1, 'Minimum wholesale quantity must be at least 1'],
    },
    isWholesaleAvailable: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    soldCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

productSchema.index({ name: 'text', description: 'text', tags: 'text' });

export default mongoose.model('Product', productSchema);
