const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get user wishlist
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [items] = await db.query(`
      SELECT w.id AS wishlist_id, w.created_at AS added_at,
             p.id AS product_id, p.title, p.price, p.original_price, p.condition_state, 
             p.status AS product_status, p.primary_image, p.campus_location, p.exchange_available,
             c.name AS category_name,
             u.full_name AS seller_name
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `, [req.user.id]);

    res.json({ success: true, items });
  } catch (err) {
    console.error('Fetch wishlist error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving wishlist.' });
  }
});

// Toggle product in wishlist (add or remove)
router.post('/toggle/:productId', authenticateToken, async (req, res) => {
  try {
    const productId = req.params.productId;

    const [existing] = await db.query(
      'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );

    if (existing.length > 0) {
      await db.query('DELETE FROM wishlist WHERE id = ?', [existing[0].id]);
      return res.json({ success: true, action: 'removed', message: 'Item removed from wishlist.' });
    }

    await db.query('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)', [req.user.id, productId]);
    res.status(201).json({ success: true, action: 'added', message: 'Item saved to wishlist.' });
  } catch (err) {
    console.error('Toggle wishlist error:', err);
    res.status(500).json({ success: false, message: 'Server error updating wishlist.' });
  }
});

// Remove product from wishlist
router.delete('/:productId', authenticateToken, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
      [req.user.id, req.params.productId]
    );
    res.json({ success: true, message: 'Item removed from wishlist.' });
  } catch (err) {
    console.error('Delete wishlist error:', err);
    res.status(500).json({ success: false, message: 'Server error removing wishlist item.' });
  }
});

// Move wishlist item to cart
router.post('/move-to-cart/:productId', authenticateToken, async (req, res) => {
  try {
    const productId = req.params.productId;

    const [products] = await db.query('SELECT id, seller_id, status FROM products WHERE id = ?', [productId]);
    if (products.length === 0 || products[0].status !== 'available') {
      return res.status(400).json({ success: false, message: 'Product is no longer available.' });
    }

    if (products[0].seller_id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot buy your own product.' });
    }

    // Add to cart or increment
    const [cartExist] = await db.query('SELECT id FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);
    if (cartExist.length > 0) {
      await db.query('UPDATE cart_items SET quantity = quantity + 1 WHERE id = ?', [cartExist[0].id]);
    } else {
      await db.query('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, 1)', [req.user.id, productId]);
    }

    // Remove from wishlist
    await db.query('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);

    res.json({ success: true, message: 'Moved item to shopping cart.' });
  } catch (err) {
    console.error('Move to cart error:', err);
    res.status(500).json({ success: false, message: 'Server error moving to cart.' });
  }
});

module.exports = router;
