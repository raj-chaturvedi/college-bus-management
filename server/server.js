const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');

const { connectDB } = require('./config/db');
const simulationEngine = require('./services/simulationService');
const store = require('./services/store');
const seedData = require('../seed/seed');

// Import routes
const authRoutes = require('./routes/authRoutes');
const busRoutes = require('./routes/busRoutes');
const routeRoutes = require('./routes/routeRoutes');
const stopRoutes = require('./routes/stopRoutes');
const driverRoutes = require('./routes/driverRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const alertRoutes = require('./routes/alertRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const historyRoutes = require('./routes/historyRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const userRoutes = require('./routes/userRoutes');
const serviceRoutes = require('./routes/serviceRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root API Status Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'College Bus AI Management System API',
    version: '1.0.0',
    health: '/api/health',
    timestamp: new Date()
  });
});

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'College Bus AI Management System Backend',
    timestamp: new Date(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/stops', stopRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/digital-pass', serviceRoutes);

// Centralized 404 Route Handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[API Error]:', err.stack || err.message);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize Server, DB, Data Seeding, and Live Simulation
async function startServer() {
  try {
    const dbConn = await connectDB();

    // Check if initial data is present; if not, seed automatically
    const dumpPath = path.join(__dirname, 'data/seedData.json');
    if (fs.existsSync(dumpPath)) {
      try {
        const raw = fs.readFileSync(dumpPath, 'utf-8');
        const parsed = JSON.parse(raw);
        Object.assign(store.memory, parsed);
        console.log(`[Store] Loaded persistent dataset (${store.memory.buses.length} buses, ${store.memory.stops.length} stops).`);
      } catch (e) {
        console.warn('[Store] Could not read cache, running fresh seed...');
        await seedData();
      }
    } else {
      await seedData();
    }

    // Start Real-Time Bus Telemetry Simulation
    simulationEngine.start(3000);

    const HOST = '0.0.0.0';
    const server = app.listen(PORT, HOST, () => {
      console.log(`====================================================`);
      console.log(`🚌 College Bus AI Server running on http://0.0.0.0:${PORT} (localhost:${PORT})`);
      console.log(`📡 Live GPS simulation active (updating every 3s)`);
      console.log(`🤖 AI Engine: ${process.env.GEMINI_API_KEY ? 'Google Gemini 1.5' : 'Transit Intelligence Engine (Ready)'}`);
      console.log(`====================================================`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      simulationEngine.stop();
      server.close();
    });
    process.on('SIGINT', () => {
      simulationEngine.stop();
      server.close();
    });

  } catch (error) {
    console.error('[Server Startup Failure]:', error);
  }
}

startServer();

module.exports = app;
