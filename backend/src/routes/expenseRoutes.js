const express = require('express');
const router = express.Router();
const { submitExpense, getExpenseHistory } = require('../controllers/expenseController');
const requireRole = require('../middleware/requireRole');

router.post('/submit', requireRole('employee'), submitExpense);
router.get('/history', requireRole('employee'), getExpenseHistory);

module.exports = router;
