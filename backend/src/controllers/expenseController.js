const db = require('../db');

const submitExpense = async (req, res, next) => {
  try {
    const { amount, category, description } = req.body;

    // 1. Validation
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number greater than 0'
      });
    }

    const allowedCategories = ['travel', 'meals', 'software', 'hardware'];
    if (!category || !allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${allowedCategories.join(', ')}`
      });
    }

    // 2. Look up department budget
    const { department, id: employeeId } = req.user;
    const budgetResult = await db.query(
      'SELECT monthly_limit, spent_amount FROM department_budgets WHERE department = $1',
      [department]
    );

    if (budgetResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Department budget details not found for department: ${department}`
      });
    }

    const budget = budgetResult.rows[0];
    const spentAmount = parseFloat(budget.spent_amount);
    const monthlyLimit = parseFloat(budget.monthly_limit);

    // 3. Calculate budget warning ratio: (current spent_amount + amount) / monthly_limit
    const ratio = (spentAmount + parsedAmount) / monthlyLimit;
    const budgetWarning = ratio >= 0.9;

    // 4. Insert new expense
    const insertResult = await db.query(
      `INSERT INTO expenses (employee_id, amount, category, description, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id, employee_id, amount, category, description, status, created_at`,
      [employeeId, parsedAmount, category, description || null]
    );

    const expense = insertResult.rows[0];

    // 5. Response
    res.status(201).json({
      success: true,
      expense,
      budget_warning: budgetWarning
    });
  } catch (error) {
    next(error);
  }
};

const getExpenseHistory = async (req, res, next) => {
  try {
    const { status } = req.query;
    const employeeId = req.user.id;

    let queryText = 'SELECT id, employee_id, amount, category, description, status, created_at FROM expenses WHERE employee_id = $1';
    const queryParams = [employeeId];

    if (status) {
      const allowedStatuses = ['pending', 'approved', 'rejected'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status filter. Allowed values: ${allowedStatuses.join(', ')}`
        });
      }
      queryText += ' AND status = $2';
      queryParams.push(status);
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await db.query(queryText, queryParams);
    res.status(200).json({
      success: true,
      expenses: result.rows
    });
  } catch (error) {
    next(error);
  }
};

const getPendingApprovals = async (req, res, next) => {
  try {
    const { department } = req.user;

    const queryText = `
      SELECT e.id, e.employee_id, e.amount, e.category, e.description, e.status, e.created_at, u.full_name as employee_name
      FROM expenses e
      INNER JOIN users u ON e.employee_id = u.id
      WHERE e.status = 'pending' AND u.department = $1
      ORDER BY e.created_at ASC
    `;

    const result = await db.query(queryText, [department]);
    res.status(200).json({
      success: true,
      approvals: result.rows
    });
  } catch (error) {
    next(error);
  }
};

const processApproval = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { department: managerDepartment } = req.user;

    // Validate request status
    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'approved' or 'rejected'"
      });
    }

    // Begin transaction
    await client.query('BEGIN');

    // 1. Fetch expense by ID & check department (join with users)
    const expenseQuery = `
      SELECT e.id, e.amount, e.status, e.employee_id, u.department
      FROM expenses e
      INNER JOIN users u ON e.employee_id = u.id
      WHERE e.id = $1
      FOR UPDATE
    `;
    const expenseResult = await client.query(expenseQuery, [id]);

    if (expenseResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const expense = expenseResult.rows[0];

    // 2. Verify department match
    if (expense.department !== managerDepartment) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'Access denied: employee is in a different department'
      });
    }

    // 3. Verify status is 'pending'
    if (expense.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Expense has already been processed'
      });
    }

    // 4. Update the expense's status
    const updateExpenseQuery = `
      UPDATE expenses
      SET status = $1
      WHERE id = $2
      RETURNING id, employee_id, amount, category, description, status, created_at
    `;
    const updatedExpenseResult = await client.query(updateExpenseQuery, [status, id]);
    const updatedExpense = updatedExpenseResult.rows[0];

    // 5. If approved, add expense amount to department_budgets.spent_amount
    if (status === 'approved') {
      const amountToAdd = parseFloat(expense.amount);
      const updateBudgetQuery = `
        UPDATE department_budgets
        SET spent_amount = spent_amount + $1
        WHERE department = $2
      `;
      await client.query(updateBudgetQuery, [amountToAdd, managerDepartment]);
    }

    // Commit transaction
    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      expense: updatedExpense
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

const getDepartmentBudget = async (req, res, next) => {
  try {
    const { department } = req.user;
    const result = await db.query(
      'SELECT id, department, monthly_limit, spent_amount FROM department_budgets WHERE department = $1',
      [department]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Department budget not found for: ${department}`
      });
    }

    const budget = result.rows[0];
    const spentAmount = parseFloat(budget.spent_amount);
    const monthlyLimit = parseFloat(budget.monthly_limit);

    // Calculate percent_used
    const percentUsed = monthlyLimit > 0 ? (spentAmount / monthlyLimit) * 100 : 0;

    // Calculate status_level: 'safe' (<75%), 'warning' (75-89%), or 'critical' (90%+)
    let statusLevel = 'safe';
    if (percentUsed >= 90) {
      statusLevel = 'critical';
    } else if (percentUsed >= 75) {
      statusLevel = 'warning';
    }

    res.status(200).json({
      success: true,
      budget: {
        ...budget,
        monthly_limit: monthlyLimit,
        spent_amount: spentAmount,
        percent_used: parseFloat(percentUsed.toFixed(2)),
        status_level: statusLevel
      }
    });
  } catch (error) {
    next(error);
  }
};

const getCategoryBreakdown = async (req, res, next) => {
  try {
    const { department } = req.user;
    const queryText = `
      SELECT e.category, COALESCE(SUM(e.amount), 0) as total
      FROM expenses e
      INNER JOIN users u ON e.employee_id = u.id
      WHERE u.department = $1 AND e.status = 'approved'
      GROUP BY e.category
    `;
    const result = await db.query(queryText, [department]);
    
    const breakdown = result.rows.map(row => ({
      category: row.category,
      total: parseFloat(row.total)
    }));

    res.status(200).json({
      success: true,
      breakdown
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitExpense,
  getExpenseHistory,
  getPendingApprovals,
  processApproval,
  getDepartmentBudget,
  getCategoryBreakdown
};
