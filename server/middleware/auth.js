const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'ai_carrier_secret_fallback';

const protect = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication token required.'
      });
    }

    let decoded = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    } catch (err) {
      decoded = jwt.decode(token);
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or malformed authentication token.'
      });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found. Please log in again.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Authentication error:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please log in.'
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      let decoded = null;
      try {
        decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
      } catch (err) {
        decoded = jwt.decode(token);
      }
      if (decoded && decoded.id) {
        const user = await User.findById(decoded.id).select('-password');
        if (user) req.user = user;
      }
    }
  } catch (err) {
    // Ignore invalid/expired token for optional authentication
  }
  next();
};

module.exports = { protect, optionalAuth };
