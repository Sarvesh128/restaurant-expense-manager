const mongoose = require('mongoose');
const Restaurant = require('../src/models/Restaurant');
const Category = require('../src/models/Category');
const Expense = require('../src/models/Expense');

describe('Core Data Models Schema Tests (Restaurant, Category, Expense)', () => {
  describe('Restaurant Model', () => {
    test('validates valid restaurant data', () => {
      const restaurant = new Restaurant({
        name: 'The Rustic Spoon',
        currency: 'INR',
        address: '123 Food Street, Mumbai',
        phone: '+91 9876543210',
        taxNumber: '27AAAAA0000A1Z5'
      });

      const error = restaurant.validateSync();
      expect(error).toBeUndefined();
      expect(restaurant.name).toBe('The Rustic Spoon');
      expect(restaurant.currency).toBe('INR');
    });

    test('requires restaurant name', () => {
      const restaurant = new Restaurant({});
      const error = restaurant.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
    });

    test('defaults currency to INR', () => {
      const restaurant = new Restaurant({ name: 'Cafe Mocha' });
      expect(restaurant.currency).toBe('INR');
    });
  });

  describe('Category Model', () => {
    test('validates valid category data', () => {
      const category = new Category({
        name: 'Raw Materials',
        description: 'Vegetables, spices, and cooking ingredients',
        isDefault: true
      });

      const error = category.validateSync();
      expect(error).toBeUndefined();
      expect(category.name).toBe('Raw Materials');
      expect(category.isDefault).toBe(true);
    });

    test('requires category name', () => {
      const category = new Category({});
      const error = category.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
    });

    test('DEFAULT_CATEGORIES contains all 8 required standard categories', () => {
      const expected = [
        'Raw Materials',
        'Utilities',
        'Salaries',
        'Rent',
        'Packaging',
        'Maintenance',
        'Transportation',
        'Miscellaneous'
      ];
      expect(Category.DEFAULT_CATEGORIES).toEqual(expected);
    });
  });

  describe('Expense Model', () => {
    const dummyRestaurantId = new mongoose.Types.ObjectId();

    test('validates valid expense data', () => {
      const expense = new Expense({
        restaurantId: dummyRestaurantId,
        description: 'Fresh vegetables wholesale purchase',
        vendor: 'Green Valley Produce',
        amount: 3450.50,
        currency: 'INR',
        category: 'Raw Materials',
        date: new Date('2026-09-15'),
        paymentMethod: 'UPI',
        invoiceNumber: 'INV-2026-001',
        source: 'MANUAL',
        confidenceScore: 1.0,
        verificationStatus: 'VERIFIED',
        reconciliationStatus: 'UNRECONCILED',
        anomalyStatus: 'NORMAL',
        duplicateStatus: 'UNIQUE'
      });

      const error = expense.validateSync();
      expect(error).toBeUndefined();
      expect(expense.amount).toBe(3450.50);
      expect(expense.category).toBe('Raw Materials');
      expect(expense.paymentMethod).toBe('UPI');
    });

    test('requires restaurantId, description, vendor, amount, category, and date', () => {
      const emptyExpense = new Expense({});
      const error = emptyExpense.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.restaurantId).toBeDefined();
      expect(error.errors.description).toBeDefined();
      expect(error.errors.vendor).toBeDefined();
      expect(error.errors.amount).toBeDefined();
      expect(error.errors.category).toBeDefined();
    });

    test('rejects negative or zero amount', () => {
      const zeroExpense = new Expense({
        restaurantId: dummyRestaurantId,
        description: 'Zero amount item',
        vendor: 'Free Vendor',
        amount: 0,
        category: 'Raw Materials'
      });

      const errorZero = zeroExpense.validateSync();
      expect(errorZero).toBeDefined();
      expect(errorZero.errors.amount).toBeDefined();

      const negativeExpense = new Expense({
        restaurantId: dummyRestaurantId,
        description: 'Negative amount item',
        vendor: 'Negative Vendor',
        amount: -150,
        category: 'Raw Materials'
      });

      const errorNeg = negativeExpense.validateSync();
      expect(errorNeg).toBeDefined();
      expect(errorNeg.errors.amount).toBeDefined();
    });

    test('rejects invalid category enum', () => {
      const badCategoryExpense = new Expense({
        restaurantId: dummyRestaurantId,
        description: 'Cryptocurrency purchase',
        vendor: 'Crypto Exchange',
        amount: 5000,
        category: 'Illegal Gambling Category'
      });

      const error = badCategoryExpense.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.category).toBeDefined();
    });

    test('rejects invalid paymentMethod enum', () => {
      const badPaymentExpense = new Expense({
        restaurantId: dummyRestaurantId,
        description: 'Item',
        vendor: 'Vendor',
        amount: 100,
        category: 'Raw Materials',
        paymentMethod: 'BARTER_TRADE'
      });

      const error = badPaymentExpense.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.paymentMethod).toBeDefined();
    });

    test('verifies all 8 standard categories are supported by Expense schema', () => {
      Expense.CATEGORIES.forEach((cat) => {
        const expense = new Expense({
          restaurantId: dummyRestaurantId,
          description: `Test for ${cat}`,
          vendor: 'Test Vendor',
          amount: 100,
          category: cat
        });
        const error = expense.validateSync();
        expect(error).toBeUndefined();
      });
    });
  });
});
