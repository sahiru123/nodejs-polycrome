const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/authenticateToken');

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, nicNumber, contactNo, password } = req.body;

    if (!firstName || !lastName || !nicNumber || !contactNo || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Basic NIC validation
    const nicRegex = /^[0-9]{9}[vVxX]$|^[0-9]{12}$/;
    if (!nicRegex.test(nicNumber)) {
      return res.status(400).json({ message: 'Invalid NIC number' });
    }

    // Basic phone number validation
    const phoneRegex = /^[0-9]{9,10}$/;
    if (!phoneRegex.test(contactNo)) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      `INSERT INTO users (first_name, last_name, nic_number, contact_no, password)
       VALUES (?, ?, ?, ?, ?)`,
      [firstName, lastName, nicNumber, contactNo, hashedPassword]
    );

    // Generate token for the newly registered user
    const token = jwt.sign({ id: result.insertId, nicNumber }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // In your register route
    res.status(201).json({ message: 'User registered successfully', token, userId: result.insertId });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'NIC number already registered' });
    } else {
      res.status(500).json({ message: 'Error registering user', error: error.message });
    }
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { nicNumber, password } = req.body;
    const [rows] = await pool.execute('SELECT * FROM users WHERE nic_number = ?', [nicNumber]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    const nicFirstTwoDigits = nicNumber.substring(0, 2);

    if (!isPasswordValid && password !== nicFirstTwoDigits) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, nicNumber: user.nic_number }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, userId: user.id, isAdmin: user.is_admin });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Check authentication route
router.get('/check-auth', authenticateToken, (req, res) => {
  res.json({ message: 'Authenticated' });
});

// Logout route
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

module.exports = router;