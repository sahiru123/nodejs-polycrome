const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/authenticateToken');


router.post('/', authenticateToken, async (req, res) => {
  try {
    const { serialNumber } = req.body;
    const userId = req.user.id;

    const [existingScans] = await pool.execute(
      'SELECT * FROM scanned_products WHERE user_id = ? AND serial_number = ?',
      [userId, serialNumber]
    );

    if (existingScans.length > 0) {
      return res.status(400).json({ message: 'Product already scanned' });
    }

    const pointsAwarded = 100; 

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.execute(
        'INSERT INTO scanned_products (user_id, serial_number, points) VALUES (?, ?, ?)',
        [userId, serialNumber, pointsAwarded]
      );

      await connection.execute(
        'UPDATE users SET total_points = total_points + ? WHERE id = ?',
        [pointsAwarded, userId]
      );

      await connection.commit();

      const [userRows] = await connection.execute(
        'SELECT total_points FROM users WHERE id = ?',
        [userId]
      );

      connection.release();

      res.json({
        message: 'Product scanned successfully',
        serialNumber,
        pointsAwarded,
        totalPoints: userRows[0].total_points
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error scanning product' });
  }
});

module.exports = router;