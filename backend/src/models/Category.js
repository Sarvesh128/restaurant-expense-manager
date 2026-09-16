const mongoose = require('mongoose');

const DEFAULT_CATEGORIES = [
  'Raw Materials',
  'Utilities',
  'Salaries',
  'Rent',
  'Packaging',
  'Maintenance',
  'Transportation',
  'Miscellaneous'
];

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null // Null indicates global default system category
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

categorySchema.statics.DEFAULT_CATEGORIES = DEFAULT_CATEGORIES;

module.exports = mongoose.model('Category', categorySchema);
