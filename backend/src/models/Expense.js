const mongoose = require('mongoose');

const EXPENSE_CATEGORIES = [
  'Raw Materials',
  'Utilities',
  'Salaries',
  'Rent',
  'Packaging',
  'Maintenance',
  'Transportation',
  'Miscellaneous'
];

const PAYMENT_METHODS = [
  'CASH',
  'BANK_TRANSFER',
  'CREDIT_CARD',
  'UPI',
  'CHEQUE',
  'OTHER'
];

const expenseSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant reference is required'],
      index: true
    },
    description: {
      type: String,
      required: [true, 'Expense description is required'],
      trim: true
    },
    vendor: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true,
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0.01, 'Expense amount must be greater than 0']
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true
    },
    category: {
      type: String,
      required: [true, 'Expense category is required'],
      enum: {
        values: EXPENSE_CATEGORIES,
        message: '{VALUE} is not a valid expense category'
      },
      index: true
    },
    subcategory: {
      type: String,
      trim: true,
      default: ''
    },
    date: {
      type: Date,
      required: [true, 'Expense date is required'],
      default: Date.now,
      index: true
    },
    paymentMethod: {
      type: String,
      enum: {
        values: PAYMENT_METHODS,
        message: '{VALUE} is not a valid payment method'
      },
      default: 'OTHER',
      uppercase: true,
      trim: true
    },
    invoiceNumber: {
      type: String,
      trim: true,
      default: ''
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null
    },
    source: {
      type: String,
      enum: {
        values: ['MANUAL', 'OCR_UPLOAD', 'IMPORT'],
        message: '{VALUE} is not a valid source type'
      },
      default: 'MANUAL',
      uppercase: true,
      trim: true
    },
    confidenceScore: {
      type: Number,
      default: 1.0,
      min: 0.0,
      max: 1.0
    },
    verificationStatus: {
      type: String,
      enum: {
        values: ['VERIFIED', 'PENDING_REVIEW', 'REJECTED'],
        message: '{VALUE} is not a valid verification status'
      },
      default: 'VERIFIED',
      uppercase: true,
      trim: true
    },
    reconciliationStatus: {
      type: String,
      enum: {
        values: ['UNRECONCILED', 'MATCHED', 'DISCREPANCY'],
        message: '{VALUE} is not a valid reconciliation status'
      },
      default: 'UNRECONCILED',
      uppercase: true,
      trim: true
    },
    anomalyStatus: {
      type: String,
      enum: {
        values: ['NORMAL', 'ANOMALY_FLAGGED'],
        message: '{VALUE} is not a valid anomaly status'
      },
      default: 'NORMAL',
      uppercase: true,
      trim: true
    },
    duplicateStatus: {
      type: String,
      enum: {
        values: ['UNIQUE', 'POTENTIAL_DUPLICATE'],
        message: '{VALUE} is not a valid duplicate status'
      },
      default: 'UNIQUE',
      uppercase: true,
      trim: true
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

expenseSchema.statics.CATEGORIES = EXPENSE_CATEGORIES;
expenseSchema.statics.PAYMENT_METHODS = PAYMENT_METHODS;

module.exports = mongoose.model('Expense', expenseSchema);
