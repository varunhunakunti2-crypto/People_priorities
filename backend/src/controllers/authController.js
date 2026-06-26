const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../db');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Lookup user by email
    const result = await db.query(
      'SELECT id, email, password_hash, full_name, department, role FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password hash
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate session token
    const sessionToken = crypto.randomUUID();

    // Save session token to DB
    await db.query(
      'UPDATE users SET session_token = $1 WHERE id = $2',
      [sessionToken, user.id]
    );

    res.status(200).json({
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        department: user.department,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { email, password, full_name, department, role } = req.body;

    if (!email || !password || !full_name || !department || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const allowedDepartments = ['sales', 'engineering', 'hr', 'marketing'];
    const allowedRoles = ['employee', 'manager'];

    if (!allowedDepartments.includes(department)) {
      return res.status(400).json({ success: false, message: 'Invalid department' });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    let user;
    try {
      const result = await db.query(
        `INSERT INTO users (email, password_hash, full_name, department, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, full_name, department, role`,
        [email.toLowerCase().trim(), hashedPassword, full_name, department, role]
      );
      user = result.rows[0];
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ success: false, message: 'Email address already in use' });
      }
      throw err;
    }

    // Generate session token
    const sessionToken = crypto.randomUUID();

    // Save session token
    await db.query(
      'UPDATE users SET session_token = $1 WHERE id = $2',
      [sessionToken, user.id]
    );

    res.status(201).json({
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        department: user.department,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register
};
