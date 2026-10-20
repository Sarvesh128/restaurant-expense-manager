const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant reference is required'],
      index: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    originalFileName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true
    },
    storedFileName: {
      type: String,
      required: [true, 'Stored file name is required'],
      trim: true
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      enum: {
        values: ['application/pdf', 'image/jpeg', 'image/png'],
        message: '{VALUE} is not a supported file MIME type'
      },
      trim: true
    },
    fileSizeBytes: {
      type: Number,
      required: [true, 'File size in bytes is required'],
      min: [1, 'File size must be greater than 0']
    },
    fileHash: {
      type: String,
      trim: true,
      default: ''
    },
    storageKey: {
      type: String,
      required: [true, 'Storage key is required'],
      trim: true
    },
    processingStatus: {
      type: String,
      enum: {
        values: ['UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED'],
        message: '{VALUE} is not a valid processing status'
      },
      default: 'UPLOADED',
      uppercase: true,
      trim: true
    },
    errorMessage: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Virtual aliases for API & doc specification compatibility
documentSchema.virtual('originalName').get(function () {
  return this.originalFileName;
});

documentSchema.virtual('storedFilename').get(function () {
  return this.storedFileName;
});

documentSchema.virtual('size').get(function () {
  return this.fileSizeBytes;
});

documentSchema.virtual('status').get(function () {
  return this.processingStatus;
});

// Index for multi-tenant query ordering
documentSchema.index({ restaurantId: 1, createdAt: -1 });

// Safe JSON and Object serializers
documentSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});
documentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Document', documentSchema);
