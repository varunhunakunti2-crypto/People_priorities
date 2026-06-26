const bcrypt = require('bcrypt');
const db = require('./db');
const authMiddleware = require('./middleware/auth');
const requireRole = require('./middleware/requireRole');
const authController = require('./controllers/authController');
const expenseController = require('./controllers/expenseController');

// Test suite helpers
let testPassed = 0;
let testFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    testPassed++;
  } else {
    console.error(`[FAIL] ${message}`);
    testFailed++;
  }
}

// Mock helper objects
const createMockRes = () => {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (obj) {
      this.body = obj;
      return this;
    }
  };
  return res;
};

// Start tests
async function runTests() {
  console.log('=== RUNNING INTEGRATION & LOGIC VERIFICATION TESTS ===\n');

  // Seeded values to mock
  const samplePasswordHash = await bcrypt.hash('password123', 10);

  // Define database query mock state
  let mockQueryResult = { rows: [] };
  let executedQueries = [];

  // Override db.query
  db.query = async (text, params) => {
    executedQueries.push({ text, params });
    return mockQueryResult;
  };

  // Mock pool connect for transactions
  const mockClient = {
    query: async (text, params) => {
      executedQueries.push({ text, params });
      // Match specific query requirements inside transaction
      if (text.includes('SELECT e.id, e.amount, e.status')) {
        return mockQueryResult;
      }
      return { rows: [{ id: 99, status: 'approved' }] };
    },
    release: () => {}
  };
  db.pool.connect = async () => mockClient;

  // --- TEST 1: Login works with seeded users, returns a valid token ---
  {
    executedQueries = [];
    mockQueryResult = {
      rows: [{
        id: 1,
        email: 'sales_employee@example.com',
        password_hash: samplePasswordHash,
        full_name: 'Alice Smith',
        department: 'sales',
        role: 'employee'
      }]
    };

    const req = {
      body: { email: 'sales_employee@example.com', password: 'password123' }
    };
    const res = createMockRes();

    await authController.login(req, res, (err) => { if (err) console.error(err); });

    assert(res.statusCode === 200, 'Login returns 200 OK');
    assert(res.body.success === true, 'Login response has success: true');
    assert(res.body.token !== undefined, 'Login response returns a session token');
    assert(executedQueries.some(q => q.text.includes('UPDATE users SET session_token')), 'Session token saved to users table');
  }

  // --- TEST 2: Submitting an expense at >90% of budget returns budget_warning: true ---
  {
    executedQueries = [];
    // Mock budget search: spent = 4600, limit = 5000. New expense = 200. Total = 4800 (96% of limit)
    mockQueryResult = {
      rows: [{
        monthly_limit: '5000.00',
        spent_amount: '4600.00'
      }]
    };

    // Mock insert result
    db.query = async (text, params) => {
      executedQueries.push({ text, params });
      if (text.includes('SELECT')) {
        return { rows: [{ monthly_limit: '5000.00', spent_amount: '4600.00' }] };
      }
      if (text.includes('INSERT')) {
        return {
          rows: [{
            id: 10,
            employee_id: 1,
            amount: 200.00,
            category: 'travel',
            description: 'test',
            status: 'pending'
          }]
        };
      }
      return { rows: [] };
    };

    const req = {
      user: { id: 1, department: 'sales', role: 'employee' },
      body: { amount: 200.00, category: 'travel', description: 'test' }
    };
    const res = createMockRes();

    await expenseController.submitExpense(req, res, (err) => { if (err) console.error(err); });

    assert(res.statusCode === 201, 'Expense submission returns 201 Created');
    assert(res.body.budget_warning === true, 'Budget warning is true when ratio >= 90%');
  }

  // --- TEST 3: Employee can only see their own expense history ---
  {
    executedQueries = [];
    mockQueryResult = { rows: [] };
    const req = {
      user: { id: 42, role: 'employee' },
      query: {}
    };
    const res = createMockRes();

    await expenseController.getExpenseHistory(req, res, (err) => { if (err) console.error(err); });

    const historyQuery = executedQueries.find(q => q.text.includes('SELECT'));
    assert(historyQuery !== undefined, 'Query for history was run');
    assert(historyQuery.params[0] === 42, 'Query filters by user ID (42)');
  }

  // --- TEST 4: Manager can only see pending approvals from their own department ---
  {
    executedQueries = [];
    mockQueryResult = { rows: [] };
    const req = {
      user: { id: 50, role: 'manager', department: 'engineering' }
    };
    const res = createMockRes();

    await expenseController.getPendingApprovals(req, res, (err) => { if (err) console.error(err); });

    const approvalQuery = executedQueries.find(q => q.text.includes('SELECT'));
    assert(approvalQuery !== undefined, 'Query for approvals was run');
    assert(approvalQuery.params[0] === 'engineering', 'Query filters by manager department ("engineering")');
  }

  // --- TEST 5: Approving an expense correctly increments spent_amount ---
  {
    executedQueries = [];
    mockQueryResult = {
      rows: [{
        id: 99,
        amount: '150.00',
        status: 'pending',
        employee_id: 10,
        department: 'marketing'
      }]
    };

    const req = {
      user: { role: 'manager', department: 'marketing' },
      params: { id: 99 },
      body: { status: 'approved' }
    };
    const res = createMockRes();

    await expenseController.processApproval(req, res, (err) => { if (err) console.error(err); });

    assert(res.statusCode === 200, 'Processing approval returns 200 OK');
    assert(executedQueries.some(q => q.text.includes('BEGIN')), 'Transaction is started');
    assert(executedQueries.some(q => q.text.includes('UPDATE department_budgets')), 'Budget spent_amount was updated');
    assert(executedQueries.some(q => q.text.includes('COMMIT')), 'Transaction is committed');
  }

  // --- TEST 6: Rejecting an expense does NOT change spent_amount ---
  {
    executedQueries = [];
    mockQueryResult = {
      rows: [{
        id: 99,
        amount: '150.00',
        status: 'pending',
        employee_id: 10,
        department: 'marketing'
      }]
    };

    const req = {
      user: { role: 'manager', department: 'marketing' },
      params: { id: 99 },
      body: { status: 'rejected' }
    };
    const res = createMockRes();

    await expenseController.processApproval(req, res, (err) => { if (err) console.error(err); });

    assert(res.statusCode === 200, 'Rejecting approval returns 200 OK');
    assert(!executedQueries.some(q => q.text.includes('UPDATE department_budgets SET spent_amount')), 'Budget spent_amount was NOT updated');
    assert(executedQueries.some(q => q.text.includes('COMMIT')), 'Transaction is committed');
  }

  // --- TEST 7: A manager cannot approve an expense from a different department (403) ---
  {
    executedQueries = [];
    mockQueryResult = {
      rows: [{
        id: 99,
        amount: '150.00',
        status: 'pending',
        employee_id: 10,
        department: 'sales' // Different department
      }]
    };

    const req = {
      user: { role: 'manager', department: 'engineering' }, // Manager is in engineering
      params: { id: 99 },
      body: { status: 'approved' }
    };
    const res = createMockRes();

    await expenseController.processApproval(req, res, (err) => { if (err) console.error(err); });

    assert(res.statusCode === 403, 'Cross-department approval returns 403 Forbidden');
    assert(executedQueries.some(q => q.text.includes('ROLLBACK')), 'Transaction was rolled back');
  }

  // --- TEST 8: An employee cannot hit /api/v1/manager/* routes (403) ---
  {
    const req = {
      user: { role: 'employee' }
    };
    const res = createMockRes();
    let nextCalled = false;

    const middleware = requireRole('manager');
    middleware(req, res, () => { nextCalled = true; });

    assert(res.statusCode === 403, 'Role middleware returns 403 for unauthorised role');
    assert(nextCalled === false, 'Next function was not called');
  }

  // --- TEST 9: Double-approving the same expense returns 400 ---
  {
    executedQueries = [];
    mockQueryResult = {
      rows: [{
        id: 99,
        amount: '150.00',
        status: 'approved', // already processed
        employee_id: 10,
        department: 'marketing'
      }]
    };

    const req = {
      user: { role: 'manager', department: 'marketing' },
      params: { id: 99 },
      body: { status: 'approved' }
    };
    const res = createMockRes();

    await expenseController.processApproval(req, res, (err) => { if (err) console.error(err); });

    assert(res.statusCode === 400, 'Double-approving returns 400 Bad Request');
    assert(executedQueries.some(q => q.text.includes('ROLLBACK')), 'Transaction was rolled back');
  }

  console.log(`\n=== TESTS SUMMARY: ${testPassed} Passed, ${testFailed} Failed ===`);
  process.exit(testFailed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
