const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const [reviews] = await db.query(`
      SELECT r.*, u.full_name AS reviewer_name, u.avatar_url AS reviewer_avatar, u.college_name AS reviewer_college
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `, [req.params.productId]);

    res.json({ success: true, reviews });
  } catch (err) {
    console.error('Fetch product reviews error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving reviews.' });
  }
});

// Get reviews for a seller
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const [reviews] = await db.query(`
      SELECT r.*, u.full_name AS reviewer_name, u.avatar_url AS reviewer_avatar,
             p.title AS product_title
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      JOIN products p ON r.product_id = p.id
      WHERE r.seller_id = ?
      ORDER BY r.created_at DESC
    `, [req.params.sellerId]);

    const [[{ avgRating, count }]] = await db.query(
      'SELECT AVG(rating) as avgRating, COUNT(*) as count FROM reviews WHERE seller_id = ?',
      [req.params.sellerId]
    );

    res.json({
      success: true,
      reviews,
      avgRating: avgRating ? Number(avgRating).toFixed(1) : '5.0',
      totalReviews: count
    });
  } catch (err) {
    console.error('Fetch seller reviews error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving seller reviews.' });
  }
});

// Post a review
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, seller_id, rating, comment } = req.body;

    const ratingNum = parseInt(rating, 10);
    if (!product_id || !seller_id || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: 'Valid product, seller, and rating between 1 and 5 are required.' });
    }

    if (seller_id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot review yourself.' });
    }

    const [result] = await db.query(`
      INSERT INTO reviews (product_id, reviewer_id, seller_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `, [product_id, req.user.id, seller_id, ratingNum, comment ? comment.trim() : null]);

    // Notify seller
    await db.query(`
      INSERT INTO notifications (user_id, title, message, link, type)
      VALUES (?, 'New Seller Review', ?, '/profile', 'system')
    `, [
      seller_id,
      `${req.user.full_name} left you a ${ratingNum}-star review: "${comment ? comment.substring(0, 50) + '...' : 'Rated ' + ratingNum + ' stars'}"`
    ]);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      reviewId: result.insertId
    });
  } catch (err) {
    console.error('Post review error:', err);
    res.status(500).json({ success: false, message: 'Server error submitting review.' });
  }
});

module.exports = router;
