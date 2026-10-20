const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { generateToken } = require('../utils/jwt');
const Expense = require('../models/Expense');

/**
 * High-performance, zero-dependency in-memory store for Phase 1-4.
 * Enables running the full-stack system immediately without requiring
 * external MongoDB installation or remote network services.
 */
class InMemoryStore {
  constructor() {
    this.restaurants = new Map();
    this.users = new Map();
    this.expenses = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    // 1. Seed Default Demo Restaurant
    const demoRestaurantId = '660000000000000000000001';
    const demoRestaurant = {
      _id: demoRestaurantId,
      name: 'The Golden Bistro',
      currency: 'INR',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.restaurants.set(demoRestaurantId, demoRestaurant);

    // 2. Seed Default Demo User (Chef Marco)
    const demoUserId = '660000000000000000000002';
    const passwordHash = await bcrypt.hash('password123', 10);
    const demoUser = {
      _id: demoUserId,
      name: 'Chef Marco (Bistro Manager)',
      email: 'chef@bistro.com',
      passwordHash,
      role: 'ADMIN',
      restaurantId: demoRestaurantId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(demoUserId, demoUser);
    demoRestaurant.ownerId = demoUserId;

    // 3. Seed Realistic Restaurant Expenses from sample-data/expenses.csv
    try {
      const csvPath = path.join(__dirname, '../../../sample-data/expenses.csv');
      if (fs.existsSync(csvPath)) {
        const fileContent = fs.readFileSync(csvPath, 'utf8');
        const lines = fileContent.trim().split(/\r?\n/);
        // header: description,vendor,date,amount,category
        const paymentMethods = ['UPI', 'BANK_TRANSFER', 'CASH', 'CREDIT_CARD', 'CHEQUE'];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Parse CSV line handling potential quotes
          const match = line.match(/^"([^"]+)",([^,]+),([^,]+),([^,]+),([^,]+)$/) ||
                        line.match(/^([^,]+),([^,]+),([^,]+),([^,]+),([^,]+)$/);
          
          if (match) {
            const [, description, vendor, dateStr, amountStr, category] = match;
            const expenseId = new mongoose.Types.ObjectId().toString();
            const date = new Date(dateStr.trim());
            const amount = parseFloat(amountStr.trim()) || 100;
            const pMethod = paymentMethods[i % paymentMethods.length];
            const isReconciled = i % 3 !== 0;
            const isFlagged = i === 18 || i === 24; // Anomaly for expensive repairs/mutton

            const expenseRecord = {
              _id: expenseId,
              restaurantId: demoRestaurantId,
              description: description.trim(),
              vendor: vendor.trim(),
              amount,
              currency: 'INR',
              category: category.trim(),
              subcategory: '',
              date,
              paymentMethod: pMethod,
              invoiceNumber: `INV-2026-${String(i).padStart(3, '0')}`,
              notes: i === 18 ? 'Walk-in freezer emergency compressor repair' : '',
              source: i % 4 === 0 ? 'OCR_UPLOAD' : (i % 5 === 0 ? 'IMPORT' : 'MANUAL'),
              confidenceScore: 0.95,
              verificationStatus: 'VERIFIED',
              reconciliationStatus: isReconciled ? 'MATCHED' : 'UNRECONCILED',
              anomalyStatus: isFlagged ? 'ANOMALY_FLAGGED' : 'NORMAL',
              duplicateStatus: 'UNIQUE',
              createdAt: date,
              updatedAt: date
            };

            this.expenses.set(expenseId, expenseRecord);
          }
        }
      }
    } catch (err) {
      console.warn('[InMemoryStore]: Note loading sample CSV:', err.message);
    }

    this.initialized = true;
    console.log(`[InMemoryStore]: Initialized with ${this.expenses.size} expenses for restaurant "${demoRestaurant.name}".`);
  }

  // Auth Operations
  async registerUser({ name, email, password, restaurantName, role }) {
    await this.initialize();
    const normalizedEmail = email.trim().toLowerCase();

    for (const u of this.users.values()) {
      if (u.email === normalizedEmail) {
        const error = new Error('Email is already registered.');
        error.statusCode = 409;
        throw error;
      }
    }

    let restaurantId = null;
    if (restaurantName && restaurantName.trim()) {
      restaurantId = new mongoose.Types.ObjectId().toString();
      const newRest = {
        _id: restaurantId,
        name: restaurantName.trim(),
        currency: 'INR',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.restaurants.set(restaurantId, newRest);
    }

    const userId = new mongoose.Types.ObjectId().toString();
    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      _id: userId,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: role ? role.toUpperCase() : 'ADMIN',
      restaurantId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(userId, user);

    if (restaurantId) {
      const rest = this.restaurants.get(restaurantId);
      if (rest) rest.ownerId = userId;
    }

    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId
    });

    return {
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId
      }
    };
  }

  async loginUser({ email, password }) {
    await this.initialize();
    const normalizedEmail = email.trim().toLowerCase();

    let foundUser = null;
    for (const u of this.users.values()) {
      if (u.email === normalizedEmail) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, foundUser.passwordHash);
    if (!isMatch) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    const restaurant = foundUser.restaurantId ? this.restaurants.get(foundUser.restaurantId.toString()) : null;

    const token = generateToken({
      userId: foundUser._id,
      email: foundUser.email,
      role: foundUser.role,
      restaurantId: foundUser.restaurantId
    });

    return {
      success: true,
      token,
      user: {
        id: foundUser._id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
        restaurantId: foundUser.restaurantId,
        restaurant: restaurant ? { id: restaurant._id, name: restaurant.name } : null
      }
    };
  }

  async getCurrentUser(userId) {
    await this.initialize();
    const user = this.users.get(userId ? userId.toString() : '');
    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }

    const restaurant = user.restaurantId ? this.restaurants.get(user.restaurantId.toString()) : null;

    return {
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
        restaurant: restaurant ? { id: restaurant._id, name: restaurant.name } : null
      }
    };
  }

  // Expense Operations
  async createExpense(data, user) {
    await this.initialize();
    const restaurantId = user.restaurantId ? user.restaurantId.toString() : null;
    if (!restaurantId) {
      const err = new Error('Forbidden: User is not associated with any restaurant.');
      err.statusCode = 403;
      throw err;
    }

    const expenseId = new mongoose.Types.ObjectId().toString();
    const now = new Date();
    const expense = {
      _id: expenseId,
      restaurantId,
      description: data.description.trim(),
      vendor: data.vendor.trim(),
      amount: Number(data.amount),
      currency: data.currency ? data.currency.trim().toUpperCase() : 'INR',
      category: data.category.trim(),
      subcategory: data.subcategory ? data.subcategory.trim() : '',
      date: data.date ? new Date(data.date) : now,
      paymentMethod: data.paymentMethod ? data.paymentMethod.trim().toUpperCase() : 'OTHER',
      invoiceNumber: data.invoiceNumber ? data.invoiceNumber.trim() : '',
      notes: data.notes ? data.notes.trim() : '',
      source: data.source && ['MANUAL', 'OCR_UPLOAD', 'IMPORT'].includes(data.source) ? data.source : 'MANUAL',
      confidenceScore: data.confidenceScore !== undefined ? Number(data.confidenceScore) : 1.0,
      verificationStatus: data.verificationStatus || 'VERIFIED',
      reconciliationStatus: data.reconciliationStatus || 'UNRECONCILED',
      anomalyStatus: data.anomalyStatus || 'NORMAL',
      duplicateStatus: data.duplicateStatus || 'UNIQUE',
      createdAt: now,
      updatedAt: now
    };

    this.expenses.set(expenseId, expense);
    return { success: true, expense };
  }

  async getExpenses(queryParams = {}, user) {
    await this.initialize();
    const restaurantId = user.restaurantId ? user.restaurantId.toString() : null;
    if (!restaurantId) {
      const err = new Error('Forbidden: User is not associated with any restaurant.');
      err.statusCode = 403;
      throw err;
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

    let items = Array.from(this.expenses.values()).filter(e => e.restaurantId === restaurantId);

    // Date filters
    if (startDate) {
      const s = new Date(startDate);
      items = items.filter(e => new Date(e.date) >= s);
    }
    if (endDate) {
      const ed = new Date(endDate);
      if (typeof endDate === 'string' && endDate.length <= 10) {
        ed.setUTCHours(23, 59, 59, 999);
      }
      items = items.filter(e => new Date(e.date) <= ed);
    }

    // Amount filters
    if (minAmount !== undefined) {
      items = items.filter(e => e.amount >= Number(minAmount));
    }
    if (maxAmount !== undefined) {
      items = items.filter(e => e.amount <= Number(maxAmount));
    }

    // Category
    if (category && category.trim()) {
      items = items.filter(e => e.category.toLowerCase() === category.trim().toLowerCase());
    }

    // Payment Method
    if (paymentMethod && paymentMethod.trim()) {
      items = items.filter(e => e.paymentMethod.toUpperCase() === paymentMethod.trim().toUpperCase());
    }

    // Statuses
    if (verificationStatus && verificationStatus.trim()) {
      items = items.filter(e => e.verificationStatus.toUpperCase() === verificationStatus.trim().toUpperCase());
    }
    if (reconciliationStatus && reconciliationStatus.trim()) {
      items = items.filter(e => e.reconciliationStatus.toUpperCase() === reconciliationStatus.trim().toUpperCase());
    }
    if (anomalyStatus && anomalyStatus.trim()) {
      items = items.filter(e => e.anomalyStatus.toUpperCase() === anomalyStatus.trim().toUpperCase());
    }
    if (duplicateStatus && duplicateStatus.trim()) {
      items = items.filter(e => e.duplicateStatus.toUpperCase() === duplicateStatus.trim().toUpperCase());
    }

    // Vendor search
    if (vendor && vendor.trim()) {
      const v = vendor.trim().toLowerCase();
      items = items.filter(e => e.vendor.toLowerCase().includes(v));
    }

    // Text search
    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      items = items.filter(e =>
        (e.description && e.description.toLowerCase().includes(s)) ||
        (e.vendor && e.vendor.toLowerCase().includes(s)) ||
        (e.invoiceNumber && e.invoiceNumber.toLowerCase().includes(s)) ||
        (e.notes && e.notes.toLowerCase().includes(s))
      );
    }

    // Sorting
    const sortMultiplier = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
    items.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === 'date' || sortBy === 'createdAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }
      if (valA < valB) return -1 * sortMultiplier;
      if (valA > valB) return 1 * sortMultiplier;
      return 0;
    });

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const totalCount = items.length;
    const totalPages = Math.ceil(totalCount / parsedLimit) || 1;
    const skip = (parsedPage - 1) * parsedLimit;
    const paginatedItems = items.slice(skip, skip + parsedLimit);

    return {
      success: true,
      expenses: paginatedItems,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        totalCount,
        totalPages,
        hasNextPage: parsedPage < totalPages,
        hasPrevPage: parsedPage > 1
      }
    };
  }

  async getExpenseById(id, user) {
    await this.initialize();
    const restaurantId = user.restaurantId ? user.restaurantId.toString() : null;
    const expense = this.expenses.get(id);

    if (!expense || expense.restaurantId !== restaurantId) {
      const err = new Error('Expense not found.');
      err.statusCode = 404;
      throw err;
    }

    return { success: true, expense };
  }

  async updateExpense(id, updateData, user) {
    await this.initialize();
    const restaurantId = user.restaurantId ? user.restaurantId.toString() : null;
    const expense = this.expenses.get(id);

    if (!expense || expense.restaurantId !== restaurantId) {
      const err = new Error('Expense not found.');
      err.statusCode = 404;
      throw err;
    }

    const updated = {
      ...expense,
      ...updateData,
      updatedAt: new Date()
    };
    if (updateData.amount !== undefined) updated.amount = Number(updateData.amount);
    if (updateData.date) updated.date = new Date(updateData.date);

    this.expenses.set(id, updated);
    return { success: true, expense: updated };
  }

  async deleteExpense(id, user) {
    await this.initialize();
    const restaurantId = user.restaurantId ? user.restaurantId.toString() : null;
    const expense = this.expenses.get(id);

    if (!expense || expense.restaurantId !== restaurantId) {
      const err = new Error('Expense not found.');
      err.statusCode = 404;
      throw err;
    }

    this.expenses.delete(id);
    return {
      success: true,
      message: 'Expense deleted successfully.',
      id
    };
  }

  getExpenseMetadata() {
    return {
      success: true,
      categories: [
        'Raw Materials',
        'Utilities',
        'Salaries',
        'Rent',
        'Packaging',
        'Maintenance',
        'Transportation',
        'Miscellaneous'
      ],
      paymentMethods: ['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'UPI', 'CHEQUE', 'OTHER'],
      sources: ['MANUAL', 'OCR_UPLOAD', 'IMPORT'],
      verificationStatuses: ['VERIFIED', 'PENDING_REVIEW', 'REJECTED'],
      reconciliationStatuses: ['UNRECONCILED', 'MATCHED', 'DISCREPANCY'],
      anomalyStatuses: ['NORMAL', 'ANOMALY_FLAGGED'],
      duplicateStatuses: ['UNIQUE', 'POTENTIAL_DUPLICATE']
    };
  }

  async getExpenseSummary(queryParams = {}, user) {
    await this.initialize();
    const restaurantId = user.restaurantId ? user.restaurantId.toString() : null;
    const { startDate, endDate, category } = queryParams;

    let items = Array.from(this.expenses.values()).filter(e => e.restaurantId === restaurantId);

    if (startDate) {
      const s = new Date(startDate);
      items = items.filter(e => new Date(e.date) >= s);
    }
    if (endDate) {
      const ed = new Date(endDate);
      if (typeof endDate === 'string' && endDate.length <= 10) {
        ed.setUTCHours(23, 59, 59, 999);
      }
      items = items.filter(e => new Date(e.date) <= ed);
    }
    if (category && category.trim()) {
      items = items.filter(e => e.category.toLowerCase() === category.trim().toLowerCase());
    }

    const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const amounts = items.map(i => i.amount || 0);
    const minAmount = amounts.length ? Math.min(...amounts) : 0;
    const maxAmount = amounts.length ? Math.max(...amounts) : 0;
    const avgAmount = amounts.length ? totalAmount / amounts.length : 0;

    // Category breakdown
    const catMap = {};
    for (const item of items) {
      if (!catMap[item.category]) catMap[item.category] = { totalAmount: 0, count: 0 };
      catMap[item.category].totalAmount += item.amount;
      catMap[item.category].count += 1;
    }
    const categoryBreakdown = Object.entries(catMap).map(([cat, val]) => ({
      category: cat,
      totalAmount: val.totalAmount,
      count: val.count
    })).sort((a, b) => b.totalAmount - a.totalAmount);

    // Status breakdown
    let verifiedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    let anomalyCount = 0;
    let reconciledCount = 0;
    let unreconciledCount = 0;

    for (const item of items) {
      if (item.verificationStatus === 'VERIFIED') verifiedCount++;
      if (item.verificationStatus === 'PENDING_REVIEW') pendingCount++;
      if (item.verificationStatus === 'REJECTED') rejectedCount++;
      if (item.anomalyStatus === 'ANOMALY_FLAGGED') anomalyCount++;
      if (item.reconciliationStatus === 'MATCHED') reconciledCount++;
      if (item.reconciliationStatus === 'UNRECONCILED') unreconciledCount++;
    }

    return {
      success: true,
      summary: {
        totalAmount,
        expenseCount: items.length,
        minAmount,
        maxAmount,
        avgAmount: Number(avgAmount.toFixed(2)),
        categoryBreakdown,
        statusBreakdown: {
          verified: verifiedCount,
          pendingReview: pendingCount,
          rejected: rejectedCount,
          anomalyFlagged: anomalyCount,
          reconciled: reconciledCount,
          unreconciled: unreconciledCount
        }
      }
    };
  }
}

const inMemoryStore = new InMemoryStore();
module.exports = inMemoryStore;
