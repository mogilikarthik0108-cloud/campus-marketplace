const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Create a new order (Checkout)
router.post('/', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      items = [], // array of { product_id, price, quantity }
      pickup_location,
      contact_phone,
      delivery_type = 'Campus Pickup',
      payment_method = 'Cash on Pickup',
      notes = ''
    } = req.body;

    if (!items || items.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Your order must contain at least one item.' });
    }

    if (!pickup_location || !contact_phone) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Campus pickup location and contact phone number are required.' });
    }

    // Verify all items are available and not owned by buyer
    const productIds = items.map(item => item.product_id);
    const [products] = await connection.query(
      `SELECT id, seller_id, title, price, status FROM products WHERE id IN (?) FOR UPDATE`,
      [productIds]
    );

    if (products.length !== items.length) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'One or more selected items are no longer found.' });
    }

    let calculatedTotal = 0;
    const itemsToProcess = [];

    for (const prod of products) {
      if (prod.status !== 'available') {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ success: false, message: `"${prod.title}" was just purchased by another student and is unavailable.` });
      }

      if (prod.seller_id === req.user.id) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ success: false, message: `You cannot purchase your own item ("${prod.title}").` });
      }

      // Check if item has a custom accepted negotiation price
      const matchedClientItem = items.find(i => i.product_id === prod.id);
      let purchasePrice = Number(prod.price);

      // Check if accepted negotiation exists for this buyer & product
      const [acceptedNego] = await connection.query(
        "SELECT current_offered_price FROM negotiations WHERE product_id = ? AND buyer_id = ? AND status = 'Accepted' LIMIT 1",
        [prod.id, req.user.id]
      );

      if (acceptedNego.length > 0) {
        purchasePrice = Number(acceptedNego[0].current_offered_price);
      } else if (matchedClientItem && matchedClientItem.custom_price && Number(matchedClientItem.custom_price) < purchasePrice) {
        // verify
      }

      const quantity = matchedClientItem && matchedClientItem.quantity ? Math.max(1, parseInt(matchedClientItem.quantity, 10)) : 1;
      calculatedTotal += purchasePrice * quantity;

      itemsToProcess.push({
        product_id: prod.id,
        seller_id: prod.seller_id,
        title: prod.title,
        price_at_purchase: purchasePrice,
        quantity
      });
    }

    // Generate unique order code
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const order_code = `CC-2026-${randomSuffix}`;

    // Determine initial payment status
    const payment_status = payment_method === 'Cash on Pickup' ? 'Pending' : 'Paid';

    // Insert order
    const [orderResult] = await connection.query(`
      INSERT INTO orders (
        order_code, buyer_id, total_amount, pickup_location,
        contact_phone, delivery_type, payment_method, payment_status,
        order_status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?)
    `, [
      order_code,
      req.user.id,
      calculatedTotal.toFixed(2),
      pickup_location.trim(),
      contact_phone.trim(),
      delivery_type,
      payment_method,
      payment_status,
      notes || null
    ]);

    const orderId = orderResult.insertId;

    // Insert order items and update products to sold
    for (const item of itemsToProcess) {
      await connection.query(`
        INSERT INTO order_items (order_id, product_id, seller_id, price_at_purchase, quantity)
        VALUES (?, ?, ?, ?, ?)
      `, [orderId, item.product_id, item.seller_id, item.price_at_purchase, item.quantity]);

      // Mark product as sold
      await connection.query("UPDATE products SET status = 'sold' WHERE id = ?", [item.product_id]);

      // Notify seller
      await connection.query(`
        INSERT INTO notifications (user_id, title, message, link, type)
        VALUES (?, 'Product Sold!', ?, '/orders', 'order')
      `, [
        item.seller_id,
        `Great news! "${item.title}" has been purchased in Order ${order_code}. Meet the buyer for pickup.`
      ]);
    }

    // Clear purchased products from user's cart
    await connection.query(`DELETE FROM cart_items WHERE user_id = ? AND product_id IN (?)`, [req.user.id, productIds]);

    // Send confirmation notification to buyer
    await connection.query(`
      INSERT INTO notifications (user_id, title, message, link, type)
      VALUES (?, 'Order Placed Successfully', ?, '/orders', 'order')
    `, [
      req.user.id,
      `Your order ${order_code} for Rs ${calculatedTotal.toFixed(2)} has been confirmed! Pickup location: ${pickup_location}.`
    ]);

    await connection.commit();
    connection.release();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: {
        id: orderId,
        order_code,
        total_amount: calculatedTotal.toFixed(2),
        payment_method,
        payment_status,
        order_status: 'Confirmed',
        pickup_location
      }
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('Create order error:', err);
    res.status(500).json({ success: false, message: 'Server error processing your order.' });
  }
});

// Get user's orders (My Orders)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT o.*, 
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count
      FROM orders o
      WHERE o.buyer_id = ?
      ORDER BY o.created_at DESC
    `, [req.user.id]);

    // Fetch items for each order
    for (const order of orders) {
      const [items] = await db.query(`
        SELECT oi.*, p.title, p.primary_image, p.condition_state, 
               u.full_name AS seller_name, u.phone_number AS seller_phone, u.campus_location AS seller_campus
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN users u ON oi.seller_id = u.id
        WHERE oi.order_id = ?
      `, [order.id]);
      order.items = items;
    }

    res.json({ success: true, orders });
  } catch (err) {
    console.error('Fetch orders error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving orders.' });
  }
});

// Get orders where logged in user is the SELLER (My Sales)
router.get('/sales/my-sales', authenticateToken, async (req, res) => {
  try {
    const [sales] = await db.query(`
      SELECT oi.*, o.order_code, o.order_status, o.pickup_location, o.payment_method, o.created_at AS order_date,
             p.title AS product_title, p.primary_image,
             u.full_name AS buyer_name, u.phone_number AS buyer_phone, u.college_name AS buyer_college
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      JOIN users u ON o.buyer_id = u.id
      WHERE oi.seller_id = ?
      ORDER BY o.created_at DESC
    `, [req.user.id]);

    res.json({ success: true, sales });
  } catch (err) {
    console.error('Fetch sales error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving sales.' });
  }
});

// Get single order details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT o.*, u.full_name AS buyer_name, u.email AS buyer_email
      FROM orders o
      JOIN users u ON o.buyer_id = u.id
      WHERE o.id = ?
    `, [req.params.id]);

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = orders[0];

    // Check authorization: must be buyer, a seller in this order, or admin
    const [items] = await db.query(`
      SELECT oi.*, p.title, p.primary_image, p.condition_state, 
             u.id AS seller_id, u.full_name AS seller_name, u.phone_number AS seller_phone, u.email AS seller_email, u.campus_location AS seller_campus
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN users u ON oi.seller_id = u.id
      WHERE oi.order_id = ?
    `, [order.id]);

    const isSeller = items.some(i => i.seller_id === req.user.id);
    const isBuyer = order.buyer_id === req.user.id;

    if (!isBuyer && !isSeller && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this order.' });
    }

    order.items = items;
    res.json({ success: true, order });
  } catch (err) {
    console.error('Get order details error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving order details.' });
  }
});

// Update order status (Ready for Pickup / Completed / Cancelled)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { order_status } = req.body;
    const orderId = req.params.id;

    if (!['Placed', 'Confirmed', 'Ready for Pickup', 'Completed', 'Cancelled'].includes(order_status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status value.' });
    }

    const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = orders[0];

    await db.query(
      'UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [order_status, orderId]
    );

    // If order was cancelled, restore product statuses to available
    if (order_status === 'Cancelled') {
      await db.query(`
        UPDATE products SET status = 'available' 
        WHERE id IN (SELECT product_id FROM order_items WHERE order_id = ?)
      `, [orderId]);
    }

    // Notify buyer
    await db.query(`
      INSERT INTO notifications (user_id, title, message, link, type)
      VALUES (?, ?, ?, '/orders', 'order')
    `, [
      order.buyer_id,
      `Order Status: ${order_status}`,
      `Your order ${order.order_code} status has been updated to "${order_status}".`
    ]);

    res.json({ success: true, message: `Order marked as ${order_status}.` });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ success: false, message: 'Server error updating order status.' });
  }
});

module.exports = router;
