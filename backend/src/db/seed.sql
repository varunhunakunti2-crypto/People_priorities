-- Clear existing data
TRUNCATE TABLE expenses, users, department_budgets RESTART IDENTITY CASCADE;

-- Seed department_budgets
INSERT INTO department_budgets (department, monthly_limit, spent_amount) VALUES
('sales', 5000.00, 0.00),
('engineering', 5000.00, 0.00),
('hr', 5000.00, 0.00),
('marketing', 5000.00, 0.00);

-- Seed users (password for all is 'password123' hashed with bcrypt)
INSERT INTO users (email, password_hash, full_name, department, role) VALUES
-- Sales
('sales_employee@example.com', '$2b$10$VueFZDPyZQs6h3buyBIFI.sywI8unmuTtgr5Jh/5w5pJHTCyndChq', 'Alice Smith', 'sales', 'employee'),
('sales_manager@example.com', '$2b$10$VueFZDPyZQs6h3buyBIFI.sywI8unmuTtgr5Jh/5w5pJHTCyndChq', 'Bob Jones', 'sales', 'manager'),

-- Engineering
('eng_employee@example.com', '$2b$10$VueFZDPyZQs6h3buyBIFI.sywI8unmuTtgr5Jh/5w5pJHTCyndChq', 'Charlie Brown', 'engineering', 'employee'),
('eng_manager@example.com', '$2b$10$VueFZDPyZQs6h3buyBIFI.sywI8unmuTtgr5Jh/5w5pJHTCyndChq', 'Diana Prince', 'engineering', 'manager'),

-- HR
('hr_employee@example.com', '$2b$10$VueFZDPyZQs6h3buyBIFI.sywI8unmuTtgr5Jh/5w5pJHTCyndChq', 'Evan Wright', 'hr', 'employee'),
('hr_manager@example.com', '$2b$10$VueFZDPyZQs6h3buyBIFI.sywI8unmuTtgr5Jh/5w5pJHTCyndChq', 'Fiona Gallagher', 'hr', 'manager'),

-- Marketing
('mktg_employee@example.com', '$2b$10$VueFZDPyZQs6h3buyBIFI.sywI8unmuTtgr5Jh/5w5pJHTCyndChq', 'George Costanza', 'marketing', 'employee'),
('mktg_manager@example.com', '$2b$10$VueFZDPyZQs6h3buyBIFI.sywI8unmuTtgr5Jh/5w5pJHTCyndChq', 'Helen Mirren', 'marketing', 'manager');
