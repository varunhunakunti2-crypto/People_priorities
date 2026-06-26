const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authRoutes = require('./authRoutes');

// Mount public routes
router.use('/auth', authRoutes);

// Apply auth middleware globally to all subsequent /api/v1/* routes
router.use(auth);

const expenseRoutes = require('./expenseRoutes');
const managerRoutes = require('./managerRoutes');

// Mount protected routes below this line
router.use('/expenses', expenseRoutes);
router.use('/manager', managerRoutes);

router.get('/protected-test', (req, res) => {
  res.json({
    success: true,
    message: 'Authentication successful',
    user: req.user
  });
});

module.exports = router;
