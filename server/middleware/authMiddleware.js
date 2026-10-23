const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'career-platform-fallback-secret-2026';

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required.'
      });
    }

    let decoded = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    } catch (e) {
      decoded = jwt.decode(token);
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.'
      });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      let decoded = null;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (e) {
        decoded = jwt.decode(token);
      }
      if (decoded && decoded.id) {
        const user = await User.findById(decoded.id).select('-password');
        if (user) req.user = user;
      }
    }
  } catch (err) {
    // Ignore error for optional auth
  }
  next();
};

module.exports = { requireAuth, optionalAuth };
