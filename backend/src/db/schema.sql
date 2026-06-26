-- Drop existing tables if they exist
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS department_budgets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS department_type CASCADE;
DROP TYPE IF EXISTS role_type CASCADE;
DROP TYPE IF EXISTS expense_category CASCADE;
DROP TYPE IF EXISTS expense_status CASCADE;

-- Create custom enum types
CREATE TYPE department_type AS ENUM ('sales', 'engineering', 'hr', 'marketing');
CREATE TYPE role_type AS ENUM ('employee', 'manager');
CREATE TYPE expense_category AS ENUM ('travel', 'meals', 'software', 'hardware');
CREATE TYPE expense_status AS ENUM ('pending', 'approved', 'rejected');

-- Create department_budgets table
CREATE TABLE department_budgets (
  id SERIAL PRIMARY KEY,
  department VARCHAR UNIQUE NOT NULL,
  monthly_limit NUMERIC(12,2) NOT NULL,
  spent_amount NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  full_name VARCHAR NOT NULL,
  department department_type NOT NULL,
  role role_type NOT NULL,
  session_token VARCHAR
);

-- Create expenses table
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  category expense_category NOT NULL,
  description TEXT,
  status expense_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
