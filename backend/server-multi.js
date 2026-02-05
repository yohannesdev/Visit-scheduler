const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Choose database based on environment
const dbModule = process.env.DATABASE_URL ? './db-postgres' : './db';
const { connectDB } = require(dbModule);

// Choose routes based on environment  
const appointmentRoutesModule = process.env.DATABASE_URL ? './routes/appointments-postgres' : './routes/appointments';
const appointmentRoutes = require(appointmentRoutesModule);
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/appointments', appointmentRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Using database: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQL Server'}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});
