const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'VisitScheduler',
  port: parseInt(process.env.DB_PORT || '1433'),
  authentication: {
    type: 'default',
    options: {
      userName: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    }
  },
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

let pool;

async function connectDB() {
  try {
    pool = await sql.connect(config);
    console.log('✅ Connected to SQL Server');
    return pool;
  } catch (err) {
    console.error('❌ Database connection error:', err);
    throw err;
  }
}

function getPool() {
  return pool;
}

module.exports = { connectDB, getPool, sql };
