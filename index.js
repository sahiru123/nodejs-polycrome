require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRouter = require('./routes/auth');
const dashboardRouter = require('./routes/dashboard');
const scanRouter = require('./routes/scan');
const adminRoutes = require('./routes/admin');
const processItemRouter = require('./routes/processItem');
const payoutRouter = require('./routes/payout');
const { authenticateToken } = require('./middleware/authenticateToken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Public routes
app.use('/auth', authRouter);

// Protected routes
app.use('/dashboard', authenticateToken, dashboardRouter);
app.use('/scan', authenticateToken, scanRouter);
app.use('/admin', authenticateToken, adminRoutes);
app.use('/payout', authenticateToken, payoutRouter);
app.use('/api', authenticateToken, processItemRouter);
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).send("Sorry, that route doesn't exist.");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});