const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request Logging Middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
  });

  // API Routes
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/customers', require('./routes/customerRoutes'));
  app.use('/api/measurements', require('./routes/measurementRoutes'));
  app.use('/api/orders', require('./routes/orderRoutes'));
  app.use('/api/samples', require('./routes/sampleRoutes'));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'OK',
      dbMode: process.env.USE_JSON_DB === 'true' ? 'JSON File DB (Offline Mode)' : 'MongoDB Atlas',
      timestamp: new Date().toISOString()
    });
  });

  // Serve Frontend Static Files
  const frontendPath = path.join(__dirname, '../frontend');
  app.use(express.static(frontendPath));

  // Fallback to index.html for single page application routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
      message: err.message || 'Internal Server Error',
      error: process.env.NODE_ENV === 'production' ? {} : err.stack,
    });
  });

  const PORT = process.env.PORT || 5000;
  const MODE = process.env.USE_JSON_DB === 'true' ? 'JSON File DB' : 'MongoDB Atlas';

  app.listen(PORT, () => {
    console.log(`\n✅ Server running on port ${PORT}`);
    console.log(`📦 Database Mode: ${MODE}`);
    console.log(`🌐 URL: http://localhost:${PORT}\n`);
  });
};

startServer();
