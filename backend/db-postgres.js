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
    
    // Create appointments table if it doesn't exist
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
    
    // Create evaluations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS evaluations (
        id SERIAL PRIMARY KEY,
        evaluation_type VARCHAR(50) NOT NULL,
        appointment_id INTEGER REFERENCES appointments(id),
        
        evaluator_name VARCHAR(255),
        evaluator_signature VARCHAR(255),
        client_name VARCHAR(255),
        service_provider_name VARCHAR(255),
        evaluation_date DATE,
        service_types TEXT,
        
        responses JSONB NOT NULL,
        
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CHECK (evaluation_type IN ('staff_service', 'parental_provider'))
      )
    `);
    console.log('✅ Evaluations table ready');
  } catch (err) {
    console.error('❌ Database connection error:', err);
    throw err;
  }
}

module.exports = { getPool, connectDB };
