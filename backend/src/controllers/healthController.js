const db = require('../db');

const getHealthStatus = async (req, res, next) => {
  try {
    // Check database connectivity
    const dbResult = await db.query('SELECT NOW()');
    
    res.status(200).json({
      success: true,
      message: 'API server is healthy',
      timestamp: new Date(),
      database: {
        status: 'connected',
        time: dbResult.rows[0].now
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'API server is running but database connection failed',
      timestamp: new Date(),
      error: error.message
    });
  }
};

module.exports = {
  getHealthStatus
};
