const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authenticateToken');
const pool = require('../config/database');

router.post('/process-item', async (req, res) => {
    const { serialNumber } = req.body;
  const userId = req.user.id;

  try {
    // Check if the product exists and get its points
    const [products] = await pool.execute('SELECT id, points, item_code, product_name FROM products WHERE serial_number = ?', [serialNumber]);
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'Invalid serial number' });
    }

    const productId = products[0].id;
    const pointsToAdd = products[0].points;
    const itemCode = products[0].item_code;
    const productName = products[0].product_name;

    // Check if the user has already scanned this product
    const [existingScans] = await pool.execute('SELECT id FROM scanned_products WHERE user_id = ? AND product_id = ?', [userId, productId]);

    if (existingScans.length > 0) {
      return res.status(400).json({ message: 'Product already scanned by this user' });
    }

    // Add points to user and record the scan
    await pool.execute('UPDATE users SET total_points = total_points + ? WHERE id = ?', [pointsToAdd, userId]);
    await pool.execute('INSERT INTO scanned_products (user_id, product_id) VALUES (?, ?)', [userId, productId]);

    // Get updated total points
    const [userPoints] = await pool.execute('SELECT total_points FROM users WHERE id = ?', [userId]);
    const totalPoints = userPoints[0].total_points;

    res.json({ 
      message: `${pointsToAdd} points added successfully for ${productName} (Item Code: ${itemCode}). Your new total is ${totalPoints} points.`,
      totalPoints: totalPoints,
      itemCode: itemCode,
      productName: productName,
      serialNumber: serialNumber
    });
  } catch (error) {
    console.error('Error processing item:', error);
    res.status(500).json({ message: 'An error occurred while processing the item' });
  }
});

module.exports = router;