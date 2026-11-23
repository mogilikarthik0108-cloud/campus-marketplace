const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'campuscart_secret_key_2026_super_secure';

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [rows] = await db.query(
      'SELECT id, full_name, email, college_name, campus_location, phone_number, avatar_url, role, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (rows.length === 0 || !rows[0].is_active) {
      return res.status(403).json({ success: false, message: 'User account not found or suspended.' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired authentication session.' });
  }
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [rows] = await db.query(
      'SELECT id, full_name, email, college_name, campus_location, phone_number, avatar_url, role, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );
    if (rows.length > 0 && rows[0].is_active) {
      req.user = rows[0];
    } else {
      req.user = null;
    }
  } catch (err) {
    req.user = null;
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Administrator privileges required.' });
  }
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  JWT_SECRET
};
