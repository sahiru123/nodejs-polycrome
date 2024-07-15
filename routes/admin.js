const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/authenticateToken');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT is_admin FROM users WHERE id = ?', [req.user.id]);
    if (rows.length > 0 && rows[0].is_admin) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error checking admin status' });
  }
};

router.get('/products', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM products');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
  }
});

router.post('/products', authenticateToken, isAdmin, async (req, res) => {
  const { serialNumber, points } = req.body;
  try {
    await pool.execute('INSERT INTO products (serial_number, points) VALUES (?, ?)', [serialNumber, points]);
    res.status(201).json({ message: 'Product added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding product' });
  }
});

router.delete('/products/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await pool.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product' });
  }
});

router.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, first_name, last_name, nic_number, city, total_points, is_admin, contact_no FROM users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

module.exports = router;