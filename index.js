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

// Enhanced CORS configuration
const corsOptions = {
  origin: 'https://loyalty.polycrome.com', // Allow only your frontend domain
  credentials: true, // Allow cookies if you're using them for authentication
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Public routes
app.use('/auth', authRouter);

// Protected routes
app.use('/api/dashboard', authenticateToken, dashboardRouter);
app.use('/api/scan', authenticateToken, scanRouter);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/payout', authenticateToken, payoutRouter);
app.use('/api/process-item', authenticateToken, processItemRouter);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!', error: err.message });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: "Sorry, that route doesn't exist." });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});