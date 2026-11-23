const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Image upload endpoint
router.post('/upload-image', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file uploaded.' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    imageUrl,
    message: 'Image uploaded successfully.'
  });
});

// Get featured products
router.get('/featured', async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug, 
             u.full_name AS seller_name, u.avatar_url AS seller_avatar, u.college_name AS seller_college
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'available'
      ORDER BY p.views_count DESC, p.created_at DESC
      LIMIT 8
    `);
    res.json({ success: true, products });
  } catch (err) {
    console.error('Featured products error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving featured products.' });
  }
});

// Get recently added products
router.get('/recent', async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug, 
             u.full_name AS seller_name, u.avatar_url AS seller_avatar, u.college_name AS seller_college
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'available'
      ORDER BY p.created_at DESC
      LIMIT 8
    `);
    res.json({ success: true, products });
  } catch (err) {
    console.error('Recent products error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving recent products.' });
  }
});

// Get popular products
router.get('/popular', async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug, 
             u.full_name AS seller_name, u.avatar_url AS seller_avatar, u.college_name AS seller_college
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'available'
      ORDER BY p.views_count DESC
      LIMIT 8
    `);
    res.json({ success: true, products });
  } catch (err) {
    console.error('Popular products error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving popular products.' });
  }
});

// Get products available for exchange
router.get('/exchange', async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug, 
             u.full_name AS seller_name, u.avatar_url AS seller_avatar, u.college_name AS seller_college
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'available' AND p.exchange_available = 1
      ORDER BY p.created_at DESC
    `);
    res.json({ success: true, products });
  } catch (err) {
    console.error('Exchange products error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving exchange products.' });
  }
});

// Get authenticated user's listings
router.get('/my-listings', authenticateToken, async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.*, c.name AS category_name,
             (SELECT COUNT(*) FROM negotiations WHERE product_id = p.id AND status = 'Pending') AS pending_offers_count,
             (SELECT COUNT(*) FROM exchange_requests WHERE requested_product_id = p.id AND status = 'Pending') AS pending_exchanges_count
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.seller_id = ?
      ORDER BY p.created_at DESC
    `, [req.user.id]);

    res.json({ success: true, products });
  } catch (err) {
    console.error('My listings error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving listings.' });
  }
});

// Browse / Search products with full filtering & pagination
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      condition,
      exchangeOnly,
      sort,
      page = 1,
      limit = 12
    } = req.query;

    let conditions = ["p.status = 'available'"];
    let params = [];

    if (search && search.trim()) {
      conditions.push('(p.title LIKE ? OR p.description LIKE ? OR p.campus_location LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category && category !== 'all') {
      if (isNaN(category)) {
        conditions.push('c.slug = ?');
        params.push(category);
      } else {
        conditions.push('p.category_id = ?');
        params.push(parseInt(category, 10));
      }
    }

    if (minPrice && !isNaN(minPrice)) {
      conditions.push('p.price >= ?');
      params.push(parseFloat(minPrice));
    }

    if (maxPrice && !isNaN(maxPrice)) {
      conditions.push('p.price <= ?');
      params.push(parseFloat(maxPrice));
    }

    if (condition && condition !== 'all') {
      conditions.push('p.condition_state = ?');
      params.push(condition);
    }

    if (exchangeOnly === 'true' || exchangeOnly === '1') {
      conditions.push('p.exchange_available = 1');
    }

    // Sorting
    let orderBy = 'p.created_at DESC';
    if (sort === 'price_asc') {
      orderBy = 'p.price ASC';
    } else if (sort === 'price_desc') {
      orderBy = 'p.price DESC';
    } else if (sort === 'popular') {
      orderBy = 'p.views_count DESC';
    } else if (sort === 'newest') {
      orderBy = 'p.created_at DESC';
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count query
    const countSql = `
      SELECT COUNT(*) AS total
      FROM products p
      JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `;
    const [[{ total }]] = await db.query(countSql, params);

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageLimit = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * pageLimit;

    const dataSql = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug,
             u.full_name AS seller_name, u.avatar_url AS seller_avatar, u.college_name AS seller_college
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const [products] = await db.query(dataSql, [...params, pageLimit, offset]);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: pageNum,
        limit: pageLimit,
        totalPages: Math.ceil(total / pageLimit)
      }
    });
  } catch (err) {
    console.error('Browse products error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving products.' });
  }
});

// Get single product details by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const productId = req.params.id;

    // Increment views
    await db.query('UPDATE products SET views_count = views_count + 1 WHERE id = ?', [productId]);

    const [products] = await db.query(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug,
             u.id AS seller_id, u.full_name AS seller_name, u.email AS seller_email, 
             u.phone_number AS seller_phone, u.avatar_url AS seller_avatar, 
             u.college_name AS seller_college, u.campus_location AS seller_campus,
             (SELECT AVG(rating) FROM reviews WHERE seller_id = u.id) AS seller_rating_avg,
             (SELECT COUNT(*) FROM reviews WHERE seller_id = u.id) AS seller_reviews_count
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      WHERE p.id = ?
    `, [productId]);

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = products[0];

    // Fetch product images
    const [images] = await db.query(
      'SELECT id, image_url, is_primary FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, id ASC',
      [productId]
    );

    // Fetch product reviews
    const [reviews] = await db.query(`
      SELECT r.*, u.full_name AS reviewer_name, u.avatar_url AS reviewer_avatar
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `, [productId]);

    // Check wishlist status for logged-in user
    let isInWishlist = false;
    let userActiveOffer = null;

    if (req.user) {
      const [wish] = await db.query('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);
      isInWishlist = wish.length > 0;

      const [offers] = await db.query(
        'SELECT id, current_offered_price, status FROM negotiations WHERE buyer_id = ? AND product_id = ? ORDER BY created_at DESC LIMIT 1',
        [req.user.id, productId]
      );
      if (offers.length > 0) {
        userActiveOffer = offers[0];
      }
    }

    // Similar products
    const [similar] = await db.query(`
      SELECT p.*, c.name AS category_name, u.full_name AS seller_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      WHERE p.category_id = ? AND p.id != ? AND p.status = 'available'
      LIMIT 4
    `, [product.category_id, productId]);

    res.json({
      success: true,
      product: {
        ...product,
        seller_rating_avg: product.seller_rating_avg ? Number(product.seller_rating_avg).toFixed(1) : '5.0',
        images: images.length > 0 ? images : [{ id: 0, image_url: product.primary_image, is_primary: 1 }],
        reviews,
        isInWishlist,
        userActiveOffer,
        similar
      }
    });
  } catch (err) {
    console.error('Product details error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving product details.' });
  }
});

// Create product listing
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      category_id,
      description,
      price,
      original_price,
      condition_state,
      exchange_available,
      preferred_exchange,
      campus_location,
      contact_info,
      primary_image,
      images = []
    } = req.body;

    if (!title || !category_id || !description || price === undefined || !condition_state || !campus_location) {
      return res.status(400).json({ success: false, message: 'Please fill in all mandatory product information.' });
    }

    const defaultImg = primary_image || (images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80');

    const [result] = await db.query(`
      INSERT INTO products (
        seller_id, category_id, title, description, price, original_price,
        condition_state, status, exchange_available, preferred_exchange,
        campus_location, contact_info, primary_image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'available', ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      parseInt(category_id, 10),
      title.trim(),
      description.trim(),
      parseFloat(price),
      original_price ? parseFloat(original_price) : null,
      condition_state,
      exchange_available ? 1 : 0,
      preferred_exchange || null,
      campus_location.trim(),
      contact_info || req.user.phone_number || req.user.email,
      defaultImg
    ]);

    const productId = result.insertId;

    // Insert primary image into product_images
    await db.query(
      'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)',
      [productId, defaultImg]
    );

    // Insert secondary images
    if (Array.isArray(images) && images.length > 0) {
      for (const imgUrl of images) {
        if (imgUrl && imgUrl !== defaultImg) {
          await db.query(
            'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 0)',
            [productId, imgUrl]
          );
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Product listed successfully.',
      productId
    });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ success: false, message: 'Server error listing product.' });
  }
});

// Update product listing
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const productId = req.params.id;
    const [existing] = await db.query('SELECT seller_id FROM products WHERE id = ?', [productId]);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Only owner or admin can edit
    if (existing[0].seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You are not authorized to edit this listing.' });
    }

    const {
      title,
      category_id,
      description,
      price,
      original_price,
      condition_state,
      status,
      exchange_available,
      preferred_exchange,
      campus_location,
      contact_info,
      primary_image,
      images
    } = req.body;

    await db.query(`
      UPDATE products SET
        title = COALESCE(?, title),
        category_id = COALESCE(?, category_id),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        original_price = ?,
        condition_state = COALESCE(?, condition_state),
        status = COALESCE(?, status),
        exchange_available = COALESCE(?, exchange_available),
        preferred_exchange = ?,
        campus_location = COALESCE(?, campus_location),
        contact_info = COALESCE(?, contact_info),
        primary_image = COALESCE(?, primary_image)
      WHERE id = ?
    `, [
      title ? title.trim() : null,
      category_id ? parseInt(category_id, 10) : null,
      description ? description.trim() : null,
      price !== undefined ? parseFloat(price) : null,
      original_price ? parseFloat(original_price) : null,
      condition_state || null,
      status || null,
      exchange_available !== undefined ? (exchange_available ? 1 : 0) : null,
      preferred_exchange || null,
      campus_location ? campus_location.trim() : null,
      contact_info || null,
      primary_image || null,
      productId
    ]);

    // Update images if provided
    if (Array.isArray(images) && images.length > 0) {
      await db.query('DELETE FROM product_images WHERE product_id = ?', [productId]);
      for (let i = 0; i < images.length; i++) {
        await db.query(
          'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)',
          [productId, images[i], i === 0 ? 1 : 0]
        );
      }
    }

    res.json({ success: true, message: 'Product updated successfully.' });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ success: false, message: 'Server error updating product.' });
  }
});

// Toggle product status (available / sold / reserved)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['available', 'sold', 'reserved', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid product status.' });
    }

    const [existing] = await db.query('SELECT seller_id FROM products WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (existing[0].seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    await db.query('UPDATE products SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: `Product status updated to ${status}.` });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ success: false, message: 'Server error updating status.' });
  }
});

// Delete product
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [existing] = await db.query('SELECT seller_id FROM products WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (existing[0].seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this listing.' });
    }

    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ success: false, message: 'Server error deleting product.' });
  }
});

module.exports = router;
