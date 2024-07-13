const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/authenticateToken');

router.get('/', authenticateToken, async (req, res) => {
  console.log('Dashboard route accessed, user:', req.user);

  try {
    if (!req.user || !req.user.id) {
      console.log('User not authenticated');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log('Authenticated user:', req.user);

    const [userRows] = await pool.execute('SELECT id, first_name, last_name, nic_number, total_points, is_admin FROM users WHERE id = ?', [req.user.id]);
    
    if (userRows.length === 0) {
      console.log('User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userRows[0];
    console.log('User found:', user.id);

    const [productRows] = await pool.execute(`
      SELECT p.item_code, p.product_name, p.serial_number, p.points, sp.scanned_at 
      FROM scanned_products sp
      JOIN products p ON sp.product_id = p.id
      WHERE sp.user_id = ?
      ORDER BY sp.scanned_at DESC
    `, [req.user.id]);
    
    console.log('Scanned products:', productRows.length);

    const userData = {
      fullName: `${user.first_name} ${user.last_name}`,
      nicNumber: user.nic_number,
      totalPoints: user.total_points || 0,
      isAdmin: user.is_admin === 1, // Convert to boolean
      scannedProducts: productRows
    };

    console.log('Sending user data:', userData);
    res.json(userData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
});

module.exports = router;