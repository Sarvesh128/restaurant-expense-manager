const mongoose = require('mongoose');

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 400;
  }
}

/**
 * Middleware to validate Document ID parameter.
 */
const validateDocumentId = (req, res, next) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid document ID format. Must be a valid 24-character hexadecimal ObjectId.'
    });
  }

  next();
};

/**
 * Middleware to validate Document Query parameters.
 */
const validateQueryDocument = (req, res, next) => {
  try {
    const { page, limit, status, processingStatus, mimeType, sortBy, sortOrder } = req.query;

    if (page !== undefined) {
      const parsedPage = parseInt(page, 10);
      if (isNaN(parsedPage) || parsedPage < 1) {
        throw new ValidationError('Query parameter "page" must be a positive integer starting at 1.');
      }
    }

    if (limit !== undefined) {
      const parsedLimit = parseInt(limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        throw new ValidationError('Query parameter "limit" must be an integer between 1 and 100.');
      }
    }

    const validMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (mimeType !== undefined && mimeType.trim() !== '') {
      if (!validMimeTypes.includes(mimeType.trim())) {
        throw new ValidationError(`Invalid query mimeType '${mimeType}'. Allowed MIME types: [${validMimeTypes.join(', ')}].`);
      }
    }

    const targetStatus = status || processingStatus;
    const validStatuses = ['UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED'];
    if (targetStatus !== undefined && targetStatus.trim() !== '') {
      if (!validStatuses.includes(targetStatus.trim().toUpperCase())) {
        throw new ValidationError(`Invalid document status '${targetStatus}'. Allowed statuses: [${validStatuses.join(', ')}].`);
      }
    }

    const allowedSortFields = ['createdAt', 'originalFileName', 'fileSizeBytes', 'mimeType', 'processingStatus'];
    if (sortBy !== undefined && !allowedSortFields.includes(sortBy.trim())) {
      throw new ValidationError(`Invalid sortBy field '${sortBy}'. Allowed sort fields: [${allowedSortFields.join(', ')}].`);
    }

    if (sortOrder !== undefined) {
      const normalizedOrder = sortOrder.trim().toLowerCase();
      if (!['asc', 'desc'].includes(normalizedOrder)) {
        throw new ValidationError('Query parameter "sortOrder" must be either "asc" or "desc".');
      }
    }

    next();
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  validateDocumentId,
  validateQueryDocument,
  ValidationError
};
