const { Pool } = require('pg');
const logger = require('./logger');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function connectDB() {
  const client = await pool.connect();
  client.release();
  logger.info('PostgreSQL connected');
}

async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  logger.debug('DB query', { text, duration: Date.now() - start, rows: result.rowCount });
  return result;
}

module.exports = { pool, query, connectDB };
