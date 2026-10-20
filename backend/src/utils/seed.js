const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Expense = require('../models/Expense');

/**
 * Seed initial restaurant, demo user, and sample expenses into MongoDB Atlas if database is empty.
 */
const seedDatabase = async () => {
  try {
    const existingExpenses = await Expense.countDocuments();
    if (existingExpenses > 0) {
      console.log(`[Database Seeder]: Database already contains ${existingExpenses} expense records. Skipping automatic seeding.`);
      return;
    }

    console.log('[Database Seeder]: Seeding MongoDB Atlas database with demo restaurant, user, and expenses...');

    // 1. Create or find Demo Restaurant
    let restaurant = await Restaurant.findOne({ name: 'The Golden Bistro' });
    if (!restaurant) {
      restaurant = await Restaurant.create({
        _id: new mongoose.Types.ObjectId('660000000000000000000001'),
        name: 'The Golden Bistro',
        currency: 'INR',
        address: '123 Gourmet Street, Foodville',
        phone: '+91 9876543210',
        taxNumber: '27AAAAA0000A1Z5'
      });
      console.log('[Database Seeder]: Created Demo Restaurant: The Golden Bistro');
    }

    // 2. Create or find Demo User (Chef Marco)
    let user = await User.findOne({ email: 'chef@bistro.com' });
    if (!user) {
      const passwordHash = await bcrypt.hash('password123', 10);
      user = await User.create({
        _id: new mongoose.Types.ObjectId('660000000000000000000002'),
        name: 'Chef Marco (Bistro Manager)',
        email: 'chef@bistro.com',
        passwordHash,
        role: 'ADMIN',
        restaurantId: restaurant._id
      });
      restaurant.ownerId = user._id;
      await restaurant.save();
      console.log('[Database Seeder]: Created Demo Admin User: chef@bistro.com / password123');
    }

    // 3. Load sample expenses from CSV
    const csvPath = path.join(__dirname, '../../../sample-data/expenses.csv');
    if (!fs.existsSync(csvPath)) {
      console.warn('[Database Seeder]: Sample expenses CSV not found at', csvPath);
      return;
    }

    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const lines = fileContent.trim().split(/\r?\n/);
    const paymentMethods = ['UPI', 'BANK_TRANSFER', 'CASH', 'CREDIT_CARD', 'CHEQUE'];

    const expenseDocs = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const match = line.match(/^"([^"]+)",([^,]+),([^,]+),([^,]+),([^,]+)$/) ||
                    line.match(/^([^,]+),([^,]+),([^,]+),([^,]+),([^,]+)$/);

      if (match) {
        const [, description, vendor, dateStr, amountStr, category] = match;
        const paymentMethod = paymentMethods[i % paymentMethods.length];
        const date = new Date(dateStr.trim());
        const amount = parseFloat(amountStr.trim()) || 100;

        expenseDocs.push({
          restaurantId: restaurant._id,
          createdById: user._id,
          description: description.trim(),
          vendor: vendor.trim(),
          date: isNaN(date.getTime()) ? new Date() : date,
          amount,
          currency: 'INR',
          category: category.trim(),
          paymentMethod,
          status: 'VERIFIED',
          reconciliationStatus: i % 3 !== 0 ? 'MATCHED' : 'UNRECONCILED'
        });
      }
    }

    if (expenseDocs.length > 0) {
      await Expense.insertMany(expenseDocs);
      console.log(`[Database Seeder]: Successfully seeded ${expenseDocs.length} sample expenses into MongoDB Atlas!`);
    }
  } catch (error) {
    console.error('[Database Seeder]: Error seeding database:', error.message);
  }
};

module.exports = seedDatabase;
