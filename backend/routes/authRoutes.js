const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, college_name, campus_location, phone_number } = req.body;

    if (!full_name || !email || !password || !college_name || !campus_location) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Check if email already registered
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Default avatar
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(full_name)}&background=0f172a&color=fff&size=200`;

    // Insert user
    const [result] = await db.query(
      `INSERT INTO users (full_name, email, password_hash, college_name, campus_location, phone_number, avatar_url, role) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'student')`,
      [full_name.trim(), email.toLowerCase().trim(), password_hash, college_name.trim(), campus_location.trim(), phone_number || null, defaultAvatar]
    );

    const userId = result.insertId;

    // Create welcoming notification
    await db.query(
      `INSERT INTO notifications (user_id, title, message, link, type) 
       VALUES (?, 'Welcome to CampusCart!', 'Start exploring products, negotiate deals, or list your student essentials.', '/browse', 'system')`,
      [userId]
    );

    // Generate JWT
    const token = jwt.sign({ userId, email: email.toLowerCase().trim() }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: userId,
        full_name: full_name.trim(),
        email: email.toLowerCase().trim(),
        college_name: college_name.trim(),
        campus_location: campus_location.trim(),
        phone_number: phone_number || null,
        avatar_url: defaultAvatar,
        role: 'student'
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration. Please try again.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        college_name: user.college_name,
        campus_location: user.campus_location,
        phone_number: user.phone_number,
        avatar_url: user.avatar_url,
        bio: user.bio,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// Get current authenticated user
router.get('/me', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

module.exports = router;
