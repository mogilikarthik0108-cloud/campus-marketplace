const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Propose a product exchange
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { requested_product_id, offered_product_id, message } = req.body;

    if (!requested_product_id || !offered_product_id) {
      return res.status(400).json({ success: false, message: 'Both requested and offered products must be selected.' });
    }

    // Verify requested product
    const [targetProducts] = await db.query(
      "SELECT id, seller_id, title, exchange_available, status FROM products WHERE id = ?",
      [requested_product_id]
    );

    if (targetProducts.length === 0) {
      return res.status(404).json({ success: false, message: 'Requested product not found.' });
    }

    const target = targetProducts[0];

    if (target.status !== 'available') {
      return res.status(400).json({ success: false, message: 'The requested item is not currently available.' });
    }

    if (!target.exchange_available) {
      return res.status(400).json({ success: false, message: 'The seller has not enabled exchange for this item.' });
    }

    if (target.seller_id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot propose an exchange for your own product.' });
    }

    // Verify offered product is owned by current user
    const [userProducts] = await db.query(
      "SELECT id, seller_id, title, status FROM products WHERE id = ?",
      [offered_product_id]
    );

    if (userProducts.length === 0) {
      return res.status(404).json({ success: false, message: 'Offered product not found.' });
    }

    const offered = userProducts[0];

    if (offered.seller_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only offer products that you have listed.' });
    }

    if (offered.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Your offered product is not marked as available.' });
    }

    // Insert exchange request
    const [result] = await db.query(`
      INSERT INTO exchange_requests (requester_id, target_seller_id, requested_product_id, offered_product_id, message, status)
      VALUES (?, ?, ?, ?, ?, 'Pending')
    `, [
      req.user.id,
      target.seller_id,
      requested_product_id,
      offered_product_id,
      message || `Proposed an exchange of "${offered.title}" for your "${target.title}".`
    ]);

    // Send notification to seller
    await db.query(`
      INSERT INTO notifications (user_id, title, message, link, type)
      VALUES (?, 'New Exchange Proposal', ?, '/exchange-requests', 'exchange')
    `, [
      target.seller_id,
      `${req.user.full_name} wants to exchange their "${offered.title}" for your "${target.title}".`
    ]);

    res.status(201).json({
      success: true,
      message: 'Exchange proposal submitted successfully.',
      exchangeId: result.insertId
    });
  } catch (err) {
    console.error('Propose exchange error:', err);
    res.status(500).json({ success: false, message: 'Server error creating exchange proposal.' });
  }
});

// Get user's exchange requests (both incoming and outgoing)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [requests] = await db.query(`
      SELECT er.*,
             rp.title AS requested_product_title, rp.primary_image AS requested_product_image, rp.price AS requested_product_price,
             op.title AS offered_product_title, op.primary_image AS offered_product_image, op.price AS offered_product_price,
             u_req.full_name AS requester_name, u_req.avatar_url AS requester_avatar, u_req.college_name AS requester_college,
             u_target.full_name AS target_seller_name, u_target.avatar_url AS target_seller_avatar, u_target.college_name AS target_seller_college
      FROM exchange_requests er
      JOIN products rp ON er.requested_product_id = rp.id
      JOIN products op ON er.offered_product_id = op.id
      JOIN users u_req ON er.requester_id = u_req.id
      JOIN users u_target ON er.target_seller_id = u_target.id
      WHERE er.requester_id = ? OR er.target_seller_id = ?
      ORDER BY er.created_at DESC
    `, [req.user.id, req.user.id]);

    const incoming = requests.filter(r => r.target_seller_id === req.user.id);
    const outgoing = requests.filter(r => r.requester_id === req.user.id);

    res.json({
      success: true,
      incoming,
      outgoing,
      totalCount: requests.length
    });
  } catch (err) {
    console.error('Fetch exchange requests error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving exchange requests.' });
  }
});

// Respond to exchange request (accept, reject, cancel, complete)
router.patch('/:id/respond', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const exchangeId = req.params.id;

    if (!['Accepted', 'Rejected', 'Cancelled', 'Completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid exchange response status.' });
    }

    const [requests] = await db.query(`
      SELECT er.*, rp.title AS requested_title, op.title AS offered_title
      FROM exchange_requests er
      JOIN products rp ON er.requested_product_id = rp.id
      JOIN products op ON er.offered_product_id = op.id
      WHERE er.id = ?
    `, [exchangeId]);

    if (requests.length === 0) {
      return res.status(404).json({ success: false, message: 'Exchange request not found.' });
    }

    const exch = requests[0];

    // Only target seller can Accept or Reject
    if (['Accepted', 'Rejected'].includes(status) && exch.target_seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the recipient seller can accept or reject this exchange.' });
    }

    // Only requester can Cancel
    if (status === 'Cancelled' && exch.requester_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the requester can cancel this exchange.' });
    }

    await db.query(
      'UPDATE exchange_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, exchangeId]
    );

    // If accepted or completed, mark both products as reserved or sold
    if (status === 'Accepted' || status === 'Completed') {
      const prodStatus = status === 'Completed' ? 'sold' : 'reserved';
      await db.query('UPDATE products SET status = ? WHERE id IN (?, ?)', [prodStatus, exch.requested_product_id, exch.offered_product_id]);
    }

    // Notify the other party
    const notifyUser = exch.requester_id === req.user.id ? exch.target_seller_id : exch.requester_id;
    await db.query(`
      INSERT INTO notifications (user_id, title, message, link, type)
      VALUES (?, ?, ?, '/exchange-requests', 'exchange')
    `, [
      notifyUser,
      `Exchange Request ${status}`,
      `${req.user.full_name} has marked the exchange for "${exch.requested_title}" as ${status}.`
    ]);

    res.json({ success: true, message: `Exchange request ${status.toLowerCase()} successfully.` });
  } catch (err) {
    console.error('Respond to exchange error:', err);
    res.status(500).json({ success: false, message: 'Server error updating exchange request.' });
  }
});

module.exports = router;
