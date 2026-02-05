const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }
  return pool;
}

async function connectDB() {
  try {
    const pool = getPool();
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL database');
    
    // Create table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        address TEXT NOT NULL,
        "requestedDate" DATE NOT NULL,
        "requestedTime" TIME NOT NULL,
        notes TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        "submittedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Appointments table ready');
  } catch (err) {
    console.error('❌ Database connection error:', err);
    throw err;
  }
}

module.exports = { getPool, connectDB };
