const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const inMemoryStore = require('./inMemoryStore');

/**
 * Custom application error with HTTP status code.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Escapes regex special characters to prevent ReDoS / injection.
 */
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Extracts and validates restaurantId from the authenticated user.
 * Ensures strict multi-tenant isolation.
 */
const extractRestaurantId = (user) => {
  if (!user) {
    throw new AppError('Authentication required.', 401);
  }

  const rawRestaurantId = user.restaurantId ? (user.restaurantId._id || user.restaurantId) : null;

  if (!rawRestaurantId) {
    throw new AppError('Forbidden: User is not associated with any restaurant.', 403);
  }

  return new mongoose.Types.ObjectId(rawRestaurantId.toString());
};

/**
 * Create a new Expense record.
 * Tenant ownership is strictly derived from the authenticated user.
 *
 * @param {Object} data - Expense payload
 * @param {Object} user - Authenticated user object from JWT
 * @returns {Promise<{ success: boolean, expense: Object }>}
 */
const createExpense = async (data, user) => {
  const restaurantId = extractRestaurantId(user);

  if (global.DEV_FALLBACK_MODE) {
    return inMemoryStore.createExpense(data, user);
  }

  const expenseData = {
    restaurantId,
    description: data.description.trim(),
    vendor: data.vendor.trim(),
    amount: Number(data.amount),
    currency: data.currency ? data.currency.trim().toUpperCase() : 'INR',
    category: data.category.trim(),
    subcategory: data.subcategory ? data.subcategory.trim() : '',
    date: data.date ? new Date(data.date) : new Date(),
    paymentMethod: data.paymentMethod ? data.paymentMethod.trim().toUpperCase() : 'OTHER',
    invoiceNumber: data.invoiceNumber ? data.invoiceNumber.trim() : '',
    notes: data.notes ? data.notes.trim() : '',
    source: data.source && ['MANUAL', 'OCR_UPLOAD', 'IMPORT'].includes(data.source) ? data.source : 'MANUAL',
    confidenceScore: data.confidenceScore !== undefined ? Number(data.confidenceScore) : 1.0,
    verificationStatus: data.verificationStatus || 'VERIFIED',
    reconciliationStatus: data.reconciliationStatus || 'UNRECONCILED',
    anomalyStatus: data.anomalyStatus || 'NORMAL',
    duplicateStatus: data.duplicateStatus || 'UNIQUE'
  };

  const expense = await Expense.create(expenseData);

  return {
    success: true,
    expense
  };
};

/**
 * List & filter expenses with deterministic aggregations, sorting, and pagination.
 * Scoped strictly to the authenticated user's restaurant.
 *
 * @param {Object} queryParams - Filtering and pagination options
 * @param {Object} user - Authenticated user object
 * @returns {Promise<{ success: boolean, expenses: Array, pagination: Object }>}
 */
const getExpenses = async (queryParams = {}, user) => {
  const restaurantId = extractRestaurantId(user);

  if (global.DEV_FALLBACK_MODE) {
    return inMemoryStore.getExpenses(queryParams, user);
  }

  const {
    page = 1,
    limit = 10,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    category,
    paymentMethod,
    vendor,
    search,
    verificationStatus,
    reconciliationStatus,
    anomalyStatus,
    duplicateStatus,
    sortBy = 'date',
    sortOrder = 'desc'
  } = queryParams;

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (parsedPage - 1) * parsedLimit;

  // Base query strictly scoped to authenticated user's restaurant
  const query = {
    restaurantId
  };

  // Date range filter
  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      query.date.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      // Set to end of day if only YYYY-MM-DD was provided
      if (typeof endDate === 'string' && endDate.length <= 10) {
        end.setUTCHours(23, 59, 59, 999);
      }
      query.date.$lte = end;
    }
  }

  // Amount range filter
  if (minAmount !== undefined || maxAmount !== undefined) {
    query.amount = {};
    if (minAmount !== undefined) {
      query.amount.$gte = Number(minAmount);
    }
    if (maxAmount !== undefined) {
      query.amount.$lte = Number(maxAmount);
    }
  }

  // Category filter
  if (category && category.trim()) {
    query.category = category.trim();
  }

  // Payment method filter
  if (paymentMethod && paymentMethod.trim()) {
    query.paymentMethod = paymentMethod.trim().toUpperCase();
  }

  // Status filters
  if (verificationStatus && verificationStatus.trim()) {
    query.verificationStatus = verificationStatus.trim().toUpperCase();
  }
  if (reconciliationStatus && reconciliationStatus.trim()) {
    query.reconciliationStatus = reconciliationStatus.trim().toUpperCase();
  }
  if (anomalyStatus && anomalyStatus.trim()) {
    query.anomalyStatus = anomalyStatus.trim().toUpperCase();
  }
  if (duplicateStatus && duplicateStatus.trim()) {
    query.duplicateStatus = duplicateStatus.trim().toUpperCase();
  }

  // Vendor exact or partial search
  if (vendor && vendor.trim()) {
    const escapedVendor = escapeRegex(vendor.trim());
    query.vendor = { $regex: new RegExp(escapedVendor, 'i') };
  }

  // General text search across description, vendor, invoiceNumber, notes
  if (search && search.trim()) {
    const escapedSearch = escapeRegex(search.trim());
    const searchRegex = new RegExp(escapedSearch, 'i');
    query.$or = [
      { description: searchRegex },
      { vendor: searchRegex },
      { invoiceNumber: searchRegex },
      { notes: searchRegex }
    ];
  }

  // Controlled sort object
  const allowedSortFields = ['date', 'amount', 'vendor', 'category', 'createdAt', 'description'];
  const sanitizedSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'date';
  const sortDirection = sortOrder && sortOrder.toLowerCase() === 'asc' ? 1 : -1;
  const sort = { [sanitizedSortBy]: sortDirection, _id: -1 };

  // Execute count and query in parallel
  const [totalCount, expenses] = await Promise.all([
    Expense.countDocuments(query),
    Expense.find(query).sort(sort).skip(skip).limit(parsedLimit).lean()
  ]);

  const totalPages = Math.ceil(totalCount / parsedLimit) || 1;

  return {
    success: true,
    expenses,
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
 * Retrieve single expense by ID with tenant verification.
 *
 * @param {string} id - Expense ID
 * @param {Object} user - Authenticated user object
 * @returns {Promise<{ success: boolean, expense: Object }>}
 */
const getExpenseById = async (id, user) => {
  const restaurantId = extractRestaurantId(user);

  if (global.DEV_FALLBACK_MODE) {
    return inMemoryStore.getExpenseById(id, user);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid expense ID format.', 400);
  }

  const expense = await Expense.findOne({
    _id: new mongoose.Types.ObjectId(id),
    restaurantId
  });

  if (!expense) {
    throw new AppError('Expense not found.', 404);
  }

  return {
    success: true,
    expense
  };
};

/**
 * Update an existing expense with tenant verification and input validation.
 *
 * @param {string} id - Expense ID
 * @param {Object} updateData - Updatable fields
 * @param {Object} user - Authenticated user object
 * @returns {Promise<{ success: boolean, expense: Object }>}
 */
const updateExpense = async (id, updateData = {}, user) => {
  const restaurantId = extractRestaurantId(user);

  if (global.DEV_FALLBACK_MODE) {
    return inMemoryStore.updateExpense(id, updateData, user);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid expense ID format.', 400);
  }

  // Whitelist mutable fields to prevent privilege escalation or tenant swapping
  const allowedFields = [
    'description',
    'vendor',
    'amount',
    'currency',
    'category',
    'subcategory',
    'date',
    'paymentMethod',
    'invoiceNumber',
    'notes',
    'verificationStatus',
    'reconciliationStatus',
    'anomalyStatus',
    'duplicateStatus'
  ];

  const sanitizedUpdates = {};
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      if (typeof updateData[field] === 'string') {
        sanitizedUpdates[field] = updateData[field].trim();
      } else {
        sanitizedUpdates[field] = updateData[field];
      }
    }
  }

  if (sanitizedUpdates.amount !== undefined) {
    sanitizedUpdates.amount = Number(sanitizedUpdates.amount);
  }
  if (sanitizedUpdates.paymentMethod) {
    sanitizedUpdates.paymentMethod = sanitizedUpdates.paymentMethod.toUpperCase();
  }
  if (sanitizedUpdates.currency) {
    sanitizedUpdates.currency = sanitizedUpdates.currency.toUpperCase();
  }
  if (sanitizedUpdates.verificationStatus) {
    sanitizedUpdates.verificationStatus = sanitizedUpdates.verificationStatus.toUpperCase();
  }
  if (sanitizedUpdates.reconciliationStatus) {
    sanitizedUpdates.reconciliationStatus = sanitizedUpdates.reconciliationStatus.toUpperCase();
  }
  if (sanitizedUpdates.anomalyStatus) {
    sanitizedUpdates.anomalyStatus = sanitizedUpdates.anomalyStatus.toUpperCase();
  }
  if (sanitizedUpdates.duplicateStatus) {
    sanitizedUpdates.duplicateStatus = sanitizedUpdates.duplicateStatus.toUpperCase();
  }

  const updatedExpense = await Expense.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(id),
      restaurantId
    },
    { $set: sanitizedUpdates },
    { new: true, runValidators: true }
  );

  if (!updatedExpense) {
    throw new AppError('Expense not found.', 404);
  }

  return {
    success: true,
    expense: updatedExpense
  };
};

/**
 * Permanently delete an expense with tenant verification.
 * Follows documented permanent deletion strategy.
 *
 * @param {string} id - Expense ID
 * @param {Object} user - Authenticated user object
 * @returns {Promise<{ success: boolean, message: string, id: string }>}
 */
const deleteExpense = async (id, user) => {
  const restaurantId = extractRestaurantId(user);

  if (global.DEV_FALLBACK_MODE) {
    return inMemoryStore.deleteExpense(id, user);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid expense ID format.', 400);
  }

  const deletedExpense = await Expense.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(id),
    restaurantId
  });

  if (!deletedExpense) {
    throw new AppError('Expense not found.', 404);
  }

  return {
    success: true,
    message: 'Expense deleted successfully.',
    id: deletedExpense._id
  };
};

/**
 * Returns metadata from established models/constants (categories, payment methods, statuses).
 * Reuses existing sources of truth without duplication.
 *
 * @returns {Object}
 */
const getExpenseMetadata = () => {
  return {
    success: true,
    categories: Expense.CATEGORIES,
    paymentMethods: Expense.PAYMENT_METHODS,
    sources: ['MANUAL', 'OCR_UPLOAD', 'IMPORT'],
    verificationStatuses: ['VERIFIED', 'PENDING_REVIEW', 'REJECTED'],
    reconciliationStatuses: ['UNRECONCILED', 'MATCHED', 'DISCREPANCY'],
    anomalyStatuses: ['NORMAL', 'ANOMALY_FLAGGED'],
    duplicateStatuses: ['UNIQUE', 'POTENTIAL_DUPLICATE']
  };
};

/**
 * Deterministic Financial Aggregation Summary.
 * Computes exact totals, category breakdowns, and status counts using MongoDB Aggregations.
 *
 * @param {Object} queryParams - Date range and category filters
 * @param {Object} user - Authenticated user object
 * @returns {Promise<{ success: boolean, summary: Object }>}
 */
const getExpenseSummary = async (queryParams = {}, user) => {
  const restaurantId = extractRestaurantId(user);

  if (global.DEV_FALLBACK_MODE) {
    return inMemoryStore.getExpenseSummary(queryParams, user);
  }

  const { startDate, endDate, category } = queryParams;

  const matchStage = {
    restaurantId
  };

  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) {
      matchStage.date.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      if (typeof endDate === 'string' && endDate.length <= 10) {
        end.setUTCHours(23, 59, 59, 999);
      }
      matchStage.date.$lte = end;
    }
  }

  if (category && category.trim()) {
    matchStage.category = category.trim();
  }

  const [totalsResult, categoryResult, statusResult] = await Promise.all([
    // 1. Overall totals and count
    Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          expenseCount: { $sum: 1 },
          minAmount: { $min: '$amount' },
          maxAmount: { $max: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]),

    // 2. Category Breakdown
    Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]),

    // 3. Verification & Anomaly Status Breakdown
    Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            verificationStatus: '$verificationStatus',
            anomalyStatus: '$anomalyStatus'
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ])
  ]);

  const rawTotal = totalsResult.length > 0 ? totalsResult[0].totalAmount : 0;
  const expenseCount = totalsResult.length > 0 ? totalsResult[0].expenseCount : 0;
  const rawAvg = totalsResult.length > 0 ? totalsResult[0].avgAmount : 0;

  // Exact deterministic JavaScript rounding to 2 decimal places
  const totalAmount = Math.round(rawTotal * 100) / 100;
  const averageAmount = Math.round(rawAvg * 100) / 100;

  const categoryBreakdown = categoryResult.map((item) => ({
    category: item._id,
    totalAmount: Math.round(item.totalAmount * 100) / 100,
    count: item.count,
    percentage: rawTotal > 0 ? Math.round((item.totalAmount / rawTotal) * 10000) / 100 : 0
  }));

  const statusCounts = {
    verifiedCount: 0,
    pendingReviewCount: 0,
    rejectedCount: 0,
    anomalyFlaggedCount: 0
  };

  statusResult.forEach((item) => {
    if (item._id.verificationStatus === 'VERIFIED') statusCounts.verifiedCount += item.count;
    if (item._id.verificationStatus === 'PENDING_REVIEW') statusCounts.pendingReviewCount += item.count;
    if (item._id.verificationStatus === 'REJECTED') statusCounts.rejectedCount += item.count;
    if (item._id.anomalyStatus === 'ANOMALY_FLAGGED') statusCounts.anomalyFlaggedCount += item.count;
  });

  return {
    success: true,
    summary: {
      totalAmount,
      expenseCount,
      averageAmount,
      categoryBreakdown,
      statusCounts
    }
  };
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseMetadata,
  getExpenseSummary,
  AppError
};
