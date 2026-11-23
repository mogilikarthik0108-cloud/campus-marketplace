const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all categories with product counts
router.get('/', async (req, res) => {
  try {
    const [categories] = await db.query(`
      SELECT c.*, COUNT(p.id) AS product_count 
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.status = 'available'
      GROUP BY c.id
      ORDER BY c.id ASC
    `);

    res.json({ success: true, categories });
  } catch (err) {
    console.error('Fetch categories error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving categories.' });
  }
});

// Admin: Create category
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const [result] = await db.query(
      'INSERT INTO categories (name, slug, icon, description) VALUES (?, ?, ?, ?)',
      [name.trim(), slug, icon || 'Layers', description || null]
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category: { id: result.insertId, name, slug, icon, description }
    });
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ success: false, message: 'Server error creating category.' });
  }
});

// Admin: Update category
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    await db.query(
      'UPDATE categories SET name = ?, slug = ?, icon = ?, description = ? WHERE id = ?',
      [name.trim(), slug, icon, description, req.params.id]
    );

    res.json({ success: true, message: 'Category updated successfully.' });
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ success: false, message: 'Server error updating category.' });
  }
});

// Admin: Delete category
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [products] = await db.query('SELECT id FROM products WHERE category_id = ? LIMIT 1', [req.params.id]);
    if (products.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete category that contains products.' });
    }

    await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ success: false, message: 'Server error deleting category.' });
  }
});

module.exports = router;
