const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role || 'student';
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Requires one of roles: [${roles.join(', ')}]`
      });
    }

    next();
  };
};

module.exports = { requireRole };
