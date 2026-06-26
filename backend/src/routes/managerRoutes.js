const express = require('express');
const router = express.Router();
const { getPendingApprovals, processApproval, getDepartmentBudget, getCategoryBreakdown } = require('../controllers/expenseController');
const requireRole = require('../middleware/requireRole');

router.get('/approvals', requireRole('manager'), getPendingApprovals);
router.put('/approvals/:id', requireRole('manager'), processApproval);
router.get('/budget', requireRole('manager'), getDepartmentBudget);
router.get('/budget/breakdown', requireRole('manager'), getCategoryBreakdown);

module.exports = router;
