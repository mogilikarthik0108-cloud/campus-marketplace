const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All admin routes require admin authentication
router.use(authenticateToken, requireAdmin);

// Admin dashboard overall statistics
router.get('/stats', async (req, res) => {
  try {
    const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) AS totalUsers FROM users');
    const [[{ totalProducts }]] = await db.query('SELECT COUNT(*) AS totalProducts FROM products');
    const [[{ availableProducts }]] = await db.query("SELECT COUNT(*) AS availableProducts FROM products WHERE status = 'available'");
    const [[{ soldProducts }]] = await db.query("SELECT COUNT(*) AS soldProducts FROM products WHERE status = 'sold'");
    const [[{ totalOrders }]] = await db.query('SELECT COUNT(*) AS totalOrders FROM orders');
    const [[{ totalRevenue }]] = await db.query('SELECT COALESCE(SUM(total_amount), 0) AS totalRevenue FROM orders');
    const [[{ activeNegotiations }]] = await db.query("SELECT COUNT(*) AS activeNegotiations FROM negotiations WHERE status IN ('Pending', 'Countered')");
    const [[{ activeExchanges }]] = await db.query("SELECT COUNT(*) AS activeExchanges FROM exchange_requests WHERE status = 'Pending'");

    // Recent orders
    const [recentOrders] = await db.query(`
      SELECT o.*, u.full_name AS buyer_name, u.email AS buyer_email
      FROM orders o
      JOIN users u ON o.buyer_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    // Top categories
    const [categoryBreakdown] = await db.query(`
      SELECT c.name, COUNT(p.id) AS count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        availableProducts,
        soldProducts,
        totalOrders,
        totalRevenue: Number(totalRevenue).toFixed(2),
        activeNegotiations,
        activeExchanges,
        recentOrders,
        categoryBreakdown
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving administrator statistics.' });
  }
});

// List all users
router.get('/users', async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT u.id, u.full_name, u.email, u.college_name, u.campus_location, u.phone_number, 
             u.role, u.is_active, u.created_at,
             (SELECT COUNT(*) FROM products WHERE seller_id = u.id) AS products_count,
             (SELECT COUNT(*) FROM orders WHERE buyer_id = u.id) AS orders_count
      FROM users u
      ORDER BY u.created_at DESC
    `);

    res.json({ success: true, users });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving users list.' });
  }
});

// Toggle user active status
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { is_active } = req.body;
    const userId = req.params.id;

    if (parseInt(userId, 10) === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own admin account.' });
    }

    await db.query('UPDATE users SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, userId]);
    res.json({ success: true, message: `User status changed to ${is_active ? 'Active' : 'Suspended'}.` });
  } catch (err) {
    console.error('Toggle user status error:', err);
    res.status(500).json({ success: false, message: 'Server error updating user status.' });
  }
});

// List all products for moderation
router.get('/products', async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.*, c.name AS category_name, u.full_name AS seller_name, u.email AS seller_email
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      ORDER BY p.created_at DESC
    `);

    res.json({ success: true, products });
  } catch (err) {
    console.error('Admin products error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving products list.' });
  }
});

// Delete inappropriate product listing
router.delete('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    const [products] = await db.query('SELECT title, seller_id FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const { title, seller_id } = products[0];

    await db.query('DELETE FROM products WHERE id = ?', [productId]);

    // Send notification to seller
    await db.query(`
      INSERT INTO notifications (user_id, title, message, link, type)
      VALUES (?, 'Listing Removed by Moderator', ?, '/browse', 'system')
    `, [
      seller_id,
      `Your product listing "${title}" was removed by the administrator for violating marketplace guidelines.`
    ]);

    res.json({ success: true, message: 'Product listing removed by admin.' });
  } catch (err) {
    console.error('Admin delete product error:', err);
    res.status(500).json({ success: false, message: 'Server error removing product.' });
  }
});

// List all orders
router.get('/orders', async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT o.*, u.full_name AS buyer_name, u.email AS buyer_email,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count
      FROM orders o
      JOIN users u ON o.buyer_id = u.id
      ORDER BY o.created_at DESC
    `);

    res.json({ success: true, orders });
  } catch (err) {
    console.error('Admin orders error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving orders.' });
  }
});

// List all exchanges
router.get('/exchanges', async (req, res) => {
  try {
    const [exchanges] = await db.query(`
      SELECT er.*,
             rp.title AS requested_product_title,
             op.title AS offered_product_title,
             u_req.full_name AS requester_name,
             u_target.full_name AS target_seller_name
      FROM exchange_requests er
      JOIN products rp ON er.requested_product_id = rp.id
      JOIN products op ON er.offered_product_id = op.id
      JOIN users u_req ON er.requester_id = u_req.id
      JOIN users u_target ON er.target_seller_id = u_target.id
      ORDER BY er.created_at DESC
    `);

    res.json({ success: true, exchanges });
  } catch (err) {
    console.error('Admin exchanges error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving exchanges.' });
  }
});

module.exports = router;
