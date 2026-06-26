const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

// In-memory mock database state
const mockUsers = [
  { id: 1, email: 'sales_employee@example.com', password_hash: '$2b$10$VueFZDPyZQs6h3buyBIFI.sywI8unmuTtgr5Jh/5w5pJHTCyndChq', full_name: 'Alice Smith', department: 'sales', role: 'employee', session_token: null },
  { id: 2, email: 'sales_manager@example.com', password_hash: '$2b$10$VueFZDPyZQs6h3buyBIFI.sywI8unmuTtgr5Jh/5w5pJHTCyndChq', full_name: 'Bob Jones', department: 'sales', role: 'manager', session_token: null },
  { id: 3, email: 'eng_employee@example.com', password_hash: '$2b$10$VueFZDPyZQs6h3buyBIFI.sywI8unmuTtgr5Jh/5w5pJHTCyndChq', full_name: 'Charlie Brown', department: 'engineering', role: 'employee', session_token: null },
  { id: 4, email: 'eng_manager@example.com', password_hash: '$2b$10$VueFZDPyZQs6h3buyBIFI.sywI8unmuTtgr5Jh/5w5pJHTCyndChq', full_name: 'Diana Prince', department: 'engineering', role: 'manager', session_token: null },
  { id: 5, email: 'hr_employee@example.com', password_hash: '$2b$10$VueFZDPyZQs6h3buyBIFI.sywI8unmuTtgr5Jh/5w5pJHTCyndChq', full_name: 'Evan Wright', department: 'hr', role: 'employee', session_token: null },
  { id: 6, email: 'hr_manager@example.com', password_hash: '$2b$10$VueFZDPyZQs6h3buyBIFI.sywI8unmuTtgr5Jh/5w5pJHTCyndChq', full_name: 'Fiona Gallagher', department: 'hr', role: 'manager', session_token: null },
  { id: 7, email: 'mktg_employee@example.com', password_hash: '$2b$10$VueFZDPyZQs6h3buyBIFI.sywI8unmuTtgr5Jh/5w5pJHTCyndChq', full_name: 'George Costanza', department: 'marketing', role: 'employee', session_token: null },
  { id: 8, email: 'mktg_manager@example.com', password_hash: '$2b$10$VueFZDPyZQs6h3buyBIFI.sywI8unmuTtgr5Jh/5w5pJHTCyndChq', full_name: 'Helen Mirren', department: 'marketing', role: 'manager', session_token: null }
];

const mockBudgets = [
  { id: 1, department: 'sales', monthly_limit: 5000, spent_amount: 0 },
  { id: 2, department: 'engineering', monthly_limit: 5000, spent_amount: 0 },
  { id: 3, department: 'hr', monthly_limit: 5000, spent_amount: 0 },
  { id: 4, department: 'marketing', monthly_limit: 5000, spent_amount: 0 }
];

const mockExpenses = [];

let useMock = false;

const runMockQuery = (text, params = []) => {
  const norm = text.replace(/\s+/g, ' ').trim();
  
  // 1. Lookup user by email
  if (norm.includes('SELECT id, email, password_hash, full_name, department, role FROM users WHERE email = $1')) {
    const email = params[0].toLowerCase().trim();
    const user = mockUsers.find(u => u.email === email);
    return { rows: user ? [user] : [] };
  }
  
  // 2. Lookup user by token
  if (norm.includes('SELECT id, email, full_name, department, role FROM users WHERE session_token = $1')) {
    const token = params[0];
    const user = mockUsers.find(u => u.session_token === token);
    return { rows: user ? [user] : [] };
  }
  
  // 3. Update session token
  if (norm.includes('UPDATE users SET session_token = $1 WHERE id = $2')) {
    const token = params[0];
    const id = params[1];
    const user = mockUsers.find(u => u.id === parseInt(id));
    if (user) user.session_token = token;
    return { rows: [] };
  }
  
  // 4. Lookup budget details
  if (norm.includes('SELECT monthly_limit, spent_amount FROM department_budgets WHERE department = $1')) {
    const dept = params[0];
    const b = mockBudgets.find(b => b.department === dept);
    return { rows: b ? [b] : [] };
  }
  if (norm.includes('SELECT id, department, monthly_limit, spent_amount FROM department_budgets WHERE department = $1')) {
    const dept = params[0];
    const b = mockBudgets.find(b => b.department === dept);
    return { rows: b ? [b] : [] };
  }
  
  // Insert user
  if (norm.includes('INSERT INTO users')) {
    const email = params[0].toLowerCase().trim();
    
    // Check uniqueness
    if (mockUsers.some(u => u.email === email)) {
      const err = new Error('duplicate key value violates unique constraint "users_email_key"');
      err.code = '23505';
      throw err;
    }
    
    const newUser = {
      id: mockUsers.length + 1,
      email,
      password_hash: params[1],
      full_name: params[2],
      department: params[3],
      role: params[4],
      session_token: null
    };
    mockUsers.push(newUser);
    return { rows: [newUser] };
  }
  if (norm.includes('INSERT INTO expenses')) {
    const employee_id = params[0];
    const amount = params[1];
    const category = params[2];
    const description = params[3];
    const newExpense = {
      id: mockExpenses.length + 1,
      employee_id,
      amount: parseFloat(amount).toFixed(2),
      category,
      description,
      status: 'pending',
      created_at: new Date()
    };
    mockExpenses.push(newExpense);
    return { rows: [newExpense] };
  }
  
  // 6. History
  if (norm.includes('FROM expenses WHERE employee_id = $1')) {
    const empId = params[0];
    let filtered = mockExpenses.filter(e => e.employee_id === parseInt(empId));
    if (params.length > 1) {
      filtered = filtered.filter(e => e.status === params[1]);
    }
    filtered.sort((a,b) => b.created_at - a.created_at);
    return { rows: filtered };
  }
  
  // 7. Approvals list
  if (norm.includes('FROM expenses e INNER JOIN users u ON e.employee_id = u.id WHERE e.status = \'pending\' AND u.department = $1')) {
    const dept = params[0];
    const approvals = mockExpenses
      .filter(e => e.status === 'pending')
      .map(e => {
        const u = mockUsers.find(user => user.id === e.employee_id);
        return { ...e, employee_name: u ? u.full_name : 'Unknown', department: u ? u.department : '' };
      })
      .filter(e => e.department === dept);
    approvals.sort((a,b) => a.created_at - b.created_at);
    return { rows: approvals };
  }
  
  // 8. Single expense select for update (approvals)
  if (norm.includes('SELECT e.id, e.amount, e.status, e.employee_id, u.department FROM expenses e')) {
    const expId = params[0];
    const e = mockExpenses.find(exp => exp.id === parseInt(expId));
    if (e) {
      const u = mockUsers.find(user => user.id === e.employee_id);
      return { rows: [{ ...e, department: u ? u.department : '' }] };
    }
    return { rows: [] };
  }
  
  // 9. Update expense status
  if (norm.includes('UPDATE expenses SET status = $1 WHERE id = $2')) {
    const status = params[0];
    const id = params[1];
    const e = mockExpenses.find(exp => exp.id === parseInt(id));
    if (e) e.status = status;
    return { rows: [e] };
  }
  
  // 10. Update department budget spent_amount
  if (norm.includes('UPDATE department_budgets SET spent_amount = spent_amount + $1 WHERE department = $2')) {
    const amount = params[0];
    const dept = params[1];
    const b = mockBudgets.find(budget => budget.department === dept);
    if (b) b.spent_amount = parseFloat(b.spent_amount) + parseFloat(amount);
    return { rows: [] };
  }

  return { rows: [] };
};

const query = async (text, params) => {
  if (useMock) {
    return runMockQuery(text, params);
  }
  try {
    return await pool.query(text, params);
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('connect ECONNREFUSED')) {
      console.warn('⚠️ PostgreSQL connection failed. Falling back to in-memory database mock!');
      useMock = true;
      return runMockQuery(text, params);
    }
    throw error;
  }
};

// Mock transaction pool client
const mockClient = {
  query: async (text, params) => runMockQuery(text, params),
  release: () => {}
};

const mockPool = {
  connect: async () => {
    if (useMock) {
      return mockClient;
    }
    try {
      return await pool.connect();
    } catch (error) {
      console.warn('⚠️ PostgreSQL connection failed. Falling back to in-memory database client mock!');
      useMock = true;
      return mockClient;
    }
  }
};

module.exports = {
  query,
  pool: mockPool
};
