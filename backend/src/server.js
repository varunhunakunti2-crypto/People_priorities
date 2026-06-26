require('dotenv').config();
const express = require('express');
const cors = require('cors');
const v1Routes = require('./routes/v1');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:4321',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Built-in body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the ExpensePro API',
    endpoints: {
      health: '/api/v1/protected-test'
    }
  });
});

// API routes
app.use('/api/v1', v1Routes);

// Global Error Handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
