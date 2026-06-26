const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userRole = req.user.role;

    // Hierarchy check: 'manager' can access both 'manager' and 'employee' routes.
    // 'employee' can only access 'employee' routes.
    if (requiredRole === 'employee') {
      if (userRole === 'employee' || userRole === 'manager') {
        return next();
      }
    } else if (requiredRole === 'manager') {
      if (userRole === 'manager') {
        return next();
      }
    } else if (userRole === requiredRole) {
      return next();
    }

    return res.status(403).json({ success: false, message: 'Access denied: insufficient permissions' });
  };
};

module.exports = requireRole;
