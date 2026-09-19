const expenseService = require('../services/expense.service');

/**
 * Controller to create a new expense record.
 * POST /api/v1/expenses
 */
const create = async (req, res, next) => {
  try {
    const result = await expenseService.createExpense(req.body, req.user);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to list and filter expenses.
 * GET /api/v1/expenses
 */
const getAll = async (req, res, next) => {
  try {
    const result = await expenseService.getExpenses(req.query, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve a single expense by ID.
 * GET /api/v1/expenses/:id
 */
const getById = async (req, res, next) => {
  try {
    const result = await expenseService.getExpenseById(req.params.id, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to update an existing expense.
 * PUT /api/v1/expenses/:id
 */
const update = async (req, res, next) => {
  try {
    const result = await expenseService.updateExpense(req.params.id, req.body, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to permanently delete an expense.
 * DELETE /api/v1/expenses/:id
 */
const remove = async (req, res, next) => {
  try {
    const result = await expenseService.deleteExpense(req.params.id, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve expense metadata (categories, payment methods, statuses).
 * GET /api/v1/expenses/meta/categories
 */
const getMetadata = (req, res, next) => {
  try {
    const result = expenseService.getExpenseMetadata();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve deterministic financial summary aggregation.
 * GET /api/v1/expenses/meta/summary
 */
const getSummary = async (req, res, next) => {
  try {
    const result = await expenseService.getExpenseSummary(req.query, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove,
  getMetadata,
  getSummary
};
