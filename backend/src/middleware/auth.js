const db = require('../db');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }

    // Support both "Bearer <token>" and raw "<token>"
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    const result = await db.query(
      'SELECT id, email, full_name, department, role FROM users WHERE session_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session token' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = auth;
