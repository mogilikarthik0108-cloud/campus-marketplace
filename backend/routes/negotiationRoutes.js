const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Make a new offer on a product
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, offered_price, message } = req.body;

    if (!product_id || offered_price === undefined || isNaN(offered_price)) {
      return res.status(400).json({ success: false, message: 'Valid product and proposed offer price are required.' });
    }

    const price = parseFloat(offered_price);
    if (price <= 0) {
      return res.status(400).json({ success: false, message: 'Offer price must be greater than zero.' });
    }

    // Check product
    const [products] = await db.query(
      'SELECT id, seller_id, title, price, status FROM products WHERE id = ?',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = products[0];

    if (product.status !== 'available') {
      return res.status(400).json({ success: false, message: 'This product is no longer available for offers.' });
    }

    if (product.seller_id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot make an offer on your own listed product.' });
    }

    // Check if there is already an active pending or countered negotiation
    const [existing] = await db.query(
      "SELECT id, status FROM negotiations WHERE product_id = ? AND buyer_id = ? AND status IN ('Pending', 'Countered')",
      [product_id, req.user.id]
    );

    let negotiationId;

    if (existing.length > 0) {
      // Update existing negotiation
      negotiationId = existing[0].id;
      await db.query(
        "UPDATE negotiations SET current_offered_price = ?, status = 'Pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [price, negotiationId]
      );
    } else {
      // Create new negotiation
      const [result] = await db.query(
        `INSERT INTO negotiations (product_id, buyer_id, seller_id, original_price, current_offered_price, status)
         VALUES (?, ?, ?, ?, ?, 'Pending')`,
        [product_id, req.user.id, product.seller_id, product.price, price]
      );
      negotiationId = result.insertId;
    }

    // Record message entry
    await db.query(
      `INSERT INTO negotiation_messages (negotiation_id, sender_id, sender_type, offered_price, message, action_type)
       VALUES (?, ?, 'buyer', ?, ?, 'offer')`,
      [negotiationId, req.user.id, price, message || `Proposed price: Rs ${price}`]
    );

    // Notify seller
    await db.query(
      `INSERT INTO notifications (user_id, title, message, link, type)
       VALUES (?, 'New Price Offer Received', ?, '/negotiations', 'offer')`,
      [product.seller_id, `${req.user.full_name} made an offer of Rs ${price} for "${product.title}".`]
    );

    res.status(201).json({
      success: true,
      message: 'Offer submitted successfully to the seller.',
      negotiationId
    });
  } catch (err) {
    console.error('Make offer error:', err);
    res.status(500).json({ success: false, message: 'Server error creating offer.' });
  }
});

// Get all negotiations for current user (sent offers & received offers)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [negotiations] = await db.query(`
      SELECT n.*, 
             p.title AS product_title, p.primary_image AS product_image, p.price AS product_price, p.status AS product_status,
             b.full_name AS buyer_name, b.email AS buyer_email, b.avatar_url AS buyer_avatar,
             s.full_name AS seller_name, s.email AS seller_email, s.avatar_url AS seller_avatar
      FROM negotiations n
      JOIN products p ON n.product_id = p.id
      JOIN users b ON n.buyer_id = b.id
      JOIN users s ON n.seller_id = s.id
      WHERE n.buyer_id = ? OR n.seller_id = ?
      ORDER BY n.updated_at DESC
    `, [req.user.id, req.user.id]);

    const sentOffers = negotiations.filter(n => n.buyer_id === req.user.id);
    const receivedOffers = negotiations.filter(n => n.seller_id === req.user.id);

    res.json({
      success: true,
      sentOffers,
      receivedOffers,
      totalCount: negotiations.length
    });
  } catch (err) {
    console.error('Fetch negotiations error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving offers.' });
  }
});

// Get single negotiation details + messages history
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [negotiations] = await db.query(`
      SELECT n.*, 
             p.title AS product_title, p.primary_image AS product_image, p.price AS product_price, p.status AS product_status,
             b.full_name AS buyer_name, b.email AS buyer_email, b.avatar_url AS buyer_avatar, b.campus_location AS buyer_campus,
             s.full_name AS seller_name, s.email AS seller_email, s.avatar_url AS seller_avatar, s.campus_location AS seller_campus
      FROM negotiations n
      JOIN products p ON n.product_id = p.id
      JOIN users b ON n.buyer_id = b.id
      JOIN users s ON n.seller_id = s.id
      WHERE n.id = ?
    `, [req.params.id]);

    if (negotiations.length === 0) {
      return res.status(404).json({ success: false, message: 'Negotiation offer not found.' });
    }

    const nego = negotiations[0];

    // Only buyer or seller can view
    if (nego.buyer_id !== req.user.id && nego.seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this negotiation.' });
    }

    // Fetch message history
    const [messages] = await db.query(`
      SELECT nm.*, u.full_name AS sender_name, u.avatar_url AS sender_avatar
      FROM negotiation_messages nm
      JOIN users u ON nm.sender_id = u.id
      WHERE nm.negotiation_id = ?
      ORDER BY nm.created_at ASC
    `, [nego.id]);

    res.json({
      success: true,
      negotiation: {
        ...nego,
        isBuyer: nego.buyer_id === req.user.id,
        isSeller: nego.seller_id === req.user.id,
        messages
      }
    });
  } catch (err) {
    console.error('Get negotiation error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving offer details.' });
  }
});

// Respond to an offer (accept, reject, counter)
router.post('/:id/respond', authenticateToken, async (req, res) => {
  try {
    const { action, counterPrice, message } = req.body;
    const negotiationId = req.params.id;

    if (!['accept', 'reject', 'counter'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be accept, reject, or counter.' });
    }

    const [negotiations] = await db.query(
      `SELECT n.*, p.title AS product_title 
       FROM negotiations n 
       JOIN products p ON n.product_id = p.id 
       WHERE n.id = ?`,
      [negotiationId]
    );

    if (negotiations.length === 0) {
      return res.status(404).json({ success: false, message: 'Negotiation not found.' });
    }

    const nego = negotiations[0];

    // Check authorization: Must be buyer or seller
    const isSeller = nego.seller_id === req.user.id;
    const isBuyer = nego.buyer_id === req.user.id;

    if (!isSeller && !isBuyer && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to respond to this offer.' });
    }

    if (action === 'accept') {
      await db.query(
        "UPDATE negotiations SET status = 'Accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [negotiationId]
      );

      await db.query(
        `INSERT INTO negotiation_messages (negotiation_id, sender_id, sender_type, offered_price, message, action_type)
         VALUES (?, ?, ?, ?, ?, 'accept')`,
        [negotiationId, req.user.id, isSeller ? 'seller' : 'buyer', nego.current_offered_price, message || 'Offer accepted! You can proceed to purchase at this price.']
      );

      // Notify the other party
      const notifyUser = isSeller ? nego.buyer_id : nego.seller_id;
      await db.query(
        `INSERT INTO notifications (user_id, title, message, link, type)
         VALUES (?, 'Offer Accepted!', ?, '/negotiations', 'offer')`,
        [notifyUser, `${req.user.full_name} accepted the offer of Rs ${nego.current_offered_price} for "${nego.product_title}".`]
      );

      return res.json({ success: true, message: 'Offer accepted successfully.' });
    }

    if (action === 'reject') {
      await db.query(
        "UPDATE negotiations SET status = 'Rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [negotiationId]
      );

      await db.query(
        `INSERT INTO negotiation_messages (negotiation_id, sender_id, sender_type, offered_price, message, action_type)
         VALUES (?, ?, ?, ?, ?, 'reject')`,
        [negotiationId, req.user.id, isSeller ? 'seller' : 'buyer', nego.current_offered_price, message || 'Offer was declined.']
      );

      const notifyUser = isSeller ? nego.buyer_id : nego.seller_id;
      await db.query(
        `INSERT INTO notifications (user_id, title, message, link, type)
         VALUES (?, 'Offer Declined', ?, '/negotiations', 'offer')`,
        [notifyUser, `${req.user.full_name} declined the offer for "${nego.product_title}".`]
      );

      return res.json({ success: true, message: 'Offer rejected.' });
    }

    if (action === 'counter') {
      if (!counterPrice || isNaN(counterPrice) || parseFloat(counterPrice) <= 0) {
        return res.status(400).json({ success: false, message: 'A valid counter-offer price is required.' });
      }

      const newPrice = parseFloat(counterPrice);

      await db.query(
        "UPDATE negotiations SET current_offered_price = ?, status = 'Countered', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [newPrice, negotiationId]
      );

      await db.query(
        `INSERT INTO negotiation_messages (negotiation_id, sender_id, sender_type, offered_price, message, action_type)
         VALUES (?, ?, ?, ?, ?, 'counter')`,
        [negotiationId, req.user.id, isSeller ? 'seller' : 'buyer', newPrice, message || `Counter-offer: Rs ${newPrice}`]
      );

      const notifyUser = isSeller ? nego.buyer_id : nego.seller_id;
      await db.query(
        `INSERT INTO notifications (user_id, title, message, link, type)
         VALUES (?, 'Counter-Offer Received', ?, '/negotiations', 'offer')`,
        [notifyUser, `${req.user.full_name} proposed a counter-offer of Rs ${newPrice} for "${nego.product_title}".`]
      );

      return res.json({ success: true, message: 'Counter-offer sent.' });
    }
  } catch (err) {
    console.error('Respond offer error:', err);
    res.status(500).json({ success: false, message: 'Server error responding to offer.' });
  }
});

module.exports = router;
