const mongoose = require('mongoose');
const Expense = require('../models/Expense');

/**
 * Custom Error for validation failures.
 */
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 400;
  }
}

/**
 * Escapes regex special characters safely.
 */
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Middleware to validate Expense ID parameter.
 */
const validateExpenseId = (req, res, next) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid expense ID format. Must be a valid 24-character hexadecimal ObjectId.'
    });
  }

  next();
};

/**
 * Middleware to validate Expense Creation payload.
 */
const validateCreateExpense = (req, res, next) => {
  try {
    const { description, vendor, amount, category, date, paymentMethod, currency, subcategory, invoiceNumber, notes } = req.body;

    // 1. Description validation
    if (!description || typeof description !== 'string' || !description.trim()) {
      throw new ValidationError('Expense description is required.');
    }

    // 2. Vendor validation
    if (!vendor || typeof vendor !== 'string' || !vendor.trim()) {
      throw new ValidationError('Vendor name is required.');
    }

    // 3. Amount validation
    if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount)) {
      throw new ValidationError('Expense amount must be a valid number.');
    }
    if (amount <= 0) {
      throw new ValidationError('Expense amount must be greater than 0.');
    }

    // 4. Category validation (reuse Expense.CATEGORIES source of truth)
    if (!category || typeof category !== 'string' || !category.trim()) {
      throw new ValidationError('Expense category is required.');
    }
    if (!Expense.CATEGORIES.includes(category.trim())) {
      throw new ValidationError(
        `Invalid category '${category}'. Allowed categories: [${Expense.CATEGORIES.join(', ')}].`
      );
    }

    // 5. Date validation (optional, defaults to now)
    if (date !== undefined && date !== null) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new ValidationError('Invalid date format. Please provide a valid ISO-8601 or YYYY-MM-DD date.');
      }
    }

    // 6. Payment method validation (optional, defaults to OTHER)
    if (paymentMethod !== undefined && paymentMethod !== null) {
      if (typeof paymentMethod !== 'string') {
        throw new ValidationError('Payment method must be a string.');
      }
      const normalizedPayment = paymentMethod.trim().toUpperCase();
      if (!Expense.PAYMENT_METHODS.includes(normalizedPayment)) {
        throw new ValidationError(
          `Invalid payment method '${paymentMethod}'. Allowed methods: [${Expense.PAYMENT_METHODS.join(', ')}].`
        );
      }
    }

    // 7. Currency validation (optional)
    if (currency !== undefined && currency !== null) {
      if (typeof currency !== 'string' || !currency.trim()) {
        throw new ValidationError('Currency must be a non-empty string.');
      }
    }

    // 8. Optional string validations
    if (subcategory !== undefined && subcategory !== null && typeof subcategory !== 'string') {
      throw new ValidationError('Subcategory must be a string.');
    }
    if (invoiceNumber !== undefined && invoiceNumber !== null && typeof invoiceNumber !== 'string') {
      throw new ValidationError('Invoice number must be a string.');
    }
    if (notes !== undefined && notes !== null && typeof notes !== 'string') {
      throw new ValidationError('Notes must be a string.');
    }

    next();
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Middleware to validate Expense Update payload (supports partial updates).
 */
const validateUpdateExpense = (req, res, next) => {
  try {
    const { body } = req;

    if (!body || Object.keys(body).length === 0) {
      throw new ValidationError('Update payload cannot be empty. Please provide at least one field to update.');
    }

    const {
      description,
      vendor,
      amount,
      category,
      date,
      paymentMethod,
      currency,
      subcategory,
      invoiceNumber,
      notes,
      verificationStatus,
      reconciliationStatus,
      anomalyStatus,
      duplicateStatus
    } = body;

    // Validate description if provided
    if (description !== undefined) {
      if (typeof description !== 'string' || !description.trim()) {
        throw new ValidationError('Expense description cannot be empty.');
      }
    }

    // Validate vendor if provided
    if (vendor !== undefined) {
      if (typeof vendor !== 'string' || !vendor.trim()) {
        throw new ValidationError('Vendor name cannot be empty.');
      }
    }

    // Validate amount if provided
    if (amount !== undefined) {
      if (typeof amount !== 'number' || isNaN(amount)) {
        throw new ValidationError('Expense amount must be a valid number.');
      }
      if (amount <= 0) {
        throw new ValidationError('Expense amount must be greater than 0.');
      }
    }

    // Validate category if provided
    if (category !== undefined) {
      if (typeof category !== 'string' || !category.trim()) {
        throw new ValidationError('Expense category cannot be empty.');
      }
      if (!Expense.CATEGORIES.includes(category.trim())) {
        throw new ValidationError(
          `Invalid category '${category}'. Allowed categories: [${Expense.CATEGORIES.join(', ')}].`
        );
      }
    }

    // Validate date if provided
    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new ValidationError('Invalid date format. Please provide a valid ISO-8601 or YYYY-MM-DD date.');
      }
    }

    // Validate paymentMethod if provided
    if (paymentMethod !== undefined) {
      if (typeof paymentMethod !== 'string') {
        throw new ValidationError('Payment method must be a string.');
      }
      const normalizedPayment = paymentMethod.trim().toUpperCase();
      if (!Expense.PAYMENT_METHODS.includes(normalizedPayment)) {
        throw new ValidationError(
          `Invalid payment method '${paymentMethod}'. Allowed methods: [${Expense.PAYMENT_METHODS.join(', ')}].`
        );
      }
    }

    // Validate currency if provided
    if (currency !== undefined) {
      if (typeof currency !== 'string' || !currency.trim()) {
        throw new ValidationError('Currency must be a non-empty string.');
      }
    }

    // Validate statuses if provided
    const validVerificationStatuses = ['VERIFIED', 'PENDING_REVIEW', 'REJECTED'];
    if (verificationStatus !== undefined) {
      if (typeof verificationStatus !== 'string' || !validVerificationStatuses.includes(verificationStatus.trim().toUpperCase())) {
        throw new ValidationError(`Invalid verification status '${verificationStatus}'. Allowed: [${validVerificationStatuses.join(', ')}].`);
      }
    }

    const validReconciliationStatuses = ['UNRECONCILED', 'MATCHED', 'DISCREPANCY'];
    if (reconciliationStatus !== undefined) {
      if (typeof reconciliationStatus !== 'string' || !validReconciliationStatuses.includes(reconciliationStatus.trim().toUpperCase())) {
        throw new ValidationError(`Invalid reconciliation status '${reconciliationStatus}'. Allowed: [${validReconciliationStatuses.join(', ')}].`);
      }
    }

    const validAnomalyStatuses = ['NORMAL', 'ANOMALY_FLAGGED'];
    if (anomalyStatus !== undefined) {
      if (typeof anomalyStatus !== 'string' || !validAnomalyStatuses.includes(anomalyStatus.trim().toUpperCase())) {
        throw new ValidationError(`Invalid anomaly status '${anomalyStatus}'. Allowed: [${validAnomalyStatuses.join(', ')}].`);
      }
    }

    const validDuplicateStatuses = ['UNIQUE', 'POTENTIAL_DUPLICATE'];
    if (duplicateStatus !== undefined) {
      if (typeof duplicateStatus !== 'string' || !validDuplicateStatuses.includes(duplicateStatus.trim().toUpperCase())) {
        throw new ValidationError(`Invalid duplicate status '${duplicateStatus}'. Allowed: [${validDuplicateStatuses.join(', ')}].`);
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

/**
 * Middleware to validate Expense Query / Filter parameters.
 */
const validateQueryExpense = (req, res, next) => {
  try {
    const { page, limit, startDate, endDate, minAmount, maxAmount, sortBy, sortOrder, category, paymentMethod } = req.query;

    // 1. Pagination validations
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

    // 2. Date range validations
    let startD = null;
    let endD = null;

    if (startDate !== undefined) {
      startD = new Date(startDate);
      if (isNaN(startD.getTime())) {
        throw new ValidationError('Query parameter "startDate" must be a valid date.');
      }
    }

    if (endDate !== undefined) {
      endD = new Date(endDate);
      if (isNaN(endD.getTime())) {
        throw new ValidationError('Query parameter "endDate" must be a valid date.');
      }
    }

    if (startD && endD && startD > endD) {
      throw new ValidationError('Query parameter "startDate" cannot be later than "endDate".');
    }

    // 3. Amount range validations
    let minA = null;
    let maxA = null;

    if (minAmount !== undefined) {
      minA = parseFloat(minAmount);
      if (isNaN(minA) || minA < 0) {
        throw new ValidationError('Query parameter "minAmount" must be a non-negative number.');
      }
    }

    if (maxAmount !== undefined) {
      maxA = parseFloat(maxAmount);
      if (isNaN(maxA) || maxA < 0) {
        throw new ValidationError('Query parameter "maxAmount" must be a non-negative number.');
      }
    }

    if (minA !== null && maxA !== null && minA > maxA) {
      throw new ValidationError('Query parameter "minAmount" cannot be greater than "maxAmount".');
    }

    // 4. Category validation
    if (category !== undefined && category.trim() !== '') {
      if (!Expense.CATEGORIES.includes(category.trim())) {
        throw new ValidationError(
          `Invalid query category '${category}'. Allowed categories: [${Expense.CATEGORIES.join(', ')}].`
        );
      }
    }

    // 5. Payment method validation
    if (paymentMethod !== undefined && paymentMethod.trim() !== '') {
      const normPayment = paymentMethod.trim().toUpperCase();
      if (!Expense.PAYMENT_METHODS.includes(normPayment)) {
        throw new ValidationError(
          `Invalid query paymentMethod '${paymentMethod}'. Allowed methods: [${Expense.PAYMENT_METHODS.join(', ')}].`
        );
      }
    }

    // 6. Sorting validations
    const allowedSortFields = ['date', 'amount', 'vendor', 'category', 'createdAt', 'description'];
    if (sortBy !== undefined && !allowedSortFields.includes(sortBy.trim())) {
      throw new ValidationError(
        `Invalid sortBy field '${sortBy}'. Allowed sort fields: [${allowedSortFields.join(', ')}].`
      );
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
  validateExpenseId,
  validateCreateExpense,
  validateUpdateExpense,
  validateQueryExpense,
  escapeRegex,
  ValidationError
};
