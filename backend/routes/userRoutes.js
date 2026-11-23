const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get current user profile details
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, full_name, email, college_name, campus_location, phone_number, avatar_url, bio, role, created_at 
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Get stats
    const [[{ listingsCount }]] = await db.query('SELECT COUNT(*) as listingsCount FROM products WHERE seller_id = ?', [req.user.id]);
    const [[{ ordersCount }]] = await db.query('SELECT COUNT(*) as ordersCount FROM orders WHERE buyer_id = ?', [req.user.id]);
    const [[{ ratingAvg }]] = await db.query('SELECT AVG(rating) as ratingAvg FROM reviews WHERE seller_id = ?', [req.user.id]);

    res.json({
      success: true,
      user: {
        ...rows[0],
        listingsCount,
        ordersCount,
        ratingAvg: ratingAvg ? Number(ratingAvg).toFixed(1) : '5.0'
      }
    });
  } catch (err) {
    console.error('Fetch profile error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving profile.' });
  }
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { full_name, college_name, campus_location, phone_number, bio, avatar_url } = req.body;

    if (!full_name || !college_name || !campus_location) {
      return res.status(400).json({ success: false, message: 'Name, college and campus location are required.' });
    }

    await db.query(
      `UPDATE users 
       SET full_name = ?, college_name = ?, campus_location = ?, phone_number = ?, bio = ?, avatar_url = COALESCE(?, avatar_url)
       WHERE id = ?`,
      [full_name.trim(), college_name.trim(), campus_location.trim(), phone_number || null, bio || null, avatar_url || null, req.user.id]
    );

    const [updated] = await db.query(
      'SELECT id, full_name, email, college_name, campus_location, phone_number, avatar_url, bio, role FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updated[0]
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const [rows] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Server error updating password.' });
  }
});

// Public seller profile
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, full_name, college_name, campus_location, avatar_url, bio, created_at 
       FROM users WHERE id = ? AND is_active = 1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Seller not found.' });
    }

    const seller = rows[0];

    // Reviews and rating
    const [reviews] = await db.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.full_name AS reviewer_name, u.avatar_url AS reviewer_avatar
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.seller_id = ?
       ORDER BY r.created_at DESC`,
      [seller.id]
    );

    const [[{ avgRating, countReviews }]] = await db.query(
      'SELECT AVG(rating) as avgRating, COUNT(*) as countReviews FROM reviews WHERE seller_id = ?',
      [seller.id]
    );

    // Active listings by this seller
    const [products] = await db.query(
      `SELECT p.*, c.name AS category_name 
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.seller_id = ? AND p.status = 'available'
       ORDER BY p.created_at DESC`,
      [seller.id]
    );

    res.json({
      success: true,
      seller: {
        ...seller,
        rating: avgRating ? Number(avgRating).toFixed(1) : '5.0',
        reviewCount: countReviews || 0,
        reviews,
        activeProducts: products
      }
    });
  } catch (err) {
    console.error('Get seller profile error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving seller details.' });
  }
});

module.exports = router;
