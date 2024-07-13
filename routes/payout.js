const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/authenticateToken');

const PAYOUT_THRESHOLD = 1000; 

router.post('/request', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [userRows] = await connection.execute(
        'SELECT total_points FROM users WHERE id = ?',
        [userId]
      );

      const totalPoints = userRows[0].total_points;

      if (totalPoints < PAYOUT_THRESHOLD) {
        await connection.rollback();
        return res.status(400).json({ message: 'Insufficient points for payout' });
      }

      await connection.execute(
        'INSERT INTO payout_requests (user_id, amount) VALUES (?, ?)',
        [userId, totalPoints]
      );

      await connection.execute(
        'UPDATE users SET total_points = 0 WHERE id = ?',
        [userId]
      );

      await connection.commit();

      res.json({
        message: 'Payout request submitted successfully',
        amount: totalPoints
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error processing payout request' });
  }
});

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.execute(
      'SELECT * FROM payout_requests WHERE user_id = ? ORDER BY requested_at DESC',
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching payout history' });
  }
});

module.exports = router;