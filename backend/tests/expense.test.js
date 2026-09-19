const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../src/app');
const Expense = require('../src/models/Expense');
const expenseService = require('../src/services/expense.service');
const { generateToken } = require('../src/utils/jwt');

describe('Phase 4 Expense CRUD & Deterministic Query Engine Tests', () => {
  const restaurantA_Id = new mongoose.Types.ObjectId().toString();
  const restaurantB_Id = new mongoose.Types.ObjectId().toString();
  const userA_Id = new mongoose.Types.ObjectId().toString();
  const userB_Id = new mongoose.Types.ObjectId().toString();

  const tokenUserA = generateToken({
    userId: userA_Id,
    email: 'chef_a@bistro.com',
    role: 'ADMIN',
    restaurantId: restaurantA_Id
  });

  const tokenUserB = generateToken({
    userId: userB_Id,
    email: 'chef_b@diner.com',
    role: 'ADMIN',
    restaurantId: restaurantB_Id
  });

  const tokenUserWithoutRestaurant = generateToken({
    userId: new mongoose.Types.ObjectId().toString(),
    email: 'homeless@bistro.com',
    role: 'ADMIN',
    restaurantId: null
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================
  // 1. AUTHENTICATION & RESTAURANT ISOLATION
  // ==========================================
  describe('1. Authentication & Tenant Isolation Security', () => {
    test('rejects unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/expenses');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no authentication token/i);
    });

    test('rejects malformed Bearer token with 401 Unauthorized', async () => {
      const res = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', 'Bearer invalid.token.value');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('rejects authenticated user without restaurantId with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${tokenUserWithoutRestaurant}`)
        .send({
          description: '50kg Tomatoes',
          vendor: 'Veggie Mart',
          amount: 1500,
          category: 'Raw Materials'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not associated with any restaurant/i);
    });

    test('POST /api/v1/expenses ignores client-provided restaurantId and enforces user restaurantId', async () => {
      const spyCreate = jest.spyOn(Expense, 'create').mockImplementation(async (doc) => ({
        _id: new mongoose.Types.ObjectId(),
        ...doc,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          restaurantId: restaurantB_Id, // Malicious client attempt to forge tenant
          description: '50kg Onions',
          vendor: 'Wholesale Farm',
          amount: 2500,
          category: 'Raw Materials',
          paymentMethod: 'UPI'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(spyCreate).toHaveBeenCalled();
      const createArg = spyCreate.mock.calls[0][0];
      // Must be forced to User A's restaurant
      expect(createArg.restaurantId.toString()).toBe(restaurantA_Id);
    });

    test('GET /api/v1/expenses/:id returns 404 if expense belongs to a different restaurant', async () => {
      const expenseId = new mongoose.Types.ObjectId().toString();

      // Find returns null because restaurantId does not match
      jest.spyOn(Expense, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/v1/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/expense not found/i);
    });

    test('PUT /api/v1/expenses/:id returns 404 if attempting to modify another restaurant expense', async () => {
      const expenseId = new mongoose.Types.ObjectId().toString();
      jest.spyOn(Expense, 'findOneAndUpdate').mockResolvedValue(null);

      const res = await request(app)
        .put(`/api/v1/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({ description: 'Hacked update' });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('DELETE /api/v1/expenses/:id returns 404 if attempting to delete another restaurant expense', async () => {
      const expenseId = new mongoose.Types.ObjectId().toString();
      jest.spyOn(Expense, 'findOneAndDelete').mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/v1/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // 2. INPUT VALIDATION TESTS
  // ==========================================
  describe('2. Input & Query Validation', () => {
    test('rejects expense creation when description is missing', async () => {
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          vendor: 'Dairy Farm',
          amount: 500,
          category: 'Raw Materials'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/description is required/i);
    });

    test('rejects expense creation when vendor is missing', async () => {
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          description: 'Milk 20L',
          amount: 500,
          category: 'Raw Materials'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/vendor name is required/i);
    });

    test('rejects expense creation when amount is zero or negative', async () => {
      const resZero = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          description: 'Free Samples',
          vendor: 'Promo Vendor',
          amount: 0,
          category: 'Miscellaneous'
        });

      expect(resZero.statusCode).toBe(400);
      expect(resZero.body.message).toMatch(/greater than 0/i);

      const resNegative = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          description: 'Refunded goods',
          vendor: 'Vendor',
          amount: -100,
          category: 'Miscellaneous'
        });

      expect(resNegative.statusCode).toBe(400);
      expect(resNegative.body.message).toMatch(/greater than 0/i);
    });

    test('rejects expense creation when category is not in Expense.CATEGORIES', async () => {
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          description: 'Cryptocurrency trading',
          vendor: 'Crypto Market',
          amount: 5000,
          category: 'NonExistentCategory'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid category/i);
    });

    test('rejects expense creation when paymentMethod is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          description: 'Cooking Oil',
          vendor: 'Oil Mart',
          amount: 1200,
          category: 'Raw Materials',
          paymentMethod: 'GOLD_COINS'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/invalid payment method/i);
    });

    test('rejects invalid date format in creation payload', async () => {
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          description: 'Cooking Oil',
          vendor: 'Oil Mart',
          amount: 1200,
          category: 'Raw Materials',
          date: 'invalid-date-string'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/invalid date format/i);
    });

    test('rejects invalid ObjectId on GET/PUT/DELETE /:id', async () => {
      const resGet = await request(app)
        .get('/api/v1/expenses/not-a-valid-object-id')
        .set('Authorization', `Bearer ${tokenUserA}`);
      expect(resGet.statusCode).toBe(400);
      expect(resGet.body.message).toMatch(/invalid expense id format/i);

      const resPut = await request(app)
        .put('/api/v1/expenses/not-a-valid-object-id')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ amount: 100 });
      expect(resPut.statusCode).toBe(400);

      const resDel = await request(app)
        .delete('/api/v1/expenses/not-a-valid-object-id')
        .set('Authorization', `Bearer ${tokenUserA}`);
      expect(resDel.statusCode).toBe(400);
    });

    test('rejects empty update payload on PUT /:id', async () => {
      const validId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .put(`/api/v1/expenses/${validId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/update payload cannot be empty/i);
    });

    test('rejects invalid query parameters on GET /api/v1/expenses', async () => {
      // 1. Invalid page
      const resPage = await request(app)
        .get('/api/v1/expenses?page=0')
        .set('Authorization', `Bearer ${tokenUserA}`);
      expect(resPage.statusCode).toBe(400);

      // 2. Invalid limit (> 100)
      const resLimit = await request(app)
        .get('/api/v1/expenses?limit=500')
        .set('Authorization', `Bearer ${tokenUserA}`);
      expect(resLimit.statusCode).toBe(400);

      // 3. startDate > endDate
      const resDate = await request(app)
        .get('/api/v1/expenses?startDate=2026-10-01&endDate=2026-09-01')
        .set('Authorization', `Bearer ${tokenUserA}`);
      expect(resDate.statusCode).toBe(400);
      expect(resDate.body.message).toMatch(/cannot be later than/i);

      // 4. minAmount > maxAmount
      const resAmount = await request(app)
        .get('/api/v1/expenses?minAmount=1000&maxAmount=200')
        .set('Authorization', `Bearer ${tokenUserA}`);
      expect(resAmount.statusCode).toBe(400);

      // 5. Invalid sort field
      const resSort = await request(app)
        .get('/api/v1/expenses?sortBy=unsupportedField')
        .set('Authorization', `Bearer ${tokenUserA}`);
      expect(resSort.statusCode).toBe(400);
    });
  });

  // ==========================================
  // 3. CRUD ENDPOINTS
  // ==========================================
  describe('3. CRUD Operations', () => {
    test('POST /api/v1/expenses successfully creates and returns expense', async () => {
      const mockCreated = {
        _id: new mongoose.Types.ObjectId(),
        restaurantId: new mongoose.Types.ObjectId(restaurantA_Id),
        description: '50kg Flour and Sugar',
        vendor: 'Bakery Supplies Co.',
        amount: 3200,
        currency: 'INR',
        category: 'Raw Materials',
        subcategory: 'Baking',
        date: new Date('2026-09-18'),
        paymentMethod: 'UPI',
        invoiceNumber: 'INV-BAKE-001',
        source: 'MANUAL',
        confidenceScore: 1.0,
        verificationStatus: 'VERIFIED',
        reconciliationStatus: 'UNRECONCILED',
        anomalyStatus: 'NORMAL',
        duplicateStatus: 'UNIQUE',
        notes: 'Delivered to pastry section',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(Expense, 'create').mockResolvedValue(mockCreated);

      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          description: '50kg Flour and Sugar',
          vendor: 'Bakery Supplies Co.',
          amount: 3200,
          category: 'Raw Materials',
          subcategory: 'Baking',
          date: '2026-09-18',
          paymentMethod: 'UPI',
          invoiceNumber: 'INV-BAKE-001',
          notes: 'Delivered to pastry section'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.expense.description).toBe('50kg Flour and Sugar');
      expect(res.body.expense.amount).toBe(3200);
      expect(res.body.expense.category).toBe('Raw Materials');
      expect(res.body.expense.restaurantId).toBe(restaurantA_Id);
    });

    test('GET /api/v1/expenses returns paginated list of expenses', async () => {
      const mockExpenses = [
        {
          _id: new mongoose.Types.ObjectId(),
          restaurantId: new mongoose.Types.ObjectId(restaurantA_Id),
          description: 'Kitchen Gas Cylinder',
          vendor: 'Indane Gas Service',
          amount: 1850,
          category: 'Utilities',
          date: new Date('2026-09-17')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          restaurantId: new mongoose.Types.ObjectId(restaurantA_Id),
          description: 'Staff Uniforms',
          vendor: 'Textile Hub',
          amount: 4500,
          category: 'Miscellaneous',
          date: new Date('2026-09-16')
        }
      ];

      jest.spyOn(Expense, 'countDocuments').mockResolvedValue(2);
      jest.spyOn(Expense, 'find').mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockExpenses)
            })
          })
        })
      });

      const res = await request(app)
        .get('/api/v1/expenses?page=1&limit=10')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.expenses).toHaveLength(2);
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 10,
        totalCount: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      });
    });

    test('GET /api/v1/expenses/:id retrieves single expense by ID', async () => {
      const expenseId = new mongoose.Types.ObjectId().toString();
      const mockExpense = {
        _id: expenseId,
        restaurantId: new mongoose.Types.ObjectId(restaurantA_Id),
        description: 'Monthly Water Bill',
        vendor: 'Municipal Water Board',
        amount: 1200,
        category: 'Utilities'
      };

      jest.spyOn(Expense, 'findOne').mockResolvedValue(mockExpense);

      const res = await request(app)
        .get(`/api/v1/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.expense.description).toBe('Monthly Water Bill');
      expect(res.body.expense.amount).toBe(1200);
    });

    test('PUT /api/v1/expenses/:id updates expense and returns updated document', async () => {
      const expenseId = new mongoose.Types.ObjectId().toString();
      const mockUpdated = {
        _id: expenseId,
        restaurantId: new mongoose.Types.ObjectId(restaurantA_Id),
        description: 'Updated Electricity Bill',
        vendor: 'Power Corp',
        amount: 4800,
        category: 'Utilities'
      };

      jest.spyOn(Expense, 'findOneAndUpdate').mockResolvedValue(mockUpdated);

      const res = await request(app)
        .put(`/api/v1/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          description: 'Updated Electricity Bill',
          amount: 4800
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.expense.description).toBe('Updated Electricity Bill');
      expect(res.body.expense.amount).toBe(4800);
    });

    test('DELETE /api/v1/expenses/:id permanently deletes expense per documented strategy', async () => {
      const expenseId = new mongoose.Types.ObjectId().toString();
      jest.spyOn(Expense, 'findOneAndDelete').mockResolvedValue({
        _id: expenseId,
        restaurantId: new mongoose.Types.ObjectId(restaurantA_Id)
      });

      const res = await request(app)
        .delete(`/api/v1/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/deleted successfully/i);
      expect(res.body.id).toBe(expenseId);
    });
  });

  // ==========================================
  // 4. METADATA & FINANCIAL SUMMARY
  // ==========================================
  describe('4. Metadata & Deterministic Financial Summary', () => {
    test('GET /api/v1/expenses/meta/categories returns system categories and payment methods', async () => {
      const res = await request(app)
        .get('/api/v1/expenses/meta/categories')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.categories).toEqual(Expense.CATEGORIES);
      expect(res.body.paymentMethods).toEqual(Expense.PAYMENT_METHODS);
      expect(res.body.verificationStatuses).toBeDefined();
    });

    test('GET /api/v1/expenses/meta/summary computes exact deterministic calculations', async () => {
      const mockTotals = [
        {
          _id: null,
          totalAmount: 15450.75,
          expenseCount: 5,
          minAmount: 450.75,
          maxAmount: 6000,
          avgAmount: 3090.15
        }
      ];

      const mockCategoryGroup = [
        { _id: 'Raw Materials', totalAmount: 8450.75, count: 3 },
        { _id: 'Utilities', totalAmount: 7000, count: 2 }
      ];

      const mockStatusGroup = [
        { _id: { verificationStatus: 'VERIFIED', anomalyStatus: 'NORMAL' }, count: 4, totalAmount: 13000 },
        { _id: { verificationStatus: 'PENDING_REVIEW', anomalyStatus: 'ANOMALY_FLAGGED' }, count: 1, totalAmount: 2450.75 }
      ];

      jest.spyOn(Expense, 'aggregate')
        .mockResolvedValueOnce(mockTotals)
        .mockResolvedValueOnce(mockCategoryGroup)
        .mockResolvedValueOnce(mockStatusGroup);

      const res = await request(app)
        .get('/api/v1/expenses/meta/summary?startDate=2026-09-01&endDate=2026-09-30')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary.totalAmount).toBe(15450.75);
      expect(res.body.summary.expenseCount).toBe(5);
      expect(res.body.summary.averageAmount).toBe(3090.15);
      expect(res.body.summary.categoryBreakdown).toHaveLength(2);
      expect(res.body.summary.categoryBreakdown[0]).toEqual({
        category: 'Raw Materials',
        totalAmount: 8450.75,
        count: 3,
        percentage: 54.69
      });
      expect(res.body.summary.statusCounts).toEqual({
        verifiedCount: 4,
        pendingReviewCount: 1,
        rejectedCount: 0,
        anomalyFlaggedCount: 1
      });
    });
  });

  // ==========================================
  // 5. SERVICE LAYER UNIT TESTS
  // ==========================================
  describe('5. Expense Service Query & Filtering Logic', () => {
    test('getExpenses builds correct filters for date, vendor regex, search, status, and amount', async () => {
      let capturedQuery = null;
      let capturedSort = null;

      jest.spyOn(Expense, 'countDocuments').mockImplementation(async (q) => {
        capturedQuery = q;
        return 1;
      });

      jest.spyOn(Expense, 'find').mockImplementation((q) => ({
        sort: jest.fn().mockImplementation((s) => {
          capturedSort = s;
          return {
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([])
              })
            })
          };
        })
      }));

      const queryParams = {
        startDate: '2026-09-01',
        endDate: '2026-09-15',
        minAmount: '500',
        maxAmount: '3000',
        category: 'Raw Materials',
        paymentMethod: 'UPI',
        vendor: 'Farm Fresh',
        search: 'Vegetables',
        verificationStatus: 'VERIFIED',
        sortBy: 'amount',
        sortOrder: 'asc'
      };

      const user = {
        userId: userA_Id,
        restaurantId: restaurantA_Id
      };

      const result = await expenseService.getExpenses(queryParams, user);

      expect(result.success).toBe(true);
      expect(capturedQuery.restaurantId.toString()).toBe(restaurantA_Id);
      expect(capturedQuery.category).toBe('Raw Materials');
      expect(capturedQuery.paymentMethod).toBe('UPI');
      expect(capturedQuery.verificationStatus).toBe('VERIFIED');
      expect(capturedQuery.amount.$gte).toBe(500);
      expect(capturedQuery.amount.$lte).toBe(3000);
      expect(capturedQuery.date.$gte).toBeInstanceOf(Date);
      expect(capturedQuery.date.$lte).toBeInstanceOf(Date);
      expect(capturedQuery.vendor.$regex).toBeDefined();
      expect(capturedQuery.$or).toHaveLength(4);
      expect(capturedSort).toEqual({ amount: 1, _id: -1 });
    });
  });
});
