const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Document = require('../models/Document');
const { getDocumentsDir } = require('../middleware/upload.middleware');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Ensures database is connected for persistent document metadata storage.
 * Fails fast without faking persistence if the database is in fallback mode or disconnected.
 */
const verifyDatabaseConnection = () => {
  if (global.DEV_FALLBACK_MODE) {
    throw new AppError(
      'Database unavailable: In-memory fallback mode does not support persistent document storage. An active MongoDB connection is required.',
      503
    );
  }

  if (process.env.NODE_ENV !== 'test' && (!mongoose.connection || mongoose.connection.readyState !== 1)) {
    throw new AppError(
      'Database unavailable: Persistent document storage requires an active MongoDB connection.',
      503
    );
  }
};

/**
 * Extracts and validates restaurantId from the authenticated user.
 * Enforces strict multi-tenant isolation.
 */
const extractRestaurantId = (user) => {
  if (!user) {
    throw new AppError('Authentication required.', 401);
  }

  const rawRestaurantId = user.restaurantId
    ? user.restaurantId._id || user.restaurantId.id || user.restaurantId
    : null;

  if (!rawRestaurantId) {
    throw new AppError('Forbidden: User is not associated with any restaurant.', 403);
  }

  return new mongoose.Types.ObjectId(rawRestaurantId.toString());
};

/**
 * Extracts user ID from authenticated token payload.
 */
const extractUserId = (user) => {
  if (!user) {
    throw new AppError('Authentication required.', 401);
  }
  const userId = user.userId || user.id || user._id;
  if (!userId) {
    throw new AppError('Authentication user identity is invalid.', 401);
  }
  return new mongoose.Types.ObjectId(userId.toString());
};

/**
 * Computes SHA-256 hash of a file on disk for audit metadata.
 *
 * @param {string} filePath
 * @returns {string}
 */
const computeFileHash = (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  } catch (err) {
    return '';
  }
};

/**
 * Upload and persist document metadata in MongoDB.
 *
 * @param {Object} file - Multer file object
 * @param {Object} user - Authenticated user payload
 * @returns {Promise<{ success: boolean, document: Object }>}
 */
const uploadDocument = async (file, user) => {
  try {
    verifyDatabaseConnection();
  } catch (dbErr) {
    // Clean up temporary stored file if DB is unavailable
    if (file && file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (e) { }
    }
    throw dbErr;
  }

  const restaurantId = extractRestaurantId(user);
  const uploadedBy = extractUserId(user);

  const fileHash = computeFileHash(file.path);
  const storedFileName = file.filename;
  const storageKey = `documents/${storedFileName}`;
  const sanitizedOriginalName = path.basename(file.originalname).replace(/[\r\n]/g, '');

  try {
    const document = await Document.create({
      restaurantId,
      uploadedBy,
      originalFileName: sanitizedOriginalName,
      storedFileName,
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
      fileHash,
      storageKey,
      processingStatus: 'UPLOADED'
    });

    return {
      success: true,
      document: document.toJSON()
    };
  } catch (error) {
    // Atomically clean up uploaded file on disk if metadata persistence fails
    if (file && file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (unlinkErr) { }
    }
    throw error;
  }
};

/**
 * List & page documents scoped strictly to the authenticated restaurant.
 *
 * @param {Object} queryParams
 * @param {Object} user
 * @returns {Promise<{ success: boolean, documents: Array, pagination: Object }>}
 */
const getDocuments = async (queryParams = {}, user) => {
  verifyDatabaseConnection();
  const restaurantId = extractRestaurantId(user);

  const {
    page = 1,
    limit = 10,
    status,
    processingStatus,
    mimeType,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = queryParams;

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (parsedPage - 1) * parsedLimit;

  // Strict tenant scoping
  const query = { restaurantId };

  const targetStatus = status || processingStatus;
  if (targetStatus && targetStatus.trim()) {
    query.processingStatus = targetStatus.trim().toUpperCase();
  }

  if (mimeType && mimeType.trim()) {
    query.mimeType = mimeType.trim();
  }

  const allowedSortFields = ['createdAt', 'originalFileName', 'fileSizeBytes', 'mimeType', 'processingStatus'];
  const sanitizedSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortDirection = sortOrder && sortOrder.toLowerCase() === 'asc' ? 1 : -1;
  const sort = { [sanitizedSortBy]: sortDirection, _id: -1 };

  const [totalCount, docs] = await Promise.all([
    Document.countDocuments(query),
    Document.find(query).sort(sort).skip(skip).limit(parsedLimit).lean()
  ]);

  const totalPages = Math.ceil(totalCount / parsedLimit) || 1;

  // Format lean documents with sanitized fields and virtual compatibility
  const formattedDocs = docs.map((doc) => {
    const docId = doc._id.toString();
    return {
      id: docId,
      restaurantId: doc.restaurantId,
      uploadedBy: doc.uploadedBy,
      originalFileName: doc.originalFileName,
      originalName: doc.originalFileName,
      storedFileName: doc.storedFileName,
      storedFilename: doc.storedFileName,
      mimeType: doc.mimeType,
      fileSizeBytes: doc.fileSizeBytes,
      size: doc.fileSizeBytes,
      fileHash: doc.fileHash,
      storageKey: doc.storageKey,
      processingStatus: doc.processingStatus,
      status: doc.processingStatus,
      errorMessage: doc.errorMessage || '',
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  });

  return {
    success: true,
    documents: formattedDocs,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      totalCount,
      totalPages,
      hasNextPage: parsedPage < totalPages,
      hasPrevPage: parsedPage > 1
    }
  };
};

/**
 * Retrieve single document metadata with strict tenant verification.
 *
 * @param {string} id
 * @param {Object} user
 * @returns {Promise<{ success: boolean, document: Object }>}
 */
const getDocumentById = async (id, user) => {
  verifyDatabaseConnection();
  const restaurantId = extractRestaurantId(user);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid document ID format. Must be a valid 24-character hexadecimal ObjectId.', 400);
  }

  const document = await Document.findOne({
    _id: new mongoose.Types.ObjectId(id),
    restaurantId
  });

  if (!document) {
    throw new AppError('Document not found.', 404);
  }

  return {
    success: true,
    document: document.toJSON()
  };
};

/**
 * Retrieve original file path for secure download with tenant authorization.
 *
 * @param {string} id
 * @param {Object} user
 * @returns {Promise<{ document: Object, filePath: string }>}
 */
const downloadDocument = async (id, user) => {
  verifyDatabaseConnection();
  const restaurantId = extractRestaurantId(user);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid document ID format. Must be a valid 24-character hexadecimal ObjectId.', 400);
  }

  const document = await Document.findOne({
    _id: new mongoose.Types.ObjectId(id),
    restaurantId
  });

  if (!document) {
    throw new AppError('Document not found.', 404);
  }

  const documentsDir = getDocumentsDir();
  const filePath = path.resolve(documentsDir, document.storedFileName);

  // Prevent directory traversal
  if (!filePath.startsWith(path.resolve(documentsDir))) {
    throw new AppError('Access denied: Invalid file path.', 403);
  }

  if (!fs.existsSync(filePath)) {
    throw new AppError('Document file not found on storage server.', 404);
  }

  return {
    document,
    filePath
  };
};

module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  downloadDocument,
  verifyDatabaseConnection,
  AppError
};
