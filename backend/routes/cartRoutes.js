const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get current user's cart
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [items] = await db.query(`
      SELECT ci.id AS cart_item_id, ci.quantity, ci.created_at AS added_at,
             p.id AS product_id, p.title, p.price, p.original_price, p.condition_state, 
             p.status AS product_status, p.primary_image, p.campus_location,
             u.id AS seller_id, u.full_name AS seller_name, u.college_name AS seller_college
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      JOIN users u ON p.seller_id = u.id
      WHERE ci.user_id = ?
      ORDER BY ci.created_at DESC
    `, [req.user.id]);

    let subtotal = 0;
    let availableCount = 0;

    const formattedItems = items.map(item => {
      const isAvailable = item.product_status === 'available';
      const itemTotal = isAvailable ? Number(item.price) * item.quantity : 0;
      if (isAvailable) {
        subtotal += itemTotal;
        availableCount += item.quantity;
      }
      return {
        ...item,
        isAvailable,
        itemTotal: itemTotal.toFixed(2)
      };
    });

    res.json({
      success: true,
      items: formattedItems,
      subtotal: subtotal.toFixed(2),
      total: subtotal.toFixed(2),
      itemCount: availableCount
    });
  } catch (err) {
    console.error('Fetch cart error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving cart items.' });
  }
});

// Add product to cart
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    // Verify product exists and is available
    const [products] = await db.query('SELECT id, seller_id, status FROM products WHERE id = ?', [product_id]);
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = products[0];

    // Cannot buy own product
    if (product.seller_id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot add your own listed product to your cart.' });
    }

    // Must be available
    if (product.status !== 'available') {
      return res.status(400).json({ success: false, message: 'This item is no longer available for purchase.' });
    }

    // Check if already in cart
    const [existing] = await db.query(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );

    if (existing.length > 0) {
      const newQty = existing[0].quantity + parseInt(quantity, 10);
      await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
      return res.json({ success: true, message: 'Cart updated successfully.' });
    }

    // Insert new item
    await db.query(
      'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
      [req.user.id, product_id, Math.max(1, parseInt(quantity, 10))]
    );

    res.status(201).json({ success: true, message: 'Product added to cart.' });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ success: false, message: 'Server error adding to cart.' });
  }
});

// Update item quantity
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    const qty = parseInt(quantity, 10);

    if (isNaN(qty) || qty < 1) {
      // Remove item if quantity becomes 0 or less
      await db.query('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
      return res.json({ success: true, message: 'Item removed from cart.' });
    }

    const [result] = await db.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
      [qty, req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found.' });
    }

    res.json({ success: true, message: 'Quantity updated.' });
  } catch (err) {
    console.error('Update quantity error:', err);
    res.status(500).json({ success: false, message: 'Server error updating cart quantity.' });
  }
});

// Remove item from cart
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found.' });
    }

    res.json({ success: true, message: 'Item removed from cart.' });
  } catch (err) {
    console.error('Delete cart item error:', err);
    res.status(500).json({ success: false, message: 'Server error removing item.' });
  }
});

// Clear user's cart
router.delete('/', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) {
    console.error('Clear cart error:', err);
    res.status(500).json({ success: false, message: 'Server error clearing cart.' });
  }
});

module.exports = router;
