const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/auth.middleware');
const expenseController = require('../controllers/expense.controller');
const {
  validateExpenseId,
  validateCreateExpense,
  validateUpdateExpense,
  validateQueryExpense
} = require('../validators/expense.validator');

// All expense routes require valid authentication
router.use(authenticate);

// 1. Create new expense
router.post('/', validateCreateExpense, expenseController.create);

// 2. List expenses with query filters & pagination
router.get('/', validateQueryExpense, expenseController.getAll);

// 3. Metadata & Categories helper route (must precede /:id)
router.get('/meta/categories', expenseController.getMetadata);

// 4. Deterministic Financial Summary Aggregation route (must precede /:id)
router.get('/meta/summary', validateQueryExpense, expenseController.getSummary);

// 5. Retrieve single expense by ID
router.get('/:id', validateExpenseId, expenseController.getById);

// 6. Update expense by ID (supports partial update)
router.put('/:id', validateExpenseId, validateUpdateExpense, expenseController.update);

// 7. Permanently delete expense by ID
router.delete('/:id', validateExpenseId, expenseController.remove);

module.exports = router;
